const BaseModel = require('./BaseModel');

class Loyalty extends BaseModel {
  constructor() {
    super('loyalty');
  }

  // Get loyalty by customer
  async getByCustomer(customerId) {
    return this.findOne({ customer_id: customerId });
  }

  // Add points to customer
  async addPoints(customerId, points, transactionId = null) {
    const loyalty = await this.getByCustomer(customerId);
    
    if (loyalty) {
      const newPoints = loyalty.points_earned + points;
      const newBalance = loyalty.current_balance + points;
      return this.update(loyalty.id, {
        points_earned: newPoints,
        current_balance: newBalance,
        last_activity: new Date().toISOString()
      });
    } else {
      return this.create({
        customer_id: customerId,
        points_earned: points,
        current_balance: points,
        last_activity: new Date().toISOString()
      });
    }
  }

  // Redeem points
  async redeemPoints(customerId, points) {
    const loyalty = await this.getByCustomer(customerId);
    
    if (!loyalty || loyalty.current_balance < points) {
      throw new Error('Insufficient loyalty points');
    }
    
    const newRedeemed = loyalty.points_redeemed + points;
    const newBalance = loyalty.current_balance - points;
    
    return this.update(loyalty.id, {
      points_redeemed: newRedeemed,
      current_balance: newBalance,
      last_activity: new Date().toISOString()
    });
  }

  // Get loyalty statistics
  async getLoyaltyStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_customers,
        SUM(points_earned) as total_points_earned,
        SUM(points_redeemed) as total_points_redeemed,
        SUM(current_balance) as total_current_balance,
        AVG(current_balance) as avg_balance
      FROM ${this.tableName}
    `;
    return this.queryOne(sql);
  }

  // Get top loyalty customers
  async getTopLoyaltyCustomers(limit = 10) {
    const sql = `
      SELECT l.*, c.name as customer_name, c.email, c.phone
      FROM ${this.tableName} l
      LEFT JOIN customers c ON l.customer_id = c.id
      ORDER BY l.current_balance DESC
      LIMIT ?
    `;
    return this.query(sql, [limit]);
  }

  // Update tier based on points
  async updateTier(customerId) {
    const loyalty = await this.getByCustomer(customerId);
    if (!loyalty) return null;
    
    let tier = 'bronze';
    if (loyalty.current_balance >= 1000) tier = 'gold';
    else if (loyalty.current_balance >= 500) tier = 'silver';
    
    if (loyalty.tier !== tier) {
      return this.update(loyalty.id, { tier });
    }
    return loyalty;
  }
}

module.exports = new Loyalty(); 