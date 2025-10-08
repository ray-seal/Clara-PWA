export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check environment variables
    const envVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NOT_SET',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'NOT_SET',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
    };

    res.status(200).json({
      message: 'Environment debug info',
      environment: envVars,
      timestamp: new Date().toISOString(),
      method: req.method
    });

  } catch (error) {
    res.status(500).json({
      error: 'Debug function failed',
      message: error.message,
      stack: error.stack
    });
  }
}