import React, { useState } from 'react';
import { Box, CssBaseline, Container, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      overflow: 'hidden' // Prevent horizontal scroll
    }}>
      <CssBaseline />
      <Header 
        onSidebarToggle={handleSidebarToggle} 
        isMobile={isMobile}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: '64px', // Header height
          minHeight: '100vh',
          overflow: 'auto',
          // Responsive sidebar margin
          ml: {
            xs: 0, // No margin on mobile
            md: isSidebarOpen ? '1px' : 0 // 1px margin when sidebar is open on desktop
          },
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            flexGrow: 1,
            py: { xs: 2, sm: 3 }, // Responsive padding
            px: { xs: 1, sm: 2, md: 0.125 }, // Reduced padding for desktop - 0.125 * 8px = 1px
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '100%', // Ensure full width usage
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;