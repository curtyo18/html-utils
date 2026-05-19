self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/script.user.js')) {
    event.respondWith(
      caches.open('userscript-install').then(cache =>
        cache.match(event.request.url).then(r => r ?? fetch(event.request))
      )
    );
  }
});
