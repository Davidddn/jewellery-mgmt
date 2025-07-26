const axios = require('axios');
const logger = require('../utils/logger');

class GoldRateService {
  constructor() {
    this.baseUrl = process.env.GOLD_RATE_API_URL || 'https://api.mcxindia.com/v1/gold-rates';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getGoldRate(purity = '24K') {
    try {
      const cacheKey = `gold_rate_${purity}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Mock gold rate data - replace with actual API call
      const mockRates = {
        '24K': 65000,
        '22K': 59500,
        '18K': 48750
      };

      const rate = mockRates[purity] || mockRates['24K'];
      
      const data = {
        purity,
        rate,
        timestamp: new Date().toISOString(),
        source: 'MCX'
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      logger.info(`Gold rate fetched for ${purity}: ${rate}`);
      return data;
    } catch (error) {
      logger.error('Error fetching gold rate:', error);
      throw new Error('Failed to fetch gold rate');
    }
  }

  async getGoldRateHistory(days = 7) {
    try {
      // Mock historical data
      const history = [];
      const baseRate = 65000;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        history.push({
          date: date.toISOString().split('T')[0],
          rate: baseRate + Math.floor(Math.random() * 1000) - 500,
          purity: '24K'
        });
      }

      return history;
    } catch (error) {
      logger.error('Error fetching gold rate history:', error);
      throw new Error('Failed to fetch gold rate history');
    }
  }

  async updateProductGoldRates() {
    try {
      const Product = require('../models/Product');
      const goldRate = await this.getGoldRate('24K');
      
      // Update all gold products with new rate
      const result = await Product.updateMany(
        { 
          category: 'gold',
          gold_rate: { $ne: goldRate.rate }
        },
        { gold_rate: goldRate.rate }
      );

      logger.info('Product gold rates updated successfully');
      return { updated: true, rate: goldRate.rate, modifiedCount: result.modifiedCount };
    } catch (error) {
      logger.error('Error updating product gold rates:', error);
      throw error;
    }
  }
}

module.exports = new GoldRateService(); 