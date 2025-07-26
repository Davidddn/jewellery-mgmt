import api from './config';

export const loyaltyAPI = {
  // Get loyalty by customer
  getLoyaltyByCustomer: async (customerId) => {
    const response = await api.get(`/loyalty/customer/${customerId}`);
    return response.data;
  },

  // Add loyalty points
  addLoyaltyPoints: async (customerId, points, transactionId = null) => {
    const response = await api.post(`/loyalty/customer/${customerId}/add-points`, {
      points,
      transactionId
    });
    return response.data;
  },

  // Redeem loyalty points
  redeemLoyaltyPoints: async (customerId, points) => {
    const response = await api.post(`/loyalty/customer/${customerId}/redeem-points`, {
      points
    });
    return response.data;
  },

  // Get loyalty statistics
  getLoyaltyStats: async () => {
    const response = await api.get('/loyalty/stats');
    return response.data;
  },

  // Get top loyalty customers
  getTopLoyaltyCustomers: async (limit = 10) => {
    const response = await api.get('/loyalty/top-customers', { params: { limit } });
    return response.data;
  },

  // Update loyalty tier
  updateLoyaltyTier: async (customerId) => {
    const response = await api.patch(`/loyalty/customer/${customerId}/tier`);
    return response.data;
  },

  // Get loyalty history
  getLoyaltyHistory: async (customerId) => {
    const response = await api.get(`/loyalty/customer/${customerId}/history`);
    return response.data;
  },

  // Get loyalty rewards
  getLoyaltyRewards: async () => {
    const response = await api.get('/loyalty/rewards');
    return response.data;
  },

  // Create loyalty reward
  createLoyaltyReward: async (rewardData) => {
    const response = await api.post('/loyalty/rewards', rewardData);
    return response.data;
  },

  // Update loyalty reward
  updateLoyaltyReward: async (rewardId, rewardData) => {
    const response = await api.put(`/loyalty/rewards/${rewardId}`, rewardData);
    return response.data;
  },

  // Delete loyalty reward
  deleteLoyaltyReward: async (rewardId) => {
    const response = await api.delete(`/loyalty/rewards/${rewardId}`);
    return response.data;
  }
}; 