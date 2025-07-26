const BaseModel = require('./BaseModel');

class Hallmarking extends BaseModel {
  constructor() {
    super('hallmarking');
  }

  // Get hallmarking by product
  async getByProduct(productId) {
    return this.findOne({ product_id: productId });
  }

  // Get hallmarking by certificate number
  async getByCertificateNumber(certificateNumber) {
    return this.findOne({ hallmark_number: certificateNumber });
  }

  // Get verified products
  async getVerifiedProducts() {
    const sql = `
      SELECT h.*, p.name as product_name, p.sku, p.barcode
      FROM ${this.tableName} h
      LEFT JOIN products p ON h.product_id = p.id
      WHERE h.purity_verified = true AND h.weight_verified = true
    `;
    return this.query(sql);
  }

  // Get pending verifications
  async getPendingVerifications() {
    const sql = `
      SELECT h.*, p.name as product_name, p.sku, p.barcode
      FROM ${this.tableName} h
      LEFT JOIN products p ON h.product_id = p.id
      WHERE h.purity_verified = false OR h.weight_verified = false
    `;
    return this.query(sql);
  }

  // Update verification status
  async updateVerification(hallmarkingId, purityVerified, weightVerified) {
    return this.update(hallmarkingId, {
      purity_verified: purityVerified,
      weight_verified: weightVerified
    });
  }

  // Get hallmarking statistics
  async getHallmarkingStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_hallmarkings,
        COUNT(CASE WHEN purity_verified = true AND weight_verified = true THEN 1 END) as fully_verified,
        COUNT(CASE WHEN purity_verified = false OR weight_verified = false THEN 1 END) as pending_verification,
        COUNT(CASE WHEN certification_date IS NOT NULL THEN 1 END) as certified_products
      FROM ${this.tableName}
    `;
    return this.queryOne(sql);
  }

  // Get hallmarking by certifying authority
  async getByCertifyingAuthority(authority) {
    return this.findAll({ where: { certifying_authority: authority } });
  }

  // Get hallmarking by date range
  async getByDateRange(startDate, endDate) {
    const sql = `
      SELECT h.*, p.name as product_name
      FROM ${this.tableName} h
      LEFT JOIN products p ON h.product_id = p.id
      WHERE h.certification_date BETWEEN ? AND ?
      ORDER BY h.certification_date DESC
    `;
    return this.query(sql, [startDate, endDate]);
  }
}

module.exports = new Hallmarking(); 