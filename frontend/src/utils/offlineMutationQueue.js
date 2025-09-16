// src/utils/offlineMutationQueue.js
// Simple localStorage-based mutation queue for offline support

const QUEUE_KEY = 'offline_mutation_queue_v1';

export function enqueueMutation({ url, method, body }) {
  const queue = getQueue();
  queue.push({ url, method, body, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function processQueue() {
  const queue = getQueue();
  const newQueue = [];
  for (const item of queue) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
    } catch {
      newQueue.push(item); // Keep in queue if still failing
    }
  }
  setQueue(newQueue);
  return newQueue.length === 0;
}
