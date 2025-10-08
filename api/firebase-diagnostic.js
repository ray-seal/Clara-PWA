import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics = {};

  try {
    // Step 1: Check environment variables
    diagnostics.step1_env = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID || 'MISSING'
    };

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        diagnostics
      });
    }

    // Step 2: Try Firebase Admin initialization
    let app;
    try {
      if (getApps().length === 0) {
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        app = getApps()[0];
      }
      diagnostics.step2_firebase_init = { success: true };
    } catch (error) {
      diagnostics.step2_firebase_init = { 
        success: false, 
        error: error.message 
      };
      return res.status(500).json({ 
        error: 'Firebase init failed',
        diagnostics
      });
    }

    // Step 3: Try Firestore connection
    try {
      const db = getFirestore(app);
      // Try to read a simple document
      const testDoc = await db.doc('test/connection').get();
      diagnostics.step3_firestore = { 
        success: true,
        exists: testDoc.exists
      };
    } catch (error) {
      diagnostics.step3_firestore = { 
        success: false, 
        error: error.message 
      };
    }

    // Step 4: Try reading a real user profile
    try {
      const db = getFirestore(app);
      const userDoc = await db.doc('profiles/Y0Jp6eDNmvSJX8cbiMkVtZPUp972').get();
      diagnostics.step4_user_profile = { 
        success: true,
        exists: userDoc.exists,
        hasFcmToken: userDoc.exists ? !!userDoc.data()?.fcmToken : false,
        pushEnabled: userDoc.exists ? userDoc.data()?.pushNotificationsEnabled : false
      };
    } catch (error) {
      diagnostics.step4_user_profile = { 
        success: false, 
        error: error.message 
      };
    }

    res.status(200).json({
      message: 'Firebase diagnostics complete',
      diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message,
      diagnostics,
      stack: error.stack
    });
  }
}