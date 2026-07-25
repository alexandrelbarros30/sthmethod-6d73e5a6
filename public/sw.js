// STH METHOD service worker — Web Push notifications only (no caching).

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      // Clean any legacy caches from previous SW versions.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}
    await self.clients.claim();
  })());
});

// Never cache anything — pass-through.
self.addEventListener('fetch', () => {});

// Push handler — shows a native notification with the payload sent by the backend.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    try { payload = { title: 'STH METHOD', body: event.data && event.data.text() }; } catch (_) {}
  }
  const title = payload.title || 'STH METHOD';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'sth-notification',
    renotify: true,
    data: { url: payload.url || '/dashboard', ...(payload.data || {}) },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      try {
        const u = new URL(client.url);
        if (u.origin === self.location.origin) {
          await client.focus();
          try { client.navigate(url); } catch (_) {}
          return;
        }
      } catch (_) {}
    }
    await self.clients.openWindow(url);
  })());
});
