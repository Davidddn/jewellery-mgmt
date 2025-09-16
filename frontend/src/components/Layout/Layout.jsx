import React, { useState } from 'react';
import { Box, CssBaseline, Container, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OfflineStatusBanner from '../OfflineStatusBanner';
import SyncFeedbackToast from '../SyncFeedbackToast';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // PWA and sync state
  const {
    isOnline,
    pendingActions,
    syncStatus,
    isSyncing: _isSyncing,
    syncProgress,
    retryAll,
    retryAction
  } = useOfflineSync();

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
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%'
    }}>
      <CssBaseline />
      
      {/* Header */}
      <Header 
        onSidebarToggle={handleSidebarToggle} 
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
      />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflow: 'auto',
          ml: 0, // Remove left margin - content spans full width
          mt: { xs: 7, sm: 8 }, // Header height offset
          width: '100%', // Full width always
          maxWidth: '100%',
          transition: 'none', // Remove transition for instant repositioning
        }}
      >
        {/* Offline Status Banner */}
        <OfflineStatusBanner
          isOnline={isOnline}
          pendingCount={pendingActions.length}
          onRetrySync={retryAll}
        />
        
        <Box
          sx={{
            flexGrow: 1,
            py: 0,
            px: 0, // Remove all padding
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      
      {/* Sync Feedback Toast */}
      <SyncFeedbackToast
        syncStatus={syncStatus}
        pendingActions={pendingActions}
        syncProgress={syncProgress}
        isOnline={isOnline}
        onRetryAction={retryAction}
        onRetryAll={retryAll}
        autoHide={true}
      />
    </Box>
  );
};

export default Layout;