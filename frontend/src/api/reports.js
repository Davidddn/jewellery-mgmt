import api from './config';

export const reportsAPI = {
  // Get daily sales dashboard
  getDailySales: async (date) => {
    const response = await api.get('/reports/daily-sales', { params: { date } });
    return response.data;
  },

  // Get sales analytics
  getSalesAnalytics: async (params = {}) => {
    const response = await api.get('/reports/sales-analytics', { params });
    return response.data;
  },

  // Get inventory reports
  getInventoryReports: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  // Get customer analytics
  getCustomerAnalytics: async (params = {}) => {
    const response = await api.get('/reports/customer-analytics', { params });
    return response.data;
  },

  // Get gold rate trends
  getGoldRateTrends: async (params = {}) => {
    const response = await api.get('/reports/gold-rates', { params });
    return response.data;
  },

  // Get GST reports
  getGSTReports: async (params = {}) => {
    const response = await api.get('/reports/gst', { params });
    return response.data;
  },

  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/reports/audit-logs', { params });
    return response.data;
  },

  // Export report
  exportReport: async (reportType, params = {}) => {
    const response = await api.get(`/reports/export/${reportType}`, { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
}; 