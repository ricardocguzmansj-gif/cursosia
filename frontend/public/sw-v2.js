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
    url.pathname.includes('chrome-extension')
  ) {
    return;
  }

  // Stale-While-Revalidate strategy
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        
        const fetchedPromise = fetch(event.request).then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cached || new Response('Offline', { status: 503 });
        });

        return cached || fetchedPromise;
      } catch (err) {
        console.error('SW Error:', err);
        return new Response('Internal Service Worker Error', { status: 500 });
      }
    })()
  );
});
