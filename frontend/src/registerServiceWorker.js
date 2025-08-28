
// Registers the service worker and handles update prompt
export function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/service-worker.js').then(registration => {
				registration.onupdatefound = () => {
					const installingWorker = registration.installing;
					installingWorker.onstatechange = () => {
						if (installingWorker.state === 'installed') {
							if (navigator.serviceWorker.controller) {
								// New update available
								window.dispatchEvent(new Event('swUpdated'));
							}
						}
					};
				};
			});
		});
	}
}

// Listen for update event and show prompt
window.addEventListener('swUpdated', () => {
	// You can replace this with a custom UI prompt
	if (window.confirm('A new version is available. Reload to update?')) {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
		}
		window.location.reload();
	}
});
