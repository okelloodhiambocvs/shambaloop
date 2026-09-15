/**
 * ShambaLoop Local Data Sync Service Worker
 * Optimizes performance and enables offline browsing for users in areas with unstable connectivity.
 * Implements Network-First with Cache-Fallback for listings and transactions, 
 * and Stale-While-Revalidate for core static files.
 */

const STATIC_CACHE_NAME = 'shambaloop-static-v1';
const DATA_CACHE_NAME = 'shambaloop-data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/src/types.ts',
  '/metadata.json'
];

// 1. Install event - pre-caches core layout templates
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ShambaLoop SW] Pre-caching structural assets for offline resilience...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Safe to soft-fail dynamic file list in dev mode
        console.log('[ShambaLoop SW] Asset pre-cache partial load (standard in unbundled dev environment):', err);
      });
    })
  );
});

// 2. Activate event - invalidates deprecated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('[ShambaLoop SW] Invalidating stale cache bucket:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch interceptor
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Filter ONLY read (GET) requests
  const isGetMethod = event.request.method === 'GET';
  const isApiCall = requestUrl.pathname.startsWith('/api/');

  if (isApiCall && isGetMethod) {
    // Network-First, Cache-Fallback strategy for all read API routes 
    // This includes listings, leases, partnerships, analytics, and users
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If response is valid, duplicate and stash in listings database cache
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn('[ShambaLoop SW] Network unavailable. Fetching matching route from local sync cache:', requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If completely empty and offline, return a clear structured response
            const emptyFallback = getEmptyResponseForRoute(requestUrl.pathname);
            return new Response(JSON.stringify(emptyFallback), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'x-shambaloop-offline': 'true' }
            });
          });
        })
    );
  } else if (!isApiCall) {
    // Stale-While-Revalidate strategy for static resources (CSS, JS, images, icons)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const cacheCopy = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(event.request, cacheCopy);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            if (cachedResponse) return cachedResponse;
            throw err;
          });

        return cachedResponse || networkFetch;
      })
    );
  }
});

/**
 * Returns structured placeholders when there's an absolute cache-miss 
 * to prevent the React app state from throwing parsing errors.
 */
function getEmptyResponseForRoute(pathname) {
  if (pathname.includes('/listings')) {
    return [];
  } else if (pathname.includes('/leases')) {
    return [];
  } else if (pathname.includes('/partnerships')) {
    return [];
  } else if (pathname.includes('/verifications')) {
    return [];
  } else if (pathname.includes('/analytics')) {
    return {
      activeListings: 0,
      activeFarms: 0,
      totalLeasedAcreage: 0,
      totalEscrowKES: 0,
      registeredUsersCount: 4,
      pendingVerificationsCount: 0,
      isOfflineState: true
    };
  } else if (pathname.includes('/users')) {
    return [];
  }
  return {};
}
