# Jewellery Management System

A comprehensive full-stack web application for managing jewelry business operations including inventory, customers, sales, loyalty programs, and analytics.

## 🌟 Features

### Core Business Features
- **📊 Dashboard**: Real-time business analytics and KPIs
- **💎 Product Management**: Comprehensive inventory with categories, pricing, and stock tracking
- **👥 Customer Management**: CRM with purchase history and contact details
- **💰 Sales & Transactions**: Complete POS system with invoice generation
- **📈 Reports & Analytics**: Advanced analytics with charts and export capabilities
- **⚙️ Settings**: Multi-user system with role-based permissions

### Advanced Features
- **🎯 Loyalty System**: Customer rewards and points management
- **🏆 Hallmarking**: Product certification and quality tracking
- **📋 Audit Logs**: Complete system activity monitoring
- **💱 Gold Rate Tracking**: Live gold price integration
- **💸 Expense Management**: Business expense tracking
- **📱 PWA Support**: Progressive Web App with offline capabilities

### Technical Features
- **🔐 Secure Authentication**: JWT-based multi-user access control
- **🗄️ Flexible Database**: SQLite for development, PostgreSQL for production
- **📤 Data Export/Import**: CSV import/export functionality
- **🔄 Real-time Updates**: Live dashboard with automatic refresh
- **📱 Responsive Design**: Mobile-first responsive UI
- **🎨 Modern UI**: Material-UI components with dark/light themes

## 🏗️ Architecture

```
jewellery-mgmt/
├── backend/                 # Node.js/Express API server
│   ├── controllers/         # Business logic controllers
│   ├── models/             # Database models and queries
│   ├── routes/             # API route definitions
│   ├── middleware/         # Authentication and validation
│   ├── services/           # Business services
│   └── config/             # Database and app configuration
├── frontend/               # React.js web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages/views
│   │   ├── contexts/       # React contexts for state
│   │   ├── api/            # API service layer
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── docs/                   # Documentation and guides
```

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **Database**: SQLite (included) or PostgreSQL 12+

### 1. Clone Repository
```bash
git clone https://github.com/your-username/jewellery-mgmt.git
cd jewellery-mgmt
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run db:setup
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Default Login**: 
  - Username: `admin`
  - Password: `admin123`

## 📋 Detailed Setup

### Backend Configuration
```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret

# Database (Choose one)
DATABASE_TYPE=sqlite  # or 'postgres'
SQLITE_PATH=./data/jewellery_mgmt.db

# PostgreSQL (if using)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=jewellery_mgmt
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

### Frontend Configuration
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Jewellery Management System
VITE_APP_VERSION=1.4.0
```

## 🗄️ Database Options

### SQLite (Development)
- ✅ Zero configuration required
- ✅ File-based storage
- ✅ Perfect for development/testing
- ✅ Automatic setup and seeding

### PostgreSQL (Production)
- ✅ Production-ready performance
- ✅ Advanced features and scalability
- ✅ Concurrent user support
- ✅ See [Database Guide](./backend/README-DATABASE.md)

## 🔒 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, settings |
| **Manager** | All business operations, reports, inventory |
| **Sales** | Sales transactions, customer management |
| **Inventory** | Product management, stock updates |

## 📊 Key Components

### Dashboard
- Real-time sales metrics
- Inventory alerts and summaries
- Customer analytics
- Recent transaction history
- Performance charts and KPIs

### Product Management
- Product catalog with images
- Category and subcategory organization
- Stock level tracking with alerts
- Pricing and cost management
- Barcode/SKU support

### Sales System
- Point-of-sale interface
- Invoice generation and printing
- Multiple payment methods
- Customer selection and details
- Real-time inventory updates

### Customer Management
- Complete customer profiles
- Purchase history tracking
- Loyalty points management
- Contact information and notes
- Customer analytics and insights

### Reporting & Analytics
- Sales performance reports
- Inventory movement analysis
- Customer behavior insights
- Financial summaries
- Export capabilities (CSV, PDF)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - User profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Core Operations
- `GET/POST/PUT/DELETE /api/products` - Product management
- `GET/POST/PUT/DELETE /api/customers` - Customer management
- `GET/POST/PUT/DELETE /api/transactions` - Transaction handling
- `GET /api/reports/*` - Various reports and analytics

### Advanced Features
- `GET/POST /api/loyalty` - Loyalty system
- `GET/POST /api/hallmarking` - Hallmarking records
- `GET /api/audit-logs` - System audit trails
- `GET/PUT /api/settings` - System configuration

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Test coverage report
```

### Frontend Tests
```bash
cd frontend
npm test              # Run component tests
npm run test:e2e      # End-to-end tests
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Production
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Serve built files with nginx/apache
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📈 Performance Features

### Frontend Optimizations
- ✅ **Full-width Layout**: Edge-to-edge responsive design
- ✅ **Component Lazy Loading**: Improved initial load times
- ✅ **React Query Caching**: Optimized data fetching
- ✅ **Material-UI Optimization**: Tree-shaking and theming
- ✅ **PWA Features**: Service worker and caching

### Backend Optimizations
- ✅ **Database Indexing**: Optimized query performance
- ✅ **Connection Pooling**: Efficient database connections
- ✅ **Request Compression**: gzip response compression
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Logging**: Winston-based logging system

## 🎨 UI/UX Features

### Recent Layout Improvements
- ✅ **Edge-to-edge Design**: Content spans full viewport width
- ✅ **Responsive Sidebar**: Overlay sidebar on content when needed
- ✅ **Consistent Spacing**: Unified padding and margin system
- ✅ **Mobile Optimization**: Touch-friendly mobile interface
- ✅ **Settings Tabs**: Proper tab content width management

### Design System
- Material-UI components
- Consistent color palette
- Typography system
- Responsive breakpoints
- Dark/light theme support

## 📝 Documentation

- [Backend Setup Guide](./backend/README.md)
- [Frontend Setup Guide](./frontend/README-FRONTEND.md)
- [Database Configuration](./backend/README-DATABASE.md)
- [API Documentation](./docs/api-docs.md)
- [PWA Implementation](./PWA_IMPLEMENTATION_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📖 Check the documentation in respective README files
- 🐛 Open an issue for bugs or feature requests
- 💬 Review existing issues and discussions
- 📧 Contact the development team

## 🔄 Version History

- **v1.4.0** - Layout improvements, edge-to-edge design, settings optimization
- **v1.3.0** - Audit logging, backup features, performance improvements  
- **v1.2.0** - Enhanced reporting, analytics dashboard, mobile optimization
- **v1.1.0** - Loyalty system, hallmarking, PWA features
- **v1.0.0** - Initial release with core business features

## 🏆 Acknowledgments

- Built with React.js and Material-UI
- Powered by Node.js and Express
- Database support for SQLite and PostgreSQL
- Charts powered by Chart.js
- Icons by Material Design Icons
