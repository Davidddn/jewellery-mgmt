import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Button, Pagination
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, Grid, Card, CardContent, useTheme, useMediaQuery, Chip, Stack
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '../api/audit';


const AuditLogs = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filters, setFilters] = useState({ user_id: '', entityType: '', action: '', page: 1, limit: 20 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditAPI.getAuditLogs(filters),
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (event, value) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const pageSize = data?.pageSize || filters.limit;
  const pageCount = Math.ceil(total / pageSize);

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };
  const handleCloseDetails = () => setDetailsOpen(false);

  // Mobile Card View
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {logs.map((log) => (
        <Grid item xs={12} key={log.id}>
          <Card elevation={1} onClick={() => handleOpenDetails(log)} sx={{ cursor: 'pointer' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {log.user?.username || 'System'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={log.action} size="small" color="primary" variant="outlined" />
                  <Chip label={log.entityType} size="small" color="secondary" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>Entity ID:</strong> {log.entityId}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View
  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Entity</TableCell>
            <TableCell>Entity ID</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} hover onClick={() => handleOpenDetails(log)} style={{ cursor: 'pointer' }}>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              <TableCell>{log.user?.username || 'System'}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.entityType}</TableCell>
              <TableCell>{log.entityId}</TableCell>
              <TableCell>
                {log.details ? (
                  <Button size="small" onClick={e => { e.stopPropagation(); handleOpenDetails(log); }}>View</Button>
                ) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        Audit Logs
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                label="User ID" 
                name="user_id" 
                value={filters.user_id} 
                onChange={handleFilterChange} 
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                label="Entity Type" 
                name="entityType" 
                value={filters.entityType} 
                onChange={handleFilterChange} 
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                label="Action" 
                name="action" 
                value={filters.action} 
                onChange={handleFilterChange} 
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Button variant="outlined" href="/api/audit-logs/export/csv" target="_blank">Export CSV</Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to fetch audit logs: {error.message}
        </Alert>
      )}
      {!isLoading && !error && (
        <>
          {isMobile ? renderMobileView() : renderTableView()}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={pageCount} page={page} onChange={handlePageChange} />
            </Box>
          )}
        </>
      )}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          Audit Log Details
          <IconButton onClick={handleCloseDetails} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Typography variant="subtitle2">Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</Typography>
              <Typography variant="subtitle2">User: {selectedLog.user?.username || 'System'}</Typography>
              <Typography variant="subtitle2">Action: {selectedLog.action}</Typography>
              <Typography variant="subtitle2">Entity: {selectedLog.entityType}</Typography>
              <Typography variant="subtitle2">Entity ID: {selectedLog.entityId}</Typography>
              <Typography variant="subtitle2">IP Address: {selectedLog.ipAddress}</Typography>
              <Typography variant="subtitle2">User Agent: {selectedLog.userAgent}</Typography>
              <Box mt={2}>
                <Typography variant="subtitle2">Details:</Typography>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
