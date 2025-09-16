import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery, Card, CardContent, Grid, Chip, Stack
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';
import { loyaltyAPI } from '../api/loyalty';

const Loyalty = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    mutationFn: ({ customerId, points }) => {
      // If points are negative, use redeem function
      if (points < 0) {
        return loyaltyAPI.redeemLoyaltyPoints(customerId, Math.abs(points));
      } else {
        return loyaltyAPI.addLoyaltyPoints(customerId, points);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setDialogOpen(false);
      setSelectedCustomer(null);
      setPoints('');
      // You could add a success notification here if you have a notification system
    },
    onError: (error) => {
      console.error('Error updating loyalty points:', error);
      // You could add an error notification here
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

  // Mobile Card View
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {customers.map((customer) => (
        <Grid item xs={12} key={customer.id}>
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {customer.name}
                  </Typography>
                  <Chip 
                    label={`${customer.loyalty_points} points`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Phone:</strong> {customer.phone}
                </Typography>
                
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => handleOpenDialog(customer)}
                  fullWidth
                >
                  Manage Points
                </Button>
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
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', p: 0.5 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        gutterBottom
        sx={{ mb: { xs: 2, md: 3 } }}
      >
        Customer Loyalty
      </Typography>
      
      <TextField 
        label="Search Customers" 
        value={searchTerm} 
        onChange={handleSearchChange} 
        fullWidth 
        sx={{ mb: 2 }}
        size={isMobile ? "small" : "medium"}
      />
      
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {!isLoading && !error && (
        isMobile ? renderMobileView() : renderTableView()
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Manage Loyalty Points for {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current loyalty points: <strong>{selectedCustomer?.loyalty_points || 0}</strong>
          </Typography>
          <TextField 
            autoFocus 
            margin="dense" 
            label="Points to Add/Redeem" 
            type="number" 
            fullWidth 
            value={points} 
            onChange={(e) => setPoints(e.target.value)}
            size={isMobile ? "small" : "medium"}
            helperText="Enter positive number to add points, negative number to redeem points"
            error={points !== '' && selectedCustomer && Math.abs(parseInt(points)) > selectedCustomer.loyalty_points && parseInt(points) < 0}
          />
          {points !== '' && parseInt(points) < 0 && selectedCustomer && Math.abs(parseInt(points)) > selectedCustomer.loyalty_points && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Cannot redeem more points than available ({selectedCustomer.loyalty_points} points)
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddPoints} 
            disabled={
              addPointsMutation.isLoading || 
              !points || 
              points === '0' ||
              (parseInt(points) < 0 && selectedCustomer && Math.abs(parseInt(points)) > selectedCustomer.loyalty_points)
            }
            variant="contained"
          >
            {addPointsMutation.isLoading ? 'Processing...' : 
             (parseInt(points) < 0 ? 'Redeem Points' : 'Add Points')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loyalty;
