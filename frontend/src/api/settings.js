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
  },

  resetSettings: async () => {
    const response = await api.post('/settings/reset');
    return response.data;
  },

  // Data Management Operations
  clearAllData: async () => {
    const response = await api.delete('/settings/clear-all-data');
    return response.data;
  },

  factoryReset: async () => {
    const response = await api.post('/settings/factory-reset');
    return response.data;
  },

  // Data Export Operations
  exportAllData: async () => {
    const response = await api.get('/settings/export/all', { responseType: 'blob' });
    return response.data;
  },

  exportProducts: async () => {
    const response = await api.get('/settings/export/products', { responseType: 'blob' });
    return response.data;
  },

  exportCustomers: async () => {
    const response = await api.get('/settings/export/customers', { responseType: 'blob' });
    return response.data;
  },

  exportTransactions: async () => {
    const response = await api.get('/settings/export/transactions', { responseType: 'blob' });
    return response.data;
  },

  // Database Operations
  backupDatabase: async () => {
    const response = await api.post('/settings/backup', { responseType: 'blob' });
    return response.data;
  },

  restoreDatabase: async (file) => {
    const formData = new FormData();
    formData.append('backup', file);
    const response = await api.post('/settings/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Data Cleanup Operations
  cleanDuplicates: async () => {
    const response = await api.post('/settings/cleanup/duplicates');
    return response.data;
  },

  archiveOldData: async () => {
    const response = await api.post('/settings/cleanup/archive');
    return response.data;
  },

  rebuildIndexes: async () => {
    const response = await api.post('/settings/maintenance/rebuild-indexes');
    return response.data;
  },

  validateData: async () => {
    const response = await api.post('/settings/maintenance/validate-data');
    return response.data;
  },

  updateStatistics: async () => {
    const response = await api.post('/settings/maintenance/update-stats');
    return response.data;
  },

  syncInventory: async () => {
    const response = await api.post('/settings/maintenance/sync-inventory');
    return response.data;
  },

  // Data Import Operations
  importProducts: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/settings/import/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  importCustomers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/settings/import/customers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  importTransactions: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/settings/import/transactions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // System Information
  getSystemInfo: async () => {
    const response = await api.get('/settings/system-info');
    return response.data;
  }
};

export default settingsAPI;
