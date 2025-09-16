# Jewellery Management System - Backend

A comprehensive Node.js/Express backend for managing jewelry business operations including inventory, customers, sales, and analytics.

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

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secure-jwt-secret-key

# Database Configuration (Choose one)
DATABASE_TYPE=sqlite  # or 'postgres'

# For SQLite (Development)
SQLITE_PATH=./data/jewellery_mgmt.db

# For PostgreSQL (Production)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=jewellery_mgmt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### 3. Setup Database
```bash
# Initialize database schema
npm run db:setup

# Seed with sample data (optional)
npm run db:seed
```

### 4. Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

## 📋 Prerequisites

- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **Database**: SQLite (included) or PostgreSQL 12+

## 🗄️ Database Support

### SQLite (Default)
- ✅ Zero configuration required
- ✅ File-based storage (`./data/jewellery_mgmt.db`)
- ✅ Perfect for development and testing
- ✅ Automatic migrations and seeding

### PostgreSQL (Production)
- ✅ High performance and scalability
- ✅ Advanced features and concurrent access
- ✅ Production-ready with ACID compliance
- ✅ See [Database Setup Guide](./README-DATABASE.md) for details

## 🏗️ Architecture

### Project Structure
```
backend/
├── config/
│   ├── database.js          # Database connection and setup
│   ├── init-database.js     # Database initialization
│   └── schema.sql          # Database schema
├── controllers/
│   ├── authController.js    # Authentication endpoints
│   ├── productController.js # Product management
│   ├── customerController.js# Customer management
│   ├── transactionController.js # Sales transactions
│   ├── reportingController.js   # Analytics and reports
│   └── ...                 # Other business logic controllers
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── validation.js       # Request validation
│   └── upload.js           # File upload handling
├── models/
│   ├── User.js             # User model and queries
│   ├── Product.js          # Product model and queries
│   ├── Customer.js         # Customer model and queries
│   └── ...                 # Other data models
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── products.js         # Product management routes
│   ├── customers.js        # Customer management routes
│   └── ...                 # Other route definitions
├── services/
│   ├── auditService.js     # Audit logging service
│   ├── emailService.js     # Email notifications
│   └── backupService.js    # Database backup utilities
├── utils/
│   ├── logger.js           # Winston logging setup
│   ├── validation.js       # Input validation helpers
│   └── helpers.js          # Utility functions
├── data/                   # SQLite database and uploads
├── logs/                   # Application logs
└── server.js              # Main application entry point
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-import` - Import products from CSV

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/:id/transactions` - Get customer transaction history

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/:id/refund` - Process refund

### Inventory
- `GET /api/inventory` - Get inventory summary
- `POST /api/inventory/adjust` - Adjust stock levels
- `GET /api/inventory/low-stock` - Get low stock alerts
- `GET /api/inventory/movements` - Get stock movement history

### Reports & Analytics
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/customers` - Customer analytics
- `POST /api/reports/export` - Export reports to CSV/PDF

### Loyalty System
- `GET /api/loyalty` - Get customer loyalty points
- `POST /api/loyalty/award` - Award loyalty points
- `POST /api/loyalty/redeem` - Redeem loyalty points
- `GET /api/loyalty/transactions` - Loyalty transaction history

### Hallmarking
- `GET /api/hallmarking` - List hallmark records
- `POST /api/hallmarking` - Create hallmark record
- `GET /api/hallmarking/:id` - Get hallmark details
- `PUT /api/hallmarking/:id` - Update hallmark record

### System Management
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings
- `GET /api/audit-logs` - Get audit logs
- `POST /api/backup` - Create database backup
- `POST /api/restore` - Restore from backup

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication
- **Role-based Access**: Admin, Manager, Sales, Inventory roles
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure token handling

### Data Protection
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Controlled cross-origin requests

### Audit & Monitoring
- **Audit Logging**: All CRUD operations tracked
- **Request Logging**: Winston-based logging system
- **Error Handling**: Comprehensive error management
- **Health Checks**: System status monitoring

## 📊 Features

### Core Business Features
- **Multi-user Support**: Role-based access control
- **Inventory Management**: Real-time stock tracking
- **Sales Processing**: Complete transaction workflows
- **Customer Management**: CRM with purchase history
- **Financial Reporting**: Sales, profit, and analytics

### Advanced Features
- **Loyalty Points System**: Customer rewards program
- **Hallmarking Tracking**: Product certification management
- **Audit Trail**: Complete operation history
- **Data Export/Import**: CSV/JSON data handling
- **Backup & Restore**: Database backup utilities

### Technical Features
- **Database Flexibility**: SQLite/PostgreSQL support
- **API Documentation**: Comprehensive endpoint docs
- **Error Handling**: Graceful error management
- **Validation**: Input validation and sanitization
- **Logging**: Request and error logging

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- controllers/productController.test.js

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Data persistence testing
- **Authentication Tests**: Security validation

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### Environment Setup
- Copy `env.example` to `.env`
- Configure database credentials
- Set secure JWT secret
- Configure CORS origins
- Set appropriate file upload limits

## 📈 Performance

### Database Optimization
- **Indexing**: Optimized database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Pooling**: Database connection management
- **Caching**: Redis integration ready

### API Performance
- **Compression**: gzip response compression
- **Rate Limiting**: API request throttling
- **Pagination**: Large dataset handling
- **Async Operations**: Non-blocking I/O

## 🛠️ Maintenance

### Database Maintenance
```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore backup-file.db

# Run migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

### Log Management
- Logs stored in `./logs/` directory
- Automatic log rotation
- Error logs separated from access logs
- Configurable log levels

## 📝 API Documentation

Detailed API documentation is available at `/api/docs` when the server is running, or view the Postman collection in the `docs/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Database Setup Guide](./README-DATABASE.md)
- Review API documentation
- Check the logs in `./logs/` directory
- Open an issue in the repository

## 🔄 Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added loyalty system and hallmarking
- **v1.2.0**: Enhanced reporting and analytics
- **v1.3.0**: Added audit logging and backup features
- **v1.4.0**: Performance improvements and UI enhancements
