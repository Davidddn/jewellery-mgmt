const BaseModel = require('./BaseModel');

class Product extends BaseModel {
  constructor() {
    super('products');
  }

  // Find product by SKU
  async findBySku(sku) {
    return this.findOne({ sku });
  }

  // Find product by barcode
  async findByBarcode(barcode) {
    return this.findOne({ barcode });
  }

  // Get products by category
  async getByCategory(category) {
    return this.findAll({ where: { category } });
  }

  // Get low stock products
  async getLowStockProducts() {
    const sql = `SELECT * FROM ${this.tableName} WHERE stock_quantity <= reorder_level AND is_active = true`;
    return this.query(sql);
  }

  // Update stock quantity
  async updateStock(productId, quantity) {
    return this.update(productId, { stock_quantity: quantity });
  }

  // Search products
  async searchProducts(searchTerm) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name LIKE ? OR sku LIKE ? OR barcode LIKE ?`;
    const searchPattern = `%${searchTerm}%`;
    return this.query(sql, [searchPattern, searchPattern, searchPattern]);
  }

  // Get product statistics
  async getProductStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        AVG(selling_price) as avg_price,
        COUNT(CASE WHEN stock_quantity <= reorder_level THEN 1 END) as low_stock_count
      FROM ${this.tableName}
      WHERE is_active = true
    `;
    return this.queryOne(sql);
  }

  // Get products by metal type
  async getByMetalType(metalType) {
    return this.findAll({ where: { metal_type: metalType } });
  }

  // Get products by price range
  async getByPriceRange(minPrice, maxPrice) {
    const sql = `SELECT * FROM ${this.tableName} WHERE selling_price BETWEEN ? AND ? AND is_active = true`;
    return this.query(sql, [minPrice, maxPrice]);
  }

  // Get active products
  async getActiveProducts() {
    return this.findAll({ where: { is_active: true } });
  }
}

module.exports = new Product(); 