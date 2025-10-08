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

    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
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
        details: tokenError,
        status: tokenResponse.status
      });
    }

    const { access_token } = await tokenResponse.json();

    // Debug: Try to list some profiles first
    const listUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles`;
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    let profilesInfo = {};
    if (listResponse.ok) {
      const profilesList = await listResponse.json();
      profilesInfo = {
        totalProfiles: profilesList.documents?.length || 0,
        profileIds: profilesList.documents?.map(doc => doc.name.split('/').pop()).slice(0, 5) || []
      };
    }

    // Now try to get the specific user
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles/${recipientId}`;
    
    const userResponse = await fetch(firestoreUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const debugInfo = {
      recipientId,
      requestedUrl: firestoreUrl,
      userResponseStatus: userResponse.status,
      profilesInfo
    };

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return res.status(200).json({ 
        error: 'User profile debug info',
        debug: debugInfo,
        errorDetails: errorText,
        suggestion: 'User profile may not exist in Firestore'
      });
    }

    const userData = await userResponse.json();
    
    return res.status(200).json({
      success: true,
      debug: debugInfo,
      userFound: true,
      hasFields: !!userData.fields,
      hasFcmToken: !!userData.fields?.fcmToken?.stringValue,
      pushEnabled: userData.fields?.pushNotificationsEnabled?.booleanValue,
      fcmTokenLength: userData.fields?.fcmToken?.stringValue?.length || 0
    });

  } catch (error) {
    console.error('Debug push notification error:', error);
    res.status(500).json({
      error: 'Debug failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}