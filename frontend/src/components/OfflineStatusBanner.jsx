// src/components/OfflineStatusBanner.jsx
// Enhanced offline status banner with PWA features
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Collapse,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export function OfflineStatusBanner({
  isOnline = true,
  pendingCount = 0,
  onRetrySync,
  onDismiss,
  showInstallPrompt = false,
  onInstallClick
}) {
  const [dismissed, setDismissed] = useState(false);
  const [lastOfflineTime, setLastOfflineTime] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('good');

  // Monitor connection quality
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType;
        setConnectionQuality(effectiveType);
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  // Track offline time
  useEffect(() => {
    if (!isOnline && !lastOfflineTime) {
      setLastOfflineTime(new Date());
    } else if (isOnline && lastOfflineTime) {
      setLastOfflineTime(null);
    }
  }, [isOnline, lastOfflineTime]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'slow-2g':
      case '2g':
        return 'error';
      case '3g':
        return 'warning';
      case '4g':
        return 'success';
      default:
        return 'info';
    }
  };

  const getOfflineDuration = () => {
    if (!lastOfflineTime) return '';
    const duration = Date.now() - lastOfflineTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Don't show if dismissed and online
  if (dismissed && isOnline && pendingCount === 0) {
    return null;
  }

  const shouldShow = !isOnline || pendingCount > 0 || showInstallPrompt;

  return (
    <Collapse in={shouldShow && !dismissed}>
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1200,
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: !isOnline ? 'warning.light' : 'info.light'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {/* Status icon and main message */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isOnline ? (
                <OfflineIcon color="warning" />
              ) : (
                <OnlineIcon color="success" />
              )}
              
              <Typography variant="body2" fontWeight="medium">
                {!isOnline ? (
                  `You're offline${lastOfflineTime ? ` (${getOfflineDuration()})` : ''}`
                ) : (
                  'Connected'
                )}
              </Typography>
            </Box>

            {/* Status chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {pendingCount > 0 && (
                <Chip
                  size="small"
                  label={`${pendingCount} pending`}
                  color="warning"
                  variant="outlined"
                  icon={<SyncIcon />}
                />
              )}
              
              {isOnline && connectionQuality && (
                <Tooltip title={`Connection: ${connectionQuality.toUpperCase()}`}>
                  <Chip
                    size="small"
                    label={connectionQuality.toUpperCase()}
                    color={getConnectionQualityColor()}
                    variant="outlined"
                  />
                </Tooltip>
              )}

              {showInstallPrompt && (
                <Chip
                  size="small"
                  label="Install Available"
                  color="primary"
                  variant="outlined"
                  onClick={onInstallClick}
                  clickable
                />
              )}
            </Box>

            {/* Descriptive text */}
            <Typography variant="caption" color="textSecondary" sx={{ flex: 1 }}>
              {!isOnline ? (
                'Your changes are saved locally and will sync when connection is restored.'
              ) : pendingCount > 0 ? (
                'Syncing your offline changes...'
              ) : showInstallPrompt ? (
                'Install the app for better offline experience.'
              ) : (
                'All changes are synced.'
              )}
            </Typography>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOnline && pendingCount > 0 && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRetrySync}
              >
                Retry Sync
              </Button>
            )}

            {showInstallPrompt && (
              <Button
                size="small"
                variant="contained"
                onClick={onInstallClick}
              >
                Install
              </Button>
            )}

            <IconButton size="small" onClick={handleDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Progress bar for active syncing */}
        {isOnline && pendingCount > 0 && (
          <LinearProgress
            sx={{
              height: 2,
              '& .MuiLinearProgress-bar': {
                transition: 'transform 0.4s ease-in-out'
              }
            }}
          />
        )}
      </Paper>
    </Collapse>
  );
}

export default OfflineStatusBanner;
