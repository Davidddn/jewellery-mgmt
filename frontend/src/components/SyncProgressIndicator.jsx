// src/components/SyncProgressIndicator.jsx
// Advanced sync progress with detailed status and estimated time

import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Sync,
  CheckCircle,
  Error,
  Warning,
  CloudOff,
  CloudDone,
  ExpandMore,
  ExpandLess,
  Speed,
  Storage
} from '@mui/icons-material';
import { BandwidthAwareSync } from '../utils/bandwidthAwareSync';
import { StorageManager } from '../utils/storageManager';

export default function SyncProgressIndicator({ 
  pendingActions = [], 
  syncStatus = {}, 
  isOnline = true
}) {
  const [expanded, setExpanded] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0 });
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [bandwidth] = useState(new BandwidthAwareSync());

  useEffect(() => {
    // Update network quality
    setNetworkQuality(bandwidth.getNetworkQuality());
    
    // Update storage info
    StorageManager.getStorageEstimate().then(setStorageInfo);
    
    // Estimate sync time
    if (pendingActions.length > 0) {
      const avgSize = 1024; // Average item size in bytes
      const estimated = bandwidth.estimateSyncTime(pendingActions.length, avgSize);
      setEstimatedTime(estimated);
    }
  }, [pendingActions, bandwidth]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'retrying': return 'warning';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'retrying': return <Sync className="rotating" />;
      default: return <Sync />;
    }
  };

  const getNetworkIcon = () => {
    if (!isOnline) return <CloudOff color="error" />;
    switch (networkQuality) {
      case 'excellent': return <CloudDone color="success" />;
      case 'good': return <CloudDone color="primary" />;
      case 'fair': return <CloudDone color="warning" />;
      default: return <CloudDone color="error" />;
    }
  };

  const syncProgress = pendingActions.length > 0 ? 
    ((pendingActions.length - Object.keys(syncStatus).filter(id => syncStatus[id] === 'pending').length) / pendingActions.length) * 100 : 0;

  const storageUsagePercent = storageInfo.quota > 0 ? 
    (storageInfo.usage / storageInfo.quota * 100).toFixed(1) : 0;

  return (
    <Card sx={{ mb: 2, position: 'sticky', top: 0, zIndex: 10 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`Network: ${networkQuality} • ${isOnline ? 'Online' : 'Offline'}`}>
              {getNetworkIcon()}
            </Tooltip>
            
            <Typography variant="h6" component="div">
              Sync Status
            </Typography>
            
            {pendingActions.length > 0 && (
              <Chip
                size="small"
                label={`${pendingActions.length} pending`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`Storage: ${storageUsagePercent}% used`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Storage fontSize="small" />
                <Typography variant="caption">{storageUsagePercent}%</Typography>
              </Box>
            </Tooltip>
            
            <Tooltip title={`Network: ${networkQuality}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Speed fontSize="small" />
                <Typography variant="caption">{networkQuality}</Typography>
              </Box>
            </Tooltip>
            
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              disabled={pendingActions.length === 0}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {pendingActions.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary">
                Syncing {Object.keys(syncStatus).filter(id => syncStatus[id] === 'retrying').length} of {pendingActions.length} items
              </Typography>
              {estimatedTime > 0 && (
                <Typography variant="caption" color="textSecondary">
                  ~{estimatedTime}s remaining
                </Typography>
              )}
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={syncProgress} 
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        <Collapse in={expanded}>
          <List dense sx={{ mt: 1 }}>
            {pendingActions.slice(0, 10).map((action) => (
              <ListItem key={action.id} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getStatusIcon(syncStatus[action.id])}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2">
                      {action.method} {action.url?.split('/').pop() || 'Unknown'}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </Typography>
                  }
                />
                <Chip
                  size="small"
                  label={syncStatus[action.id] || 'pending'}
                  color={getStatusColor(syncStatus[action.id])}
                  variant="outlined"
                />
              </ListItem>
            ))}
            {pendingActions.length > 10 && (
              <ListItem>
                <Typography variant="caption" color="textSecondary">
                  ... and {pendingActions.length - 10} more items
                </Typography>
              </ListItem>
            )}
          </List>
        </Collapse>

        {!isOnline && (
          <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="warning.dark">
              You're offline. Changes will sync when connection is restored.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
