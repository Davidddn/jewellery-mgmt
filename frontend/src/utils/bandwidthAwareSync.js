// src/utils/bandwidthAwareSync.js
// Adaptive sync based on network conditions

class BandwidthAwareSync {
  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.syncStrategy = this.determineSyncStrategy();
    this.setupNetworkMonitoring();
  }
  
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }
  
  determineSyncStrategy() {
    const { effectiveType, saveData } = this.connectionInfo;
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        batchSize: 1,
        maxConcurrent: 1,
        compressionLevel: 'high',
        deltaOnly: true,
        priority: 'critical-only'
      };
    } else if (effectiveType === '3g') {
      return {
        batchSize: 5,
        maxConcurrent: 2,
        compressionLevel: 'medium',
        deltaOnly: true,
        priority: 'high-medium'
      };
    } else {
      return {
        batchSize: 10,
        maxConcurrent: 5,
        compressionLevel: 'low',
        deltaOnly: false,
        priority: 'all'
      };
    }
  }
  
  setupNetworkMonitoring() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.connectionInfo = this.getConnectionInfo();
        this.syncStrategy = this.determineSyncStrategy();
        this.onNetworkChange?.(this.syncStrategy);
      });
    }
  }
  
  onNetworkChange = null; // To be set by consumers
  
  // Adaptive batch sizing based on network
  getBatchSize(itemCount) {
    const baseSize = this.syncStrategy.batchSize;
    if (this.connectionInfo.effectiveType === '4g' && this.connectionInfo.downlink > 5) {
      return Math.min(itemCount, baseSize * 2);
    }
    return Math.min(itemCount, baseSize);
  }
  
  // Determine if item should sync based on priority
  shouldSync(item, priority = 'normal') {
    const strategy = this.syncStrategy.priority;
    
    if (strategy === 'critical-only') {
      return priority === 'critical';
    } else if (strategy === 'high-medium') {
      return ['critical', 'high', 'medium'].includes(priority);
    }
    return true; // 'all'
  }
  
  // Calculate optimal retry delay based on network
  getRetryDelay(attemptCount) {
    const baseDelay = 1000;
    const networkMultiplier = this.connectionInfo.effectiveType === '2g' ? 4 : 
                             this.connectionInfo.effectiveType === '3g' ? 2 : 1;
    
    return Math.min(baseDelay * Math.pow(2, attemptCount) * networkMultiplier, 60000);
  }
  
  // Estimate sync time for UI feedback
  estimateSyncTime(itemCount, averageItemSize) {
    const { downlink, rtt } = this.connectionInfo;
    const batchSize = this.getBatchSize(itemCount);
    const batches = Math.ceil(itemCount / batchSize);
    
    const transferTime = (itemCount * averageItemSize * 8) / (downlink * 1000 * 1000); // Convert to seconds
    const latencyTime = (batches * rtt) / 1000; // Convert to seconds
    
    return Math.ceil(transferTime + latencyTime);
  }
  
  // Get network quality indicator
  getNetworkQuality() {
    const { effectiveType, downlink } = this.connectionInfo;
    
    if (effectiveType === '4g' && downlink > 5) return 'excellent';
    if (effectiveType === '4g' || downlink > 2) return 'good';
    if (effectiveType === '3g') return 'fair';
    return 'poor';
  }
}

export { BandwidthAwareSync };
