// src/utils/offlineDataCache.js
// IndexedDB-based offline data cache for browsing when offline

import { DataCompressor } from './dataCompression';
import { StorageManager } from './storageManager';

const DB_NAME = 'offline_data_cache';
const STORE_NAME = 'cached_data';
const METADATA_STORE = 'cache_metadata';
const DB_VERSION = 2;

function openCacheDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      
      // Main cache store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('accessCount', 'accessCount', { unique: false });
      }
      
      // Metadata store for analytics
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metaStore = db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        metaStore.createIndex('lastAccess', 'lastAccess', { unique: false });
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

export async function cacheData(key, data, options = {}) {
  const db = await openCacheDb();
  
  // Check storage availability
  const dataSize = JSON.stringify(data).length;
  const isAvailable = await StorageManager.isStorageAvailable(dataSize);
  
  if (!isAvailable) {
    // Try to free up space
    await StorageManager.cleanupExpiredData();
    if (!(await StorageManager.isStorageAvailable(dataSize))) {
      throw new Error('Insufficient storage space');
    }
  }
  
  const compressed = options.compress !== false ? DataCompressor.compress(data) : data;
  const cacheEntry = {
    key,
    data: compressed,
    timestamp: Date.now(),
    category: options.category || 'general',
    priority: options.priority || 'normal',
    accessCount: 0,
    compressed: options.compress !== false,
    originalSize: dataSize,
    compressedSize: JSON.stringify(compressed).length
  };
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(cacheEntry);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

export async function getCachedData(key) {
  const db = await openCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const metaStore = tx.objectStore(METADATA_STORE);
    
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        // Update access count and last access time
        result.accessCount = (result.accessCount || 0) + 1;
        store.put(result);
        
        // Update metadata
        metaStore.put({
          key,
          lastAccess: Date.now(),
          accessCount: result.accessCount
        });
        
        // Decompress if needed
        const data = result.compressed ? 
          DataCompressor.decompress(result.data) : result.data;
        resolve(data);
      } else {
        resolve(null);
      }
    };
    request.onerror = reject;
  });
}

export async function clearExpiredCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  const db = await openCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const cutoff = Date.now() - maxAge;
    
    const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = reject;
  });
}

export async function getAllCachedKeys() {
  const db = await openCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

// Predictive pre-caching based on usage patterns
export async function predictivePreCache(userBehavior = {}) {
  const patterns = await analyzeAccessPatterns();
  const recommendations = generateCacheRecommendations(patterns, userBehavior);
  
  for (const rec of recommendations) {
    if (rec.probability > 0.7) { // High probability items
      try {
        // Pre-cache if not already cached
        const cached = await getCachedData(rec.key);
        if (!cached && rec.fetchFunction) {
          const data = await rec.fetchFunction();
          await cacheData(rec.key, data, { 
            category: 'predictive', 
            priority: 'low' 
          });
        }
      } catch (error) {
        console.warn('Predictive caching failed for:', rec.key, error);
      }
    }
  }
}

// Analyze access patterns for predictive caching
async function analyzeAccessPatterns() {
  const db = await openCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(METADATA_STORE, 'readonly');
    const store = tx.objectStore(METADATA_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const patterns = request.result.reduce((acc, item) => {
        const hour = new Date(item.lastAccess).getHours();
        const dayOfWeek = new Date(item.lastAccess).getDay();
        
        if (!acc[item.key]) {
          acc[item.key] = {
            totalAccess: 0,
            hourPattern: {},
            dayPattern: {},
            lastAccess: 0
          };
        }
        
        acc[item.key].totalAccess += item.accessCount;
        acc[item.key].hourPattern[hour] = (acc[item.key].hourPattern[hour] || 0) + 1;
        acc[item.key].dayPattern[dayOfWeek] = (acc[item.key].dayPattern[dayOfWeek] || 0) + 1;
        acc[item.key].lastAccess = Math.max(acc[item.key].lastAccess, item.lastAccess);
        
        return acc;
      }, {});
      
      resolve(patterns);
    };
    request.onerror = reject;
  });
}

function generateCacheRecommendations(patterns, userBehavior) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  return Object.entries(patterns).map(([key, pattern]) => {
    let probability = 0;
    
    // Time-based probability
    const hourScore = (pattern.hourPattern[currentHour] || 0) / pattern.totalAccess;
    const dayScore = (pattern.dayPattern[currentDay] || 0) / pattern.totalAccess;
    
    // Recency factor
    const recencyScore = Math.max(0, 1 - (Date.now() - pattern.lastAccess) / (7 * 24 * 60 * 60 * 1000));
    
    // Usage frequency
    const frequencyScore = Math.min(1, pattern.totalAccess / 100);
    
    // User behavior boost
    const behaviorBoost = userBehavior[key] ? 0.2 : 0;
    const contextBoost = userBehavior.currentContext && key.includes(userBehavior.currentContext) ? 0.1 : 0;
    
    probability = (hourScore * 0.3 + dayScore * 0.2 + recencyScore * 0.3 + frequencyScore * 0.2) + behaviorBoost + contextBoost;
    
    return {
      key,
      probability: Math.min(1, probability), // Cap at 1.0
      reasons: {
        timeMatch: hourScore > 0.1,
        dayMatch: dayScore > 0.1,
        recentUse: recencyScore > 0.5,
        frequentUse: frequencyScore > 0.3,
        userPreference: userBehavior[key] || false,
        contextRelevant: contextBoost > 0
      }
    };
  }).sort((a, b) => b.probability - a.probability);
}

// Smart cache eviction
export async function smartCacheEviction(targetBytes) {
  const db = await openCacheDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const items = request.result;
      
      // Score items for eviction (lower score = more likely to evict)
      const scored = items.map(item => ({
        ...item,
        evictionScore: calculateEvictionScore(item)
      })).sort((a, b) => a.evictionScore - b.evictionScore);
      
      let freedBytes = 0;
      const toEvict = [];
      
      for (const item of scored) {
        if (freedBytes >= targetBytes) break;
        toEvict.push(item.key);
        freedBytes += item.compressedSize || JSON.stringify(item.data).length;
      }
      
      // Remove selected items
      toEvict.forEach(key => store.delete(key));
      
      resolve(freedBytes);
    };
    request.onerror = reject;
  });
}

function calculateEvictionScore(item) {
  const now = Date.now();
  const age = (now - item.timestamp) / (24 * 60 * 60 * 1000); // days
  const accessCount = item.accessCount || 0;
  const size = item.compressedSize || JSON.stringify(item.data).length;
  
  // Priority weights
  const priorityWeight = item.priority === 'high' ? 0.1 : 
                        item.priority === 'medium' ? 0.5 : 1.0;
  
  // Score: higher = keep, lower = evict
  return (accessCount * 0.4 + (1/age) * 0.3 + (1/size) * 0.2) * priorityWeight;
}
