// src/registerSyncListener.js
import { processQueueIndexedDb } from './utils/indexedDbQueue';

export function registerSyncListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'PROCESS_OFFLINE_MUTATIONS') {
  await processQueueIndexedDb();
      }
    });
  }
}
