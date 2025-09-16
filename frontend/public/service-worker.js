// Advanced offline mutation sync: listen for 'sync' event and process queued mutations
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(
      (async () => {
        const allClients = await clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({ type: 'PROCESS_OFFLINE_MUTATIONS' });
        }
      })()
    );
  }
});

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
    data: data.url ? { url: data.url } : undefined,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'general'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle action button clicks
  if (event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (let client of windowClients) {
          if ('focus' in client) {
            client.focus();
            // Send action to the client
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: event.action,
              data: event.notification.data
            });
            return;
          }
        }
        // No existing window, open new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
    return;
  }
  
  // Handle notification click (no action button)
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
  } else {
    // Default behavior - focus or open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        if (windowClients.length > 0) {
          return windowClients[0].focus();
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
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

// Listen for skipWaiting and sync notification messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Listen for sync notification events from app
  if (event.data && event.data.type === 'SYNC_NOTIFICATION') {
    const { status, message } = event.data;
    let title = 'Sync Status';
    let body = message || '';
    let actions = [];
    
    if (status === 'success') {
      title = 'Sync Complete';
      body = body || 'All offline changes have been synced.';
      actions = [
        { action: 'view', title: 'View Changes' }
      ];
    } else if (status === 'conflict') {
      title = 'Sync Conflict';
      body = body || 'A conflict was detected during sync.';
      actions = [
        { action: 'resolve', title: 'Resolve' },
        { action: 'dismiss', title: 'Later' }
      ];
    } else if (status === 'error') {
      title = 'Sync Error';
      body = body || 'Some changes could not be synced.';
      actions = [
        { action: 'retry', title: 'Retry' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    }
    
    self.registration.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      actions,
      requireInteraction: status === 'conflict',
      data: { status, originalMessage: message }
    });
  }
});
