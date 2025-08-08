import api from './config'; // Assuming you have a central axios config

export const authAPI = {
  /**
   * Logs in a user.
   * @param {object} credentials - The user's credentials.
   * @param {string} credentials.username - The username.
   * @param {string} credentials.password - The password.
   * @returns {Promise<object>} The response data, including user and token.
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Registers a new user.
   * @param {object} userData - The data for the new user.
   * @returns {Promise<object>} The response data.
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logs in a user with biometric data.
   * @param {object} biometricData - The biometric data from the client.
   * @returns {Promise<object>} The response data, including user and token.
   */
  biometricLogin: async (biometricData) => {
    const response = await api.post('/auth/biometric', biometricData);
    return response.data;
  },

  /**
   * Fetches the profile of the currently authenticated user.
   * @returns {Promise<object>} The user's profile data.
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Updates the profile of the currently authenticated user.
   * @param {object} userData - The updated user data.
   * @returns {Promise<object>} The updated user profile.
   */
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  /**
   * Logs out the current user.
   * @returns {Promise<object>} The response data from the server.
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};
