const fs = require('fs');
const path = require('path');
const { getSqliteDb, getDatabaseType } = require('./database'); // Removed getPostgresPool

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split schema into individual statements (remove PostgreSQL-specific triggers for SQLite)
const getSchemaStatements = (dbType) => {
  let statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  // Remove PostgreSQL-specific triggers for SQLite
  if (dbType === 'sqlite') {
    statements = statements.filter(stmt => 
      !stmt.includes('CREATE OR REPLACE FUNCTION') && 
      !stmt.includes('CREATE TRIGGER') &&
      !stmt.includes('EXECUTE FUNCTION')
    );
  }
  
  return statements;
};

// Initialize SQLite database
const initSqlite = () => {
  return new Promise((resolve) => {
    const db = getSqliteDb();
    const statements = getSchemaStatements('sqlite');
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    let completed = 0;
    let hasError = false;
    
    if (statements.length === 0) {
      console.log('✅ No statements to execute, SQLite database ready');
      resolve(true);
      return;
    }
    
    statements.forEach((statement) => {
      if (statement.trim()) {
        db.run(statement, (err) => {
          if (err) {
            console.error('❌ Error executing SQLite statement:', err.message);
            console.error('Statement:', statement);
            hasError = true;
          }
          completed++;
          
          if (completed === statements.length) {
            if (!hasError) {
              console.log('✅ SQLite database initialized successfully');
            }
            resolve(!hasError);
          }
        });
      } else {
        completed++;
        if (completed === statements.length) {
          resolve(!hasError);
        }
      }
    });
  });
};

// Main initialization function
const initializeDatabase = async () => {
  const dbType = 'sqlite'; // Force sqlite
  console.log(`🔄 Initializing SQLITE database...`);
  
  let success = false;
  success = await initSqlite();
  
  if (success) {
    console.log(`✅ Database initialization completed for sqlite`);
  } else {
    console.error(`❌ Database initialization failed for sqlite`);
  }
  
  return success;
};

// Export for use in other files
module.exports = {
  initializeDatabase,
  initSqlite
};

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Database initialization error:', error);
      process.exit(1);
    });
}