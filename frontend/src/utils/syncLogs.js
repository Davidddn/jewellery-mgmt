// src/utils/syncLogs.js
// Enhanced logging system for offline sync operations

class SyncLogger {
  constructor() {
    this.maxLogs = 1000;
    this.isDebugMode = false;
    this.logLevels = {
      DEBUG: 0,
      INFO: 1,
      WARNING: 2,
      ERROR: 3,
      SUCCESS: 4
    };
    this.minLogLevel = this.logLevels.INFO;
    this.sessionId = Date.now().toString(36) + Math.random().toString(36);
    this.listeners = [];
  }

  getLogs() {
    try {
      const logs = localStorage.getItem('sync_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('Failed to load sync logs:', error);
      return [];
    }
  }

  saveLogs(logs) {
    try {
      // Keep only recent logs to prevent localStorage bloat
      const recentLogs = logs.slice(0, this.maxLogs);
      localStorage.setItem('sync_logs', JSON.stringify(recentLogs));
      return recentLogs;
    } catch (error) {
      console.warn('Failed to save sync logs:', error);
      return logs;
    }
  }

  log(level, message, details = null, category = 'sync') {
    const levelValue = this.logLevels[level.toUpperCase()] || this.logLevels.INFO;
    
    if (levelValue < this.minLogLevel && !this.isDebugMode) {
      return;
    }

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      type: level.toLowerCase(),
      message,
      details,
      category,
      session: this.sessionId
    };

    const logs = this.getLogs();
    logs.unshift(logEntry);
    this.saveLogs(logs);
    
    // Console output for development
    if (this.isDebugMode || level === 'ERROR') {
      const consoleMethod = level === 'ERROR' ? 'error' : 
                          level === 'WARNING' ? 'warn' : 'log';
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, details || '');
    }

    this.notifyListeners(logEntry);
  }

  // Specific sync operation logging methods
  logSyncStart(operation, details) {
    this.log('INFO', `Sync started: ${operation}`, details, 'sync');
  }

  logSyncComplete(operation, duration, details) {
    this.log('SUCCESS', `Sync completed: ${operation} (${duration}ms)`, details, 'sync');
  }

  logSyncError(operation, error, details) {
    this.log('ERROR', `Sync failed: ${operation}`, { error: error.message, ...details }, 'sync');
  }

  logConflict(type, item, resolution) {
    this.log('WARNING', `Conflict detected: ${type}`, { item, resolution }, 'conflict');
  }

  setDebugMode(enabled) {
    this.isDebugMode = enabled;
    this.log('INFO', `Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => this.removeListener(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(logEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  clearLogs() {
    localStorage.removeItem('sync_logs');
    this.log('INFO', 'Logs cleared');
  }

  exportLogs(format = 'json') {
    const logs = this.getLogs();
    const data = {
      exported: new Date().toISOString(),
      session: this.sessionId,
      logs
    };

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'details'];
      const rows = logs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.details ? JSON.stringify(log.details) : ''
      ]);

      return [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    }

    return JSON.stringify(data, null, 2);
  }
}

// Create singleton instance
const syncLogger = new SyncLogger();

// Legacy compatibility functions
export const getSyncLogs = () => syncLogger.getLogs();
export const clearSyncLogs = () => syncLogger.clearLogs();
export const addSyncLog = (type, message, details = null) => {
  syncLogger.log(type, message, details);
};

// Export new enhanced functions
export const exportSyncLogs = (format) => syncLogger.exportLogs(format);
export const setSyncDebugMode = (enabled) => syncLogger.setDebugMode(enabled);
export const addSyncLogListener = (callback) => syncLogger.addListener(callback);

// Export logger instance for direct use
export default syncLogger;
