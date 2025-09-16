import api from './config';

export const usersAPI = {
  getActiveUserCount: async () => {
    const response = await api.get('/users/active-count');
    return response.data;
  },

  // Get all users with optional filters
  getAllUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.name) params.append('name', filters.name);
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    
    const response = await api.get(`/users${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  // Create a new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update an existing user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete a user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Get a specific user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Toggle user active status
  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/users/${userId}/toggle-status`);
    return response.data;
  },
};