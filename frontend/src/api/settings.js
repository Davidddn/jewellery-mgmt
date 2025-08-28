import api from './config';

export const settingsAPI = {
  getLogo: async () => {
    try {
      console.log('🔍 Fetching active logo from API...');
      const response = await api.get('/settings/logo', {
        responseType: 'blob',
        timeout: 10000
      });
      console.log('✅ Active logo fetched successfully, size:', response.data.size);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching active logo:', error);
      if (error.response?.status === 404) {
        console.log('📝 No active logo found on server');
        return null;
      }
      throw error;
    }
  },

  getAllLogos: async () => {
    try {
      console.log('🔍 Fetching all logos from API...');
      const response = await api.get('/settings/logos');
      console.log('✅ All logos fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching all logos:', error);
      throw error;
    }
  },

  setActiveLogo: async (filename) => {
    try {
      console.log('🔄 Setting active logo:', filename);
      const response = await api.put('/settings/logo/active', { filename });
      console.log('✅ Active logo set successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error setting active logo:', error);
      throw error;
    }
  },

  uploadLogo: async (file) => {
    try {
      console.log('📤 Uploading logo:', file.name, 'Size:', file.size);
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      });
      
      console.log('✅ Logo uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      throw error;
    }
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
