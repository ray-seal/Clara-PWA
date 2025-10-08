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

    // Step 1: Get user's FCM token from Firestore using REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/profiles/${recipientId}`;
    
    // For now, we'll skip the actual Firestore call and FCM call
    // and just return a successful mock response
    
    console.log('Would fetch user from:', firestoreUrl);
    console.log('Push notification data:', { recipientId, message, type, metadata });

    // Return mock success
    res.status(200).json({
      success: true,
      messageId: `rest_${Date.now()}`,
      recipientId,
      message,
      approach: 'REST API (mock)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('REST API push notification error:', error);
    res.status(500).json({
      error: 'REST API push notification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}