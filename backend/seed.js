// backend/seed.js

const { sequelize, User, Customer, Product } = require('./models');

const seedDatabase = async () => {
  console.log('Starting the seeding process...');

  try {
    // This will drop all tables and recreate them.
    console.log('Syncing database schema... (This will delete existing data)');
    await sequelize.sync({ force: true });
    console.log('Database schema synced.');

    // --- Create Users ---
    console.log('Seeding users...');
    const usersData = [
      { username: 'admin', email: 'admin@example.com', password: 'password123', firstName: 'Admin', lastName: 'User', role: 'admin' },
      { username: 'manager', email: 'manager@example.com', password: 'password123', firstName: 'Manager', lastName: 'Person', role: 'manager' },
      { username: 'sales', email: 'sales@example.com', password: 'password123', firstName: 'Sales', lastName: 'Rep', role: 'sales' },
      { username: 'inventory', email: 'inventory@example.com', password: 'password123', firstName: 'Inventory', lastName: 'Clerk', role: 'inventory' },
    ];
    await User.bulkCreate(usersData, { individualHooks: true });
    console.log('Users seeded successfully.');

    // --- Create Customers ---
    console.log('Seeding customers...');
    const customersData = [
      { name: 'John Doe', email: 'john.doe@example.com', phone: '111-222-3333', total_spent: 150000 },
      { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '444-555-6666', total_spent: 275000 },
    ];
    await Customer.bulkCreate(customersData);
    console.log('Customers seeded successfully.');

    // --- Create Products ---
    console.log('Seeding products...');
    const productsData = [
      { name: 'Classic Gold Ring', category: 'Rings', sku: 'G-RNG-001', weight: 5.5, purity: '22K', metal_type: 'Gold', cost_price: 25000, selling_price: 30000, stock_quantity: 10 },
      { name: 'Diamond Necklace', category: 'Necklaces', sku: 'D-NCK-001', weight: 10.2, purity: 'PT950', metal_type: 'Platinum', stone_type: 'Diamond', cost_price: 150000, selling_price: 200000, stock_quantity: 5 },
      { name: 'Silver Anklet', category: 'Anklets', sku: 'S-ANK-001', weight: 20.0, purity: '925', metal_type: 'Silver', cost_price: 4000, selling_price: 6000, stock_quantity: 3 },
    ];
    await Product.bulkCreate(productsData);
    console.log('Products seeded successfully.');

    console.log('✅ Seeding complete!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    console.log('Closing database connection.');
    await sequelize.close();
  }
};

seedDatabase();