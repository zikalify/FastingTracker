const CACHE_NAME = 'fasting-tracker-cache-v3';
const urlsToCache = [
  'index.html',     // Relative to sw.js
  'style.css',      // Relative to sw.js
  'script.js',      // Relative to sw.js
  'manifest.json',  // Relative to sw.js
  'icons/icon-192x192.png', // Relative to sw.js
  'icons/icon-512x512.png'  // Relative to sw.js
  // Add './' or '.' if you want to cache the root of the service worker's scope
  // For example, if index.html is the root, 'index.html' is fine.
  // You might also add '.' to represent the current directory (scope root).
];

// Install event: open cache and add core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache core assets:', error);
      })
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all open clients once activated
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        return response || fetch(event.request);
      })
  );
});