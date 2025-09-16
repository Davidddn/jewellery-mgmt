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
  
  updateHallmarking: async (id, hallmarkData) => {
    try {
      const response = await api.put(`/hallmarking/${id}`, hallmarkData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },
  
  deleteHallmarking: async (id) => {
    try {
      const response = await api.delete(`/hallmarking/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },
  
  getHallmarkingByProduct: async (productId) => {
    try {
      const response = await api.get(`/hallmarking/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  },
  
  verifyHallmarking: async (certificateNo) => {
    try {
      const response = await api.get(`/hallmarking/verify/${certificateNo}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message;
    }
  }
};