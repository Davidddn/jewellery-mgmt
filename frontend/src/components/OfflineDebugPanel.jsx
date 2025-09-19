// src/components/OfflineDebugPanel.jsx
// Developer tools for offline sync debugging and monitoring

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import {
  Refresh,
  Delete,
  BugReport,
  NetworkCheck,
  Storage,
  Sync
} from '@mui/icons-material';
import { StorageManager } from '../utils/storageManager';
import { BandwidthAwareSync } from '../utils/bandwidthAwareSync';
import { getSyncLogs, clearSyncLogs } from '../utils/syncLogs';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OfflineDebugPanel({ open, onClose, offlineContext }) {
  const [tabValue, setTabValue] = useState(0);
  const [storageInfo, setStorageInfo] = useState({});
  const [networkInfo, setNetworkInfo] = useState({});
  const [syncLogs, setSyncLogs] = useState([]);
  const [forceOffline, setForceOffline] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (open) {
      loadDebugData();
    }
  }, [open]);

  const loadDebugData = async () => {
    // Storage information
    const estimate = await StorageManager.getStorageEstimate();
    const usage = await StorageManager.getUsagePercentage();
    const isPersistent = await StorageManager.isPersistent();
    
    setStorageInfo({ estimate, usage, isPersistent });

    // Network information
    const bandwidth = new BandwidthAwareSync();
    setNetworkInfo({
      connection: bandwidth.getConnectionInfo(),
      quality: bandwidth.getNetworkQuality(),
      strategy: bandwidth.syncStrategy
    });

    // Sync logs
    setSyncLogs(getSyncLogs());
  };

  const handleClearStorage = async () => {
    if (window.confirm('Clear all offline storage? This cannot be undone.')) {
      await StorageManager.cleanupExpiredData(0); // Clear all
      loadDebugData();
    }
  };

  const handleClearLogs = () => {
    clearSyncLogs();
    setSyncLogs([]);
  };

  const simulateNetworkCondition = (condition) => {
    // This would require more complex implementation
    console.log('Simulating network condition:', condition);
  };

  const exportDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      storage: storageInfo,
      network: networkInfo,
      logs: syncLogs,
      pendingActions: offlineContext?.pendingActions || [],
      conflicts: offlineContext?.conflicts || []
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport />
          Offline Debug Panel
          <Chip size="small" label="DEV TOOLS" color="warning" variant="outlined" />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Storage" icon={<Storage />} />
            <Tab label="Network" icon={<NetworkCheck />} />
            <Tab label="Sync Logs" icon={<Sync />} />
            <Tab label="Simulation" icon={<BugReport />} />
          </Tabs>
        </Box>

        {/* Storage Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Storage Information</Typography>
          
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Usage</TableCell>
                  <TableCell>{storageInfo.usage}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Quota</TableCell>
                  <TableCell>{(storageInfo.estimate?.quota / (1024*1024)).toFixed(2)} MB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Used</TableCell>
                  <TableCell>{(storageInfo.estimate?.usage / (1024*1024)).toFixed(2)} MB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Persistent</TableCell>
                  <TableCell>
                    <Chip 
                      label={storageInfo.isPersistent ? 'Yes' : 'No'} 
                      color={storageInfo.isPersistent ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={loadDebugData} startIcon={<Refresh />}>
              Refresh
            </Button>
            <Button 
              onClick={handleClearStorage} 
              startIcon={<Delete />} 
              color="error"
              variant="outlined"
            >
              Clear Storage
            </Button>
          </Box>
        </TabPanel>

        {/* Network Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Network Information</Typography>
          
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Effective Type</TableCell>
                  <TableCell>{networkInfo.connection?.effectiveType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Downlink</TableCell>
                  <TableCell>{networkInfo.connection?.downlink} Mbps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>RTT</TableCell>
                  <TableCell>{networkInfo.connection?.rtt} ms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Save Data</TableCell>
                  <TableCell>
                    <Chip 
                      label={networkInfo.connection?.saveData ? 'Enabled' : 'Disabled'} 
                      color={networkInfo.connection?.saveData ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Quality</TableCell>
                  <TableCell>
                    <Chip 
                      label={networkInfo.quality}
                      color={
                        networkInfo.quality === 'excellent' ? 'success' :
                        networkInfo.quality === 'good' ? 'primary' :
                        networkInfo.quality === 'fair' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>Sync Strategy</Typography>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(networkInfo.strategy, null, 2)}
          </pre>
        </TabPanel>

        {/* Sync Logs Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Sync Logs ({syncLogs.length})</Typography>
            <Button onClick={handleClearLogs} startIcon={<Delete />} size="small">
              Clear Logs
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={log.type} 
                        size="small"
                        color={
                          log.type === 'success' ? 'success' :
                          log.type === 'error' ? 'error' :
                          log.type === 'conflict' ? 'warning' : 'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell>
                      {log.details && (
                        <Typography variant="caption" component="pre">
                          {JSON.stringify(log.details, null, 2)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Simulation Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Network Simulation</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            These tools help test offline behavior and sync strategies.
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={forceOffline}
                  onChange={(e) => setForceOffline(e.target.checked)}
                />
              }
              label="Force Offline Mode"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                />
              }
              label="Enable Debug Logging"
            />
          </Box>

          <Typography variant="subtitle1" gutterBottom>Simulate Network Conditions</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['slow-2g', '2g', '3g', '4g'].map((condition) => (
              <Button
                key={condition}
                variant="outlined"
                size="small"
                onClick={() => simulateNetworkCondition(condition)}
              >
                {condition.toUpperCase()}
              </Button>
            ))}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={exportDebugData}>Export Debug Data</Button>
        <Button onClick={loadDebugData} startIcon={<Refresh />}>Refresh All</Button>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
