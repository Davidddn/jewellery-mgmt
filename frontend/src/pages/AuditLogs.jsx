import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, Grid
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '../api/audit';

const AuditLogs = () => {
  const [filters, setFilters] = useState({ user_id: '', entity: '', action: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: () => auditAPI.getAuditLogs(filters),
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const logs = data?.logs || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Audit Logs</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><TextField fullWidth label="User ID" name="user_id" value={filters.user_id} onChange={handleFilterChange} size="small" /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Entity Type" name="entity" value={filters.entity} onChange={handleFilterChange} size="small" /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Action" name="action" value={filters.action} onChange={handleFilterChange} size="small" /></Grid>
        </Grid>
      </Paper>
      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">Failed to fetch audit logs: {error.message}</Alert>}
      {!isLoading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Entity ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.user?.username || 'System'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.entityId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AuditLogs;
