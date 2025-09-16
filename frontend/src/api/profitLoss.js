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

export const profitLossAPI = {
  // Get comprehensive profit & loss statement
  getProfitLossStatement: (params = {}) => 
    api.get('/profit-loss/statement', { params }).then(res => res.data),

  // Get real-time profit metrics for dashboard
  getRealtimeProfitMetrics: () => 
    api.get('/profit-loss/realtime-metrics').then(res => res.data),

  // Export profit & loss statement
  exportProfitLossStatement: async (params = {}) => {
    const response = await api.get('/profit-loss/export', { 
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const filename = params.format === 'pdf' 
      ? `profit_loss_statement_${params.start_date || 'all'}_${params.end_date || 'time'}.pdf`
      : `profit_loss_statement_${params.start_date || 'all'}_${params.end_date || 'time'}.csv`;
      
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response;
  },

  // Get expense impact analysis on profit margins  
  getExpenseImpactAnalysis: (params = {}) => 
    api.get('/profit-loss/expense-impact', { params }).then(res => res.data)
};

export default profitLossAPI;
