import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { Menu as MenuIcon, Logout as LogoutIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../../contexts/useAuth';
import { useLocation } from 'react-router-dom';
import { useCustomTheme } from '../../contexts/CustomThemeContext';

const drawerWidth = 240;

const Header = ({ onSidebarToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { mode, toggleTheme } = useCustomTheme();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        boxShadow: 'none',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        width: { md: `calc(100% - ${isSidebarOpen ? drawerWidth : 0}px)` },
        ml: { md: `${isSidebarOpen ? drawerWidth : 0}px` },
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onSidebarToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          {getPageTitle()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <Typography sx={{ mr: 1.5, display: { xs: 'none', sm: 'block' } }}>{user?.firstName || 'User'}</Typography>
          <IconButton onClick={handleMenu} sx={{ p: 0 }}>
            <Avatar>{user?.firstName?.charAt(0) || 'U'}</Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={logout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
