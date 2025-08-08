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

  return (
    <Box sx={{ display: 'flex', minHeight: '300vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <Header onSidebarToggle={handleSidebarToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: '64px', // Push content below the fixed header
        }}
      >
        {/* The Container now fills the available width */}
        <Container
          maxWidth={false}
          sx={{
            flexGrow: 1,
            py: 3,
            px: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet /> {/* Your page components will render here, now in a full-width container */}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
