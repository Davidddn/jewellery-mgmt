import api from './config';

export const usersAPI = {
  /**
   * Fetches a list of all users, with optional filtering. (Admin only)
   * @param {object} params - The query parameters for filtering (e.g., { name, role, status }).
   * @returns {Promise<object>} The list of users.
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Creates a new user. (Admin only)
   * @param {object} userData - The data for the new user.
   * @returns {Promise<object>} The newly created user object.
   */
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  /**
   * Updates an existing user by ID. (Admin only)
   * @param {string} id - The ID of the user to update.
   * @param {object} userData - The updated data for the user.
   * @returns {Promise<object>} The updated user object.
   */
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  /**
   * Deletes a user by ID. (Admin only)
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<object>} The confirmation message.
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
