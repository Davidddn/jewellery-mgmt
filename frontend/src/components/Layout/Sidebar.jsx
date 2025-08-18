import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { Dashboard, ShoppingCart, People, Receipt, Assessment, Settings, VerifiedUser, Loyalty as LoyaltyIcon, MonetizationOn } from '@mui/icons-material';
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
  { text: 'Settings', icon: <Settings />, path: '/settings' },
  { text: 'Gold Rate', icon: <MonetizationOn />, path: '/gold-rate' },
  { text: 'Hallmarking', icon: <VerifiedUser />, path: '/admin/hallmarking' },
  { text: 'Loyalty', icon: <LoyaltyIcon />, path: '/admin/loyalty' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [logoPreview, setLogoPreview] = useState('');

  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['logo'],
    queryFn: () => settingsAPI.getLogo(),
  });

  useEffect(() => {
    if (logoData) {
      const blob = new Blob([logoData], { type: 'image/jpeg' });
      const objectUrl = URL.createObjectURL(blob);
      setLogoPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [logoData]);

  const drawerContent = (
    <div>
      <Toolbar sx={{ justifyContent: 'center', py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        {isLogoLoading ? (
          <CircularProgress size={24} />
        ) : logoPreview ? (
          <img src={logoPreview} alt="Logo" style={{ maxHeight: 40, maxWidth: '80%' }} />
        ) : (
          <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            JewelPro
          </Typography>
        )}
      </Toolbar>
      <List sx={{ p: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={isMobile ? onClose : undefined} // Only close on mobile
              sx={{
                borderRadius: 1,
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
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={isOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }} // Better mobile performance
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: 'background.paper',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;