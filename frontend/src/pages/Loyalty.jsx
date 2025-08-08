import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';
import { loyaltyAPI } from '../api/loyalty';

const Loyalty = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [points, setPoints] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { searchTerm }],
    queryFn: () => customersAPI.getCustomers({ search: searchTerm }),
  });

  const addPointsMutation = useMutation({
    mutationFn: ({ customerId, points }) => loyaltyAPI.addLoyaltyPoints(customerId, points),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setDialogOpen(false);
      setSelectedCustomer(null);
    }
  });

  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleOpenDialog = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    setPoints('');
  };
  const handleAddPoints = () => {
    addPointsMutation.mutate({ customerId: selectedCustomer.id, points: parseInt(points) });
  };

  const customers = data?.customers || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Customer Loyalty</Typography>
      <TextField label="Search Customers" value={searchTerm} onChange={handleSearchChange} fullWidth sx={{ mb: 2 }} />
      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error.message}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Loyalty Points</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell align="right">{customer.loyalty_points}</TableCell>
                <TableCell align="center">
                  <Button size="small" onClick={() => handleOpenDialog(customer)}>Manage Points</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Manage Loyalty Points for {selectedCustomer?.name}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Points to Add/Redeem" type="number" fullWidth value={points} onChange={(e) => setPoints(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddPoints} disabled={addPointsMutation.isLoading}>Add Points</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loyalty;
