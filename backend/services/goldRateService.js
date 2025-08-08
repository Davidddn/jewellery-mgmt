const { GoldRate } = require('../models');
const logger = require('../utils/logger');

class GoldRateService {
  async getGoldRate(purity = '24K') {
    try {
      const goldRate = await GoldRate.findOne({ where: { purity } });
      if (goldRate) {
        return {
          purity: goldRate.purity,
          rate: parseFloat(goldRate.rate),
          timestamp: goldRate.updatedAt,
          source: 'manual'
        };
      }
      // Fallback to a default if not set
      const mockRates = { '24K': 65000, '22K': 59500, '18K': 48750 };
      return { purity, rate: mockRates[purity] || 0, timestamp: new Date(), source: 'default' };
    } catch (error) {
      logger.error('Error fetching gold rate from DB:', error);
      throw new Error('Failed to fetch gold rate');
    }
  }
}

module.exports = new GoldRateService();
