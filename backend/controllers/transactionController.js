const { Transaction, Product, Customer, Loyalty, TransactionItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const fs = require('fs');
const csv = require('csv-parser');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Admin, Sales
exports.createTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id, items, payment_mode } = req.body;

    const customer = await Customer.findByPk(customer_id, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let total_amount = 0;
    let total_gst = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) throw new Error(`Product with ID ${item.product_id} not found.`);
      if (product.stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}.`);

      const item_base_price = product.selling_price * item.quantity;
      const item_gst = item_base_price * 0.03; // Example GST
      total_amount += item_base_price + item_gst;
      total_gst += item_gst;

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
      gst_amount: total_gst,
      final_amount: total_amount,
      payment_method: payment_mode,
      transaction_status: 'completed',
      transaction_type: 'sale',
    }, { transaction: t });

    for (const item of transactionItems) {
        item.transaction_id = transaction.id;
        await TransactionItem.create(item, { transaction: t });
    }

    // Correctly update customer total spent with the final amount
    customer.total_spent = (parseFloat(customer.total_spent) || 0) + transaction.final_amount;
    await customer.save({ transaction: t });

    // Assuming a simple loyalty point system
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

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Admin, Manager, Sales
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone'] }],
    });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Admin, Manager, Sales
exports.getTransactionById = async (req, res) => {
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
exports.updateTransaction = async (req, res) => {
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
exports.deleteTransaction = async (req, res) => {
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
exports.getInvoice = async (req, res) => {
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
                { label: 'GST Amount', value: 'gst_amount' },
                { label: 'Final Amount', value: 'final_amount' },
            ];

            const transactionData = {
                id: transaction.id,
                createdAt: new Date(transaction.createdAt).toLocaleDateString(),
                customer: {
                    name: transaction.customer ? transaction.customer.name : '',
                    phone: transaction.customer ? transaction.customer.phone : '',
                },
                gst_amount: parseFloat(transaction.gst_amount).toFixed(2),
                final_amount: parseFloat(transaction.final_amount).toFixed(2),
                subtotal: (parseFloat(transaction.final_amount) - parseFloat(transaction.gst_amount || 0)).toFixed(2),
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
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers).toString('base64');
                res.json({ success: true, pdf_data: pdfData });
            });

            // --- PDF Content ---
            doc.fontSize(20).text('Invoice', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(12).text(`Invoice ID: ${transaction.id}`);
            doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`);
            doc.moveDown();

            if (transaction.customer) {
                doc.text('Bill To:');
                doc.text(transaction.customer.name);
                doc.text(transaction.customer.address || '');
                doc.text(transaction.customer.email || '');
                doc.text(transaction.customer.phone || '');
            }
            
            doc.moveDown(2);

            // Table Header
            const tableTop = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 250, tableTop);
            doc.text('Price', 350, tableTop, { width: 100, align: 'right' });
            doc.text('Total', 450, tableTop, { width: 100, align: 'right' });
            doc.font('Helvetica');

            // Table Rows
            let i = 0;
            for (const item of transaction.items) {
                const y = tableTop + 25 + (i * 25);
                doc.text(item.product.name, 50, y);
                doc.text(item.quantity.toString(), 250, y);
                doc.text(`₹${item.unit_price}`, 350, y, { width: 100, align: 'right' });
                doc.text(`₹${item.total_price}`, 450, y, { width: 100, align: 'right' });
                i++;
            }
            
            doc.moveDown(i + 2);

            // Totals
            const totalsY = doc.y;
            const subtotal = parseFloat(transaction.final_amount) - parseFloat(transaction.gst_amount || 0);
            doc.font('Helvetica-Bold');
            doc.text('Subtotal:', 350, totalsY, { width: 100, align: 'right' });
            doc.text(`₹${subtotal.toFixed(2)}`, 450, totalsY, { width: 100, align: 'right' });
            
            doc.text('GST:', 350, totalsY + 20, { width: 100, align: 'right' });
            doc.text(`₹${parseFloat(transaction.gst_amount).toFixed(2)}`, 450, totalsY + 20, { width: 100, align: 'right' });
            
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

exports.uploadCSV = async (req, res) => {
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
          const item_gst = item_base_price * 0.03; // Example GST
          const total_amount = item_base_price + item_gst;

          product.stock_quantity -= quantity;
          await product.save({ transaction: t });

          const transaction = await Transaction.create({
            customer_id: customer.id,
            user_id: req.user.id,
            total_amount: total_amount,
            gst_amount: item_gst,
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