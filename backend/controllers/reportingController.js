const { Op, fn, col } = require('sequelize');
const { Parser } = require('json2csv');
const { Transaction, Product, Customer, TransactionItem } = require('../models');
const goldRateService = require('../services/goldRateService');

const sendCsvResponse = (res, fileName, data) => {
  if (!data || data.length === 0) {
    return res.status(404).json({ success: false, message: 'No data to export' });
  }
  try {
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  } catch (err) {
    console.error('Error parsing to CSV:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate CSV file.' });
  }
};


exports.dailySalesDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause = {
      created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
      transaction_type: 'sale',
      transaction_status: 'completed'
    };

    const dailyTransactions = await Transaction.findAll({ where: whereClause });
    const revenue = dailyTransactions.reduce((sum, t) => sum + Number(t.final_amount), 0);
    const transactionCount = dailyTransactions.length;

    const topSelling = await TransactionItem.findAll({
      attributes: ['product_id', [fn('SUM', col('quantity')), 'total_sold']],
      include: [
        { model: Transaction, as: 'transaction', attributes: [], where: whereClause, required: true },
        { model: Product, as: 'product', attributes: ['name'], required: true },
      ],
      group: ['product_id', 'product.id', 'product.name'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5,
    });

    const lowStockProducts = await Product.findAll({
      where: { stock_quantity: { [Op.lte]: col('reorder_level') } },
      order: [['stock_quantity', 'ASC']],
      limit: 10,
    });
    
    const totalCustomers = await Customer.count();

    res.json({
      success: true,
      dashboard: { revenue, transactionCount, topSelling, lowStockProducts, totalCustomers },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGoldRate = async (req, res) => {
  try {
    const rate24k = await goldRateService.getGoldRate('24K');
    const rate22k = await goldRateService.getGoldRate('22K');
    const rate18k = await goldRateService.getGoldRate('18K');

    res.json({
      success: true,
      rates: {
        '24K': rate24k,
        '22K': rate22k,
        '18K': rate18k,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gold rates.' });
  }
};

exports.getSalesAnalytics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let whereClause = { transaction_type: 'sale', transaction_status: 'completed' };

    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    const allTransactions = await Transaction.findAll({
      where: whereClause,
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      order: [['created_at', 'DESC']],
    });

    const dailySales = await Transaction.findAll({
      attributes: [
        [fn('date', col('created_at')), 'date'],
        [fn('sum', col('final_amount')), 'total_sales'],
      ],
      where: whereClause,
      group: [fn('date', col('created_at'))],
      order: [[fn('date', col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      success: true,
      report: { allTransactions, dailySales },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventoryReports = async (req, res) => {
  try {
    const lowStockProducts = await Product.findAll({
      where: { stock_quantity: { [Op.lte]: col('reorder_level') } },
      order: [['stock_quantity', 'ASC']],
    });

    const categoryBreakdown = await Product.findAll({
      attributes: ['category', [fn('SUM', col('stock_quantity')), 'totalStock']],
      group: ['category'],
    });

    res.json({
      success: true,
      report: { lowStockProducts, categoryBreakdown },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const topCustomers = await Customer.findAll({
      order: [['total_spent', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      analytics: { topCustomers },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadSalesReport = async (req, res) => {
  try {
    const { type, start_date, end_date } = req.query;
    let whereClause = { transaction_type: 'sale', transaction_status: 'completed' };
    let order = [['created_at', 'DESC']];
    let fileName = 'sales_report.csv';

    if (type === 'date_range' && start_date && end_date) {
      whereClause.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      fileName = `sales_report_${start_date}_to_${end_date}.csv`;
    } else if (type === 'lowest') {
      order = [['final_amount', 'ASC']];
      fileName = 'lowest_sales_report.csv';
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [{ model: Customer, as: 'customer', attributes: ['name', 'email'] }],
      order,
      raw: true,
      nest: true,
    });

    const dataForCsv = transactions.map(t => ({
      'Transaction ID': t.id,
      'Date': new Date(t.created_at).toLocaleDateString('en-IN'),
      'Customer Name': t.customer.name,
      'Customer Email': t.customer.email,
      'Total Amount': t.total_amount,
      'Discount': t.discount,
      'Final Amount': t.final_amount,
      'Payment Method': t.payment_method,
    }));

    return sendCsvResponse(res, fileName, dataForCsv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadInventoryReport = async (req, res) => {
  try {
    const { type, category } = req.query;
    let products;
    let whereClause = {};
    let fileName = 'inventory_report.csv';

    if (type === 'low_stock') {
      whereClause.stock_quantity = { [Op.lte]: col('reorder_level') };
      fileName = 'low_stock_inventory_report.csv';
    } else if (type === 'category' && category) {
      whereClause.category = { [Op.iLike]: `%${category}%` };
      fileName = `inventory_report_${category}.csv`;
    }

    products = await Product.findAll({ where: whereClause, raw: true });
    
    const dataForCsv = products.map(p => ({
        'Product ID': p.id,
        'Name': p.name,
        'Category': p.category,
        'Stock Quantity': p.stock_quantity,
        'Reorder Level': p.reorder_level,
        'Cost Price': p.cost_price,
        'Selling Price': p.selling_price,
    }));

    return sendCsvResponse(res, fileName, dataForCsv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadCustomerReport = async (req, res) => {
  try {
    const { type, start_date, end_date, name } = req.query;
    let customers;
    let whereClause = {};
    let order = [['created_at', 'DESC']];
    let fileName = 'customers_report.csv';

    if (type === 'date' && start_date && end_date) {
      whereClause.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      fileName = `customers_report_${start_date}_to_${end_date}.csv`;
    } else if (type === 'name' && name) {
      whereClause.name = { [Op.iLike]: `%${name}%` };
      fileName = `customers_report_name_${name}.csv`;
    } else if (type === 'most_purchases') {
      order = [['total_spent', 'DESC']];
      fileName = 'top_customers_report.csv';
    }

    customers = await Customer.findAll({ where: whereClause, order, raw: true });

    const dataForCsv = customers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Address': c.address,
        // Format total_spent for consistency
        'Total Spent': parseFloat(c.total_spent).toFixed(2),
        'Joined Date': new Date(c.created_at).toLocaleDateString('en-IN'),
    }));

    return sendCsvResponse(res, fileName, dataForCsv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};