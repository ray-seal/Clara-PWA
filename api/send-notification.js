// Vercel serverless function
// Save as: api/send-notification.js in your project

import admin from 'firebase-admin';

// Note: Firebase Admin is initialized inside the handler function

export default async function handler(req, res) {
  // Add comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Enhanced environment variable debugging
    const envCheck = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING', 
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING'
    };
    
    console.log('Environment check:', envCheck);
    
    // Check if required environment variables exist
    const requiredEnvs = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      console.error('Missing environment variables:', missingEnvs);
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: `Missing: ${missingEnvs.join(', ')}`,
        envCheck
      });
    }
    const { recipientId, message, type, metadata } = req.body;

    console.log('Processing notification for recipient:', recipientId);

    // Initialize Firebase Admin if not already done
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('Firebase Admin initialized successfully');
      } catch (initError) {
        console.error('Firebase Admin initialization error:', initError);
        return res.status(500).json({ 
          error: 'Firebase initialization failed',
          details: initError.message 
        });
      }
    }

    // Get recipient's FCM token
    let userDoc;
    try {
      userDoc = await admin.firestore()
        .doc(`profiles/${recipientId}`)
        .get();
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      return res.status(500).json({ 
        error: 'Database error',
        details: firestoreError.message 
      });
    }

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