const BaseModel = require('./BaseModel');

class AuditLog extends BaseModel {
  constructor() {
    super('audit_logs');
  }

  // Create audit log entry
  async logAction(userId, action, tableName, recordId, oldValues = null, newValues = null, ipAddress = null, userAgent = null) {
    return this.create({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  // Get audit logs by user
  async getByUser(userId, limit = 50) {
    const sql = `
      SELECT al.*, u.username, u.first_name, u.last_name
      FROM ${this.tableName} al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return this.query(sql, [userId, limit]);
  }

  // Get audit logs by table
  async getByTable(tableName, limit = 50) {
    const sql = `
      SELECT al.*, u.username, u.first_name, u.last_name
      FROM ${this.tableName} al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return this.query(sql, [tableName, limit]);
  }

  // Get audit logs by record
  async getByRecord(tableName, recordId) {
    const sql = `
      SELECT al.*, u.username, u.first_name, u.last_name
      FROM ${this.tableName} al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = ? AND al.record_id = ?
      ORDER BY al.created_at DESC
    `;
    return this.query(sql, [tableName, recordId]);
  }

  // Get audit logs by date range
  async getByDateRange(startDate, endDate) {
    const sql = `
      SELECT al.*, u.username, u.first_name, u.last_name
      FROM ${this.tableName} al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at BETWEEN ? AND ?
      ORDER BY al.created_at DESC
    `;
    return this.query(sql, [startDate, endDate]);
  }

  // Get audit statistics
  async getAuditStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT table_name) as tables_affected,
        COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as creates,
        COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as updates,
        COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as deletes
      FROM ${this.tableName}
    `;
    return this.queryOne(sql);
  }

  // Get recent activity
  async getRecentActivity(limit = 20) {
    const sql = `
      SELECT al.*, u.username, u.first_name, u.last_name
      FROM ${this.tableName} al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return this.query(sql, [limit]);
  }
}

module.exports = new AuditLog(); 