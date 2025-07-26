# Jewellery Management System - Frontend

This is the React frontend for the Jewellery Management System, designed to work with both SQLite and PostgreSQL backends.

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

Edit `.env` and configure your API URL:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Jewellery Management System
VITE_APP_VERSION=1.0.0
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Prerequisites

- Node.js 16+ 
- Backend server running (see backend README)
- Modern web browser

## 🗄️ Database Compatibility

The frontend is designed to work with both database types:

### SQLite (Development)
- No additional setup required
- Backend automatically creates database file
- Perfect for development and testing

### PostgreSQL (Production)
- Requires PostgreSQL installation
- Better performance for production
- Supports complex queries and transactions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `Jewellery Management System` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

### API Configuration

The frontend includes comprehensive API services:

- **Authentication** (`/src/api/auth.js`)
- **Products** (`/src/api/products.js`)
- **Customers** (`/src/api/customers.js`)
- **Transactions** (`/src/api/transactions.js`)
- **Inventory** (`/src/api/inventory.js`)
- **Loyalty** (`/src/api/loyalty.js`)
- **Hallmarking** (`/src/api/hallmarking.js`)
- **Audit Logs** (`/src/api/audit.js`)
- **Health Checks** (`/src/api/health.js`)
- **Reports** (`/src/api/reports.js`)

## 📊 Features

### Core Modules
- **Dashboard** - Overview and analytics
- **Products** - Inventory management
- **Customers** - Customer relationship management
- **Transactions** - Sales and purchases
- **Reports** - Analytics and reporting
- **Settings** - System configuration

### Advanced Features
- **Loyalty System** - Customer rewards and points
- **Hallmarking** - Product certification tracking
- **Audit Logs** - System activity monitoring
- **Inventory Management** - Stock tracking and alerts
- **Multi-user Support** - Role-based access control

## 🔌 API Integration

### Authentication
```javascript
import { authAPI } from './api/auth';

// Login
const login = await authAPI.login({ username, password });

// Get profile
const profile = await authAPI.getProfile();
```

### Products
```javascript
import { productsAPI } from './api/products';

// Get all products
const products = await productsAPI.getProducts();

// Search products
const results = await productsAPI.searchProducts('gold ring');

// Get product statistics
const stats = await productsAPI.getProductStats();
```

### Customers
```javascript
import { customersAPI } from './api/customers';

// Get all customers
const customers = await customersAPI.getCustomers();

// Search customers
const results = await customersAPI.searchCustomers('john');

// Get customer statistics
const stats = await customersAPI.getCustomerStats();
```

### Transactions
```javascript
import { transactionsAPI } from './api/transactions';

// Get all transactions
const transactions = await transactionsAPI.getTransactions();

// Create transaction with items
const transaction = await transactionsAPI.createTransactionWithItems(
  transactionData,
  items
);

// Get sales statistics
const stats = await transactionsAPI.getSalesStats();
```

### Inventory
```javascript
import { inventoryAPI } from './api/inventory';

// Get inventory status
const status = await inventoryAPI.getInventoryStatus();

// Update stock
await inventoryAPI.updateInventoryQuantity(productId, quantity);

// Get low stock alerts
const alerts = await inventoryAPI.getLowStockAlerts();
```

### Loyalty
```javascript
import { loyaltyAPI } from './api/loyalty';

// Get customer loyalty
const loyalty = await loyaltyAPI.getLoyaltyByCustomer(customerId);

// Add points
await loyaltyAPI.addLoyaltyPoints(customerId, points);

// Get loyalty statistics
const stats = await loyaltyAPI.getLoyaltyStats();
```

### Hallmarking
```javascript
import { hallmarkingAPI } from './api/hallmarking';

// Get product hallmarking
const hallmarking = await hallmarkingAPI.getHallmarkingByProduct(productId);

// Update verification status
await hallmarkingAPI.updateVerificationStatus(id, true, true);

// Get verified products
const verified = await hallmarkingAPI.getVerifiedProducts();
```

### Audit Logs
```javascript
import { auditAPI } from './api/audit';

// Get audit logs
const logs = await auditAPI.getAuditLogs();

// Get recent activity
const activity = await auditAPI.getRecentActivity();

// Get audit statistics
const stats = await auditAPI.getAuditStats();
```

## 🛠️ Development

### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure
```
src/
├── api/           # API services
├── components/    # Reusable components
├── contexts/      # React contexts
├── pages/         # Page components
├── assets/        # Static assets
└── main.jsx       # Application entry point
```

### Component Architecture
- **Layout Components** - Page structure and navigation
- **Form Components** - Input fields and validation
- **Table Components** - Data display and pagination
- **Modal Components** - Overlays and dialogs
- **Chart Components** - Data visualization

## 🔒 Security

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Role-based access control
- Session management

### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure API communication

## 🐛 Troubleshooting

### Common Issues

#### API Connection Failed
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check environment variables
echo $VITE_API_URL
```

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
npm run lint
```

#### Database Connection Issues
- Ensure backend server is running
- Check database configuration in backend
- Verify database is initialized (`npm run db:setup`)

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📈 Performance

### Optimization Tips
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components and routes
- Optimize images and assets
- Use production builds for testing

### Monitoring
- Browser developer tools
- Network tab for API calls
- Performance tab for rendering
- Console for errors and logs

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Configuration
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Jewellery Management System
VITE_APP_VERSION=1.0.0
```

### Deployment Options
- **Vercel** - Zero-config deployment
- **Netlify** - Static site hosting
- **AWS S3** - Static website hosting
- **Docker** - Containerized deployment

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Axios Documentation](https://axios-http.com/)
- [Backend API Documentation](./../backend/README-DATABASE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For frontend-related issues:
1. Check the browser console for errors
2. Verify API connectivity
3. Review the troubleshooting section
4. Check the backend logs 