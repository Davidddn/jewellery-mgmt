const mongoose = require('../config/mongo');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createMultipleUsers() {
  const users = [
    {
      username: 'manager',
      email: 'manager@jewellery.com',
      password: 'manager123',
      firstName: 'John',
      lastName: 'Manager',
      role: 'manager'
    },
    {
      username: 'sales1',
      email: 'sales1@jewellery.com',
      password: 'sales123',
      firstName: 'Sarah',
      lastName: 'Sales',
      role: 'sales'
    },
    {
      username: 'inventory',
      email: 'inventory@jewellery.com',
      password: 'inventory123',
      firstName: 'Mike',
      lastName: 'Inventory',
      role: 'inventory'
    }
  ];

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`User ${userData.username} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`User created: ${userData.username} (${userData.role})`);
    } catch (error) {
      console.error(`Error creating user ${userData.username}:`, error.message);
    }
  }

  console.log('\nAll users created successfully!');
  console.log('\nAvailable login credentials:');
  console.log('1. admin/admin123 (Admin)');
  console.log('2. manager/manager123 (Manager)');
  console.log('3. sales1/sales123 (Sales)');
  console.log('4. inventory/inventory123 (Inventory)');
  
  process.exit(0);
}

createMultipleUsers().catch(err => {
  console.error(err);
  process.exit(1);
}); 