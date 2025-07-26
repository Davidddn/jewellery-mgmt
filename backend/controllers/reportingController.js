const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.dailySalesDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's transactions
    const todayTransactions = await Transaction.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'completed'
    });

    // Calculate metrics
    const revenue = todayTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const gstCollected = todayTransactions.reduce((sum, t) => sum + t.gst_amount, 0);
    const profit = revenue * 0.1; // Example: 10% margin

    // Top selling products
    const topSelling = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: today,
            $lt: tomorrow
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$product_id',
          total_sold: { $sum: '$quantity' },
          total_revenue: { $sum: '$total_amount' }
        }
      },
      {
        $sort: { total_revenue: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Low stock alerts
    const lowStockProducts = await Product.find({
      stock: { $lte: 5 }
    }).limit(10);

    // Recent transactions
    const recentTransactions = await Transaction.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      dashboard: {
        revenue,
        gstCollected,
        profit,
        transactionCount: todayTransactions.length,
        topSelling,
        lowStockProducts,
        recentTransactions
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, category } = req.query;
    
    let filter = {
      status: 'completed'
    };

    if (start_date && end_date) {
      filter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const transactions = await Transaction.find(filter)
      .populate('product_id', 'name category purity')
      .sort({ createdAt: -1 });

    // Filter by category if specified
    let filteredTransactions = transactions;
    if (category) {
      filteredTransactions = transactions.filter(t => 
        t.product_id && t.product_id.category === category
      );
    }

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalGST = filteredTransactions.reduce((sum, t) => sum + t.gst_amount, 0);

    res.json({
      success: true,
      report: {
        transactions: filteredTransactions,
        totalRevenue,
        totalGST,
        transactionCount: filteredTransactions.length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getGoldPriceTrends = async (req, res) => {
  try {
    // Mock gold price data - in production, fetch from MCX/IBJA API
    const goldPrices = [
      { date: '2024-01-01', price: 65000, purity: '24K' },
      { date: '2024-01-02', price: 65200, purity: '24K' },
      { date: '2024-01-03', price: 64800, purity: '24K' },
      { date: '2024-01-04', price: 65500, purity: '24K' },
      { date: '2024-01-05', price: 65800, purity: '24K' }
    ];

    res.json({
      success: true,
      goldPrices
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateFilter = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'month':
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
        break;
      case 'year':
        dateFilter = {
          $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };
        break;
      default:
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        };
    }

    const transactions = await Transaction.find({
      createdAt: dateFilter,
      status: 'completed'
    });

    const customerIds = [...new Set(transactions.map(t => t.customer_id))];
    const customers = await Customer.find({
      _id: { $in: customerIds }
    });

    const topCustomers = customers
      .sort((a, b) => b.total_purchases - a.total_purchases)
      .slice(0, 10);

    // Customer segmentation
    const customerSegments = {
      premium: customers.filter(c => c.total_purchases > 100000).length,
      regular: customers.filter(c => c.total_purchases > 50000 && c.total_purchases <= 100000).length,
      occasional: customers.filter(c => c.total_purchases <= 50000).length
    };

    res.json({
      success: true,
      analytics: {
        totalCustomers: customers.length,
        topCustomers,
        customerSegments,
        averagePurchaseValue: customers.length > 0 
          ? customers.reduce((sum, c) => sum + c.total_purchases, 0) / customers.length 
          : 0
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { category, min_stock, max_stock } = req.query;
    
    let filter = {};
    
    if (category) filter.category = category;
    if (min_stock !== undefined) filter.stock = { $gte: parseInt(min_stock) };
    if (max_stock !== undefined) {
      if (filter.stock) {
        filter.stock.$lte = parseInt(max_stock);
      } else {
        filter.stock = { $lte: parseInt(max_stock) };
      }
    }

    const products = await Product.find(filter).sort({ stock: 1 });

    const totalValue = products.reduce((sum, p) => {
      return sum + (p.weight * p.gold_rate * p.stock);
    }, 0);

    const categoryBreakdown = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$gold_rate' }
        }
      }
    ]);

    res.json({
      success: true,
      report: {
        products,
        totalProducts: products.length,
        totalValue,
        categoryBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getProfitLossReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = {};
    if (start_date && end_date) {
      dateFilter.createdAt = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      };
    }

    const transactions = await Transaction.find({
      ...dateFilter,
      status: 'completed'
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalGST = transactions.reduce((sum, t) => sum + t.gst_amount, 0);
    
    // Calculate cost (simplified - in real scenario, track actual costs)
    const totalCost = transactions.reduce((sum, t) => {
      // Assuming 70% of revenue is cost (30% margin)
      return sum + (t.total_amount * 0.7);
    }, 0);

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalGST;

    res.json({
      success: true,
      report: {
        totalRevenue,
        totalCost,
        grossProfit,
        totalGST,
        netProfit,
        margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        transactionCount: transactions.length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}; 