import React, { useState, useEffect } from 'react';
import { 
  Drawer,
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Box, 
  useTheme, 
  CircularProgress,
  Divider,
  Collapse,
  Badge,
  alpha
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { 
  Dashboard, 
  ShoppingCart, 
  People, 
  Receipt, 
  Assessment, 
  Settings, 
  VerifiedUser, 
  Loyalty as LoyaltyIcon, 
  MonetizationOn,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
  Analytics,
  Timeline,
  PhoneAndroid
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../../api/settings';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Products', icon: <ShoppingCart />, path: '/products' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
  { text: 'Sales', icon: <ShoppingCart />, path: '/sales' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Expenses', icon: <MonetizationOn />, path: '/expenses' },
  { text: 'Profit & Loss', icon: <Assessment />, path: '/profit-loss' },
  { text: 'Gold Rate', icon: <MonetizationOn />, path: '/gold-rate' },
  { text: 'Customer History', icon: <People />, path: '/customer-history' },
  { text: 'Pricing Plans', icon: <MonetizationOn />, path: '/pricing' },
  { text: 'Subscription', icon: <Settings />, path: '/subscription' },
  { text: 'PWA Status', icon: <PhoneAndroid />, path: '/pwa-status' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const adminItems = [
  { text: 'Invoice Designer', icon: <Receipt />, path: '/admin/invoice-designer' },
  { text: 'Import Data', icon: <Assessment />, path: '/import' },
  { text: 'Audit Logs', icon: <Assessment />, path: '/audit-logs', adminOnly: true },
  { text: 'Hallmarking', icon: <VerifiedUser />, path: '/admin/hallmarking' },
  { text: 'Loyalty', icon: <LoyaltyIcon />, path: '/admin/loyalty' },
];

const Sidebar = ({ isOpen, onClose, isMobile }) => {
  const theme = useTheme();
  const [logoPreview, setLogoPreview] = useState('');
  const [adminExpanded, setAdminExpanded] = useState(false);

  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['logo'],
    queryFn: () => settingsAPI.getLogo(),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (logoData) {
      const blob = new Blob([logoData], { type: 'image/jpeg' });
      const objectUrl = URL.createObjectURL(blob);
      setLogoPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [logoData]);

  const handleAdminToggle = () => {
    setAdminExpanded(!adminExpanded);
  };

  const handleNavClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper', // Solid background
    }}>
      {/* Logo/Brand Section */}
      <Toolbar 
        sx={{ 
          justifyContent: 'center', 
          py: 3,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {/* Logo */}
        {isLogoLoading ? (
          <CircularProgress size={24} />
        ) : logoPreview ? (
          <img 
            src={logoPreview} 
            alt="Logo" 
            style={{ 
              maxHeight: 40, 
              maxWidth: '80%',
              objectFit: 'contain'
            }} 
          />
        ) : (
          <Typography 
            variant="h5"
            noWrap 
            component="div" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 700,
              letterSpacing: '-0.5px'
            }}
          >
            JewelPro
          </Typography>
        )}
      </Toolbar>

      {/* Navigation Items */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        py: 2,
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.text.secondary, 0.3),
          borderRadius: '3px',
          transition: 'background 0.2s ease',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: alpha(theme.palette.text.secondary, 0.5),
        },
        // For Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(theme.palette.text.secondary, 0.3)} transparent`,
      }}>
        <List sx={{ px: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={handleNavClick}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  px: 2.5,
                  py: 1.5,
                  transition: 'all 0.2s ease-in-out',
                  '&.active': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateX(4px)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 44 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Admin Section */}
          <Divider sx={{ my: 2 }} />
          
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={handleAdminToggle}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                px: 2.5,
                py: 1.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <AdminPanelSettings />
              </ListItemIcon>
              <ListItemText 
                primary="Admin"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
              <Badge 
                badgeContent={adminItems.length} 
                color="primary" 
                variant="dot"
                sx={{ mr: 1 }}
              />
              {adminExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>

          <Collapse in={adminExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {adminItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={handleNavClick}
                    sx={{
                      borderRadius: 2,
                      minHeight: 44,
                      px: 2,
                      py: 1.25,
                      transition: 'all 0.2s ease-in-out',
                      '&.active': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      {/* Footer/Version Info */}
      {!isMobile && (
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            align="center" 
            display="block"
            fontWeight={500}
          >
            JewelPro v1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isOpen}
      onClose={onClose}
      ModalProps={{ 
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        width: isOpen ? drawerWidth : 0,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          // Remove transitions for instant show/hide
          transition: 'none',
          // Add safe area for mobile devices with notches
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
          zIndex: (theme) => theme.zIndex.drawer,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;