// Vercel serverless function
// Save as: api/send-notification.js in your project

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientId, message, type, metadata } = req.body;

    // Get recipient's FCM token
    const userDoc = await admin.firestore()
      .doc(`profiles/${recipientId}`)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken || !userData.pushNotificationsEnabled) {
      return res.status(200).json({ message: 'Push notifications disabled' });
    }

    // Send push notification
    const pushMessage = {
      token: fcmToken,
      notification: {
        title: 'Clara',
        body: message,
      },
      data: {
        type: type,
        postId: metadata?.postId || '',
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
        }
      }
    };

    const response = await admin.messaging().send(pushMessage);
    res.status(200).json({ success: true, messageId: response });

  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: error.message });
  }
}