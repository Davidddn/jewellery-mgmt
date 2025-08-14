import api from './config';

export const hallmarkingAPI = {
  getHallmarking: async () => {
    try {
      const response = await api.get('/hallmarking');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },
  createHallmarking: async (hallmarkData) => {
    try {
      const response = await api.post('/hallmarking', hallmarkData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },
  // You can add other hallmarking related API calls here if needed
};