# Jewellery Management System - Frontend

A modern React.js frontend application for the Jewellery Management System, featuring a responsive design with Material-UI components and comprehensive business management tools.

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
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Jewellery Management System
VITE_APP_VERSION=1.4.0
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## 📋 Prerequisites

- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **Backend server**: Must be running (see backend README)
- **Modern browser**: Chrome, Firefox, Safari, Edge

## 🎨 Recent UI/UX Improvements

### Layout Enhancements (v1.4.0)
- ✅ **Edge-to-edge Design**: Content now spans the full viewport width
- ✅ **Fixed Layout Gaps**: Eliminated left and right-side gaps on all pages
- ✅ **Responsive Sidebar**: Sidebar overlays content when open, maintaining full-width layout
- ✅ **Settings Page Optimization**: All settings tabs now properly constrain content width
- ✅ **Consistent Spacing**: Unified padding and margin system across all components

### Responsive Design
- ✅ **Mobile-first Approach**: Optimized for mobile devices with touch-friendly interfaces
- ✅ **Tablet Support**: Adaptive layouts for tablet screen sizes
- ✅ **Desktop Optimization**: Full-featured desktop experience
- ✅ **Breakpoint System**: Material-UI responsive breakpoints

## 🏗️ Architecture

### Project Structure
```
frontend/src/
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx           # Main layout wrapper
│   │   ├── Header.jsx           # Top navigation header
│   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   └── ...
│   ├── Common/                  # Reusable UI components
│   └── Dialogs/                 # Modal dialogs
├── pages/
│   ├── Dashboard.jsx            # Main dashboard
│   ├── Products.jsx             # Product management
│   ├── Customers.jsx            # Customer management
│   ├── Transactions.jsx         # Transaction history
│   ├── Sales.jsx                # Point of sale
│   ├── Reports.jsx              # Reports and analytics
│   ├── RealTimeDashboard.jsx    # Real-time analytics
│   ├── Settings.jsx             # System settings
│   └── ...
├── contexts/
│   ├── AuthProvider.jsx         # Authentication context
│   ├── CustomThemeContext.jsx   # Theme management
│   ├── NotificationContext.jsx  # Notification system
│   └── OfflineSyncContext.jsx   # PWA sync management
├── api/
│   ├── auth.js                  # Authentication API
│   ├── products.js              # Products API
│   ├── customers.js             # Customers API
│   ├── transactions.js          # Transactions API
│   ├── reports.js               # Reports API
│   └── ...
├── hooks/
│   ├── useAuth.js               # Authentication hook
│   ├── useOfflineSync.js        # Offline sync hook
│   └── ...
└── utils/
    ├── constants.js             # Application constants
    ├── helpers.js               # Utility functions
    └── validation.js            # Form validation
```

## 🔧 Core Features

### Dashboard
- **Real-time Analytics**: Live business metrics and KPIs
- **Quick Actions**: Fast access to common operations
- **Recent Activity**: Latest transactions and updates
- **Performance Charts**: Visual data representation
- **Inventory Alerts**: Low stock notifications

### Product Management
- **Comprehensive Catalog**: Product listings with search and filters
- **Category Management**: Organized product categorization
- **Stock Tracking**: Real-time inventory levels
- **Image Upload**: Product photo management
- **Barcode Support**: SKU and barcode scanning

### Customer Management
- **Customer Profiles**: Complete customer information
- **Purchase History**: Transaction tracking per customer
- **Loyalty Integration**: Points and rewards management
- **Contact Management**: Phone, email, and address details
- **Customer Analytics**: Purchase patterns and insights

### Sales System
- **Point of Sale**: Complete POS interface
- **Invoice Generation**: Professional invoice creation
- **Payment Processing**: Multiple payment method support
- **Real-time Updates**: Live inventory synchronization
- **Customer Selection**: Quick customer lookup and selection

### Reports & Analytics
- **Advanced Analytics**: Comprehensive business intelligence
- **Visual Charts**: Chart.js powered data visualization
- **Export Capabilities**: CSV and PDF export options
- **Date Range Filtering**: Flexible report periods
- **Performance Metrics**: Key business indicators

## 🔌 API Integration

### Authentication System
```javascript
import { authAPI } from './api/auth';

// Login user
const response = await authAPI.login({ username, password });

// Get user profile
const profile = await authAPI.getProfile();

// Update profile
await authAPI.updateProfile(profileData);
```

### Data Management
```javascript
import { productsAPI } from './api/products';

// Fetch products with pagination
const products = await productsAPI.getAll({ page: 1, limit: 20 });

// Create new product
const newProduct = await productsAPI.create(productData);

// Update product
await productsAPI.update(productId, updateData);
```

### Real-time Features
```javascript
import { useQuery } from '@tanstack/react-query';

// Auto-refreshing data
const { data: dashboardData } = useQuery({
  queryKey: ['dashboard'],
  queryFn: reportsAPI.getDashboard,
  refetchInterval: 30000 // Refresh every 30 seconds
});
```

## 🎨 UI Components

### Material-UI Integration
- **Theme System**: Custom theme with dark/light mode support
- **Component Library**: Comprehensive Material-UI component usage
- **Responsive Grid**: Material-UI Grid system for layouts
- **Typography**: Consistent text styling throughout
- **Icons**: Material Design Icons integration

### Custom Components
- **DataTable**: Advanced table with sorting, filtering, pagination
- **Charts**: Chart.js integration for analytics
- **Forms**: React Hook Form with validation
- **Modals**: Reusable dialog components
- **Layout**: Responsive layout system

### Layout System
```jsx
// Main layout with sidebar and header
<Layout>
  <Box sx={{ 
    width: '100%', 
    maxWidth: '100%', 
    overflow: 'hidden',
    p: 0 // Edge-to-edge design
  }}>
    {/* Page content */}
  </Box>
</Layout>
```

## 📱 Progressive Web App (PWA)

### PWA Features
- ✅ **Service Worker**: Offline functionality
- ✅ **App Manifest**: Installable web app
- ✅ **Caching Strategy**: Offline data access
- ✅ **Background Sync**: Data synchronization
- ✅ **Push Notifications**: User engagement

### Offline Support
- **Data Caching**: Critical data stored locally
- **Sync Queue**: Actions queued for online sync
- **Offline Indicators**: Clear offline status
- **Conflict Resolution**: Data sync conflict handling

## 🔒 Security Features

### Authentication
- **JWT Token Management**: Secure token storage and refresh
- **Role-based Access**: Page and feature access control
- **Session Management**: Automatic logout on token expiry
- **Protected Routes**: Route guards for authenticated areas

### Data Protection
- **Input Validation**: Client-side validation with server verification
- **XSS Prevention**: Sanitized user inputs
- **CSRF Protection**: Request origin validation
- **Secure Storage**: Sensitive data encryption

## 🧪 Testing

### Test Setup
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

### Test Structure
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API integration testing
- **E2E Tests**: Full user workflow testing
- **Accessibility Tests**: WCAG compliance testing

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Optimization
- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Bundle size analysis tools

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application display name | `Jewellery Management System` |
| `VITE_APP_VERSION` | Application version | `1.4.0` |

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

## 📈 Performance Optimizations

### Code Optimizations
- **React Query**: Efficient data fetching and caching
- **Component Memoization**: Preventing unnecessary re-renders
- **Lazy Loading**: Dynamic component imports
- **Virtual Scrolling**: Large list performance

### Bundle Optimizations
- **Vite**: Fast build tool with HMR
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Route-based chunk splitting
- **Asset Optimization**: Image compression and optimization

## 🌐 Browser Support

### Supported Browsers
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

### Mobile Support
- **iOS Safari**: 13+
- **Chrome Mobile**: 80+
- **Samsung Internet**: 12+

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Standards
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message standards
- **Component Standards**: Consistent component structure

## 🆘 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force
```

#### API Connection Issues
- Verify backend server is running
- Check VITE_API_URL in .env file
- Verify CORS configuration in backend

#### Layout Issues
- Check browser console for CSS errors
- Verify Material-UI theme configuration
- Clear browser cache and hard refresh

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Version History

- **v1.4.0**: Layout improvements, edge-to-edge design, settings optimization
- **v1.3.0**: PWA enhancements, offline support, performance improvements
- **v1.2.0**: Advanced analytics, reporting features, mobile optimization
- **v1.1.0**: Loyalty system, hallmarking features, real-time dashboard
- **v1.0.0**: Initial release with core business features
