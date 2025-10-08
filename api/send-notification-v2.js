import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return res.status(500).json({ 
        error: 'Missing Firebase environment variables',
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      });
    }

    // Initialize Firebase Admin (using modular SDK)
    let app;
    if (getApps().length === 0) {
      try {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } catch (initError) {
        return res.status(500).json({ 
          error: 'Firebase initialization failed',
          details: initError.message 
        });
      }
    } else {
      app = getApps()[0];
    }

    const { recipientId, message, type, metadata } = req.body;

    // Get recipient's FCM token from Firestore
    const db = getFirestore(app);
    let userDoc;
    
    try {
      userDoc = await db.doc(`profiles/${recipientId}`).get();
    } catch (firestoreError) {
      return res.status(500).json({ 
        error: 'Firestore error',
        details: firestoreError.message 
      });
    }

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      return res.status(200).json({ 
        message: 'No FCM token for user',
        recipientId,
        hasToken: false
      });
    }

    if (!userData.pushNotificationsEnabled) {
      return res.status(200).json({ 
        message: 'Push notifications disabled for user',
        recipientId,
        hasToken: true,
        enabled: false
      });
    }

    // Send push notification
    const messaging = getMessaging(app);
    const pushMessage = {
      token: fcmToken,
      notification: {
        title: 'Clara',
        body: message,
      },
      data: {
        type: type || 'general',
        postId: metadata?.postId || '',
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
        }
      }
    };

    try {
      const response = await messaging.send(pushMessage);
      return res.status(200).json({ 
        success: true, 
        messageId: response,
        recipientId,
        hasToken: true,
        enabled: true
      });
    } catch (messagingError) {
      return res.status(500).json({ 
        error: 'Push notification send failed',
        details: messagingError.message,
        recipientId,
        hasToken: true
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}