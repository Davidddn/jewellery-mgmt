// src/components/OfflineSettingsDialog.jsx
// UI for managing offline sync and PWA settings

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Box,
  Divider,
  Alert
} from '@mui/material';
import { useOfflineSettings } from '../contexts/useOfflineSettings';

export default function OfflineSettingsDialog({ open, onClose }) {
  const { settings, updateSetting, resetSettings } = useOfflineSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    setHasChanges(true);
  };

  const handleReset = () => {
    resetSettings();
    setHasChanges(false);
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  const formatInterval = (ms) => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatDuration = (ms) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="offline-settings-title"
      aria-describedby="offline-settings-description"
    >
      <DialogTitle id="offline-settings-title">Offline & Sync Settings</DialogTitle>
      <DialogContent id="offline-settings-description">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          
          {/* Auto Sync */}
          <Box role="group" aria-labelledby="sync-settings">
            <Typography variant="h6" gutterBottom id="sync-settings">Synchronization</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoSync}
                  onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                  inputProps={{ 'aria-describedby': 'auto-sync-help' }}
                />
              }
              label="Enable automatic sync"
            />
            <Typography variant="caption" id="auto-sync-help" sx={{ display: 'block', mt: 0.5 }}>
              Automatically sync your changes when online
            </Typography>
            
            {settings.autoSync && (
              <Box sx={{ mt: 2 }}>
                <Typography gutterBottom>
                  Sync interval: {formatInterval(settings.syncInterval)}
                </Typography>
                <Slider
                  value={settings.syncInterval}
                  onChange={(e, value) => handleSettingChange('syncInterval', value)}
                  min={10000}
                  max={300000}
                  step={10000}
                  marks={[
                    { value: 10000, label: '10s' },
                    { value: 60000, label: '1m' },
                    { value: 300000, label: '5m' }
                  ]}
                />
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={settings.backgroundSync}
                  onChange={(e) => handleSettingChange('backgroundSync', e.target.checked)}
                />
              }
              label="Enable background sync"
            />
          </Box>

          <Divider />

          {/* Notifications */}
          <Box>
            <Typography variant="h6" gutterBottom>Notifications</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                />
              }
              label="Enable sync notifications"
            />
            {settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'denied' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Notifications are blocked. Please enable them in your browser settings.
              </Alert>
            )}
          </Box>

          <Divider />

          {/* Conflict Resolution */}
          <Box>
            <Typography variant="h6" gutterBottom>Conflict Resolution</Typography>
            <FormControl fullWidth>
              <InputLabel>Default conflict resolution</InputLabel>
              <Select
                value={settings.conflictResolution}
                onChange={(e) => handleSettingChange('conflictResolution', e.target.value)}
                label="Default conflict resolution"
              >
                <MenuItem value="ask">Ask me each time</MenuItem>
                <MenuItem value="keepLocal">Always keep my changes</MenuItem>
                <MenuItem value="useServer">Always use server version</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider />

          {/* Cache Settings */}
          <Box>
            <Typography variant="h6" gutterBottom>Offline Cache</Typography>
            
            <Typography gutterBottom>
              Cache duration: {formatDuration(settings.offlineCacheDuration)}
            </Typography>
            <Slider
              value={settings.offlineCacheDuration}
              onChange={(e, value) => handleSettingChange('offlineCacheDuration', value)}
              min={3600000} // 1 hour
              max={604800000} // 7 days
              step={3600000}
              marks={[
                { value: 3600000, label: '1h' },
                { value: 86400000, label: '1d' },
                { value: 604800000, label: '7d' }
              ]}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataCompressionEnabled}
                  onChange={(e) => handleSettingChange('dataCompressionEnabled', e.target.checked)}
                />
              }
              label="Enable data compression"
            />
          </Box>

          <Divider />

          {/* Advanced */}
          <Box>
            <Typography variant="h6" gutterBottom>Advanced</Typography>
            
            <Typography gutterBottom>
              Max retry attempts: {settings.maxRetryAttempts}
            </Typography>
            <Slider
              value={settings.maxRetryAttempts}
              onChange={(e, value) => handleSettingChange('maxRetryAttempts', value)}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' }
              ]}
            />
          </Box>

          {hasChanges && (
            <Alert severity="info">
              Settings are saved automatically.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="secondary">
          Reset to Defaults
        </Button>
        <Button onClick={handleClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
