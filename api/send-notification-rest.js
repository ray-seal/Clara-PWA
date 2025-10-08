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

  console.log('🚀 FCM Notification Request:', req.body);

  try {
    const { recipientId, message, type, metadata } = req.body;
    
    if (!recipientId || !message) {
      return res.status(400).json({ error: 'Missing recipientId or message' });
    }

    // Check if we have the required environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('❌ Missing Firebase configuration');
      return res.status(500).json({ 
        error: 'Missing Firebase configuration',
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      });
    }

    console.log('🔑 Firebase config loaded successfully');

    // Step 1: Get OAuth token for Firebase REST API
    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    console.log('🎫 JWT token created successfully');

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('❌ OAuth token request failed:', tokenError);
      return res.status(500).json({ 
        error: 'Failed to get OAuth token',
        details: tokenError
      });
    }

    const { access_token } = await tokenResponse.json();
    console.log('✅ OAuth access token obtained');

    // Step 2: Get user's FCM token from Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles/${recipientId}`;
    console.log('📋 Fetching user profile for FCM token...');
    console.log('🔗 Firestore URL:', firestoreUrl);
    
    const userResponse = await fetch(firestoreUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    console.log('📊 User profile response status:', userResponse.status);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User profile not found:', recipientId);
      console.error('📄 Error response:', errorText);
      
      // Let's also try to list all profiles to see what exists
      const listUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles`;
      try {
        const listResponse = await fetch(listUrl, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        });
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log('📋 Available profiles:', listData.documents?.map(doc => doc.name.split('/').pop()) || 'None found');
        }
      } catch (e) {
        console.log('Could not list profiles:', e.message);
      }
      
      return res.status(404).json({ 
        error: 'User not found',
        recipientId,
        firestoreUrl,
        errorDetails: errorText
      });
    }

    const userData = await userResponse.json();
    const fcmToken = userData.fields?.fcmToken?.stringValue;
    const pushEnabled = userData.fields?.pushNotificationsEnabled?.booleanValue;
    
    console.log('👤 User data retrieved:', {
      recipientId,
      hasFcmToken: !!fcmToken,
      fcmTokenLength: fcmToken?.length || 0,
      pushEnabled
    });

    if (!fcmToken) {
      console.warn('⚠️ No FCM token found for user');
      return res.status(200).json({ 
        success: false,
        reason: 'no_fcm_token',
        message: 'No FCM token for user - notifications not enabled',
        recipientId,
        userData: {
          hasToken: false,
          pushEnabled: userData.fields?.pushNotificationsEnabled?.booleanValue
        }
      });
    }

    if (pushEnabled === false) {
      return res.status(200).json({ 
        success: false,
        reason: 'notifications_disabled',
        message: 'Push notifications disabled for user',
        recipientId,
        userData: {
          hasToken: true,
          pushEnabled: false
        }
      });
    }

    // Step 3: Send FCM message using REST API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`;
    console.log('📤 Preparing FCM message...');
    
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

    console.log('🚀 Sending FCM message to device...');
    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmMessage)
    });

    console.log('📊 FCM response status:', fcmResponse.status);

    if (!fcmResponse.ok) {
      const fcmError = await fcmResponse.text();
      console.error('❌ FCM send failed:', fcmError);
      return res.status(500).json({ 
        error: 'FCM send failed',
        details: fcmError,
        status: fcmResponse.status
      });
    }

    const fcmResult = await fcmResponse.json();
    console.log('✅ FCM message sent successfully:', fcmResult);

    res.status(200).json({
      success: true,
      messageId: fcmResult.name,
      recipientId,
      approach: 'Firebase REST API',
      userData: {
        hasToken: true,
        pushEnabled: pushEnabled !== false,
        tokenLength: fcmToken.length
      },
      fcmResponse: {
        messageId: fcmResult.name,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 REST API push notification error:', error);
    res.status(500).json({
      error: 'Push notification failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}