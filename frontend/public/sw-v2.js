const CACHE_NAME = 'cursosia-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/version.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
             .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore API/Supabase/Functions calls
  if (
    url.pathname.includes('/functions/') || 
    url.host.includes('supabase') ||
    url.pathname.includes('chrome-extension') ||
    url.pathname.includes('/rest/v1/')
  ) {
    return;
  }

  // For navigation requests (HTML), try network first, then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other assets: Stale-While-Revalidate strategy
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        
        const fetchedPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails, return cached or a minimal fallback
          return cached || new Response('Offline', { 
            status: 503, 
            headers: { 'Content-Type': 'text/plain' } 
          });
        });

        return cached || fetchedPromise;
      } catch (err) {
        return fetch(event.request);
      }
    })()
  );
});
