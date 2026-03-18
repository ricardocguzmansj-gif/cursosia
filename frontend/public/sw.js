const CACHE_NAME = 'cursosia-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html'
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
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  // Ignore API/Supabase/Functions calls
  if (
    event.request.url.includes('/functions/') || 
    event.request.url.includes('supabase') ||
    event.request.url.includes('chrome-extension')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // If fetch fails and nothing in cache, return a fallback or rethrow
          return cached || new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });

      return cached || fetched;
    })
  );
});
