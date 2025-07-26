const BaseModel = require('./BaseModel');

class Customer extends BaseModel {
  constructor() {
    super('customers');
  }

  // Find customer by phone
  async findByPhone(phone) {
    return this.findOne({ phone });
  }

  // Find customer by email
  async findByEmail(email) {
    return this.findOne({ email });
  }

  // Get customers with loyalty points
  async getCustomersWithLoyalty() {
    const sql = `SELECT * FROM ${this.tableName} WHERE loyalty_points > 0 ORDER BY loyalty_points DESC`;
    return this.query(sql);
  }

  // Update loyalty points
  async updateLoyaltyPoints(customerId, points) {
    return this.update(customerId, { loyalty_points: points });
  }

  // Get top customers by total spent
  async getTopCustomers(limit = 10) {
    const sql = `SELECT * FROM ${this.tableName} ORDER BY total_spent DESC LIMIT ?`;
    return this.query(sql, [limit]);
  }

  // Search customers by name or phone
  async searchCustomers(searchTerm) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?`;
    const searchPattern = `%${searchTerm}%`;
    return this.query(sql, [searchPattern, searchPattern, searchPattern]);
  }

  // Get customer statistics
  async getCustomerStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        AVG(total_spent) as avg_spent,
        SUM(loyalty_points) as total_loyalty_points
      FROM ${this.tableName}
    `;
    return this.queryOne(sql);
  }
}

module.exports = new Customer(); 