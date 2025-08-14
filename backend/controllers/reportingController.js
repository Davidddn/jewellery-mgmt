const { Op, fn, col } = require('sequelize');
const { Parser } = require('json2csv');
const { Transaction, Product, Customer, TransactionItem } = require('../models');
const goldRateService = require('../services/goldRateService');
const PDFDocument = require('pdfkit');

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

const sendPdfResponse = (res, fileName, data, headers) => {
  if (!data || data.length === 0) {
    return res.status(404).json({ success: false, message: 'No data to export' });
  }
  try {
    const doc = new PDFDocument();
    res.header('Content-Type', 'application/pdf');
    res.attachment(fileName);
    doc.pipe(res);

    // Table Headers
    const tableTop = 100;
    const itemX = 50;
    const rowHeight = 25;
    let currentY = tableTop;

    doc.fontSize(12).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, itemX + i * 100, currentY, { width: 90, align: 'left' });
    });
    doc.fontSize(10).font('Helvetica');
    currentY += rowHeight;

    // Table Rows
    data.forEach(item => {
      headers.forEach((header, i) => {
        doc.text(item[header] ? item[header].toString() : '', itemX + i * 100, currentY, { width: 90, align: 'left' });
      });
      currentY += rowHeight;
    });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF file.' });
  }
};


exports.dailySalesDashboard = async (req, res) => {
  try {
    const { date } = req.query;
    let today;

    if (date) {
      today = new Date(date);
    } else {
      today = new Date();
    }

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
        { model: Product, as: 'product', attributes: ['id', 'name'], required: true },
      ],
      group: ['product_id', 'product.id', 'product.name'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5,
    });

    const lowStockProducts = await Product.findAll({
      where: {
        stock_quantity: { [Op.lte]: col('reorder_level') },
        reorder_level: { [Op.gt]: 0 } // Ensure reorder_level is greater than 0
      },
      order: [['stock_quantity', 'ASC']],
      limit: 10,
    });
    
    const totalCustomers = await Customer.count();

    res.json({
      success: true,
      dashboard: { revenue, transactionCount, topSelling, lowStockProducts, totalCustomers },
    });
  } catch (err) {
    console.error('Error in dailySalesDashboard:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
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
    let whereClause = {};
    let transactionWhereClause = { transaction_type: 'sale', transaction_status: 'completed' };

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      whereClause['$transaction.created_at$'] = {
        [Op.between]: [startDate, endDate],
      };
      transactionWhereClause.created_at = {
        [Op.between]: [startDate, endDate],
      };
    }

    const salesReport = await TransactionItem.findAll({
      attributes: [
        [col('transaction.created_at'), 'date'],
        [col('product.name'), 'productName'],
        ['quantity', 'totalQuantity'],
        ['total_price', 'totalAmount'],
      ],
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: [],
          required: true
        },
        {
          model: Product,
          as: 'product',
          attributes: [],
          required: true
        },
      ],
      where: whereClause,
      order: [[col('transaction.created_at'), 'DESC']],
      raw: true,
    });

    const dailySales = await Transaction.findAll({
      attributes: [
        [fn('date', col('created_at')), 'date'],
        [fn('sum', col('final_amount')), 'total_sales'],
      ],
      where: transactionWhereClause,
      group: [fn('date', col('created_at'))],
      order: [[fn('date', col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      success: true,
      report: { sales: salesReport, dailySales: dailySales },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventoryReports = async (req, res) => {
  try {
    const { type, category } = req.query;
    let whereClause = {};

    if (type === 'low_stock') {
      whereClause.stock_quantity = { [Op.lte]: col('reorder_level') };
    } else if (type === 'category' && category) {
      whereClause.category = { [Op.iLike]: `%${category}%` };
    }

    const products = await Product.findAll({
      where: whereClause,
      order: [['stock_quantity', 'ASC']],
    });

    const categoryBreakdown = await Product.findAll({
      attributes: ['category', [fn('SUM', col('stock_quantity')), 'totalStock']],
      group: ['category'],
    });

    res.json({
      success: true,
      report: { products, categoryBreakdown },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { type, start_date, end_date, name } = req.query;
    let whereClause = {};
    let order = [['total_spent', 'DESC']];
    let limit = null;

    if (type === 'date' && start_date && end_date) {
      whereClause.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      order = [['created_at', 'DESC']];
    } else if (type === 'name' && name) {
      whereClause.name = { [Op.iLike]: `%${name}%` };
    } else if (type === 'most_purchases') {
      limit = 10;
    }

    const customers = await Customer.findAll({
      where: whereClause,
      order: order,
      limit: limit,
    });

    res.json({
      success: true,
      analytics: { customers },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadSalesReport = async (req, res) => {
  try {
    const { type, start_date, end_date, format = 'csv' } = req.query;
    let whereClause = { transaction_type: 'sale', transaction_status: 'completed' };
    let order = [['created_at', 'DESC']];
    let fileName = `sales_report.${format}`;

    if (type === 'date_range' && start_date && end_date) {
      whereClause.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      fileName = `sales_report_${start_date}_to_${end_date}.${format}`;
    } else if (type === 'lowest') {
      order = [['final_amount', 'ASC']];
      fileName = `lowest_sales_report.${format}`;
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [{ model: Customer, as: 'customer', attributes: ['name', 'email'] }],
      order,
      raw: true,
      nest: true,
    });

    const data = transactions.map(t => ({
      'Transaction ID': t.id,
      'Date': new Date(t.created_at).toLocaleDateString('en-IN'),
      'Customer Name': t.customer.name,
      'Customer Email': t.customer.email,
      'Total Amount': t.total_amount,
      'Discount': t.discount,
      'Final Amount': t.final_amount,
      'Payment Method': t.payment_method,
    }));

    if (format === 'pdf') {
      const headers = ['Transaction ID', 'Date', 'Customer Name', 'Customer Email', 'Total Amount', 'Discount', 'Final Amount', 'Payment Method'];
      return sendPdfResponse(res, fileName, data, headers);
    } else {
      return sendCsvResponse(res, fileName, data);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadInventoryReport = async (req, res) => {
  try {
    const { type, category, format = 'csv' } = req.query;
    let products;
    let whereClause = {};
    let fileName = `inventory_report.${format}`;

    if (type === 'low_stock') {
      whereClause.stock_quantity = { [Op.lte]: col('reorder_level') };
      fileName = `low_stock_inventory_report.${format}`;
    } else if (type === 'category' && category) {
      whereClause.category = { [Op.iLike]: `%${category}%` };
      fileName = `inventory_report_${category}.${format}`;
    }

    products = await Product.findAll({ where: whereClause, raw: true });
    
    const data = products.map(p => ({
        'Product ID': p.id,
        'Name': p.name,
        'Category': p.category,
        'Stock Quantity': p.stock_quantity,
        'Reorder Level': p.reorder_level,
        'Cost Price': p.cost_price,
        'Selling Price': p.selling_price,
    }));

    if (format === 'pdf') {
      const headers = ['Product ID', 'Name', 'Category', 'Stock Quantity', 'Reorder Level', 'Cost Price', 'Selling Price'];
      return sendPdfResponse(res, fileName, data, headers);
    } else {
      return sendCsvResponse(res, fileName, data);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.downloadCustomerReport = async (req, res) => {
  try {
    const { type, start_date, end_date, name, format = 'csv' } = req.query;
    let customers;
    let whereClause = {};
    let order = [['created_at', 'DESC']];
    let fileName = `customers_report.${format}`;

    if (type === 'date' && start_date && end_date) {
      whereClause.created_at = { [Op.between]: [new Date(start_date), new Date(end_date)] };
      fileName = `customers_report_${start_date}_to_${end_date}.${format}`;
    } else if (type === 'name' && name) {
      whereClause.name = { [Op.iLike]: `%${name}%` };
      fileName = `customers_report_name_${name}.${format}`;
    } else if (type === 'most_purchases') {
      order = [['total_spent', 'DESC']];
      fileName = `top_customers_report.${format}`;
    }

    customers = await Customer.findAll({ where: whereClause, order, raw: true });

    const data = customers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Address': c.address,
        'Total Spent': parseFloat(c.total_spent).toFixed(2),
        'Joined Date': new Date(c.created_at).toLocaleDateString('en-IN'),
    }));

    if (format === 'pdf') {
      const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Address', 'Total Spent', 'Joined Date'];
      return sendPdfResponse(res, fileName, data, headers);
    } else {
      return sendCsvResponse(res, fileName, data);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};