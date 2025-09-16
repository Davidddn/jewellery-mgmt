// src/components/SyncLogsDialog.jsx
// UI for displaying sync history and logs

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Chip,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Sync,
  Clear,
  Refresh
} from '@mui/icons-material';
import { getSyncLogs, clearSyncLogs } from '../utils/syncLogs';

export default function SyncLogsDialog({ open, onClose }) {
  const [logs, setLogs] = useState([]);

  const loadLogs = () => {
    setLogs(getSyncLogs());
  };

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open]);

  const handleClearLogs = () => {
    clearSyncLogs();
    setLogs([]);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'conflict':
        return <Warning color="warning" />;
      case 'retry':
        return <Sync color="primary" />;
      default:
        return <Sync />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'conflict':
        return 'warning';
      case 'retry':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Sync Logs
          <Box>
            <IconButton onClick={loadLogs} title="Refresh">
              <Refresh />
            </IconButton>
            <IconButton onClick={handleClearLogs} title="Clear logs">
              <Clear />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {logs.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No sync logs available
          </Typography>
        ) : (
          <List>
            {logs.map((log, index) => (
              <React.Fragment key={log.id}>
                <ListItem alignItems="flex-start">
                  <ListItemIcon>
                    {getLogIcon(log.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{log.message}</Typography>
                        <Chip 
                          label={log.type} 
                          size="small" 
                          color={getLogColor(log.type)}
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                        {log.details && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {JSON.stringify(log.details, null, 2)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
