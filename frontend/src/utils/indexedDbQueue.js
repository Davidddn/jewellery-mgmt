// src/utils/indexedDbQueue.js
// IndexedDB-based mutation queue for offline support

const DB_NAME = 'offline_mutation_db';
const STORE_NAME = 'mutation_queue';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

export async function enqueueMutationIndexedDb({ url, method, body }) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ url, method, body, timestamp: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

export async function getQueueIndexedDb() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    store.getAll().onsuccess = function(event) {
      resolve(event.target.result);
    };
    store.getAll().onerror = reject;
  });
}

export async function clearQueueIndexedDb() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

export async function deleteMutationById(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// Returns: { allProcessed: boolean, conflicts: Array<{ id, local, server }> }
export async function processQueueIndexedDb() {
  const queue = await getQueueIndexedDb();
  const conflicts = [];
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (res.status === 409 || res.status === 412) {
        // Conflict detected
        let serverData = null;
  try { serverData = await res.json(); } catch { /* ignore */ }
        // Store conflict info in IndexedDB (optional: or just return for now)
        conflicts.push({ id: item.id, local: item, server: serverData });
        continue;
      }
      await deleteMutationById(item.id);
    } catch {
      // Keep in queue if still failing
    }
  }
  const remaining = await getQueueIndexedDb();
  return { allProcessed: remaining.length === 0, conflicts };
}
