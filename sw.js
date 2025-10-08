// Clara PWA - Service Worker (auto-updating)
const CACHE_VERSION = 'v3'; // bump this if you ever need a full reset
const CACHE_NAME = `clara-${CACHE_VERSION}-${Date.now()}`;

// Files to cache at install
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/config.js',
  '/manifest.json',
  '/firebase-messaging-sw.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// INSTALL — cache fresh assets
self.addEventListener('install', (event) => {
  console.log('🔧 Installing new service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => {
        console.log('✅ Cached resources successfully');
        return self.skipWaiting();
      })
  );
});

// ACTIVATE — remove old caches & take control
self.addEventListener('activate', (event) => {
  console.log('🚀 Activating new service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('clara-') && cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => {
      console.log('✅ Now controlling clients immediately');
      return self.clients.claim();
    })
  );
});

// FETCH — prefer network, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // Skip Firebase and other dynamic requests
  if (
    request.url.includes('firebase') ||
    request.url.includes('googleapis')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return response;
      })
      .catch(() => caches.match(request).then((res) => res || caches.match('/index.html')))
  );
});

// Background Sync for offline notification storage
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-notifications') {
    event.waitUntil(syncOfflineNotifications());
  }
});

// Sync offline notifications when connection is restored
async function syncOfflineNotifications() {
  try {
    console.log('📡 Syncing offline notifications...');
    
    // Get stored offline notifications from IndexedDB
    const offlineNotifications = await getOfflineNotifications();
    
    if (offlineNotifications.length > 0) {
      console.log(`📤 Syncing ${offlineNotifications.length} offline notifications`);
      
      // Send notifications to Firebase when online
      for (const notification of offlineNotifications) {
        try {
          // You would implement the actual Firebase API call here
          // This is a placeholder for the sync logic
          console.log('📨 Syncing notification:', notification);
          
          // Remove from offline storage after successful sync
          await removeOfflineNotification(notification.id);
        } catch (error) {
          console.error('❌ Failed to sync notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error syncing offline notifications:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineNotifications() {
  // Implement IndexedDB get operations
  return [];
}

async function removeOfflineNotification(id) {
  // Implement IndexedDB remove operations
  console.log(`🗑️ Removed offline notification: ${id}`);
}

// Force page reload when new service worker takes control
self.addEventListener('controllerchange', () => {
  console.log('♻️ New service worker controlling page — reloading...');
  window.location.reload();
});
