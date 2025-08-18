const { Transaction, TransactionItem, Customer, Product, Setting } = require('../models');

const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    console.log(`Generating invoice for transaction ${id}, format: ${format}`);

    // Handle CSV format separately
    if (format === 'csv') {
      return generateCSV(req, res);
    }

    // Get transaction with all related data
    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        },
        {
          model: TransactionItem,
          as: 'items',
          required: false,
          include: [
            {
              model: Product,
              as: 'product',
              required: false
            }
          ]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    console.log('Transaction found:', {
      id: transaction.id,
      customer: transaction.customer?.name || 'No customer',
      itemsCount: transaction.items?.length || 0
    });

    // Get company settings (FIXED - query only existing columns)
    let companySettings = {
      company_name: 'Jewellery Store',
      company_address: 'Store Address',
      company_phone: 'Store Phone',
      company_email: 'store@email.com',
      gstin: 'GST Number'
    };

    try {
      // Query settings without timestamp columns that don't exist
      const settings = await Setting.findAll({
        attributes: ['id', 'key', 'value'] // Only select columns that exist
      });
      console.log('Raw settings from DB:', settings.length);
      settings.forEach(setting => {
        companySettings[setting.key] = setting.value;
      });
      console.log('Loaded settings successfully');
    } catch (settingsError) {
      console.warn('Could not load settings, using defaults:', settingsError.message);
    }

    // Format transaction data for invoice
    const invoiceData = {
      id: transaction.id,
      created_at: transaction.createdAt || transaction.created_at || new Date(),
      status: transaction.transaction_status || transaction.status || 'completed',
      payment_method: transaction.payment_method || 'cash',
      payment_reference: transaction.payment_reference,
      total_amount: transaction.final_amount || transaction.total_amount || 0,
      amount_paid: transaction.amount_paid || transaction.final_amount || transaction.total_amount || 0,
      customer: transaction.customer || {
        name: 'Cash Customer',
        phone: 'N/A',
        email: 'N/A'
      },
      items: transaction.items?.map(item => ({
        product_name: item.product?.name || 'Unknown Item',
        product_description: item.product?.description || '',
        sku: item.product?.sku || '',
        quantity: item.quantity || 1,
        price: item.unit_price || item.price || 0,
        total_price: item.total_price || (item.quantity * item.unit_price) || 0,
        weight: item.product?.weight || 0,
        purity: item.product?.purity || ''
      })) || []
    };

    console.log('Invoice data prepared:', {
      itemsCount: invoiceData.items.length,
      totalAmount: invoiceData.total_amount
    });

    // Generate HTML invoice (NO PDF SERVICE CALLS)
    const html = generateSimpleInvoiceHTML(invoiceData, companySettings);
    
    if (format === 'html') {
      // Return HTML for preview
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      // Return HTML data in JSON (no PDF generation)
      res.json({
        success: true,
        message: 'Invoice generated successfully',
        html_data: html,
        invoice_number: transaction.id,
        customer_name: transaction.customer?.name || 'Cash Customer'
      });
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Downloading invoice for transaction ${id}`);

    // Get transaction
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', required: false },
        { 
          model: TransactionItem, 
          as: 'items',
          required: false,
          include: [{ model: Product, as: 'product', required: false }]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate HTML invoice
    const html = generateSimpleInvoiceHTML({
      id: transaction.id,
      created_at: transaction.createdAt,
      status: transaction.transaction_status,
      payment_method: transaction.payment_method,
      total_amount: transaction.final_amount || transaction.total_amount,
      customer: transaction.customer,
      items: transaction.items?.map(item => ({
        product_name: item.product?.name || 'Unknown Item',
        quantity: item.quantity,
        price: item.unit_price,
        total_price: item.total_price
      })) || []
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${transaction.id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice',
      error: error.message
    });
  }
};

const previewInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Previewing invoice for transaction ${id}`);

    // Get transaction data
    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', required: false },
        { 
          model: TransactionItem, 
          as: 'items',
          required: false,
          include: [{ model: Product, as: 'product', required: false }]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate HTML preview
    const html = generateSimpleInvoiceHTML({
      id: transaction.id,
      created_at: transaction.createdAt,
      status: transaction.transaction_status,
      payment_method: transaction.payment_method,
      total_amount: transaction.final_amount || transaction.total_amount,
      customer: transaction.customer,
      items: transaction.items?.map(item => ({
        product_name: item.product?.name || 'Unknown Item',
        quantity: item.quantity,
        price: item.unit_price,
        total_price: item.total_price
      })) || []
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error previewing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview invoice'
    });
  }
};

// HTML generator function
function generateSimpleInvoiceHTML(invoiceData, companySettings = {}) {
  const {
    company_name = 'Jewellery Store',
    company_address = 'Store Address',
    company_phone = 'Store Phone',
    company_email = 'store@email.com'
  } = companySettings;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice #${invoiceData.id}</title>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; margin: 20px; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
          .company-name { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .company-info { font-size: 14px; color: #666; margin-bottom: 10px; }
          .invoice-title { font-size: 28px; margin: 20px 0; color: #666; font-weight: bold; }
          .invoice-meta { text-align: right; margin-bottom: 20px; font-size: 14px; }
          .section { margin: 25px 0; }
          .section h3 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; color: #333; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total-row { font-weight: bold; font-size: 18px; background-color: #e9ecef !important; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin: 25px 0; }
          .info-box { padding: 20px; border: 2px solid #ddd; border-radius: 8px; background-color: #f8f9fa; }
          .info-box h4 { color: #333; margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .info-item { margin: 8px 0; }
          .label { font-weight: bold; display: inline-block; width: 80px; }
          .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; }
          .thank-you { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .generated { font-size: 12px; color: #666; }
          @media print { 
              body { margin: 0; } 
              .section { break-inside: avoid; }
              .info-grid { grid-template-columns: 1fr 1fr; }
          }
          @media (max-width: 600px) {
              .info-grid { grid-template-columns: 1fr; }
              .company-name { font-size: 24px; }
              .invoice-title { font-size: 20px; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <div class="company-name">${company_name}</div>
              <div class="company-info">${company_address}</div>
              <div class="company-info">${company_phone} | ${company_email}</div>
              <div class="invoice-title">INVOICE #${invoiceData.id}</div>
          </div>

          <div class="invoice-meta">
              <strong>Date:</strong> ${formatDate(invoiceData.created_at)}<br>
              <strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${invoiceData.status || 'Completed'}</span>
          </div>

          <div class="info-grid">
              <div class="info-box">
                  <h4>👤 Customer Details</h4>
                  <div class="info-item">
                      <span class="label">Name:</span> ${invoiceData.customer?.name || 'Cash Customer'}
                  </div>
                  <div class="info-item">
                      <span class="label">Phone:</span> ${invoiceData.customer?.phone || 'N/A'}
                  </div>
                  <div class="info-item">
                      <span class="label">Email:</span> ${invoiceData.customer?.email || 'N/A'}
                  </div>
              </div>
              
              <div class="info-box">
                  <h4>💳 Payment Details</h4>
                  <div class="info-item">
                      <span class="label">Method:</span> ${(invoiceData.payment_method || 'Cash').toUpperCase()}
                  </div>
                  <div class="info-item">
                      <span class="label">Amount:</span> <strong>${formatCurrency(invoiceData.total_amount || 0)}</strong>
                  </div>
                  <div class="info-item">
                      <span class="label">Status:</span> <span style="color: #28a745;">Paid</span>
                  </div>
              </div>
          </div>

          <div class="section">
              <h3>📦 Items Purchased</h3>
              <table>
                  <thead>
                      <tr>
                          <th style="width: 40%;">Item Description</th>
                          <th style="width: 15%; text-align: center;">Quantity</th>
                          <th style="width: 20%; text-align: right;">Unit Price</th>
                          <th style="width: 25%; text-align: right;">Total Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${invoiceData.items?.map(item => `
                          <tr>
                              <td>
                                  <strong>${item.product_name}</strong>
                                  ${item.sku ? `<br><small>SKU: ${item.sku}</small>` : ''}
                                  ${item.weight ? `<br><small>Weight: ${item.weight}g</small>` : ''}
                                  ${item.purity ? `<br><small>Purity: ${item.purity}</small>` : ''}
                              </td>
                              <td style="text-align: center;">${item.quantity || 1}</td>
                              <td style="text-align: right;">${formatCurrency(item.price || 0)}</td>
                              <td style="text-align: right; font-weight: bold;">${formatCurrency(item.total_price || (item.quantity * item.price) || 0)}</td>
                          </tr>
                      `).join('') || '<tr><td colspan="4" style="text-align: center; color: #666;">No items found</td></tr>'}
                  </tbody>
                  <tfoot>
                      <tr class="total-row">
                          <td colspan="3" style="text-align: right; font-size: 18px;"><strong>TOTAL AMOUNT</strong></td>
                          <td style="text-align: right; font-size: 20px; color: #333;"><strong>${formatCurrency(invoiceData.total_amount || 0)}</strong></td>
                      </tr>
                  </tfoot>
              </table>
          </div>

          <div class="footer">
              <div class="thank-you">🙏 Thank you for your business!</div>
              <div class="generated">Generated on ${formatDate(new Date())}</div>
              <div style="margin-top: 15px; font-size: 12px; color: #666;">
                  This is a computer generated invoice. No signature required.
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
}

// Add this function to your existing invoiceController.js:

const generateCSV = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Generating CSV for transaction ${id}`);

    // Get transaction with all related data
    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false
        },
        {
          model: TransactionItem,
          as: 'items',
          required: false,
          include: [
            {
              model: Product,
              as: 'product',
              required: false
            }
          ]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate CSV content
    const csvData = generateTransactionCSV(transaction);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transaction-${transaction.id}.csv"`);
    res.send(csvData);

  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV',
      error: error.message
    });
  }
};

// CSV generator function
function generateTransactionCSV(transaction) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toFixed(2);
  };

  // CSV Headers
  const headers = [
    'Transaction ID',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Item Name',
    'SKU',
    'Quantity',
    'Unit Price',
    'Total Price',
    'Weight',
    'Purity',
    'Payment Method',
    'Transaction Status',
    'Total Amount'
  ];

  // CSV Rows
  const rows = [];
  
  if (transaction.items && transaction.items.length > 0) {
    transaction.items.forEach(item => {
      rows.push([
        transaction.id,
        formatDate(transaction.createdAt),
        transaction.customer?.name || 'Cash Customer',
        transaction.customer?.phone || 'N/A',
        transaction.customer?.email || 'N/A',
        item.product?.name || 'Unknown Item',
        item.product?.sku || 'N/A',
        item.quantity || 1,
        formatCurrency(item.unit_price || 0),
        formatCurrency(item.total_price || 0),
        item.product?.weight || 'N/A',
        item.product?.purity || 'N/A',
        transaction.payment_method || 'Cash',
        transaction.transaction_status || 'Completed',
        formatCurrency(transaction.final_amount || transaction.total_amount || 0)
      ]);
    });
  } else {
    // If no items, create a single row with transaction details
    rows.push([
      transaction.id,
      formatDate(transaction.createdAt),
      transaction.customer?.name || 'Cash Customer',
      transaction.customer?.phone || 'N/A',
      transaction.customer?.email || 'N/A',
      'No items',
      'N/A',
      0,
      0,
      0,
      'N/A',
      'N/A',
      transaction.payment_method || 'Cash',
      transaction.transaction_status || 'Completed',
      formatCurrency(transaction.final_amount || transaction.total_amount || 0)
    ]);
  }

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => 
        // Escape fields that contain commas or quotes
        typeof field === 'string' && (field.includes(',') || field.includes('"')) 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(',')
    )
  ].join('\n');

  return csvContent;
}

module.exports = {
  generateInvoice,
  downloadInvoice,
  previewInvoice,
  generateCSV  // Add this
};