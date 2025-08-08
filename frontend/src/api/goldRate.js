import api from './config';

export const goldRateAPI = {
  /**
   * Fetches the current gold rates.
   * The backend will return live rates unless a manual override for the day exists.
   * @returns {Promise<object>} The gold rate data, keyed by purity.
   * @throws {Error} If the API request fails
   */
  getGoldRates: async () => {
    try {
      const response = await api.get('/gold-rates');
      
      // Validate response structure
      if (!response.data?.success || !response.data?.rates) {
        throw new Error('Invalid response format from gold rates API');
      }

      // Validate and normalize rates
      const validPurities = ['24K', '22K', '18K'];
      const normalizedRates = {};

      validPurities.forEach(purity => {
        const rateData = response.data.rates[purity];
        if (!rateData) return;

        normalizedRates[purity] = {
          purity,
          rate: typeof rateData.rate === 'string' ? 
              parseFloat(rateData.rate) : rateData.rate,
          source: rateData.source || 'unknown',
          timestamp: rateData.timestamp || new Date().toISOString()
        };
      });

      return {
        success: true,
        rates: normalizedRates,
        source: response.data.source,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Gold rates fetch error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch gold rates');
    }
  },

  /**
   * Updates the gold rates manually. (Admin/Manager only)
   * This will override the live rates for the day.
   * @param {object} ratesData - The new rates to set. e.g., { rates: [{ purity: '22K', rate: 60000 }] }
   * @returns {Promise<object>} The updated gold rates.
   * @throws {Error} If the API request fails or validation fails
   */
  updateGoldRates: async (ratesData) => {
    try {
      // Validate input data
      if (!ratesData.rates || !Array.isArray(ratesData.rates)) {
        throw new Error('Invalid rates data format');
      }

      // Validate each rate entry
      ratesData.rates.forEach(rate => {
        if (!rate.purity || !rate.rate) {
          throw new Error('Each rate must have purity and rate values');
        }
        if (!['24K', '22K', '18K'].includes(rate.purity)) {
          throw new Error('Invalid purity value');
        }
        if (typeof rate.rate !== 'number' || rate.rate <= 0) {
          throw new Error('Rate must be a positive number');
        }
      });

      const response = await api.post('/gold-rates', ratesData);
      
      // Validate response
      if (!response.data || !response.data.success) {
        throw new Error('Failed to update gold rates');
      }

      return response.data;
    } catch (error) {
      console.error('Gold rates update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update gold rates');
    }
  },
};
