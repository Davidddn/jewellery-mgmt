import api from './config';

export const auditAPI = {
  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  // Get audit log by ID
  getAuditLog: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Get audit logs by user
  getAuditLogsByUser: async (userId, limit = 50) => {
    const response = await api.get(`/audit-logs/user/${userId}`, { params: { limit } });
    return response.data;
  },

  // Get audit logs by table
  getAuditLogsByTable: async (tableName, limit = 50) => {
    const response = await api.get(`/audit-logs/table/${tableName}`, { params: { limit } });
    return response.data;
  },

  // Get audit logs by record
  getAuditLogsByRecord: async (tableName, recordId) => {
    const response = await api.get(`/audit-logs/record/${tableName}/${recordId}`);
    return response.data;
  },

  // Get audit logs by date range
  getAuditLogsByDateRange: async (startDate, endDate) => {
    const response = await api.get('/audit-logs/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get audit statistics
  getAuditStats: async () => {
    const response = await api.get('/audit-logs/stats');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit = 20) => {
    const response = await api.get('/audit-logs/recent', { params: { limit } });
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (format = 'csv', params = {}) => {
    const response = await api.get('/audit-logs/export', {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get user activity summary
  getUserActivitySummary: async (userId) => {
    const response = await api.get(`/audit-logs/user/${userId}/summary`);
    return response.data;
  },

  // Get system activity summary
  getSystemActivitySummary: async () => {
    const response = await api.get('/audit-logs/system/summary');
    return response.data;
  }
}; 