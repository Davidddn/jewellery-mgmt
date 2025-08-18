// Create this file and run it once:

const { sequelize } = require('./models');

async function addTagsColumn() {
  try {
    await sequelize.query(`
      ALTER TABLE products ADD COLUMN tags TEXT;
    `);
    console.log('Tags column added successfully');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Tags column already exists');
    } else {
      console.error('Error adding tags column:', error.message);
    }
  }
  process.exit(0);
}

addTagsColumn();