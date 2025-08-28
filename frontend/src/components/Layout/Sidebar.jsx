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
  Badge
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
  Timeline
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '../../api/settings';

const drawerWidth = 240;
const mobileDrawerWidth = 280; // Slightly wider on mobile for better touch targets

const navItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Products', icon: <ShoppingCart />, path: '/products' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
  { text: 'Sales', icon: <ShoppingCart />, path: '/sales' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { text: 'Real-Time', icon: <Timeline />, path: '/realtime' },
  { text: 'Gold Rate', icon: <MonetizationOn />, path: '/gold-rate' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const adminItems = [
  { text: 'Hallmarking', icon: <VerifiedUser />, path: '/admin/hallmarking' },
  { text: 'Loyalty', icon: <LoyaltyIcon />, path: '/admin/loyalty' },
];


// TODO: Replace with real premium check
const isPremium = true;

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Section */}
      <Toolbar 
        sx={{ 
          justifyContent: 'center', 
          py: { xs: 2, sm: 2.5 }, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: { xs: 56, sm: 64 }
        }}
      >
        {isLogoLoading ? (
          <CircularProgress size={24} />
        ) : logoPreview ? (
          <img 
            src={logoPreview} 
            alt="Logo" 
            style={{ 
              maxHeight: isMobile ? 35 : 40, 
              maxWidth: '80%',
              objectFit: 'contain'
            }} 
          />
        ) : (
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            noWrap 
            component="div" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 'bold',
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            JewelPro
          </Typography>
        )}
      </Toolbar>

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ p: { xs: 1, sm: 1.5 } }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={handleNavClick}
                sx={{
                  borderRadius: 1,
                  minHeight: { xs: 44, sm: 48 }, // Touch-friendly height
                  px: { xs: 2, sm: 2.5 },
                  '&.active': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 40, sm: 44 } }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {/* Premium: Invoice Designer */}
          {isPremium && (
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to="/invoice-designer"
                onClick={handleNavClick}
                sx={{
                  borderRadius: 1,
                  minHeight: { xs: 44, sm: 48 },
                  px: { xs: 2, sm: 2.5 },
                  '&.active': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 40, sm: 44 } }}>
                  {/* Use a custom icon for designer */}
                  <Receipt />
                </ListItemIcon>
                <ListItemText 
                  primary="Invoice Designer"
                  primaryTypographyProps={{
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                />
                <Box component="span" sx={{ ml: 1, color: 'warning.main', fontWeight: 600, fontSize: '0.75rem' }}>
                  Premium
                </Box>
              </ListItemButton>
            </ListItem>
          )}

          {/* Admin Section */}
          <ListItem disablePadding sx={{ mb: 0.5, mt: 1 }}>
            <ListItemButton
              onClick={handleAdminToggle}
              sx={{
                borderRadius: 1,
                minHeight: { xs: 44, sm: 48 },
                px: { xs: 2, sm: 2.5 },
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 40, sm: 44 } }}>
                <AdminPanelSettings />
              </ListItemIcon>
              <ListItemText 
                primary="Admin"
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              />
              <Badge badgeContent={adminItems.length} color="primary" variant="dot">
                {adminExpanded ? <ExpandLess /> : <ExpandMore />}
              </Badge>
            </ListItemButton>
          </ListItem>

          <Collapse in={adminExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: { xs: 1, sm: 2 } }}>
              {adminItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={handleNavClick}
                    sx={{
                      borderRadius: 1,
                      minHeight: { xs: 40, sm: 44 },
                      px: { xs: 1.5, sm: 2 },
                      '&.active': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
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
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Version 1.0.0
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
        width: isMobile ? mobileDrawerWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? mobileDrawerWidth : drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: 'background.paper',
          // Add safe area for mobile devices with notches
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;