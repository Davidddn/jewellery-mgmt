import api from './config';

export const healthAPI = {
  // Check server health
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Check database connectivity
  checkDatabase: async () => {
    try {
      const response = await api.get('/health/database');
      return response.data;
    } catch (error) {
      console.error('Database health check failed:', error);
      throw error;
    }
  },

  // Get server status
  getServerStatus: async () => {
    try {
      const response = await api.get('/health/status');
      return response.data;
    } catch (error) {
      console.error('Server status check failed:', error);
      throw error;
    }
  }
}; 