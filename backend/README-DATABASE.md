# Jewellery Management System - Database Setup

This guide will help you set up the database for the Jewellery Management System using either SQLite or PostgreSQL.

## 🗄️ Database Options

### SQLite (Recommended for Development)
- **Pros**: No installation required, file-based, portable
- **Cons**: Limited concurrent users, not suitable for production
- **Best for**: Development, testing, small deployments

### PostgreSQL (Recommended for Production)
- **Pros**: Robust, scalable, supports complex queries
- **Cons**: Requires installation and setup
- **Best for**: Production environments, high-traffic applications

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy the environment example file:
```bash
cp env.example .env
```

Edit `.env` and choose your database:
```env
# For SQLite (default)
DATABASE_TYPE=sqlite

# For PostgreSQL
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=jewellery_mgmt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
```

### 3. Setup Database
```bash
# Setup database schema
npm run db:setup

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Server
```bash
npm run dev
```

## 📊 PostgreSQL Setup

### Installation

#### Windows
1. Download from [PostgreSQL Official Site](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for the postgres user

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or using Postgres.app
# Download from https://postgresapp.com/
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Creation
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE jewellery_mgmt;
CREATE USER jewellery_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jewellery_mgmt TO jewellery_user;
\q
```

### Environment Configuration
```env
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=jewellery_mgmt
POSTGRES_USER=jewellery_user
POSTGRES_PASSWORD=your_password
```

## 💾 SQLite Setup

### No Installation Required
SQLite is included with Node.js and requires no additional installation.

### Environment Configuration
```env
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/jewellery_mgmt.db
```

The database file will be created automatically in the `data/` directory.

## 🔧 Database Management

### Available Scripts
```bash
# Setup database schema
npm run db:setup

# Initialize database (alternative)
npm run db:init

# Seed with sample data
npm run db:seed

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Backup database
npm run db:backup

# View database statistics
npm run db:stats
```

### Manual Database Operations

#### PostgreSQL
```bash
# Connect to database
psql -h localhost -U jewellery_user -d jewellery_mgmt

# View tables
\dt

# View table structure
\d table_name

# Exit
\q
```

#### SQLite
```bash
# Connect to database
sqlite3 data/jewellery_mgmt.db

# View tables
.tables

# View table structure
.schema table_name

# Exit
.quit
```

## 📋 Database Schema

The system includes the following tables:

- **users** - User accounts and authentication
- **customers** - Customer information and profiles
- **products** - Jewellery products and inventory
- **transactions** - Sales and purchase transactions
- **transaction_items** - Individual items in transactions
- **inventory** - Stock management
- **hallmarking** - Product certification and verification
- **loyalty** - Customer loyalty points and rewards
- **audit_logs** - System activity tracking

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong passwords for database users
- Rotate JWT secrets regularly

### Database Security
- Use dedicated database users with minimal privileges
- Enable SSL for PostgreSQL in production
- Regular backups of your database
- Monitor database access logs

## 🐛 Troubleshooting

### Common Issues

#### PostgreSQL Connection Failed
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d postgres
```

#### SQLite Permission Issues
```bash
# Check file permissions
ls -la data/

# Fix permissions if needed
chmod 755 data/
chmod 644 data/jewellery_mgmt.db
```

#### Database Schema Errors
```bash
# Reset and reinitialize
npm run db:reset
npm run db:setup
```

### Logs
Check the application logs for detailed error messages:
```bash
# View logs
tail -f logs/app.log
```

## 📈 Performance Tips

### PostgreSQL
- Use connection pooling (already configured)
- Create indexes on frequently queried columns
- Regular VACUUM and ANALYZE operations
- Monitor query performance with `EXPLAIN`

### SQLite
- Keep database file on fast storage (SSD)
- Regular VACUUM operations
- Use transactions for bulk operations
- Consider WAL mode for better concurrency

## 🔄 Migration from MongoDB

If you're migrating from the previous MongoDB setup:

1. Export your MongoDB data
2. Transform the data to match the new SQL schema
3. Use the seeding scripts as a template for data import
4. Test thoroughly before switching to production

## 📞 Support

For database-related issues:
1. Check the logs in `logs/app.log`
2. Verify your environment configuration
3. Test database connectivity manually
4. Review the troubleshooting section above

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js Database Best Practices](https://nodejs.org/en/docs/guides/) 