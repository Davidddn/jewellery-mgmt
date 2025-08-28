import React, { createContext, useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '../api/products';
import { transactionsAPI } from '../api/transactions';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Fetch low stock products
  const { data: lowStockProducts } = useQuery({
    queryKey: ['lowStockProducts'],
    queryFn: async () => {
      const response = await productsAPI.getProducts();
      return response.products?.filter(product => product.stock_quantity <= 10) || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const response = await transactionsAPI.getTransactions();
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return response.transactions?.filter(transaction => 
        new Date(transaction.created_at) > oneHourAgo
      ) || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Generate notifications based on data
  useEffect(() => {
    const newNotifications = [];

    // Low stock notifications
    if (lowStockProducts?.length > 0) {
      lowStockProducts.forEach(product => {
        if (product.stock_quantity === 0) {
          newNotifications.push({
            id: `out-of-stock-${product.id}`,
            type: 'error',
            title: 'Out of Stock',
            message: `${product.name} is out of stock`,
            icon: <WarningIcon />,
            timestamp: new Date(),
            category: 'inventory'
          });
        } else if (product.stock_quantity <= 5) {
          newNotifications.push({
            id: `low-stock-${product.id}`,
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${product.name} has only ${product.stock_quantity} items left`,
            icon: <InventoryIcon />,
            timestamp: new Date(),
            category: 'inventory'
          });
        }
      });
    }

    // New transaction notifications
    if (recentTransactions?.length > 0) {
      recentTransactions.forEach(transaction => {
        newNotifications.push({
          id: `transaction-${transaction.id}`,
          type: 'success',
          title: 'New Transaction',
          message: `Transaction #${transaction.id} - ₹${Number(transaction.final_amount || 0).toLocaleString('en-IN')}`,
          icon: <TrendingUpIcon />,
          timestamp: new Date(transaction.created_at),
          category: 'transaction'
        });
      });
    }

    // Update notifications (keep only recent ones)
    setNotifications(prevNotifications => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Filter out old notifications and duplicates
      const filteredOld = prevNotifications.filter(
        notif => notif.timestamp > oneHourAgo && 
        !newNotifications.some(newNotif => newNotif.id === notif.id)
      );
      
      return [...filteredOld, ...newNotifications].slice(0, 20); // Keep only 20 most recent
    });
  }, [lowStockProducts, recentTransactions]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}`,
      timestamp: notification.timestamp || new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <SuccessIcon color="success" />;
      case 'info': 
      default: return <InfoIcon color="info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info':
      default: return 'primary';
    }
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const unreadCount = notifications.length;

  const value = {
    notifications,
    unreadCount,
    showSnackbar,
    addNotification,
    clearNotification,
    clearAllNotifications,
    // Notification Bell Component
    NotificationBell: () => (
      <>
        <IconButton
          color="inherit"
          onClick={handleNotificationClick}
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: { 
              width: 350, 
              maxHeight: 400,
              '& .MuiList-root': { py: 0 }
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Notifications ({unreadCount})
              </Typography>
              {unreadCount > 0 && (
                <Chip 
                  label="Clear All" 
                  size="small" 
                  onClick={clearAllNotifications}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Typography color="text.secondary">
                No new notifications
              </Typography>
            </MenuItem>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => clearNotification(notification.id)}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      py: 1.5
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip 
                      label={notification.category}
                      size="small"
                      color={getNotificationColor(notification.type)}
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Menu>
      </>
    )
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={hideSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export { NotificationContext };
