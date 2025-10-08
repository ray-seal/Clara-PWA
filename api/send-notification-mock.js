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

    // For now, let's just return success and log the attempt
    // We'll add actual FCM later once we confirm this works
    console.log('Push notification request:', {
      recipientId,
      message,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Simulate successful push notification
    const response = {
      success: true,
      messageId: `mock_${Date.now()}`,
      recipientId,
      message,
      type,
      timestamp: new Date().toISOString(),
      note: 'Mock response - actual FCM integration pending'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Push notification error:', error);
    res.status(500).json({
      error: 'Push notification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}