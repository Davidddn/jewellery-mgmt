const DatabaseSetup = require('./database-setup');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.setup = new DatabaseSetup();
  }

  async runCommand(command, options = {}) {
    try {
      switch (command) {
        case 'start':
          await this.startServer();
          break;
        case 'setup':
          await this.setupDatabase();
          break;
        case 'backup':
          await this.createBackup();
          break;
        case 'restore':
          await this.restoreBackup(options.file);
          break;
        case 'stats':
          await this.showStats();
          break;
        case 'clean':
          await this.cleanDatabase();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      logger.error(`Database manager error: ${error.message}`);
      process.exit(1);
    }
  }

  async startServer() {
    logger.info('Starting jewellery management server...');
    const { spawn } = require('child_process');
    
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    server.on('error', (error) => {
      logger.error('Server error:', error);
    });

    server.on('exit', (code) => {
      logger.info(`Server exited with code ${code}`);
    });
  }

  async setupDatabase() {
    logger.info('Setting up database...');
    await this.setup.initializeDatabase();
    await this.setup.seedDatabase();
    logger.info('Database setup completed successfully!');
  }

  async createBackup() {
    logger.info('Creating database backup...');
    const backupFile = await this.setup.backupDatabase();
    logger.info(`Backup created: ${backupFile}`);
  }

  async restoreBackup(backupFile) {
    if (!backupFile) {
      logger.error('Please specify backup file path');
      return;
    }
    
    logger.info(`Restoring from backup: ${backupFile}`);
    // Implementation for restore functionality
    logger.info('Restore functionality to be implemented');
  }

  async showStats() {
    logger.info('Getting database statistics...');
    const stats = await this.setup.getDatabaseStats();
    console.table(stats);
  }

  async cleanDatabase() {
    logger.info('Cleaning database...');
    await this.setup.resetDatabase();
    logger.info('Database cleaned successfully!');
  }

  showHelp() {
    console.log(`
Jewellery Management Database Manager

Usage: node db-manager.js [command] [options]

Commands:
  start           - Start the server
  setup           - Initialize and seed database
  backup          - Create a backup of all data
  restore <file>  - Restore from backup file
  stats           - Show database statistics
  clean           - Reset and clean database

Examples:
  node db-manager.js start
  node db-manager.js setup
  node db-manager.js backup
  node db-manager.js stats
  node db-manager.js clean
    `);
  }
}

// CLI interface
async function main() {
  const manager = new DatabaseManager();
  const command = process.argv[2];
  const options = {
    file: process.argv[3]
  };

  if (!command) {
    manager.showHelp();
    return;
  }

  await manager.runCommand(command, options);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseManager; 