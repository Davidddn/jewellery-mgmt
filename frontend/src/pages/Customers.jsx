import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { searchTerm }],
    queryFn: () => customersAPI.getCustomers({ search: searchTerm }),
  });

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const customers = data?.customers || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Customers</Typography>
        <TextField
          label="Search Customers"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </Box>

      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">Failed to fetch customers: {error.message}</Alert>}
      {!isLoading && !error && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Total Spent (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email || 'N/A'}</TableCell>
                  <TableCell>{customer.phone || 'N/A'}</TableCell>
                  <TableCell align="right">{parseFloat(customer.total_spent).toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Customers;
