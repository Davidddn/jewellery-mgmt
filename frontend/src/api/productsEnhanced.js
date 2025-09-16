import { api } from './config';

// Enhanced Products API
export const productsAPI = {
  // ... existing methods from original productsAPI ...
  
  // Analytics endpoints
  getAnalytics: async () => {
    const response = await api.get('/products/analytics');
    return response.data;
  },

  getRecommendations: async (userId = null, limit = 5) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (limit) params.append('limit', limit);
    
    const response = await api.get(`/products/recommendations?${params}`);
    return response.data;
  },

  intelligentSearch: async (query, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await api.get(`/products/search/intelligent?${params}`);
    return response.data;
  },

  getProductPerformance: async (productId, days = 30) => {
    const response = await api.get(`/products/${productId}/performance?days=${days}`);
    return response.data;
  },

  // Enhanced search with filters
  searchProductsWithFilters: async (filters) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    const response = await api.get(`/products?${params}`);
    return response.data;
  },

  // Bulk operations
  bulkUpdateStock: async (updates) => {
    const response = await api.put('/products/bulk/stock', { updates });
    return response.data;
  },

  bulkUpdatePrices: async (updates) => {
    const response = await api.put('/products/bulk/prices', { updates });
    return response.data;
  },

  // Product insights
  getProductInsights: async (productId) => {
    const response = await api.get(`/products/${productId}/insights`);
    return response.data;
  },

  // Categories and filters data
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  getPurities: async () => {
    const response = await api.get('/products/purities');
    return response.data;
  },

  getAllTags: async () => {
    const response = await api.get('/products/tags');
    return response.data;
  },

  // Existing methods (you would need to copy these from your original API file)
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  searchProducts: async (searchTerm) => {
    const response = await api.get(`/products/search?query=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  exportExcel: async () => {
    const response = await api.get('/products/export/excel', {
      responseType: 'blob'
    });
    return response.data;
  },

  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    
    const response = await api.post('/products/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default productsAPI;
