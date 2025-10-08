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
    const body = req.body;
    
    // Basic response without Firebase
    res.status(200).json({
      success: true,
      message: 'Push notification function called successfully',
      receivedData: {
        recipientId: body?.recipientId || 'missing',
        message: body?.message || 'missing',
        type: body?.type || 'missing'
      },
      environment: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Function error',
      message: error.message,
      stack: error.stack
    });
  }
}