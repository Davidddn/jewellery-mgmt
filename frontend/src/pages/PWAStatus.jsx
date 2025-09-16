// src/pages/PWAStatus.jsx
// Comprehensive PWA status and management page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Notifications as NotificationsIcon,
  GetApp as InstallIcon,
  Sync as SyncIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function PWAStatus() {
  const {
    isOnline,
    pendingActions,
    isSyncing,
    syncProgress,
    networkQuality,
    compressionStats,
    retryAll,
    clearQueue
  } = useOfflineSync();

  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    isUpdateAvailable: false,
    notificationsEnabled: false,
    serviceWorkerStatus: 'unknown',
    cacheStatus: 'unknown'
  });

  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    quota: 0,
    usageDetails: {}
  });

  const [clearCacheDialog, setClearCacheDialog] = useState(false);

  useEffect(() => {
    const checkPWAStatus = async () => {
      // Check if PWA is installed
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');

      // Check notification permission
      const notificationsEnabled = Notification.permission === 'granted';

      // Check service worker status
      let serviceWorkerStatus = 'not-supported';
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            if (registration.active) {
              serviceWorkerStatus = 'active';
            } else if (registration.installing) {
              serviceWorkerStatus = 'installing';
            } else if (registration.waiting) {
              serviceWorkerStatus = 'waiting';
              setPwaStatus(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          } else {
            serviceWorkerStatus = 'not-registered';
          }
        } catch (err) {
          serviceWorkerStatus = 'error';
          console.error('Service worker check failed:', err);
        }
      }

      // Check cache status
      let cacheStatus = 'unknown';
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          cacheStatus = cacheNames.length > 0 ? 'available' : 'empty';
        } catch (err) {
          cacheStatus = 'error';
          console.error('Cache check failed:', err);
        }
      }

      setPwaStatus({
        isInstalled,
        notificationsEnabled,
        serviceWorkerStatus,
        cacheStatus,
        isUpdateAvailable: pwaStatus.isUpdateAvailable
      });
    };

    const checkStorageUsage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageInfo({
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
            usageDetails: estimate.usageDetails || {}
          });
        } catch (error) {
          console.error('Storage estimation failed:', error);
        }
      }
    };

    const init = async () => {
      await checkPWAStatus();
      await checkStorageUsage();
    };
    
    init();
  }, [pwaStatus.isUpdateAvailable]);

  const handleInstallApp = () => {
    // This would trigger the install prompt component
    window.dispatchEvent(new CustomEvent('pwa-install-requested'));
  };

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPwaStatus(prev => ({ ...prev, notificationsEnabled: true }));
      }
    }
  };

  const handleUpdateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      // Reload to check status again
      window.location.reload();
    }
    setClearCacheDialog(false);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'available':
      case 'good':
        return 'success';
      case 'installing':
      case 'waiting':
      case 'warning':
        return 'warning';
      case 'error':
      case 'not-supported':
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getNetworkQualityLabel = () => {
    switch (networkQuality) {
      case 'slow-2g':
        return 'Very Slow';
      case '2g':
        return 'Slow';
      case '3g':
        return 'Moderate';
      case '4g':
        return 'Fast';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        PWA Status & Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Installation Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InstallIcon color={pwaStatus.isInstalled ? 'success' : 'action'} />
                <Typography variant="h6">Installation Status</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {pwaStatus.isInstalled ? <SuccessIcon color="success" /> : <WarningIcon color="warning" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary="App Installation"
                    secondary={pwaStatus.isInstalled ? 'Installed as PWA' : 'Running in browser'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      size="small" 
                      label={pwaStatus.serviceWorkerStatus} 
                      color={getStatusColor(pwaStatus.serviceWorkerStatus)}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Service Worker"
                    secondary="Handles offline functionality"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      size="small" 
                      label={pwaStatus.cacheStatus} 
                      color={getStatusColor(pwaStatus.cacheStatus)}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary="App Cache"
                    secondary="Stores app files for offline use"
                  />
                </ListItem>
              </List>
            </CardContent>
            
            <CardActions>
              {!pwaStatus.isInstalled && (
                <Button
                  variant="contained"
                  startIcon={<InstallIcon />}
                  onClick={handleInstallApp}
                >
                  Install App
                </Button>
              )}
              
              {pwaStatus.isUpdateAvailable && (
                <Button
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  onClick={handleUpdateApp}
                >
                  Update App
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Network & Sync Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {isOnline ? <OnlineIcon color="success" /> : <OfflineIcon color="error" />}
                <Typography variant="h6">Network & Sync</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Chip 
                      size="small" 
                      label={isOnline ? 'online' : 'offline'} 
                      color={isOnline ? 'success' : 'error'}
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Connection Status"
                    secondary={isOnline ? 'Connected to internet' : 'Working offline'}
                  />
                </ListItem>
                
                {isOnline && (
                  <ListItem>
                    <ListItemIcon>
                      <SpeedIcon color={getStatusColor(networkQuality)} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Network Quality"
                      secondary={getNetworkQualityLabel()}
                    />
                  </ListItem>
                )}
                
                <ListItem>
                  <ListItemIcon>
                    <SyncIcon color={pendingActions.length > 0 ? 'warning' : 'success'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Pending Actions"
                    secondary={`${pendingActions.length} actions queued for sync`}
                  />
                </ListItem>
              </List>

              {isSyncing && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Syncing... ({syncProgress.current}/{syncProgress.total})
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(syncProgress.current / syncProgress.total) * 100} 
                  />
                </Box>
              )}
            </CardContent>
            
            <CardActions>
              {pendingActions.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={retryAll}
                    disabled={isSyncing}
                  >
                    Retry Sync
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<ClearIcon />}
                    onClick={clearQueue}
                    color="error"
                  >
                    Clear Queue
                  </Button>
                </>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationsIcon color={pwaStatus.notificationsEnabled ? 'success' : 'action'} />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={pwaStatus.notificationsEnabled}
                    onChange={handleEnableNotifications}
                    disabled={pwaStatus.notificationsEnabled}
                  />
                }
                label="Push Notifications"
              />
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {pwaStatus.notificationsEnabled 
                  ? 'You will receive notifications about sync status and important updates.'
                  : 'Enable notifications to get sync status updates and alerts.'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <StorageIcon />
                <Typography variant="h6">Storage Usage</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Used Storage</Typography>
                  <Typography variant="body2">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(storageInfo.used / storageInfo.quota) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              {compressionStats && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Compression saved: {formatBytes(compressionStats.totalSaved)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Compression ratio: {(compressionStats.compressionRatio * 100).toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
            
            <CardActions>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => setClearCacheDialog(true)}
                color="warning"
              >
                Clear Cache
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* PWA Features */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PWA Features Available
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <OfflineIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Offline Mode
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Work without internet connection
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <SyncIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Background Sync
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Automatic sync when back online
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Push Notifications
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Real-time notifications
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Secure & Fast
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      HTTPS with service worker caching
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Clear Cache Dialog */}
      <Dialog open={clearCacheDialog} onClose={() => setClearCacheDialog(false)}>
        <DialogTitle>Clear Application Cache</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will clear all cached data and the app will need to reload everything from the server.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to clear the application cache? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearCacheDialog(false)}>Cancel</Button>
          <Button onClick={handleClearCache} color="warning" variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PWAStatus;
