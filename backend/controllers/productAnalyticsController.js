const { Product, TransactionItem, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    // Basic metrics
    const totalProducts = await Product.count();
    
    const lowStockProducts = await Product.count({
      where: {
        stock_quantity: {
          [Op.lte]: col('reorder_level')
        }
      }
    });

    const inventoryValue = await Product.sum('selling_price', {
      where: {
        stock_quantity: {
          [Op.gt]: 0
        }
      }
    });

    const avgPrice = await Product.aggregate('selling_price', 'AVG') || 0;

    // Top categories
    const topCategories = await Product.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        category: {
          [Op.ne]: null
        }
      },
      group: ['category'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    // Simple trending products (mock data for now)
    const trendingProducts = await Product.findAll({
      attributes: ['id', 'name', 'selling_price', 'stock_quantity'],
      where: {
        stock_quantity: {
          [Op.gt]: 0
        },
        is_active: 1
      },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    // Add trend indicators (mock for now)
    const trendingWithIndicators = trendingProducts.map((product, index) => ({
      id: product.id,
      name: product.name,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      sales_count: Math.floor(Math.random() * 50) + 10, // Mock data
      total_sold: Math.floor(Math.random() * 100) + 20, // Mock data
      trend: index % 2 === 0 ? 'up' : 'down',
      change: Math.floor(Math.random() * 20) + 5
    }));

    res.json({
      success: true,
      analytics: {
        totalProducts,
        lowStockCount: lowStockProducts,
        totalValue: inventoryValue || 0,
        avgPrice: Math.round(avgPrice),
        topCategories: topCategories.map(cat => ({
          name: cat.category,
          count: cat.count
        })),
        trending: trendingWithIndicators
      }
    });
  } catch (error) {
    console.error('Error getting product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

// Get product recommendations
const getProductRecommendations = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const recommendations = [];
    
    // 1. Popular products (by recent activity)
    const popular = await Product.findAll({
      where: {
        stock_quantity: { [Op.gt]: 0 },
        is_active: true
      },
      order: [['created_at', 'DESC']],
      limit: Math.ceil(limit / 2)
    });

    recommendations.push(...popular.map(product => ({
      id: product.id,
      name: product.name,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category: product.category,
      sales_count: Math.floor(Math.random() * 50) + 10, // Mock data
      reason: 'Popular'
    })));

    // 2. Low stock items (urgency)
    const lowStock = await Product.findAll({
      where: {
        stock_quantity: {
          [Op.and]: [
            { [Op.gt]: 0 },
            { [Op.lte]: col('reorder_level') }
          ]
        },
        is_active: true
      },
      limit: Math.floor(limit / 2)
    });

    recommendations.push(...lowStock.map(product => ({
      id: product.id,
      name: product.name,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      category: product.category,
      sales_count: Math.floor(Math.random() * 20) + 5, // Mock data
      reason: 'Low Stock - Reorder Soon'
    })));

    // 3. If we need more recommendations, add recently added products
    if (recommendations.length < limit) {
      const recent = await Product.findAll({
        where: {
          stock_quantity: { [Op.gt]: 0 },
          is_active: true,
          id: {
            [Op.notIn]: recommendations.map(r => r.id)
          }
        },
        order: [['created_at', 'DESC']],
        limit: limit - recommendations.length
      });

      recommendations.push(...recent.map(product => ({
        id: product.id,
        name: product.name,
        selling_price: product.selling_price,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url,
        category: product.category,
        sales_count: Math.floor(Math.random() * 30) + 5, // Mock data
        reason: 'Recently Added'
      })));
    }

    res.json({
      success: true,
      recommendations: recommendations.slice(0, limit)
    });
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
};

// Advanced product search with AI-like features
const intelligentSearch = async (req, res) => {
  try {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    
    // Build dynamic search conditions
    const searchConditions = [];
    
    // Exact matches (highest priority)
    searchConditions.push({
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { sku: { [Op.like]: `%${query}%` } },
        { category: { [Op.like]: `%${query}%` } }
      ]
    });
    
    // Partial matches for each term
    if (searchTerms.length > 1) {
      const termConditions = searchTerms.map(term => ({
        [Op.or]: [
          { name: { [Op.like]: `%${term}%` } },
          { description: { [Op.like]: `%${term}%` } },
          { tags: { [Op.like]: `%${term}%` } }
        ]
      }));
      
      searchConditions.push({
        [Op.and]: termConditions
      });
    }

    const products = await Product.findAndCountAll({
      where: {
        [Op.and]: [
          { [Op.or]: searchConditions },
          { is_active: true }
        ]
      },
      order: [
        // Prioritize exact name matches
        [literal(`CASE WHEN name LIKE '%${query}%' THEN 0 ELSE 1 END`), 'ASC'],
        // Then by relevance (how many terms match)
        ['name', 'ASC']
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Add search relevance scoring
    const productsWithScore = products.rows.map(product => {
      let score = 0;
      const productText = `${product.name} ${product.description} ${product.category} ${product.tags}`.toLowerCase();
      
      // Exact query match
      if (productText.includes(query.toLowerCase())) score += 10;
      
      // Term matches
      searchTerms.forEach(term => {
        if (productText.includes(term)) score += 3;
      });
      
      // Name match bonus
      if (product.name.toLowerCase().includes(query.toLowerCase())) score += 5;
      
      return {
        ...product.toJSON(),
        relevanceScore: score
      };
    });

    // Sort by relevance score
    productsWithScore.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      products: productsWithScore,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.count,
        pages: Math.ceil(products.count / parseInt(limit))
      },
      searchQuery: query,
      searchTerms
    });
  } catch (error) {
    console.error('Error in intelligent search:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

// Get product performance metrics
const getProductPerformance = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Sales performance
    const salesData = await TransactionItem.findAll({
      where: {
        product_id: productId,
        created_at: { [Op.gte]: startDate }
      },
      include: [{
        association: 'transaction',
        attributes: ['transaction_date', 'customer_id']
      }],
      order: [['created_at', 'ASC']]
    });

    const totalSold = salesData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalRevenue = salesData.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    const uniqueCustomers = new Set(salesData.map(item => item.transaction?.customer_id)).size;

    // Performance metrics
    const metrics = {
      totalSold,
      totalRevenue,
      uniqueCustomers,
      averageOrderValue: totalSold > 0 ? totalRevenue / salesData.length : 0,
      salesFrequency: salesData.length / parseInt(days), // sales per day
      stockTurnover: product.stock_quantity > 0 ? totalSold / (product.stock_quantity + totalSold) : 0
    };

    // Daily sales breakdown
    const dailySales = {};
    salesData.forEach(item => {
      const date = item.transaction?.transaction_date?.toISOString().split('T')[0];
      if (date) {
        dailySales[date] = (dailySales[date] || 0) + (item.quantity || 0);
      }
    });

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock_quantity
      },
      metrics,
      dailySales,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error getting product performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product performance',
      error: error.message
    });
  }
};

module.exports = {
  getProductAnalytics,
  getProductRecommendations,
  intelligentSearch,
  getProductPerformance
};
