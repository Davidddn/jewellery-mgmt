import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Logout as LogoutIcon, 
  Brightness4, 
  Brightness7,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/useAuth';
import { useLocation } from 'react-router-dom';
import { useCustomTheme } from '../../contexts/CustomThemeContext';
import { useNotifications } from '../../hooks/useNotifications';

const Header = ({ onSidebarToggle, isMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { mode, toggleTheme } = useCustomTheme();
  const { NotificationBell } = useNotifications();

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    if (!path || path === 'dashboard') return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      sx={(theme) => ({
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        zIndex: theme.zIndex.drawer + 1,
        width: { xs: '100%', sm: `calc(100% - 240px)` },
        ml: { xs: 0, sm: '240px' },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      })}
    >
      <Toolbar sx={{ 
        minHeight: { xs: 56, sm: 64 }, // Responsive toolbar height
        px: { xs: 1, sm: 2 }, // Responsive padding
        pl: { xs: 1, sm: 0 } // Remove extra left padding on desktop
      }}>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={onSidebarToggle}
          sx={{ 
            mr: { xs: 1, sm: 2 },
            p: { xs: 1, sm: 1.5 }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center',
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {getPageTitle()}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 }
        }}>
          {/* Notifications */}
          <NotificationBell />
          
          {/* Theme Toggle */}
          <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{ p: { xs: 1, sm: 1.5 } }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {/* User Info - Show differently on mobile */}
          {!isMobile && (
            <Typography 
              sx={{ 
                mr: 1.5, 
                display: { xs: 'none', sm: 'block' },
                fontSize: { sm: '0.875rem', md: '1rem' }
              }}
            >
              {user?.firstName || 'User'}
            </Typography>
          )}
          
          {/* User Avatar */}
          <IconButton 
            onClick={handleMenu} 
            sx={{ p: { xs: 0.5, sm: 0 } }}
            aria-label="user menu"
          >
            <Avatar sx={{ 
              width: { xs: 32, sm: 40 }, 
              height: { xs: 32, sm: 40 },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              {user?.firstName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                minWidth: { xs: 150, sm: 180 }
              }
            }}
          >
            {/* Show user info on mobile in menu */}
            {isMobile && (
              <MenuItem disabled sx={{ opacity: 1 }}>
                <Person sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.firstName || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
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
