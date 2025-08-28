import api from './config';

export const transactionsAPI = {
  // Regular transaction functions (remove /api/ since config adds it)
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getTransaction: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  getRecentTransactions: async (limit = 5) => {
    const response = await api.get('/transactions/recent', { params: { limit } });
    return response.data;
  },

  getRealtimeStats: async () => {
    const response = await api.get('/transactions/realtime-stats');
    return response.data;
  },

  // Invoice functions (remove /api/ since config adds it)
  getInvoice: async (transactionId, format = 'pdf') => {
    try {
      if (format === 'csv') {
        // Use blob response type for CSV
        const response = await api.get(`/invoices/${transactionId}/csv`, {
          responseType: 'blob'
        });
        return response;
      } else {
        // Regular JSON response for HTML/PDF
        const response = await api.get(`/invoices/${transactionId}`, { params: { format } });
        return response.data;
      }
    } catch (error) {
      console.error('API Error in getInvoice:', error);
      throw error;
    }
  },

  downloadInvoice: async (transactionId) => {
    return api.get(`/invoices/${transactionId}/download`, { responseType: 'blob' });
  },

  previewInvoice: async (transactionId) => {
    const response = await api.get(`/invoices/${transactionId}/preview`);
    return response.data;
  },

  // Alternative: Get invoice through transactions endpoint
  getTransactionInvoice: async (transactionId, format = 'pdf') => {
    const config = { params: { format } };
    if (format === 'csv') {
      config.responseType = 'blob';
    }
    try {
      const response = await api.get(`/transactions/${transactionId}/invoice`, config);
      return response.data;
    } catch (error) {
      console.error('API Error in getTransactionInvoice:', error);
      throw error;
    }
  },

  // Download CSV specifically
  downloadCSV: async (transactionId) => {
    try {
      const response = await api.get(`/invoices/${transactionId}/csv`, {
        responseType: 'blob'  // Important for CSV download
      });
      return response;
    } catch (error) {
      console.error('API Error in downloadCSV:', error);
      throw error;
    }
  },

  // Export all transactions as CSV
  exportTransactions: async () => {
    try {
      const response = await api.get('/transactions/export/csv', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('API Error in exportTransactions:', error);
      throw error;
    }
  },

  // Import transactions from CSV
  uploadCSV: async (formData) => {
    const response = await api.post('/imports/transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get sales timeline for dashboard
  getSalesTimeline: async () => {
    const response = await api.get('/transactions/sales-timeline');
    return response.data;
  },
};

export default transactionsAPI;