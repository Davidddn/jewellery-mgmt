// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Admin, Sales
const createTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, items, payment_mode } = req.body;

    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let total_amount = 0;
    let total_tax = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) throw new Error(`Product with ID ${item.product_id} not found.`);
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}.`);

      const item_base_price = product.selling_price * item.quantity;
      const item_tax = item_base_price * 0.03; // Example GST
      total_amount += item_base_price + item_tax;
      total_tax += item_tax;

      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });

      transactionItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.selling_price,
        total_price: item_base_price,
      });
    }

    const transaction = await Transaction.create({
      customer_id,
      user_id: req.user.id,
      total_amount,
      tax_amount: total_tax,
      final_amount: total_amount,
      payment_method: payment_mode,
      transaction_status: 'completed',
      transaction_type: 'sale',
    }, { transaction: t });

    for (const item of transactionItems) {
      item.transaction_id = transaction.id;
      await TransactionItem.create(item, { transaction: t });
    }

    customer.total_spent = (parseFloat(customer.total_spent) || 0) + transaction.final_amount;
    await customer.save({ transaction: t });

    const points_earned = Math.floor(transaction.final_amount / 100);
    if (points_earned > 0) {
      await Loyalty.create({
        customer_id,
        points: points_earned,
        transaction_id: transaction.id,
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, message: 'Transaction successful', transaction });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
};
const { Transaction, Product, Customer, Loyalty, TransactionItem, sequelize } = require('../models');
const { Op, fn, col } = require('sequelize');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');


// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Admin, Manager, Sales
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { 
          model: TransactionItem, 
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'selling_price'] }]
        }
      ],
    });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recent transactions
// @route   GET /api/transactions/recent
// @access  Admin, Manager, Sales
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const transactions = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
    });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get real-time stats
// @route   GET /api/transactions/realtime-stats
// @access  Admin, Manager, Sales
const getRealtimeStats = async (req, res) => {
  try {
    const now = new Date();
    // Use UTC dates to ensure consistency
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const todaysTransactions = await Transaction.findAll({
      where: {
        created_at: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        transaction_type: 'sale',
        transaction_status: 'completed'
      }
    });

    const todaysSales = todaysTransactions.reduce((sum, t) => sum + Number(t.final_amount), 0);

    const recentTransactionsRaw = await Transaction.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
    });

    const recentTransactions = recentTransactionsRaw.map(t => ({
      id: t.id,
      final_amount: t.final_amount,
      created_at: t.created_at,
      customer: t.customer ? { name: t.customer.name } : null
    }));

    // Set cache headers to prevent caching of real-time data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: {
        todaysSales,
        todaysTransactions: todaysTransactions.length,
        recentTransactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get sales timeline
// @route   GET /api/transactions/sales-timeline
// @access  Admin, Manager, Sales
const getSalesTimeline = async (req, res) => {
  try {
    const now = new Date();
    // Use UTC date to ensure consistency with database timestamps
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    const sales = await Transaction.findAll({
      where: {
        created_at: { [Op.gte]: startOfDay },
        transaction_type: 'sale',
        transaction_status: 'completed'
      },
      attributes: [
        [fn('strftime', '%H:00', col('created_at')), 'hour'],
        [fn('sum', col('final_amount')), 'sales']
      ],
      group: [fn('strftime', '%H:00', col('created_at'))],
      order: [[col('hour'), 'ASC']]
    });

    // Set cache headers to prevent caching of real-time data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Admin, Manager, Sales
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id, {
        include: [
            { model: Customer, as: 'customer' },
            { 
                model: TransactionItem, 
                as: 'items',
                include: [{ model: Product, as: 'product' }]
            }
        ]
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Admin
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Transaction.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const updatedTransaction = await Transaction.findByPk(id);
    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updatedTransaction,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Admin
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Generate PDF/CSV Invoice for a transaction
// @route   GET /api/transactions/:id/invoice?format=csv
// @access  Admin, Manager, Sales
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { format } = req.query; // Get format from query parameter

        const transaction = await Transaction.findByPk(id, {
            include: [
                { model: Customer, as: 'customer' },
                { 
                    model: TransactionItem, 
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        if (format === 'csv') {
            // CSV Generation
            const fields = [
                { label: 'Invoice ID', value: 'id' },
                { label: 'Date', value: 'createdAt' },
                { label: 'Customer Name', value: 'customer.name' },
                { label: 'Customer Phone', value: 'customer.phone' },
                { label: 'Item Name', value: 'items.product.name' },
                { label: 'Quantity', value: 'items.quantity' },
                { label: 'Unit Price', value: 'items.unit_price' },
                { label: 'Total Price', value: 'items.total_price' },
                { label: 'Subtotal', value: 'subtotal' },
                { label: 'GST Amount', value: 'tax_amount' },
                { label: 'Final Amount', value: 'final_amount' },
            ];

            const transactionData = {
                id: transaction.id,
                createdAt: new Date(transaction.createdAt).toLocaleDateString(),
                customer: {
                    name: transaction.customer ? transaction.customer.name : '',
                    phone: transaction.customer ? transaction.customer.phone : '',
                },
                tax_amount: parseFloat(transaction.tax_amount).toFixed(2),
                final_amount: parseFloat(transaction.final_amount).toFixed(2),
                subtotal: (parseFloat(transaction.final_amount) - parseFloat(transaction.tax_amount || 0)).toFixed(2),
            };

            const itemsData = transaction.items.map(item => ({
                'Item Name': item.product.name,
                'Quantity': item.quantity,
                'Unit Price': item.unit_price,
                'Total Price': item.total_price,
            }));

            const data = [{ ...transactionData, items: itemsData }];

            const json2csvParser = new Parser({ fields, unwind: 'items' });
            const csv = json2csvParser.parse(data);

            res.header('Content-Type', 'text/csv');
            res.attachment(`invoice-${transaction.id}.csv`);
            return res.send(csv);

        } else {
            // PDF Generation (existing logic)
            const doc = new PDFDocument({ margin: 50 });
            // Totals
            const totalsY = doc.y;
            const subtotal = parseFloat(transaction.final_amount) - parseFloat(transaction.tax_amount || 0);
            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 350, totalsY, { width: 100, align: 'right' });
            doc.text(`₹${subtotal.toFixed(2)}`, 450, totalsY, { width: 100, align: 'right' });
            
            doc.text('GST:', 350, totalsY + 20, { width: 100, align: 'right' });
            doc.text(`₹${parseFloat(transaction.tax_amount).toFixed(2)}`, 450, totalsY + 20, { width: 100, align: 'right' });
            
            doc.text('Total:', 350, totalsY + 40, { width: 100, align: 'right' });
            doc.text(`₹${parseFloat(transaction.final_amount).toFixed(2)}`, 450, totalsY + 40, { width: 100, align: 'right' });
            doc.font('Helvetica');

            doc.end();
        }

    } catch (err) {
        console.error('Invoice generation error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate invoice.' });
    }
};

const uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const results = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let createdCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const item of results) {
        const t = await sequelize.transaction();
        try {
          const { customer_phone, product_sku, quantity, payment_mode } = item;

          const customer = await Customer.findOne({ where: { phone: customer_phone } });
          if (!customer) {
            errors.push(`Customer with phone ${customer_phone} not found.`);
            errorCount++;
            await t.rollback();
            continue;
          }

          const product = await Product.findOne({ where: { sku: product_sku } });
          if (!product) {
            errors.push(`Product with SKU ${product_sku} not found.`);
            errorCount++;
            await t.rollback();
            continue;
          }

          if (product.stock_quantity < quantity) {
            errors.push(`Insufficient stock for ${product.name}.`);
            errorCount++;
            await t.rollback();
            continue;
          }

          const item_base_price = product.selling_price * quantity;
          const item_tax = item_base_price * 0.03; // Example GST
          const total_amount = item_base_price + item_tax;

          product.stock_quantity -= quantity;
          await product.save({ transaction: t });

          const transaction = await Transaction.create({
            customer_id: customer.id,
            user_id: req.user.id,
            total_amount: total_amount,
            tax_amount: item_tax,
            final_amount: total_amount,
            payment_method: payment_mode,
            transaction_status: 'completed',
            transaction_type: 'sale',
          }, { transaction: t });

          await TransactionItem.create({
              transaction_id: transaction.id,
              product_id: product.id,
              quantity: quantity,
              unit_price: product.selling_price,
              total_price: item_base_price,
          }, { transaction: t });

          customer.total_spent = (parseFloat(customer.total_spent) || 0) + total_amount;
          await customer.save({ transaction: t });

          const points_earned = Math.floor(total_amount / 100);
          if (points_earned > 0) {
              await Loyalty.create({
                  customer_id: customer.id,
                  points: points_earned,
                  transaction_id: transaction.id,
              }, { transaction: t });
          }

          await t.commit();
          createdCount++;
        } catch (error) {
          await t.rollback();
          errors.push(error.message);
          errorCount++;
        }
      }

      fs.unlinkSync(filePath); // Clean up the uploaded file
      res.status(200).json({ 
        success: true, 
        message: 'CSV processed.',
        created: createdCount,
        errors: errorCount,
        errorList: errors,
      });
    });
};

const exportCSV = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone'] }],
    });
    const fields = ['id', 'customer.name', 'customer.phone', 'createdAt', 'transaction_status', 'final_amount'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getRecentTransactions,
  getRealtimeStats,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getInvoice,
  uploadCSV,
  exportCSV,
  getSalesTimeline,
};