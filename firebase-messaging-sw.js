// Firebase Cloud Messaging Service Worker
// This file handles push notifications when the app is in the background

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js');

// Firebase configuration - must match your main config
const firebaseConfig = {
  apiKey: "AIzaSyBcWWjr4e3jbRTSs0jsoCEyjX35P2CcxNA",
  authDomain: "supportapp-9df04.firebaseapp.com", 
  projectId: "supportapp-9df04",
  storageBucket: "supportapp-9df04.firebasestorage.app",
  messagingSenderId: "825301739515",
  appId: "1:825301739515:web:6f6eaf0365169c6f7b4d5e"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Clara Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'clara-notification',
    data: {
      url: payload.data?.url || '/',
      notificationId: payload.data?.notificationId,
      type: payload.data?.type
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click - open the app
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events (for custom handling if needed)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push received.');
  
  if (event.data) {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Push data: ', payload);
  }
});