import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { Dashboard, ShoppingCart, People, Receipt, Assessment, Settings } from '@mui/icons-material';

const drawerWidth = 240;

const navItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Products', icon: <ShoppingCart />, path: '/products' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <div>
      <Toolbar sx={{ justifyContent: 'center', py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          JewelPro
        </Typography>
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
