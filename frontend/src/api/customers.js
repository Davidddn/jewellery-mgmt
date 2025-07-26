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

  // Get customer by phone
  getCustomerByPhone: async (phone) => {
    const response = await api.get(`/customers/phone/${phone}`);
    return response.data;
  },

  // Get customer by email
  getCustomerByEmail: async (email) => {
    const response = await api.get(`/customers/email/${email}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
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

  // Search customers
  searchCustomers: async (searchTerm) => {
    const response = await api.get('/customers/search', { params: { q: searchTerm } });
    return response.data;
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
  }
}; 