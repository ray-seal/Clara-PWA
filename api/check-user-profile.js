export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the recipient ID from query params for GET requests or body for POST
    const recipientId = req.method === 'GET' ? req.query.userId : req.body?.recipientId;
    
    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId required' });
    }

    // Check environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      return res.status(500).json({ 
        error: 'Missing Firebase configuration'
      });
    }

    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: process.env.FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/datastore',
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
      return res.status(500).json({ error: 'Failed to get OAuth token' });
    }

    const { access_token } = await tokenResponse.json();

    // Check if user profile exists
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles/${recipientId}`;
    
    const userResponse = await fetch(firestoreUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!userResponse.ok) {
      // Try to list some profiles to see what exists
      const listUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles`;
      const listResponse = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      
      let availableProfiles = [];
      if (listResponse.ok) {
        const profilesList = await listResponse.json();
        availableProfiles = profilesList.documents?.map(doc => doc.name.split('/').pop()).slice(0, 5) || [];
      }

      return res.status(404).json({ 
        error: 'User profile not found',
        searchedUserId: recipientId,
        availableProfiles,
        firestoreStatus: userResponse.status,
        suggestion: 'User may need to complete profile setup'
      });
    }

    const userData = await userResponse.json();
    
    res.status(200).json({
      success: true,
      userId: recipientId,
      profileExists: true,
      hasFields: !!userData.fields,
      hasFcmToken: !!userData.fields?.fcmToken?.stringValue,
      pushNotificationsEnabled: userData.fields?.pushNotificationsEnabled?.booleanValue,
      fcmTokenLength: userData.fields?.fcmToken?.stringValue?.length || 0,
      profileFields: Object.keys(userData.fields || {})
    });

  } catch (error) {
    res.status(500).json({
      error: 'Profile check failed',
      message: error.message
    });
  }
}