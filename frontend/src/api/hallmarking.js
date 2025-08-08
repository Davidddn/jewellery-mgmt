import api from './config';

export const hallmarkingAPI = {
  // Get all hallmarking records
  getAllHallmarking: async (params = {}) => {
    const response = await api.get('/hallmarking', { params });
    return response.data;
  },

  // Get hallmarking by product
  getHallmarkingByProduct: async (productId) => {
    const response = await api.get(`/hallmarking/product/${productId}`);
    return response.data;
  },

  // Get hallmarking by certificate number
  getHallmarkingByCertificate: async (certificateNumber) => {
    const response = await api.get(`/hallmarking/certificate/${certificateNumber}`);
    return response.data;
  },

  // Create hallmarking record
  createHallmarking: async (hallmarkingData) => {
    const response = await api.post('/hallmarking', hallmarkingData);
    return response.data;
  },

  // Update hallmarking
  updateHallmarking: async (id, hallmarkingData) => {
    const response = await api.put(`/hallmarking/${id}`, hallmarkingData);
    return response.data;
  },

  // Delete hallmarking
  deleteHallmarking: async (id) => {
    const response = await api.delete(`/hallmarking/${id}`);
    return response.data;
  },

  // Update verification status
  updateVerificationStatus: async (id, purityVerified, weightVerified) => {
    const response = await api.patch(`/hallmarking/${id}/verification`, {
      purityVerified,
      weightVerified
    });
    return response.data;
  },

  // Get verified products
  getVerifiedProducts: async () => {
    const response = await api.get('/hallmarking/verified');
    return response.data;
  },

  // Get pending verifications
  getPendingVerifications: async () => {
    const response = await api.get('/hallmarking/pending');
    return response.data;
  },

  // Get hallmarking statistics
  getHallmarkingStats: async () => {
    const response = await api.get('/hallmarking/stats');
    return response.data;
  },

  // Get hallmarking by certifying authority
  getHallmarkingByAuthority: async (authority) => {
    const response = await api.get('/hallmarking/authority', { params: { authority } });
    return response.data;
  },

  // Get hallmarking by date range
  getHallmarkingByDateRange: async (startDate, endDate) => {
    const response = await api.get('/hallmarking/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Export hallmarking report
  exportHallmarkingReport: async (format = 'csv') => {
    const response = await api.get('/hallmarking/export', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
};
