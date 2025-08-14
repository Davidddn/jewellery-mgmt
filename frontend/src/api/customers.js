import api from './config';

export const customersAPI = {
  // Get all customers
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Get customer by phone - Updated to match Sales component expectations
  getCustomerByPhone: async (phone) => {
    try {
      const response = await api.get(`/customers/phone/${phone}`);
      return {
        success: true,
        customer: response.data.customer
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Customer not found by phone');
    }
  },

  // Get customer by email
  getCustomerByEmail: async (email) => {
    const response = await api.get(`/customers/email/${email}`);
    return response.data;
  },

  // Create new customer - Updated to match Sales component expectations
  createCustomer: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return {
        success: true,
        customer: response.data.customer
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create customer'
      };
    }
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  // Get customer transactions
  getCustomerTransactions: async (id) => {
    const response = await api.get(`/customers/${id}/transactions`);
    return response.data;
  },

  // Get customer loyalty points
  getCustomerLoyalty: async (id) => {
    const response = await api.get(`/customers/${id}/loyalty`);
    return response.data;
  },

  // Search customers - Updated to match Sales component expectations
  searchCustomers: async (searchTerm) => {
    try {
      const response = await api.get('/customers/search', { 
        params: { q: searchTerm } // Changed from 'search' to 'q' to match Sales component
      });
      return {
        success: true,
        customers: response.data.customers || []
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'No customers found');
    }
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await api.get('/customers/stats');
    return response.data;
  },

  // Get top customers
  getTopCustomers: async (limit = 10) => {
    const response = await api.get('/customers/top', { params: { limit } });
    return response.data;
  },

  // Get customers with loyalty points
  getCustomersWithLoyalty: async () => {
    const response = await api.get('/customers/loyalty');
    return response.data;
  },

  // Send SMS notification
  sendSMS: async (id, message) => {
    const response = await api.post(`/customers/${id}/sms`, { message });
    return response.data;
  },

  uploadCSV: async (formData) => {
    const response = await api.post('/customers/upload/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};