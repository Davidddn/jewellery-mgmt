import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Chip, TextField, IconButton
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';

const getStatusChipColor = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', { searchTerm }],
    queryFn: () => transactionsAPI.getTransactions({ search: searchTerm }),
  });

  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const handleDownloadInvoice = async (transactionId) => {
    try {
      await transactionsAPI.getInvoice(transactionId);
    } catch (err) {
      console.error('Failed to download invoice', err);
      // You could show an error alert here
    }
  };

  const transactions = data?.transactions || [];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Transactions</Typography>
        <TextField label="Search by Customer/ID" variant="outlined" size="small" value={searchTerm} onChange={handleSearchChange} sx={{ minWidth: '250px' }} />
      </Box>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to fetch transactions: {error.message}</Alert>}
        {!isLoading && !error && (
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount (₹)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: 'grey.50' } }}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Chip label={transaction.transaction_status} color={getStatusChipColor(transaction.transaction_status)} size="small" /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>{parseFloat(transaction.final_amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleDownloadInvoice(transaction.id)} color="primary" size="small">
                        <DownloadIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default Transactions;
