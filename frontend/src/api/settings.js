import api from './config';

export const settingsAPI = {
  getLogo: async () => {
    try {
      const response = await api.get('/settings/logo', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching logo:', error);
      return null;
    }
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  }
};

export default settingsAPI;
