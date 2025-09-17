const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role VARCHAR(20) DEFAULT 'sales',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        subcategory VARCHAR(50),
        sku VARCHAR(50) UNIQUE,
        barcode VARCHAR(50),
        cost_price DECIMAL(10,2) DEFAULT 0,
        selling_price DECIMAL(10,2) DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        weight DECIMAL(8,2),
        purity VARCHAR(20),
        size_info VARCHAR(50),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(50),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        loyalty_points INTEGER DEFAULT 0,
        total_purchases DECIMAL(12,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id),
        transaction_type VARCHAR(20) DEFAULT 'sale',
        subtotal DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(20) DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transaction items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user
    const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // 'admin123'
    await client.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ('admin', 'admin@jewelry.com', $1, 'Admin', 'User', 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    await client.query('COMMIT');
    console.log('Database tables created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });