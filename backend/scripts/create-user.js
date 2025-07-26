const mongoose = require('../config/mongo');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createUser() {
  const username = 'admin';
  const password = 'admin123'; // Change this to a secure password!
  const email = 'admin@example.com';
  const firstName = 'Admin';
  const lastName = 'User';
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role
  });

  await user.save();
  console.log('User created:', { username, email, firstName, lastName, password });
  process.exit(0);
}

createUser().catch(err => {
  console.error(err);
  process.exit(1);
});