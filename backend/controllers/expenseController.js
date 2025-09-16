const { Expense } = require('../models');
const { Op, fn, col } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

module.exports = {
  async createExpense(req, res) {
    try {
      const { description, amount, date, category, vendor, payment_method, notes } = req.body;
      const expense = await Expense.create({ 
        description, 
        amount, 
        date, 
        category,
        vendor,
        payment_method,
        notes,
        user_id: req.user.id 
      });
      res.status(201).json({ success: true, expense });
    } catch (err) {
      console.error('Error creating expense:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getExpenses(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        category, 
        startDate,
        endDate,
        sortBy = 'date',
        sortOrder = 'DESC',
        search
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = {};

      // Filter by category
      if (category && category !== 'all') {
        whereClause.category = category;
      }

      // Filter by date range
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      // Search in description, vendor, and notes
      if (search) {
        whereClause[Op.or] = [
          { description: { [Op.like]: `%${search}%` } },
          { vendor: { [Op.like]: `%${search}%` } },
          { notes: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: expenses } = await Expense.findAndCountAll({
        where: whereClause,
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({ 
        success: true, 
        expenses,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      console.error('Error fetching expenses:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getExpenseById(req, res) {
    try {
      const expense = await Expense.findByPk(req.params.id);
      if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
      res.json({ success: true, expense });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async updateExpense(req, res) {
    try {
      const { description, amount, date, category, vendor, payment_method, notes } = req.body;
      const expense = await Expense.findByPk(req.params.id);
      if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
      await expense.update({ 
        description, 
        amount, 
        date, 
        category, 
        vendor, 
        payment_method, 
        notes 
      });
      res.json({ success: true, expense });
    } catch (err) {
      console.error('Error updating expense:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      const expense = await Expense.findByPk(req.params.id);
      if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
      await expense.destroy();
      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Get expense analytics
  async getExpenseAnalytics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      let whereClause = {};

      if (start_date && end_date) {
        whereClause.date = {
          [Op.between]: [start_date, end_date]
        };
      }

      // Total expenses
      const totalExpenses = await Expense.sum('amount', { where: whereClause });

      // Expenses by category
      const expensesByCategory = await Expense.findAll({
        attributes: [
          'category',
          [fn('SUM', col('amount')), 'total_amount'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: whereClause,
        group: ['category'],
        order: [[fn('SUM', col('amount')), 'DESC']]
      });

      // Monthly expenses trend
      const monthlyTrend = await Expense.findAll({
        attributes: [
          [fn('strftime', '%Y-%m', col('date')), 'month'],
          [fn('SUM', col('amount')), 'total_amount']
        ],
        where: whereClause,
        group: [fn('strftime', '%Y-%m', col('date'))],
        order: [[fn('strftime', '%Y-%m', col('date')), 'ASC']]
      });

      // Top expenses
      const topExpenses = await Expense.findAll({
        where: whereClause,
        order: [['amount', 'DESC']],
        limit: 10
      });

      res.json({
        success: true,
        analytics: {
          totalExpenses: totalExpenses || 0,
          expensesByCategory,
          monthlyTrend,
          topExpenses
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Get expense categories
  async getExpenseCategories(req, res) {
    try {
      const categories = await Expense.findAll({
        attributes: [
          'category',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('amount')), 'total_amount']
        ],
        where: {
          category: { [Op.ne]: null }
        },
        group: ['category'],
        order: [[fn('COUNT', col('id')), 'DESC']]
      });

      res.json({ success: true, categories });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // Download expenses
  async downloadExpenses(req, res) {
    try {
      const { format = 'csv', start_date, end_date, category } = req.query;
      let whereClause = {};

      if (start_date && end_date) {
        whereClause.date = { [Op.between]: [start_date, end_date] };
      }

      if (category && category !== 'all') {
        whereClause.category = category;
      }

      const expenses = await Expense.findAll({
        where: whereClause,
        order: [['date', 'DESC']],
        raw: true
      });

      const data = expenses.map(expense => ({
        'Date': new Date(expense.date).toLocaleDateString('en-IN'),
        'Description': expense.description,
        'Category': expense.category || 'Uncategorized',
        'Amount': parseFloat(expense.amount).toFixed(2)
      }));

      if (format === 'pdf') {
        const doc = new PDFDocument();
        res.header('Content-Type', 'application/pdf');
        res.attachment('expenses.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Expense Report', 50, 50);
        doc.moveDown();

        data.forEach((expense, index) => {
          const y = 100 + (index * 20);
          doc.fontSize(10).text(`${expense.Date} - ${expense.Description} - ${expense.Category} - ₹${expense.Amount}`, 50, y);
        });

        doc.end();
      } else {
        const parser = new Parser();
        const csv = parser.parse(data);
        res.header('Content-Type', 'text/csv');
        res.attachment('expenses.csv');
        res.send(csv);
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
