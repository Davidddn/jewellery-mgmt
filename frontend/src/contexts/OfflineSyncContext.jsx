import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  enqueueMutationIndexedDb,
  getQueueIndexedDb,
  deleteMutationById,
  processQueueIndexedDb,
  clearQueueIndexedDb
} from '../utils/indexedDbQueue';
import { cacheData, getCachedData, clearExpiredCache } from '../utils/offlineDataCache';
import syncLogger from '../utils/syncLogs';
import { initMultiTabSync, broadcastToTabs, closeMultiTabSync, MESSAGE_TYPES } from '../utils/multiTabSync';
import { ConflictResolver } from '../utils/conflictResolver';
import { DeltaSync } from '../utils/deltaSync';
import { BandwidthAwareSync } from '../utils/bandwidthAwareSync';
import { StorageManager } from '../utils/storageManager';
import { DataCompressor } from '../utils/dataCompression';

const OfflineSyncContext = createContext();

export { OfflineSyncContext };

export function OfflineSyncProvider({ children }) {
  // Existing state
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState({});
  const [conflicts, setConflicts] = useState([]);

  // Enhanced state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    operation: null,
    details: null
  });
  const [networkQuality, setNetworkQuality] = useState('good');
  const [storageUsage, setStorageUsage] = useState(0);
  const [compressionStats, setCompressionStats] = useState({
    totalSaved: 0,
    compressionRatio: 1
  });
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    conflictResolution: 'auto',
    compressionEnabled: true,
    predictiveCaching: true,
    maxRetries: 3,
    retryDelay: 1000
  });

  // Enhanced utilities
  const conflictResolver = useRef(new ConflictResolver());
  const deltaSync = useRef(new DeltaSync());
  const bandwidthSync = useRef(new BandwidthAwareSync());
  const compression = useRef(new DataCompressor());

  // Monitor online status and network quality
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const quality = bandwidthSync.current.getNetworkQuality();
      setNetworkQuality(quality);
      syncLogger.logNetworkChange('offline', 'online', { quality });
    };

    const handleOffline = () => {
      setIsOnline(false);
      syncLogger.logNetworkChange('online', 'offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial network quality check
    if (isOnline) {
      const quality = bandwidthSync.current.getNetworkQuality();
      setNetworkQuality(quality);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  // Clean up expired cache and monitor storage
  useEffect(() => {
    clearExpiredCache();
    
    const checkStorage = async () => {
      const usage = await StorageManager.getUsagePercentage();
      setStorageUsage(usage);
      
      if (usage > 80) {
        syncLogger.logStorageWarning(usage, 80);
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize multi-tab sync
  useEffect(() => {
    const handleTabMessage = (message) => {
      if (message.type === MESSAGE_TYPES.QUEUE_UPDATED) {
        getQueueIndexedDb().then(setPendingActions);
      } else if (message.type === MESSAGE_TYPES.CONFLICT_DETECTED) {
        setConflicts(prev => [...prev, ...message.data]);
      } else if (message.type === MESSAGE_TYPES.SYNC_STARTED) {
        setIsSyncing(true);
      } else if (message.type === MESSAGE_TYPES.SYNC_COMPLETED) {
        setIsSyncing(false);
        setSyncProgress({ current: 0, total: 0, operation: null });
      }
    };

    initMultiTabSync(handleTabMessage);
    
    return () => {
      closeMultiTabSync();
    };
  }, []);

  // Poll IndexedDB for pending actions
  useEffect(() => {
    let interval = setInterval(async () => {
      const queue = await getQueueIndexedDb();
      setPendingActions(queue);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced process queue
  const processQueue = useCallback(async () => {
    if (isSyncing || pendingActions.length === 0) return;
    
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: pendingActions.length, operation: 'processing_queue' });
    
    broadcastToTabs(MESSAGE_TYPES.SYNC_STARTED, {});
    
    const startTime = Date.now();
    syncLogger.logSyncStart('queue_processing', {
      count: pendingActions.length,
      networkQuality
    });

    try {
      const result = await processQueueIndexedDb((processed) => {
        setSyncProgress(prev => ({
          ...prev,
          current: processed,
          operation: 'processing_items'
        }));
      });

      const queue = await getQueueIndexedDb();
      setPendingActions(queue);
      
      if (result && result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        sendSyncNotification('conflict', 'Conflicts detected during sync.', [
          { action: 'view_conflicts', title: 'View Conflicts' }
        ]);
        syncLogger.logConflict('queue_processing', result.conflicts);
        broadcastToTabs(MESSAGE_TYPES.CONFLICT_DETECTED, result.conflicts);
      } else if (result && result.allProcessed) {
        sendSyncNotification('success', 'All offline changes have been synced.');
        
        const duration = Date.now() - startTime;
        syncLogger.logSyncComplete('queue_processing', duration, {
          processed: result.processedCount || pendingActions.length
        });
      } else {
        sendSyncNotification('error', 'Some changes could not be synced.', [
          { action: 'retry', title: 'Retry' }
        ]);
        syncLogger.error('Some changes could not be synced', { result });
      }
      
      broadcastToTabs(MESSAGE_TYPES.SYNC_COMPLETED, { result, queue });
      
    } catch (error) {
      syncLogger.logSyncError('queue_processing', error);
      sendSyncNotification('error', 'Sync failed: ' + error.message, [
        { action: 'retry', title: 'Retry' }
      ]);
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0, operation: null });
    }
  }, [pendingActions, isSyncing, networkQuality]);

  // Cache data with compression
  const cacheDataForOffline = useCallback(async (key, data) => {
    if (syncSettings.compressionEnabled) {
      const compressed = await compression.current.compress(JSON.stringify(data));
      await cacheData(key, { compressed: true, data: compressed });
      
      const stats = compression.current.getCompressionStats();
      setCompressionStats(prev => ({
        totalSaved: prev.totalSaved + stats.savedBytes,
        compressionRatio: stats.ratio
      }));
      
      syncLogger.logCompressionStats(stats.originalSize, stats.compressedSize, stats.ratio);
    } else {
      await cacheData(key, data);
    }
  }, [syncSettings.compressionEnabled]);

  // Get cached data with decompression
  const getCachedDataForOffline = useCallback(async (key) => {
    const cached = await getCachedData(key);
    
    if (cached && cached.compressed) {
      const decompressed = await compression.current.decompress(cached.data);
      return JSON.parse(decompressed);
    }
    
    return cached;
  }, []);

  // Enhanced queue mutation
  const queueMutation = useCallback(async (mutation) => {
    const enhancedMutation = {
      ...mutation,
      id: mutation.id || Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      networkQuality: networkQuality
    };

    if (syncSettings.compressionEnabled && mutation.body) {
      const compressed = await compression.current.compress(JSON.stringify(mutation.body));
      enhancedMutation.body = compressed;
      enhancedMutation.compressed = true;
    }

    await enqueueMutationIndexedDb(enhancedMutation);
    const queue = await getQueueIndexedDb();
    setPendingActions(queue);
    broadcastToTabs(MESSAGE_TYPES.QUEUE_UPDATED, queue);
    
    syncLogger.info(`Queued mutation: ${mutation.method} ${mutation.url}`, {
      id: enhancedMutation.id,
      compressed: enhancedMutation.compressed
    });
  }, [syncSettings.compressionEnabled, networkQuality]);

  // Enhanced conflict resolution (defined early to avoid circular dependency)
  const resolveConflict = useCallback(async (conflictId, action, mergedData) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    syncLogger.info(`Resolving conflict: ${action}`, { conflictId });
    
    try {
      if (action === 'keepLocal') {
        // Retry the local version
        const retryItem = { ...conflict.local };
        await enqueueMutationIndexedDb(retryItem);
      } else if (action === 'useServer') {
        await deleteMutationById(conflictId);
      } else if (action === 'merge' && mergedData) {
        // Create merged item and retry
        const mergedItem = { ...conflict.local, body: mergedData };
        await enqueueMutationIndexedDb(mergedItem);
      }
      
      setConflicts(cs => cs.filter(c => c.id !== conflictId));
      setPendingActions(await getQueueIndexedDb());
      
      syncLogger.success(`Conflict resolved: ${action}`, { conflictId });
      
    } catch (error) {
      syncLogger.error(`Failed to resolve conflict: ${action}`, {
        conflictId,
        error: error.message
      });
      throw error;
    }
  }, [conflicts]);

  // Enhanced retry with exponential backoff
  const retryAction = useCallback(async (item) => {
    setSyncStatus(s => ({ ...s, [item.id]: 'retrying' }));
    syncLogger.info(`Retrying action: ${item.method} ${item.url}`, item);
    
    try {
      let body = item.body;
      
      if (item.compressed) {
        body = JSON.parse(await compression.current.decompress(item.body));
      }

      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const serverData = await response.json();
          const conflict = {
            id: item.id,
            local: item,
            server: serverData,
            timestamp: new Date().toISOString()
          };
          
          setConflicts(prev => [...prev, conflict]);
          syncLogger.logConflict('sync_retry', item, { serverData });
          
          if (syncSettings.conflictResolution === 'auto') {
            const resolution = await conflictResolver.current.resolveConflict(
              conflict,
              syncSettings.conflictResolution
            );
            
            if (resolution.autoResolved) {
              await resolveConflict(item.id, 'merge', resolution.resolvedData);
              return;
            }
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await deleteMutationById(item.id);
      setSyncStatus(s => ({ ...s, [item.id]: 'success' }));
      syncLogger.success(`Successfully retried: ${item.method} ${item.url}`);
      
    } catch (error) {
      const newRetryCount = (item.retryCount || 0) + 1;
      const maxRetries = syncSettings.maxRetries;
      
      if (newRetryCount < maxRetries) {
        const delay = syncSettings.retryDelay * Math.pow(2, newRetryCount);
        setTimeout(() => {
          const updatedItem = { ...item, retryCount: newRetryCount };
          retryAction(updatedItem);
        }, delay);
        
        setSyncStatus(s => ({ ...s, [item.id]: 'pending' }));
        syncLogger.warning(`Retry ${newRetryCount}/${maxRetries} failed, will retry in ${delay}ms`, {
          error: error.message
        });
      } else {
        setSyncStatus(s => ({ ...s, [item.id]: 'failed' }));
        syncLogger.error(`Failed to retry after ${maxRetries} attempts: ${item.method} ${item.url}`, {
          error: error.message
        });
      }
    }
    
    setPendingActions(await getQueueIndexedDb());
  }, [syncSettings, resolveConflict]);

  // Enhanced retry all with progress tracking
  const retryAll = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: pendingActions.length, operation: 'retrying_all' });
    
    const strategy = bandwidthSync.current.getSyncStrategy();
    const batchSize = strategy.batchSize;
    
    for (let i = 0; i < pendingActions.length; i += batchSize) {
      const batch = pendingActions.slice(i, i + batchSize);
      
      setSyncProgress(prev => ({
        ...prev,
        current: i,
        operation: `retrying_batch_${Math.floor(i / batchSize) + 1}`
      }));

      await Promise.all(batch.map(item => retryAction(item)));

      if (strategy.batchDelay > 0 && i + batchSize < pendingActions.length) {
        await new Promise(resolve => setTimeout(resolve, strategy.batchDelay));
      }
    }
    
    setIsSyncing(false);
    setSyncProgress({ current: 0, total: 0, operation: null });
  }, [pendingActions, retryAction, isSyncing]);

  // Cancel action
  const cancelAction = useCallback(async (id) => {
    await deleteMutationById(id);
    setSyncStatus(s => ({ ...s, [id]: undefined }));
    setPendingActions(await getQueueIndexedDb());
    syncLogger.info(`Cancelled action: ${id}`);
  }, []);

  // Enhanced notification helper
  const sendSyncNotification = (status, message, actions = []) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_NOTIFICATION',
        status,
        message,
        actions,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Update sync settings
  const updateSyncSettings = useCallback((newSettings) => {
    setSyncSettings(prev => ({ ...prev, ...newSettings }));
    syncLogger.info('Sync settings updated', newSettings);
  }, []);

  // Force immediate sync
  const forceSyncNow = useCallback(async () => {
    if (isOnline) {
      await processQueue();
    }
  }, [isOnline, processQueue]);

  // Clear all offline data
  const clearAllData = useCallback(async () => {
    await clearQueueIndexedDb();
    await clearExpiredCache(0); // Clear all cached data
    setPendingActions([]);
    setConflicts([]);
    setSyncStatus({});
    syncLogger.clearLogs();
    syncLogger.info('All offline data cleared');
  }, []);

  const contextValue = {
    // Existing functionality
    pendingActions,
    syncStatus,
    queueMutation,
    retryAction,
    retryAll,
    cancelAction,
    processQueue,
    conflicts,
    resolveConflict,
    cacheDataForOffline,
    getCachedDataForOffline,

    // Enhanced functionality
    isOnline,
    isSyncing,
    syncProgress,
    networkQuality,
    storageUsage,
    compressionStats,
    syncSettings,
    updateSyncSettings,
    forceSyncNow,
    clearAllData,

    // Utilities
    syncLogger,
    conflictResolver: conflictResolver.current,
    deltaSync: deltaSync.current,
    bandwidthSync: bandwidthSync.current
  };

  return (
    <OfflineSyncContext.Provider value={contextValue}>
      {children}
    </OfflineSyncContext.Provider>
  );
}
