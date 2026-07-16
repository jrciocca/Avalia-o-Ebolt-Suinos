const CACHE_NAME = 'insens-suinos-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first para o HTML: sempre busca a versão mais nova quando há internet,
// e só usa o cache como fallback se estiver offline. Isso evita ficar preso numa
// versão antiga para sempre (o problema que causou telas desatualizadas antes).
self.addEventListener('fetch', (event) => {
  const isHTML = event.request.mode === 'navigate' || event.request.destination === 'document';
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
  } else {
    // Assets estáticos (ícones, manifest): cache-first está OK, mudam raramente.
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});

