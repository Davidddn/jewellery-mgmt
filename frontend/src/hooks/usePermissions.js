import { useAuth } from '../contexts/useAuth';

// Role hierarchy and permissions mapping
const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  inventory: 2,
  sales: 1
};

const PERMISSIONS = {
  // User Management
  'users.view': ['admin'],
  'users.create': ['admin'],
  'users.edit': ['admin'],
  'users.delete': ['admin'],
  
  // Product Management
  'products.view': ['admin', 'manager', 'inventory', 'sales'],
  'products.read': ['admin', 'manager', 'inventory', 'sales'], // Added for compatibility
  'products.create': ['admin', 'manager', 'inventory'],
  'products.edit': ['admin', 'manager', 'inventory'],
  'products.delete': ['admin', 'manager'],
  'products.export': ['admin', 'manager', 'inventory'],
  'products.import': ['admin', 'manager', 'inventory'],
  
  // Customer Management
  'customers.view': ['admin', 'manager', 'sales'],
  'customers.read': ['admin', 'manager', 'sales'], // Added for compatibility
  'customers.create': ['admin', 'manager', 'sales'],
  'customers.edit': ['admin', 'manager', 'sales'],
  'customers.delete': ['admin', 'manager'],
  
  // Transaction Management
  'transactions.view': ['admin', 'manager', 'sales'],
  'transactions.create': ['admin', 'manager', 'sales'],
  'transactions.edit': ['admin', 'manager'],
  'transactions.delete': ['admin'],
  
  // Invoice Management
  'invoices.view': ['admin', 'manager', 'sales'],
  'invoices.create': ['admin', 'manager', 'sales'],
  'invoices.edit': ['admin', 'manager', 'sales'],
  'invoices.delete': ['admin', 'manager'],
  
  // Reports and Analytics
  'reports.view': ['admin', 'manager', 'sales'],
  'reports.advanced': ['admin', 'manager'],
  'analytics.view': ['admin', 'manager'],
  'analytics.advanced': ['admin'],
  
  // Settings
  'settings.view': ['admin', 'manager'],
  'settings.edit': ['admin'],
  'settings.system': ['admin'],
  
  // Audit Logs
  'audit.view': ['admin'],
  'audit.export': ['admin'],
  
  // Inventory Management
  'inventory.view': ['admin', 'manager', 'inventory'],
  'inventory.edit': ['admin', 'manager', 'inventory'],
  'inventory.export': ['admin', 'manager', 'inventory'],
  
  // Gold Rate Management
  'goldrate.view': ['admin', 'manager', 'sales'],
  'goldrate.edit': ['admin', 'manager'],
  
  // Loyalty Management
  'loyalty.view': ['admin', 'manager', 'sales'],
  'loyalty.edit': ['admin', 'manager'],
  
  // Expenses
  'expenses.view': ['admin', 'manager'],
  'expenses.create': ['admin', 'manager'],
  'expenses.edit': ['admin', 'manager'],
  'expenses.delete': ['admin'],
  
  // Hallmarking
  'hallmarking.view': ['admin', 'manager', 'inventory'],
  'hallmarking.edit': ['admin', 'manager', 'inventory'],
  
  // Dashboard
  'dashboard.view': ['admin', 'manager', 'inventory', 'sales'],
  'dashboard.advanced': ['admin', 'manager'],
  
  // Import/Export
  'import.data': ['admin', 'manager'],
  'export.data': ['admin', 'manager', 'inventory']
};

export const usePermissions = () => {
  const { user, loading } = useAuth();

  const hasPermission = (permission) => {
    if (loading || !user || !user.role) return false;
    
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    
    return allowedRoles.includes(user.role);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRoleLevel = (requiredLevel) => {
    if (loading || !user || !user.role) return false;
    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    return userLevel >= requiredLevel;
  };

  const isAdmin = () => !loading && user?.role === 'admin';
  const isManager = () => !loading && user?.role === 'manager';
  const isInventory = () => !loading && user?.role === 'inventory';
  const isSales = () => !loading && user?.role === 'sales';

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRoleLevel,
    isAdmin,
    isManager,
    isInventory,
    isSales,
    userRole: user?.role,
    permissions: PERMISSIONS,
    isLoading: loading
  };
};
