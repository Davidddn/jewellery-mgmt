const { sequelize } = require('./config/database');

async function addUserIdToInvoiceTemplates() {
  try {
    await sequelize.query('ALTER TABLE invoice_templates ADD COLUMN userId INTEGER;');
    console.log('userId column added successfully to invoice_templates table');
  } catch (error) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('userId column already exists in invoice_templates table');
    } else {
      console.error('Error adding userId column to invoice_templates table:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

addUserIdToInvoiceTemplates();