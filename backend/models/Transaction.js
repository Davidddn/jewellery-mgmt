const BaseModel = require('./BaseModel');

class Transaction extends BaseModel {
  constructor() {
    super('transactions');
  }

  // Create transaction with items
  async createTransactionWithItems(transactionData, items) {
    return this.transaction(async (db) => {
      // Create transaction
      const transaction = await this.create(transactionData);
      
      // Create transaction items
      const TransactionItem = require('./TransactionItem');
      for (const item of items) {
        item.transaction_id = transaction.id;
        await TransactionItem.create(item);
      }
      
      return transaction;
    });
  }

  // Get transactions by customer
  async getByCustomer(customerId) {
    const sql = `
      SELECT t.*, c.name as customer_name, u.first_name, u.last_name as user_name
      FROM ${this.tableName} t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.customer_id = ?
      ORDER BY t.created_at DESC
    `;
    return this.query(sql, [customerId]);
  }

  // Get transactions by user
  async getByUser(userId) {
    const sql = `
      SELECT t.*, c.name as customer_name
      FROM ${this.tableName} t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `;
    return this.query(sql, [userId]);
  }

  // Get transaction with items
  async getTransactionWithItems(transactionId) {
    const sql = `
      SELECT t.*, c.name as customer_name, u.first_name, u.last_name as user_name
      FROM ${this.tableName} t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `;
    const transaction = await this.queryOne(sql, [transactionId]);
    
    if (transaction) {
      const TransactionItem = require('./TransactionItem');
      transaction.items = await TransactionItem.getByTransaction(transactionId);
    }
    
    return transaction;
  }

  // Get sales statistics
  async getSalesStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(final_amount) as total_sales,
        AVG(final_amount) as avg_sale,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM ${this.tableName}
      WHERE transaction_type = 'sale' AND transaction_status = 'completed'
    `;
    const params = [];
    
    if (startDate && endDate) {
      sql += ` AND created_at BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    return this.queryOne(sql, params);
  }

  // Get transactions by date range
  async getByDateRange(startDate, endDate) {
    const sql = `
      SELECT t.*, c.name as customer_name
      FROM ${this.tableName} t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.created_at BETWEEN ? AND ?
      ORDER BY t.created_at DESC
    `;
    return this.query(sql, [startDate, endDate]);
  }

  // Get transactions by status
  async getByStatus(status) {
    return this.findAll({ where: { transaction_status: status } });
  }

  // Get transactions by payment method
  async getByPaymentMethod(paymentMethod) {
    return this.findAll({ where: { payment_method: paymentMethod } });
  }

  // Update transaction status
  async updateStatus(transactionId, status) {
    return this.update(transactionId, { transaction_status: status });
  }
}

module.exports = new Transaction(); 