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
    const { recipientId, message, type, metadata } = req.body;

    // Check if we have the required environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      return res.status(500).json({ 
        error: 'Missing Firebase configuration',
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      });
    }

    // Step 1: Get OAuth token for Firebase REST API
    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      return res.status(500).json({ 
        error: 'Failed to get OAuth token',
        details: tokenError
      });
    }

    const { access_token } = await tokenResponse.json();

    // Step 2: Get user's FCM token from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles/${recipientId}`;
    
    const userResponse = await fetch(firestoreUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!userResponse.ok) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = await userResponse.json();
    const fcmToken = userData.fields?.fcmToken?.stringValue;
    const pushEnabled = userData.fields?.pushNotificationsEnabled?.booleanValue;

    if (!fcmToken) {
      return res.status(200).json({ 
        message: 'No FCM token for user',
        recipientId 
      });
    }

    if (pushEnabled === false) {
      return res.status(200).json({ 
        message: 'Push notifications disabled',
        recipientId 
      });
    }

    // Step 3: Send FCM message using REST API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`;
    
    const fcmMessage = {
      message: {
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
      }
    };

    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmMessage)
    });

    if (!fcmResponse.ok) {
      const fcmError = await fcmResponse.text();
      return res.status(500).json({ 
        error: 'FCM send failed',
        details: fcmError
      });
    }

    const fcmResult = await fcmResponse.json();

    res.status(200).json({
      success: true,
      messageId: fcmResult.name,
      recipientId,
      approach: 'Firebase REST API'
    });

  } catch (error) {
    console.error('REST API push notification error:', error);
    res.status(500).json({
      error: 'Push notification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}