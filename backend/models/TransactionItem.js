const BaseModel = require('./BaseModel');

class TransactionItem extends BaseModel {
  constructor() {
    super('transaction_items');
  }

  // Get items by transaction
  async getByTransaction(transactionId) {
    const sql = `
      SELECT ti.*, p.name as product_name, p.sku, p.barcode
      FROM ${this.tableName} ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.transaction_id = ?
    `;
    return this.query(sql, [transactionId]);
  }

  // Get items by product
  async getByProduct(productId) {
    const sql = `
      SELECT ti.*, t.transaction_id, t.transaction_type, t.created_at as transaction_date
      FROM ${this.tableName} ti
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE ti.product_id = ?
      ORDER BY t.created_at DESC
    `;
    return this.query(sql, [productId]);
  }

  // Get sales statistics by product
  async getProductSalesStats(productId, startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.total_price) as total_revenue,
        AVG(ti.unit_price) as avg_price
      FROM ${this.tableName} ti
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE ti.product_id = ? AND t.transaction_type = 'sale'
    `;
    const params = [productId];
    
    if (startDate && endDate) {
      sql += ` AND t.created_at BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    
    return this.queryOne(sql, params);
  }

  // Get top selling products
  async getTopSellingProducts(limit = 10) {
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(ti.quantity) as total_quantity_sold,
        SUM(ti.total_price) as total_revenue
      FROM ${this.tableName} ti
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.transaction_type = 'sale'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity_sold DESC
      LIMIT ?
    `;
    return this.query(sql, [limit]);
  }

  // Get daily sales
  async getDailySales(date) {
    const sql = `
      SELECT 
        ti.product_id,
        p.name as product_name,
        SUM(ti.quantity) as quantity_sold,
        SUM(ti.total_price) as revenue
      FROM ${this.tableName} ti
      LEFT JOIN products p ON ti.product_id = p.id
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      WHERE DATE(t.created_at) = ? AND t.transaction_type = 'sale'
      GROUP BY ti.product_id, p.name
      ORDER BY revenue DESC
    `;
    return this.query(sql, [date]);
  }
}

module.exports = new TransactionItem(); 