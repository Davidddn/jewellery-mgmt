import api from './config';

export const inventoryAPI = {
  // Get inventory status
  getInventoryStatus: async () => {
    const response = await api.get('/inventory/status');
    return response.data;
  },

  // Get inventory by product
  getInventoryByProduct: async (productId) => {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  // Update inventory quantity
  updateInventoryQuantity: async (productId, quantity, location = null, notes = null) => {
    const response = await api.patch(`/inventory/product/${productId}`, {
      quantity,
      location,
      notes
    });
    return response.data;
  },

  // Add stock
  addStock: async (productId, quantity, location = null, notes = null) => {
    const response = await api.post(`/inventory/product/${productId}/add`, {
      quantity,
      location,
      notes
    });
    return response.data;
  },

  // Remove stock
  removeStock: async (productId, quantity, location = null, notes = null) => {
    const response = await api.post(`/inventory/product/${productId}/remove`, {
      quantity,
      location,
      notes
    });
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  // Get inventory movements
  getInventoryMovements: async (params = {}) => {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  // Get inventory by location
  getInventoryByLocation: async (location) => {
    const response = await api.get('/inventory/location', { params: { location } });
    return response.data;
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },

  // Export inventory report
  exportInventoryReport: async (format = 'csv') => {
    const response = await api.get('/inventory/export', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
}; 