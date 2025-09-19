// src/components/SyncFeedbackToast.jsx
// Enhanced sync feedback with detailed status per action
import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Sync as SyncIcon,
  Refresh as RetryIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';

export function SyncFeedbackToast({ 
  syncStatus = {},
  pendingActions = [],
  syncProgress = { current: 0, total: 0 },
  isOnline = true,
  onRetryAction,
  onRetryAll,
  autoHide = true
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Show toast when there's sync activity
  useEffect(() => {
    const hasActivity = pendingActions.length > 0 || 
                       Object.keys(syncStatus).length > 0 ||
                       syncProgress.total > 0;
    
    if (hasActivity && !open) {
      setOpen(true);
    }

    // Auto-hide successful syncs
    if (autoHide && open) {
      const allSuccess = pendingActions.length === 0 && 
                        Object.values(syncStatus).every(status => status === 'success');
      
      if (allSuccess && syncProgress.current === syncProgress.total && syncProgress.total > 0) {
        const timer = setTimeout(() => {
          setOpen(false);
          setLastSyncTime(new Date());
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingActions, syncStatus, syncProgress, open, autoHide]);

  const handleClose = () => {
    setOpen(false);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Calculate sync statistics
  const stats = {
    total: pendingActions.length,
    success: Object.values(syncStatus).filter(status => status === 'success').length,
    failed: Object.values(syncStatus).filter(status => status === 'failed').length,
    pending: Object.values(syncStatus).filter(status => status === 'pending' || status === 'retrying').length
  };

  const getSeverity = () => {
    if (stats.failed > 0) return 'error';
    if (stats.pending > 0) return 'warning';
    if (stats.success > 0) return 'success';
    return 'info';
  };

  const getMainMessage = () => {
    if (!isOnline) {
      return `${stats.total} actions queued for sync when online`;
    }
    
    if (stats.pending > 0) {
      return `Syncing ${stats.pending} actions...`;
    }
    
    if (stats.failed > 0) {
      return `${stats.failed} actions failed to sync`;
    }
    
    if (stats.success > 0 && stats.total === stats.success) {
      return `All ${stats.success} actions synced successfully`;
    }
    
    return 'Sync in progress...';
  };

  const getActionIcon = (actionId) => {
    const status = syncStatus[actionId];
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" fontSize="small" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'retrying':
        return <SyncIcon color="warning" fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />;
      case 'pending':
      default:
        return <PendingIcon color="action" fontSize="small" />;
    }
  };

  const getActionDescription = (action) => {
    const method = action.method?.toUpperCase() || 'ACTION';
    const entity = action.url?.split('/').pop() || 'item';
    
    switch (method) {
      case 'POST':
        return `Creating ${entity}`;
      case 'PUT':
        return `Updating ${entity}`;
      case 'DELETE':
        return `Deleting ${entity}`;
      default:
        return `${method} ${entity}`;
    }
  };

  const shouldShow = open && (stats.total > 0 || !isOnline);

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <Snackbar
        open={open}
        onClose={autoHide ? handleClose : undefined}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ maxWidth: { xs: '100%', sm: 400 } }}
      >
        <Alert
          severity={getSeverity()}
          onClose={autoHide ? handleClose : undefined}
          sx={{ width: '100%' }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {stats.failed > 0 && (
                <Tooltip title="Retry all failed actions">
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={onRetryAll}
                  >
                    <RetryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {stats.total > 1 && (
                <Tooltip title={expanded ? "Show less" : "Show details"}>
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={toggleExpanded}
                  >
                    {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              {!autoHide && (
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
        >
          <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOnline ? <CloudDoneIcon fontSize="small" /> : <CloudOffIcon fontSize="small" />}
            Sync Status
          </AlertTitle>
          
          <Typography variant="body2" gutterBottom>
            {getMainMessage()}
          </Typography>

          {/* Progress bar */}
          {syncProgress.total > 0 && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(syncProgress.current / syncProgress.total) * 100}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="textSecondary">
                {syncProgress.current} of {syncProgress.total} completed
              </Typography>
            </Box>
          )}

          {/* Status chips */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            {stats.success > 0 && (
              <Chip
                size="small"
                label={`${stats.success} synced`}
                color="success"
                variant="outlined"
              />
            )}
            {stats.pending > 0 && (
              <Chip
                size="small"
                label={`${stats.pending} pending`}
                color="warning"
                variant="outlined"
              />
            )}
            {stats.failed > 0 && (
              <Chip
                size="small"
                label={`${stats.failed} failed`}
                color="error"
                variant="outlined"
              />
            )}
          </Box>

          {/* Detailed action list */}
          <Collapse in={expanded}>
            <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
              {pendingActions.map((action) => (
                <ListItem
                  key={action.id}
                  dense
                  secondaryAction={
                    syncStatus[action.id] === 'failed' && (
                      <IconButton
                        size="small"
                        onClick={() => onRetryAction?.(action.id)}
                        color="primary"
                      >
                        <RetryIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 
                      syncStatus[action.id] === 'success' ? 'success.light' :
                      syncStatus[action.id] === 'failed' ? 'error.light' :
                      syncStatus[action.id] === 'retrying' ? 'warning.light' :
                      'action.hover',
                    mb: 0.5,
                    opacity: syncStatus[action.id] === 'success' ? 0.7 : 1
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getActionIcon(action.id)}
                  </ListItemIcon>
                  <ListItemText
                    primary={getActionDescription(action)}
                    secondary={syncStatus[action.id] ? syncStatus[action.id] : 'queued'}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>

          {/* Last sync time */}
          {lastSyncTime && !open && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Typography>
          )}
        </Alert>
      </Snackbar>

      {/* Global styles for animations */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default SyncFeedbackToast;
