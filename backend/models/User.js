const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Create user with password hashing
  async createUser(userData) {
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    return this.create(userData);
  }

  // Find user by username or email
  async findByUsernameOrEmail(usernameOrEmail) {
    const sql = `SELECT * FROM ${this.tableName} WHERE username = ? OR email = ? LIMIT 1`;
    return this.queryOne(sql, [usernameOrEmail, usernameOrEmail]);
  }

  // Find user by username
  async findByUsername(username) {
    return this.findOne({ username });
  }

  // Find user by email
  async findByEmail(email) {
    return this.findOne({ email });
  }

  // Compare password
  async comparePassword(userId, candidatePassword) {
    const user = await this.findById(userId);
    if (!user) return false;
    return bcrypt.compare(candidatePassword, user.password);
  }

  // Update login attempts
  async updateLoginAttempts(userId, attempts, lockedUntil = null) {
    const data = { login_attempts: attempts };
    if (lockedUntil) {
      data.locked_until = lockedUntil;
    }
    return this.update(userId, data);
  }

  // Update last login
  async updateLastLogin(userId) {
    return this.update(userId, { 
      last_login: new Date().toISOString(),
      login_attempts: 0,
      locked_until: null
    });
  }

  // Get active users
  async getActiveUsers() {
    return this.findAll({ where: { is_active: true } });
  }

  // Get users by role
  async getUsersByRole(role) {
    return this.findAll({ where: { role } });
  }
}

module.exports = new User(); 