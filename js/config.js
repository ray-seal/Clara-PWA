// Clara PWA - Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js';

// Firebase configuration with your saved credentials
const firebaseConfig = {
  apiKey: "AIzaSyBcWWjr4e3jbRTSs0jsoCEyjX35P2CcxNA",
  authDomain: "supportapp-9df04.firebaseapp.com", 
  projectId: "supportapp-9df04",
  storageBucket: "supportapp-9df04.firebasestorage.app",
  messagingSenderId: "825301739515",
  appId: "1:825301739515:web:6f6eaf0365169c6f7b4d5e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Collection names for Clara Mental Health Support
export const COLLECTIONS = {
  PROFILES: 'profiles',
  POSTS: 'posts', 
  COMMENTS: 'comments',
  SUPPORT_GROUPS: 'supportGroups',
  GROUP_MESSAGES: 'groupMessages',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports'
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'Clara',
  VERSION: '2.0.0',
  SUPPORT_EMAIL: 'support@clara-app.com',
  CRISIS_HOTLINE: '988',
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Mental health support groups
  SUPPORT_GROUPS: [
    {
      id: 'anxiety-support',
      name: 'Anxiety Support',
      description: 'A safe space to discuss anxiety, panic attacks, and coping strategies',
      icon: '💙',
      color: '#4A90E2'
    },
    {
      id: 'depression-support', 
      name: 'Depression Support',
      description: 'Connect with others who understand depression and share hope',
      icon: '💜',
      color: '#8E44AD'
    },
    {
      id: 'trauma-recovery',
      name: 'Trauma Recovery',
      description: 'Healing together from trauma and PTSD experiences',
      icon: '🌱',
      color: '#27AE60'
    },
    {
      id: 'general-wellness',
      name: 'General Wellness',
      description: 'Overall mental health discussions and wellness tips',
      icon: '🧠',
      color: '#3498DB'
    }
  ]
};