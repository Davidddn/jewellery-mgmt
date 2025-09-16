import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/useAuth';
import api from '../api/config';

// Check if audit API was previously disabled in this session
let auditApiDisabled = sessionStorage.getItem('auditApiDisabled') === 'true';

export const useActivityLogger = () => {
  const { user, loading } = useAuth();
  const { userRole, isLoading: permissionsLoading } = usePermissions();

  const logActivity = async (action, entityType, entityId = null, details = {}) => {
    try {
      // Don't log if user is not authenticated or still loading
      if (loading || permissionsLoading || !user) return;

      const activityData = {
        action,
        entityType,
        entityId,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          userRole,
          sessionId: sessionStorage.getItem('sessionId') || generateSessionId()
        }
      };

      // Store session ID if not exists
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', activityData.details.sessionId);
      }

      // Only try API logging if not disabled
      if (!auditApiDisabled) {
        try {
          await api.post('/audit-logs', activityData);
        } catch (apiError) {
          // If 404, disable future API calls to reduce noise
          if (apiError.response?.status === 404) {
            auditApiDisabled = true;
            sessionStorage.setItem('auditApiDisabled', 'true');
            console.warn('Audit logs endpoint not available - activity logging disabled for this session');
          } else {
            console.warn('Activity logging API error (non-critical):', apiError.message);
          }
        }
      }

      // Always log locally for offline scenarios and as backup
      const localLogs = JSON.parse(localStorage.getItem('pendingActivityLogs') || '[]');
      localLogs.push(activityData);
      localStorage.setItem('pendingActivityLogs', JSON.stringify(localLogs.slice(-50))); // Keep last 50

    } catch (error) {
      // Only log non-API errors to console to avoid spam
      console.warn('Activity logger error (non-critical):', error.message);
      
      // Store failed logs for retry
      const failedLogs = JSON.parse(localStorage.getItem('failedActivityLogs') || '[]');
      failedLogs.push({
        action,
        entityType,
        entityId,
        details,
        timestamp: new Date().toISOString(),
        error: error.message
      });
      localStorage.setItem('failedActivityLogs', JSON.stringify(failedLogs.slice(-20)));
    }
  };

  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Predefined activity types for consistency
  const ActivityTypes = {
    // Authentication
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    
    // Navigation
    PAGE_VIEW: 'PAGE_VIEW',
    ROUTE_CHANGE: 'ROUTE_CHANGE',
    
    // CRUD Operations
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    BULK_UPDATE: 'BULK_UPDATE',
    BULK_DELETE: 'BULK_DELETE',
    
    // Data Operations
    IMPORT: 'IMPORT',
    EXPORT: 'EXPORT',
    BACKUP: 'BACKUP',
    RESTORE: 'RESTORE',
    
    // Search and Filter
    SEARCH: 'SEARCH',
    FILTER_APPLIED: 'FILTER_APPLIED',
    SORT_APPLIED: 'SORT_APPLIED',
    
    // Reports
    REPORT_GENERATED: 'REPORT_GENERATED',
    REPORT_EXPORTED: 'REPORT_EXPORTED',
    ANALYTICS_VIEWED: 'ANALYTICS_VIEWED',
    
    // Settings
    SETTINGS_CHANGED: 'SETTINGS_CHANGED',
    PERMISSION_CHANGED: 'PERMISSION_CHANGED',
    
    // Errors
    ERROR_OCCURRED: 'ERROR_OCCURRED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    
    // Business Operations
    TRANSACTION_CREATED: 'TRANSACTION_CREATED',
    INVOICE_GENERATED: 'INVOICE_GENERATED',
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
    INVENTORY_UPDATED: 'INVENTORY_UPDATED',
    GOLD_RATE_UPDATED: 'GOLD_RATE_UPDATED'
  };

  const EntityTypes = {
    USER: 'User',
    PRODUCT: 'Product',
    CUSTOMER: 'Customer',
    TRANSACTION: 'Transaction',
    INVOICE: 'Invoice',
    CATEGORY: 'Category',
    GOLD_RATE: 'GoldRate',
    EXPENSE: 'Expense',
    LOYALTY: 'Loyalty',
    HALLMARKING: 'Hallmarking',
    SETTING: 'Setting',
    REPORT: 'Report',
    DASHBOARD: 'Dashboard'
  };

  // Convenience methods for common activities
  const logPageView = (pageName, additionalData = {}) => {
    logActivity(ActivityTypes.PAGE_VIEW, EntityTypes.DASHBOARD, null, {
      pageName,
      url: window.location.pathname,
      ...additionalData
    });
  };

  const logEntityAction = (action, entityType, entityId, oldData = null, newData = null) => {
    logActivity(action, entityType, entityId, {
      oldData,
      newData,
      timestamp: new Date().toISOString()
    });
  };

  const logError = (error, context = {}) => {
    logActivity(ActivityTypes.ERROR_OCCURRED, 'System', null, {
      error: error.message || error,
      stack: error.stack,
      context,
      url: window.location.pathname
    });
  };

  const logAccessDenied = (permission, attemptedAction = '') => {
    logActivity(ActivityTypes.ACCESS_DENIED, 'Security', null, {
      deniedPermission: permission,
      attemptedAction,
      url: window.location.pathname
    });
  };

  const logSearch = (searchTerm, entityType, resultsCount = 0) => {
    logActivity(ActivityTypes.SEARCH, entityType, null, {
      searchTerm,
      resultsCount,
      timestamp: new Date().toISOString()
    });
  };

  return {
    logActivity,
    logPageView,
    logEntityAction,
    logError,
    logAccessDenied,
    logSearch,
    ActivityTypes,
    EntityTypes
  };
};
