import api from './config';

export const productsAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Get product by SKU
  getProductBySku: async (sku) => {
    const response = await api.get(`/products/sku/${sku}`);
    return response.data;
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Create new product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id, stockData) => {
    const response = await api.patch(`/products/${id}/stock`, stockData);
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await api.get('/products/low-stock');
    return response.data;
  },

  // Search products
  searchProducts: async (searchTerm) => {
    const response = await api.get('/products/search', { params: { q: searchTerm } });
    return response.data;
  },

  // Get products by category
  getProductsByCategory: async (category) => {
    const response = await api.get('/products/category', { params: { category } });
    return response.data;
  },

  // Get products by metal type
  getProductsByMetalType: async (metalType) => {
    const response = await api.get('/products/metal-type', { params: { metalType } });
    return response.data;
  },

  // Get product statistics
  getProductStats: async () => {
    const response = await api.get('/products/stats');
    return response.data;
  },

  // Get active products
  getActiveProducts: async () => {
    const response = await api.get('/products/active');
    return response.data;
  }
}; 