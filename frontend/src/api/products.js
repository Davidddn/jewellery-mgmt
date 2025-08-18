import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productsAPI = {
  // Get all products
  getProducts: (params = {}) => 
    api.get('/api/products', { params }).then(res => res.data),
  
  // Get product by ID
  getProductById: (id) => 
    api.get(`/api/products/${id}`).then(res => res.data),
  
  // Create new product
  createProduct: (formData) => 
    api.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  // Update product
  updateProduct: (id, formData) => 
    api.put(`/api/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  // Delete product
  deleteProduct: (id) => 
    api.delete(`/api/products/${id}`).then(res => res.data),
  
  // Upload images
  uploadImages: (id, formData) => 
    api.post(`/api/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  // Delete image
  deleteImage: (id, imageType) => 
    api.delete(`/api/products/${id}/images/${imageType}`).then(res => res.data),
  
  // Search products
  searchProducts: (query) => 
    api.get('/api/products/search', { params: { q: query } }).then(res => res.data),
  
  // Get product by barcode
  getProductByBarcode: (barcode) => 
    api.get(`/api/products/barcode/${barcode}`).then(res => res.data),
  
  // Get product by SKU
  getProductBySku: (sku) => 
    api.get(`/api/products/sku/${sku}`).then(res => res.data),
  
  // Export CSV
  exportCSV: () => 
    api.get('/api/products/export/csv', { responseType: 'blob' }),
  
  // Upload CSV
  uploadCSV: (formData) => 
    api.post('/api/products/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),

  // Get all unique tags
  getAllTags: () => 
    api.get('/api/products/tags').then(res => res.data),

  // Search products with tags support
  searchProductsWithFilters: (params = {}) => 
    api.get('/api/products', { params }).then(res => res.data),

  // Excel export function
  exportExcel: () => 
    api.get('/api/products/export/excel', { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }).then(response => {
      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `products-export-${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Excel file downloaded successfully' };
    }),
};