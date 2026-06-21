const CACHE_VERSION = "2";
const STATIC_CACHE = `devosfera-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `devosfera-runtime-v${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  "/",
  "/404.html",
  "/favicon.ico",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/manifest.json",
  "/desktop.webp",
  "/mobile.webp",
];

// Install Event - Pre-cache critical assets in STATIC_CACHE
self.addEventListener("install", e => {
  e.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        const cachePromises = ASSETS_TO_CACHE.map(asset => {
          return fetch(asset)
            .then(res => {
              if (res.status === 200 || res.status === 0) {
                return cache.put(asset, res);
              }
            })
            .catch(() => {
              // Ignore individual fetch/cache failures during installation
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener("activate", e => {
  const activeCaches = [STATIC_CACHE, RUNTIME_CACHE];
  e.waitUntil(
    caches
      .keys()
      .then(keys => {
        return Promise.all(
          keys.map(key => {
            if (!activeCaches.includes(key)) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle GET requests and same-origin assets
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Check if it's a static asset (immutable/long-cacheable)
  const isAstroAsset = url.pathname.startsWith("/_astro/");
  const isImageOrFont = url.pathname.match(
    /\.(jpg|jpeg|png|gif|svg|webp|avif|woff|woff2|css|js)$/
  );

  if (isAstroAsset || isImageOrFont) {
    // Cache First strategy
    e.respondWith(
      caches.match(req).then(cachedRes => {
        if (cachedRes) {
          // Since _astro assets are immutable (they contain hashes), we don't need to revalidate them.
          // For other static assets, we can stale-while-revalidate.
          if (!isAstroAsset) {
            fetch(req)
              .then(networkRes => {
                if (networkRes.status === 200) {
                  caches
                    .open(RUNTIME_CACHE)
                    .then(cache => cache.put(req, networkRes));
                }
              })
              .catch(() => {
                /* Ignore network failures */
              });
          }
          return cachedRes;
        }

        return fetch(req).then(networkRes => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
  } else {
    // Network First strategy for HTML/other pages
    e.respondWith(
      fetch(req)
        .then(networkRes => {
          if (networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(req).then(cachedRes => {
            if (cachedRes) return cachedRes;
            // Fallback to pre-cached 404 page if not found in cache
            return caches.match("/404.html");
          });
        })
    );
  }
});
