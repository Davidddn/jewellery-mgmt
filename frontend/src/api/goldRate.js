
import api from './config';

export const goldRateAPI = {
  createGoldRate: async (rateData) => {
    const { data } = await api.post('/gold-rates', rateData);
    return data;
  },
  getLatestGoldRate: async () => {
    const { data } = await api.get('/gold-rates/latest');
    return data;
  },
};
