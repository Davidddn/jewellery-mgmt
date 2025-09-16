// src/utils/multiTabSync.js
// Multi-tab sync awareness using BroadcastChannel API

const CHANNEL_NAME = 'offline_sync_channel';

let broadcastChannel = null;

// Initialize broadcast channel
export const initMultiTabSync = (onMessage) => {
  if ('BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (onMessage) {
        onMessage(event.data);
      }
    };
  }
};

// Send message to other tabs
export const broadcastToTabs = (type, data) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
  }
};

// Close broadcast channel
export const closeMultiTabSync = () => {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
};

// Message types
export const MESSAGE_TYPES = {
  QUEUE_UPDATED: 'QUEUE_UPDATED',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
};
