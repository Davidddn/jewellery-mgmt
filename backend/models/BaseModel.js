const { getPostgresPool, getSqliteDb, getDatabaseType } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.dbType = getDatabaseType();
  }

  // Get database connection
  getDb() {
    if (this.dbType === 'postgres') {
      return getPostgresPool();
    } else {
      return getSqliteDb();
    }
  }

  // Execute query with parameters
  async query(sql, params = []) {
    if (this.dbType === 'postgres') {
      const pool = this.getDb();
      const result = await pool.query(sql, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        const db = this.getDb();
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  // Execute single row query
  async queryOne(sql, params = []) {
    if (this.dbType === 'postgres') {
      const pool = this.getDb();
      const result = await pool.query(sql, params);
      return result.rows[0] || null;
    } else {
      return new Promise((resolve, reject) => {
        const db = this.getDb();
        db.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        });
      });
    }
  }

  // Execute insert/update/delete
  async execute(sql, params = []) {
    if (this.dbType === 'postgres') {
      const pool = this.getDb();
      const result = await pool.query(sql, params);
      return result;
    } else {
      return new Promise((resolve, reject) => {
        const db = this.getDb();
        db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rowCount: this.changes,
              insertId: this.lastID 
            });
          }
        });
      });
    }
  }

  // Find all records
  async findAll(options = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (options.where) {
      const whereClause = Object.keys(options.where)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(options.where));
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    return this.query(sql, params);
  }

  // Find one record
  async findOne(where) {
    const whereClause = Object.keys(where)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const sql = `SELECT * FROM ${this.tableName} WHERE ${whereClause} LIMIT 1`;
    const params = Object.values(where);

    return this.queryOne(sql, params);
  }

  // Find by ID
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return this.queryOne(sql, [id]);
  }

  // Create new record
  async create(data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const params = Object.values(data);

    const result = await this.execute(sql, params);
    return { id: result.insertId, ...data };
  }

  // Update record
  async update(id, data) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const params = [...Object.values(data), id];

    const result = await this.execute(sql, params);
    return result.rowCount > 0;
  }

  // Delete record
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.execute(sql, [id]);
    return result.rowCount > 0;
  }

  // Count records
  async count(where = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const whereClause = Object.keys(where)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(where));
    }

    const result = await this.queryOne(sql, params);
    return result.count;
  }

  // Raw query for complex operations
  async rawQuery(sql, params = []) {
    return this.query(sql, params);
  }

  // Transaction support
  async transaction(callback) {
    if (this.dbType === 'postgres') {
      const pool = this.getDb();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // SQLite transactions
      return new Promise((resolve, reject) => {
        const db = this.getDb();
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          try {
            const result = callback(db);
            db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          } catch (error) {
            db.run('ROLLBACK');
            reject(error);
          }
        });
      });
    }
  }
}

module.exports = BaseModel; 