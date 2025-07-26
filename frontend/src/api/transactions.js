import api from './config';

export const transactionsAPI = {
  // Get all transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  // Get transaction by ID
  getTransaction: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Get transaction with items
  getTransactionWithItems: async (id) => {
    const response = await api.get(`/transactions/${id}/items`);
    return response.data;
  },

  // Create new transaction
  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  // Create transaction with items
  createTransactionWithItems: async (transactionData, items) => {
    const response = await api.post('/transactions/with-items', {
      transaction: transactionData,
      items: items
    });
    return response.data;
  },

  // Update transaction
  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  // Delete transaction
  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  // Get transactions by customer
  getTransactionsByCustomer: async (customerId) => {
    const response = await api.get(`/transactions/customer/${customerId}`);
    return response.data;
  },

  // Get transactions by user
  getTransactionsByUser: async (userId) => {
    const response = await api.get(`/transactions/user/${userId}`);
    return response.data;
  },

  // Get transactions by date range
  getTransactionsByDateRange: async (startDate, endDate) => {
    const response = await api.get('/transactions/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get transactions by status
  getTransactionsByStatus: async (status) => {
    const response = await api.get('/transactions/status', { params: { status } });
    return response.data;
  },

  // Get transactions by payment method
  getTransactionsByPaymentMethod: async (paymentMethod) => {
    const response = await api.get('/transactions/payment-method', { params: { paymentMethod } });
    return response.data;
  },

  // Get sales statistics
  getSalesStats: async (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/transactions/sales-stats', { params });
    return response.data;
  },

  // Process return/exchange
  processReturn: async (id, returnData) => {
    const response = await api.post(`/transactions/${id}/return`, returnData);
    return response.data;
  },

  // Update transaction status
  updateTransactionStatus: async (id, status) => {
    const response = await api.patch(`/transactions/${id}/status`, { status });
    return response.data;
  },

  // Get invoice
  getInvoice: async (id) => {
    const response = await api.get(`/transactions/${id}/invoice`);
    return response.data;
  },

  // Get EMI details
  getEMIDetails: async (id) => {
    const response = await api.get(`/transactions/${id}/emi`);
    return response.data;
  },

  // Update EMI payment
  updateEMIPayment: async (id, paymentData) => {
    const response = await api.post(`/transactions/${id}/emi-payment`, paymentData);
    return response.data;
  }
}; 