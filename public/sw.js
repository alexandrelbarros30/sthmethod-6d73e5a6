// Self-destroying service worker
// This replaces any previously registered SW, clears all caches, and unregisters itself.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => {
        try { client.navigate(client.url); } catch (_) {}
      });
    } catch (_) {}
  })());
});

// Pass through all fetches — never cache anything
self.addEventListener('fetch', () => {});
