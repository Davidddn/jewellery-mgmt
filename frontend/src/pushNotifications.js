const API_BASE = '/api/push';
const UNSUBSCRIBE_URL = `${API_BASE}/unsubscribe`;
export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (subscription) {
    await fetch(UNSUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  }
}
// pushNotifications.js
// Handles push subscription and notification logic for the frontend

const VAPID_PUBLIC_KEY_URL = `${API_BASE}/vapid-public-key`;
const SUBSCRIBE_URL = `${API_BASE}/subscribe`;

// Convert base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const res = await fetch(VAPID_PUBLIC_KEY_URL);
  const { publicKey } = await res.json();
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  await fetch(SUBSCRIBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  return subscription;
}
