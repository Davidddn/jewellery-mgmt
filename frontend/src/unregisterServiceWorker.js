// Immediately unregister service workers before anything else
console.log('🧹 Starting aggressive service worker cleanup...');

// Force unregister all service workers
if ('serviceWorker' in navigator) {
  // Get all registrations
  navigator.serviceWorker.getRegistrations()
    .then(function(registrations) {
      console.log(`Found ${registrations.length} service worker registrations`);
      
      // Unregister each one
      const unregisterPromises = registrations.map(function(registration) {
        console.log('🗑️ Unregistering service worker:', registration.scope);
        return registration.unregister();
      });
      
      return Promise.all(unregisterPromises);
    })
    .then(function(results) {
      console.log('✅ All service workers unregistered:', results);
      
      // Force reload to ensure clean state
      if (results.some(result => result === true)) {
        console.log('🔄 Reloading page to ensure clean state...');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    })
    .catch(function(err) {
      console.error('❌ Service Worker unregistration failed:', err);
    });
}

// Clear all caches aggressively
if ('caches' in window) {
  caches.keys()
    .then(function(cacheNames) {
      console.log(`Found ${cacheNames.length} caches to clear:`, cacheNames);
      
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(function(results) {
      console.log('✅ All caches cleared:', results);
    })
    .catch(function(err) {
      console.error('❌ Cache clearing failed:', err);
    });
}

// Clear localStorage items related to workbox
try {
  Object.keys(localStorage).forEach(key => {
    if (key.includes('workbox') || key.includes('sw-') || key.includes('cache')) {
      console.log('🗑️ Removing localStorage item:', key);
      localStorage.removeItem(key);
    }
  });
} catch (err) {
  console.error('❌ localStorage cleanup failed:', err);
}

console.log('🎉 Service worker cleanup completed!');
