const CACHE_NAME = 'devosfera-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/404.html',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/manifest.json'
];

// Install Event - Pre-cache critical assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const cachePromises = ASSETS_TO_CACHE.map((asset) => {
        return fetch(asset)
          .then((res) => {
            if (res.status === 200 || res.status === 0) {
              return cache.put(asset, res);
            }
          })
          .catch(() => {
            // Ignore individual fetch/cache failures during installation
          });
      });
      return Promise.all(cachePromises);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic caching with Network-First fallback to Cache
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle GET requests and same-origin assets
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip query string resources like pagefind search queries or analytics
  if (url.pathname.startsWith('/_astro/') || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|woff|woff2|css|js)$/)) {
    // Cache First for static assets & images (Stale-While-Revalidate pattern)
    e.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) {
          // Fetch new version in background to update cache
          fetch(req).then((networkRes) => {
            if (networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          }).catch(() => {/* Ignore network failures */});
          return cachedRes;
        }

        return fetch(req).then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
  } else {
    // Network First for HTML and other documents
    e.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(req).then((cachedRes) => {
            if (cachedRes) return cachedRes;
            // Fallback to 404 page if offline and not cached
            return caches.match('/404.html');
          });
        })
    );
  }
});
