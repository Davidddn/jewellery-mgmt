/* eslint-disable no-undef */
/* global workbox, clients */
// Handle push notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Notification', body: event.data.text() };
    }
  }
  const title = data.title || 'Jewellery Management';
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: data.url ? { url: data.url } : undefined
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});


// Try to load Workbox from CDN, but handle errors gracefully
try {
  self.importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
  if (self.workbox) {
    // Precache all assets
    workbox.precaching.precacheAndRoute([
      {"revision":"666467e947403a9f15b23414e018ab0b","url":"logo.png"},
      {"revision":"4b6f7866a3e5da2e2b006d03232545c9","url":"manifest.json"},
      {"revision":"0c4237659fd489efef06e28ddebfb988","url":"offline.html"},
      {"revision":"8e3a10e157f75ada21ab742c022d5430","url":"vite.svg"}
    ]);

    // Cache API requests with background sync for offline support
    const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('apiQueue', {
      maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
    });

    workbox.routing.registerRoute(
      ({ url }) => url.pathname.startsWith('/api/'),
      new workbox.strategies.NetworkFirst({
        cacheName: 'api-cache',
        plugins: [bgSyncPlugin],
      }),
      'GET'
    );

    // Cache static assets
    workbox.routing.registerRoute(
      ({ request }) => request.destination === 'script' || request.destination === 'style',
      new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'static-resources',
      })
    );
  } else {
    console.warn('Workbox could not be loaded from CDN. Service worker will run with basic offline support only.');
  }
} catch (e) {
  console.warn('Workbox import failed:', e);
}

// Offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});

// Listen for skipWaiting message for update UX
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
