// src/utils/storageManager.js
// Advanced storage management with quota monitoring and cleanup

class StorageManager {
  static async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate();
    }
    return { quota: 0, usage: 0 };
  }
  
  static async getUsagePercentage() {
    const estimate = await this.getStorageEstimate();
    if (estimate.quota === 0) return 0;
    return (estimate.usage / estimate.quota * 100).toFixed(2);
  }
  
  static async isStorageAvailable(requiredBytes = 0) {
    const estimate = await this.getStorageEstimate();
    const available = estimate.quota - estimate.usage;
    return available > requiredBytes;
  }
  
  static async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }
  
  static async isPersistent() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      return await navigator.storage.persisted();
    }
    return false;
  }
  
  // Cleanup strategies
  static async cleanupExpiredData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const databases = ['offline_mutation_db', 'offline_data_cache'];
    let cleanedBytes = 0;
    
    for (const dbName of databases) {
      try {
        const cleaned = await this.cleanupDatabase(dbName, maxAge);
        cleanedBytes += cleaned;
      } catch (error) {
        console.warn(`Failed to cleanup ${dbName}:`, error);
      }
    }
    
    return cleanedBytes;
  }
  
  static async cleanupDatabase(dbName, maxAge) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => {
        const db = request.result;
        const stores = Array.from(db.objectStoreNames);
        let cleanedBytes = 0;
        
        stores.forEach(storeName => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          if (store.indexNames.contains('timestamp')) {
            const index = store.index('timestamp');
            const cutoff = Date.now() - maxAge;
            const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
            
            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                const dataSize = JSON.stringify(cursor.value).length;
                cursor.delete();
                cleanedBytes += dataSize;
                cursor.continue();
              }
            };
          }
        });
        
        resolve(cleanedBytes);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Smart cache eviction
  static async evictLeastUsedData(targetBytes) {
    // Implementation would track access patterns and remove least used items
    console.log(`Evicting ${targetBytes} bytes of least used data`);
    return 0; // Placeholder
  }
  
  // Storage monitoring
  static startStorageMonitoring(callback, interval = 60000) { // 1 minute
    return setInterval(async () => {
      const estimate = await this.getStorageEstimate();
      const percentage = await this.getUsagePercentage();
      callback({ estimate, percentage });
    }, interval);
  }
  
  static stopStorageMonitoring(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

export { StorageManager };
