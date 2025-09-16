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
  useTheme,
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

const Header = ({ onSidebarToggle, isMobile, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { mode, toggleTheme } = useCustomTheme();
  const { NotificationBell } = useNotifications();
  const theme = useTheme();

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

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U';
  };

  return (
        <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: theme.zIndex.drawer + 1,
        width: isSidebarOpen && !isMobile ? 'calc(100% - 240px)' : '100%',
        ml: isSidebarOpen && !isMobile ? '240px' : 0,
        // Remove transition for instant repositioning
        transition: 'none',
      }}
    >
      <Toolbar 
        sx={{ 
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
          gap: 2,
        }}
      >
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={onSidebarToggle}
          sx={{ 
            p: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          noWrap 
          component="h1" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {getPageTitle()}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
        }}>
          {/* Notifications */}
          <NotificationBell />
          
          {/* Theme Toggle */}
          <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{ 
              p: 1.5,
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
            aria-label="toggle theme"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {/* User Info - Show name on desktop */}
          {!isMobile && (
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              mr: 1,
            }}>
              <Typography 
                variant="body2"
                fontWeight={500}
                color="text.primary"
              >
                {user?.firstName || user?.username || 'User'}
              </Typography>
              <Typography 
                variant="caption"
                color="text.secondary"
              >
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
              </Typography>
            </Box>
          )}
          
          {/* User Avatar */}
          <IconButton 
            onClick={handleMenu} 
            sx={{ 
              p: 0,
              '&:hover': {
                '& .MuiAvatar-root': {
                  boxShadow: theme.shadows[4],
                }
              }
            }}
            aria-label="user menu"
          >
            <Avatar 
              sx={{ 
                width: { xs: 36, sm: 40 }, 
                height: { xs: 36, sm: 40 },
                bgcolor: 'primary.main',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                transition: 'box-shadow 0.2s ease-in-out',
              }}
            >
              {getUserInitials()}
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
                minWidth: 200,
                mt: 1,
                borderRadius: 2,
                boxShadow: theme.shadows[8],
              }
            }}
          >
            {/* Show user info on mobile in menu */}
            {isMobile && (
              <MenuItem disabled sx={{ 
                opacity: 1, 
                py: 2,
                borderBottom: 1,
                borderColor: 'divider',
                mb: 1,
              }}>
                <Person sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {user?.firstName || user?.username || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
                  </Typography>
                </Box>
              </MenuItem>
            )}
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                }
              }}
            >
              <LogoutIcon sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
