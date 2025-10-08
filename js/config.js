// Clara PWA - Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js';
import { getMessaging } from 'https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging.js';

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

// Initialize messaging with error handling
let messaging;
try {
  messaging = getMessaging(app);
  console.log('✅ Firebase Messaging initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Messaging:', error);
  console.log('This might be due to:');
  console.log('- Browser not supporting FCM');
  console.log('- Missing service worker');
  console.log('- Incorrect Firebase configuration');
}

export { messaging };

// Collection names for Clara Mental Health Support
export const COLLECTIONS = {
  PROFILES: 'profiles',
  POSTS: 'posts', 
  COMMENTS: 'comments',
  SUPPORT_GROUPS: 'supportGroups',
  GROUP_MESSAGES: 'groupMessages',
  CHAT_MESSAGES: 'chatMessages',
  CHAT_REACTIONS: 'chatReactions',
  USER_PRESENCE: 'userPresence',
  MEDITATION_SESSIONS: 'meditationSessions',
  MOOD_ASSESSMENTS: 'moodAssessments',
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
    },
    {
      id: 'gender-identity',
      name: 'Gender and Identity',
      description: 'Overall mental health discussions and wellness tips',
      icon: '🏳️‍🌈',
      color: '#8a2be2'
    }
  ],
  
  // Points system for gamification
  POINTS: {
    SIGNUP: 50,
    POST: 10,
    COMMENT: 5,
    LIKE: 2,
    LIKE_RECEIVED: 3,
    CHAT_MESSAGE: 3,
    HEART_REACTION: 1,
    DAILY_LOGIN: 5,
    MEDITATION_SESSION: 10
  },
  
  // Meditation configuration
  MEDITATION: {
    TYPES: [
      {
        id: 'breathing',
        name: 'Breathing Exercise',
        description: '4-4-4 breathing technique for relaxation and anxiety relief',
        icon: '🫁',
        color: '#4A90E2',
        duration: 120, // 2 minutes in seconds
        pattern: {
          inhale: 4,
          hold: 4,
          exhale: 4
        }
      },
      {
        id: 'body-scan',
        name: 'Body Scan',
        description: 'Progressive relaxation through body awareness',
        icon: '🧘‍♀️',
        color: '#27AE60',
        comingSoon: true
      },
      {
        id: 'loving-kindness',
        name: 'Loving Kindness',
        description: 'Cultivate compassion and self-love',
        icon: '💗',
        color: '#E91E63',
        comingSoon: true
      }
    ],
    
    MOOD_QUESTIONS: [
      {
        id: 'stress_level',
        question: 'How stressed are you feeling right now?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very Relaxed', 'Very Stressed'] }
      },
      {
        id: 'anxiety_level',
        question: 'How anxious are you feeling?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very Calm', 'Very Anxious'] }
      },
      {
        id: 'mood_overall',
        question: 'How would you describe your overall mood?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very Low', 'Very High'] }
      },
      {
        id: 'energy_level',
        question: 'What is your energy level?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very Tired', 'Very Energetic'] }
      },
      {
        id: 'focus_clarity',
        question: 'How clear and focused do you feel?',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very Foggy', 'Very Clear'] }
      }
    ]
  }
};
