import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const expensesAPI = {
  // Get all expenses with optional filters
  getExpenses: (params = {}) => 
    api.get('/expenses', { params }).then(res => res.data),

  // Get expense by ID
  getExpense: (id) => 
    api.get(`/expenses/${id}`).then(res => res.data),

  // Create new expense
  createExpense: (expense) => 
    api.post('/expenses', expense).then(res => res.data),

  // Update expense
  updateExpense: (id, expense) => 
    api.put(`/expenses/${id}`, expense).then(res => res.data),

  // Delete expense
  deleteExpense: (id) => 
    api.delete(`/expenses/${id}`).then(res => res.data),

  // Get expense analytics
  getAnalytics: (params = {}) => 
    api.get('/expenses/analytics', { params }).then(res => res.data),

  // Export expenses
  exportExpenses: async (params = {}) => {
    const response = await api.get('/expenses/export', { 
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `expenses.${params.format || 'csv'}`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Get expense categories
  getExpenseCategories: () => 
    api.get('/expenses/categories').then(res => res.data),

  // Download expenses (legacy method name)
  downloadExpenses: async (params = {}) => {
    const response = await api.get('/expenses/download', { 
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `expenses.${params.format || 'csv'}`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

// Export with both names for compatibility
export const expenseApi = expensesAPI;
export default expensesAPI;
