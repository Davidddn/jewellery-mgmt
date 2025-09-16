const { Op, fn, col, literal } = require('sequelize');
const { Transaction, Product, Customer, TransactionItem, Expense } = require('../models');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Profit & Loss Controller
 * Provides comprehensive financial reporting by combining sales revenue with expense tracking
 */

// Get comprehensive P&L statement
exports.getProfitLossStatement = async (req, res) => {
  try {
    const { start_date, end_date, granularity = 'monthly' } = req.query;
    
    let dateFilter = {};
    if (start_date && end_date) {
      dateFilter = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else {
      // Default to current year
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const endOfYear = new Date(new Date().getFullYear(), 11, 31);
      dateFilter = {
        [Op.between]: [startOfYear, endOfYear]
      };
    }

    // Revenue Calculation
    const revenueData = await Transaction.findAll({
      attributes: [
        [fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('created_at')), 'period'],
        [fn('SUM', col('final_amount')), 'total_revenue'],
        [fn('COUNT', col('id')), 'transaction_count']
      ],
      where: {
        created_at: dateFilter,
        transaction_type: 'sale',
        transaction_status: 'completed'
      },
      group: [fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('created_at'))],
      order: [[fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('created_at')), 'ASC']],
      raw: true
    });

    // Expense Calculation
    const expenseData = await Expense.findAll({
      attributes: [
        [fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('date')), 'period'],
        [fn('SUM', col('amount')), 'total_expenses'],
        'category'
      ],
      where: {
        date: dateFilter
      },
      group: [
        fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('date')),
        'category'
      ],
      order: [[fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('date')), 'ASC']],
      raw: true
    });

    // Expense breakdown by category
    const expensesByCategory = await Expense.findAll({
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total_amount'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        date: dateFilter
      },
      group: ['category'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      raw: true
    });

    // Calculate Cost of Goods Sold (COGS)
    const cogsData = await Expense.findAll({
      attributes: [
        [fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('date')), 'period'],
        [fn('SUM', col('amount')), 'cogs']
      ],
      where: {
        date: dateFilter,
        category: ['Raw Materials', 'Equipment', 'Transportation'] // COGS categories
      },
      group: [fn('strftime', `%Y-${granularity === 'daily' ? '%m-%d' : '%m'}`, col('date'))],
      raw: true
    });

    // Combine data for P&L statement
    const profitLossData = [];
    const periods = [...new Set([
      ...revenueData.map(r => r.period),
      ...expenseData.map(e => e.period)
    ])].sort();

    periods.forEach(period => {
      const revenue = revenueData.find(r => r.period === period);
      const expenses = expenseData
        .filter(e => e.period === period)
        .reduce((sum, e) => sum + parseFloat(e.total_expenses || 0), 0);
      const cogs = cogsData.find(c => c.period === period);

      const totalRevenue = parseFloat(revenue?.total_revenue || 0);
      const totalCOGS = parseFloat(cogs?.cogs || 0);
      const totalExpenses = expenses;
      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - (totalExpenses - totalCOGS);
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      profitLossData.push({
        period,
        revenue: totalRevenue,
        cogs: totalCOGS,
        gross_profit: grossProfit,
        operating_expenses: totalExpenses - totalCOGS,
        net_profit: netProfit,
        profit_margin: profitMargin,
        transaction_count: parseInt(revenue?.transaction_count || 0)
      });
    });

    // Summary totals
    const totalRevenue = profitLossData.reduce((sum, p) => sum + p.revenue, 0);
    const totalCOGS = profitLossData.reduce((sum, p) => sum + p.cogs, 0);
    const totalOperatingExpenses = profitLossData.reduce((sum, p) => sum + p.operating_expenses, 0);
    const totalNetProfit = profitLossData.reduce((sum, p) => sum + p.net_profit, 0);
    const overallProfitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        periods: profitLossData,
        summary: {
          total_revenue: totalRevenue,
          total_cogs: totalCOGS,
          gross_profit: totalRevenue - totalCOGS,
          total_operating_expenses: totalOperatingExpenses,
          net_profit: totalNetProfit,
          profit_margin: overallProfitMargin
        },
        expenses_by_category: expensesByCategory,
        date_range: { start_date, end_date },
        granularity
      }
    });

  } catch (error) {
    console.error('Error generating P&L statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate profit & loss statement',
      error: error.message
    });
  }
};

// Get real-time profit/loss metrics for dashboard
exports.getRealtimeProfitMetrics = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Today's metrics
    const [todayRevenue, todayExpenses] = await Promise.all([
      Transaction.sum('final_amount', {
        where: {
          created_at: { [Op.between]: [startOfDay, endOfDay] },
          transaction_type: 'sale',
          transaction_status: 'completed'
        }
      }),
      Expense.sum('amount', {
        where: {
          date: { [Op.between]: [startOfDay, endOfDay] }
        }
      })
    ]);

    // This month's metrics
    const [monthRevenue, monthExpenses] = await Promise.all([
      Transaction.sum('final_amount', {
        where: {
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
          transaction_type: 'sale',
          transaction_status: 'completed'
        }
      }),
      Expense.sum('amount', {
        where: {
          date: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      })
    ]);

    // Calculate profits
    const todayProfit = (todayRevenue || 0) - (todayExpenses || 0);
    const monthProfit = (monthRevenue || 0) - (monthExpenses || 0);

    // Calculate profit margins
    const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
    const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

    // Top expense categories this month
    const topExpenseCategories = await Expense.findAll({
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total_amount']
      ],
      where: {
        date: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      group: ['category'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue || 0,
          expenses: todayExpenses || 0,
          profit: todayProfit,
          margin: todayMargin
        },
        month: {
          revenue: monthRevenue || 0,
          expenses: monthExpenses || 0,
          profit: monthProfit,
          margin: monthMargin
        },
        top_expense_categories: topExpenseCategories
      }
    });

  } catch (error) {
    console.error('Error getting realtime profit metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit metrics',
      error: error.message
    });
  }
};

// Export P&L statement as CSV/PDF
exports.exportProfitLossStatement = async (req, res) => {
  try {
    const { start_date, end_date, format = 'csv', granularity = 'monthly' } = req.query;
    
    // Get P&L data (reuse the main function logic)
    const plRequest = { query: { start_date, end_date, granularity } };
    const plResponse = { 
      json: (data) => data // Mock response object
    };
    
    // This is a simplified approach - in production, you'd extract the logic into a shared function
    await exports.getProfitLossStatement(plRequest, plResponse);
    const plData = plResponse.json();

    if (!plData.success) {
      return res.status(500).json(plData);
    }

    const exportData = plData.data.periods.map(period => ({
      'Period': period.period,
      'Revenue': period.revenue.toFixed(2),
      'COGS': period.cogs.toFixed(2),
      'Gross Profit': period.gross_profit.toFixed(2),
      'Operating Expenses': period.operating_expenses.toFixed(2),
      'Net Profit': period.net_profit.toFixed(2),
      'Profit Margin (%)': period.profit_margin.toFixed(2),
      'Transactions': period.transaction_count
    }));

    const fileName = `profit_loss_statement_${start_date || 'all'}_${end_date || 'time'}.${format}`;

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment(fileName);
      doc.pipe(res);

      doc.fontSize(16).text('Profit & Loss Statement', { align: 'center' });
      doc.fontSize(12).text(`Period: ${start_date || 'All time'} to ${end_date || new Date().toISOString().split('T')[0]}`, { align: 'center' });
      doc.text(''); // Add space

      // Summary section
      doc.fontSize(14).text('Summary:', { underline: true });
      doc.fontSize(10);
      doc.text(`Total Revenue: ₹${plData.data.summary.total_revenue.toFixed(2)}`);
      doc.text(`Total COGS: ₹${plData.data.summary.total_cogs.toFixed(2)}`);
      doc.text(`Gross Profit: ₹${plData.data.summary.gross_profit.toFixed(2)}`);
      doc.text(`Operating Expenses: ₹${plData.data.summary.total_operating_expenses.toFixed(2)}`);
      doc.text(`Net Profit: ₹${plData.data.summary.net_profit.toFixed(2)}`);
      doc.text(`Profit Margin: ${plData.data.summary.profit_margin.toFixed(2)}%`);

      doc.end();
    } else {
      // Generate CSV
      const parser = new Parser();
      const csv = parser.parse(exportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(fileName);
      res.send(csv);
    }

  } catch (error) {
    console.error('Error exporting P&L statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export profit & loss statement',
      error: error.message
    });
  }
};

// Get expense impact on profit margins
exports.getExpenseImpactAnalysis = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = {};
    if (start_date && end_date) {
      dateFilter = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // Get expense trends by category
    const expenseTrends = await Expense.findAll({
      attributes: [
        'category',
        [fn('strftime', '%Y-%m', col('date')), 'month'],
        [fn('SUM', col('amount')), 'total_amount']
      ],
      where: { date: dateFilter },
      group: ['category', fn('strftime', '%Y-%m', col('date'))],
      order: [
        [fn('strftime', '%Y-%m', col('date')), 'ASC'],
        [fn('SUM', col('amount')), 'DESC']
      ],
      raw: true
    });

    // Calculate expense percentage of revenue
    const monthlyRevenue = await Transaction.findAll({
      attributes: [
        [fn('strftime', '%Y-%m', col('created_at')), 'month'],
        [fn('SUM', col('final_amount')), 'revenue']
      ],
      where: {
        created_at: dateFilter,
        transaction_type: 'sale',
        transaction_status: 'completed'
      },
      group: [fn('strftime', '%Y-%m', col('created_at'))],
      raw: true
    });

    // Combine expense and revenue data for analysis
    const impactAnalysis = {};
    
    expenseTrends.forEach(expense => {
      if (!impactAnalysis[expense.month]) {
        impactAnalysis[expense.month] = {
          month: expense.month,
          total_expenses: 0,
          expenses_by_category: {},
          revenue: 0,
          expense_ratio: 0
        };
      }
      
      impactAnalysis[expense.month].total_expenses += parseFloat(expense.total_amount);
      impactAnalysis[expense.month].expenses_by_category[expense.category] = parseFloat(expense.total_amount);
    });

    monthlyRevenue.forEach(rev => {
      if (impactAnalysis[rev.month]) {
        impactAnalysis[rev.month].revenue = parseFloat(rev.revenue);
        impactAnalysis[rev.month].expense_ratio = 
          (impactAnalysis[rev.month].total_expenses / parseFloat(rev.revenue)) * 100;
      }
    });

    res.json({
      success: true,
      data: {
        expense_impact: Object.values(impactAnalysis),
        expense_trends: expenseTrends
      }
    });

  } catch (error) {
    console.error('Error analyzing expense impact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze expense impact',
      error: error.message
    });
  }
};
