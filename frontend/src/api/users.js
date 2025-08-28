import api from './config';

export const usersAPI = {
  getActiveUserCount: async () => {
    const response = await api.get('/users/active-count');
    return response.data;
  },
};