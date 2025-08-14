import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Chip, TextField, IconButton, Menu, MenuItem, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [downloadingId, setDownloadingId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For the download menu
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const queryClient = useQueryClient();
  const [errorAlert, setErrorAlert] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', { searchTerm }],
    queryFn: () => transactionsAPI.getTransactions({ search: searchTerm }),
  });

  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const handleDownloadMenuClick = (event, transactionId) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransactionId(transactionId);
  };

  const handleDownloadMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransactionId(null);
  };

  const handleDownloadInvoice = async (format) => {
    if (!selectedTransactionId) return;

    setDownloadingId(selectedTransactionId);
    handleDownloadMenuClose(); // Close menu immediately

    try {
      const response = await transactionsAPI.getInvoice(selectedTransactionId, format);
      if (format === 'pdf') {
        if (response.pdf_data) {
          const binaryString = atob(response.pdf_data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = `Invoice-${selectedTransactionId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(fileURL);
        } else {
            console.error('Failed to download invoice: No PDF data in response');
            alert('Could not download invoice. Please try again.');
        }
      } else if (format === 'csv') {
          const fileURL = URL.createObjectURL(response.data);
          const link = document.createElement('a');
          link.href = fileURL;
          link.download = `Invoice-${selectedTransactionId}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(fileURL);
      } else {
          console.error('Failed to download invoice: Unsupported format');
          alert('Could not download invoice. Please try again.');
      }
    } catch (err) {
      console.error('Failed to download invoice from API:', err);
      alert('An error occurred while downloading the invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorAlert('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csv', selectedFile);

    try {
      const result = await transactionsAPI.uploadCSV(formData);
      setUploadResult(result);
      queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      setErrorAlert(error.response?.data?.message || 'Failed to upload CSV.');
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
    }
  };

  const transactions = data?.transactions || [];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, width: '100%', maxWidth: '1200px' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Transactions</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField 
          label="Search by Customer/ID" 
          variant="outlined" 
          size="small" 
          value={searchTerm} 
          onChange={handleSearchChange} 
          sx={{ minWidth: '250px' }} 
        />
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadDialogOpen(true)}>Upload CSV</Button>
        </Box>
      </Box>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        {errorAlert && <Alert severity="error" onClose={() => setErrorAlert('')} sx={{ mb: 2 }}>{errorAlert}</Alert>}
        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to fetch transactions: {error.message}</Alert>}
        {!isLoading && !error && (
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount (₹)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: (theme) => theme.palette.action.hover } }}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>{new Date(transaction.createdAt || transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.transaction_status || 'completed'} 
                          color={getStatusChipColor(transaction.transaction_status || 'completed')} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {parseFloat(transaction.final_amount || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={(event) => handleDownloadMenuClick(event, transaction.id)} 
                          color="primary" 
                          size="small"
                          disabled={downloadingId === transaction.id}
                        >
                          {downloadingId === transaction.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DownloadIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDownloadMenuClose}
      >
        <MenuItem onClick={() => handleDownloadInvoice('pdf')}>Download PDF</MenuItem>
        <MenuItem onClick={() => handleDownloadInvoice('csv')}>Download CSV</MenuItem>
      </Menu>

      {/* Upload CSV Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload CSV</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a CSV file to upload. The CSV should have a header row with the following columns: customer_phone, product_sku, quantity, payment_mode.
          </DialogContentText>
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            Select File
            <input type="file" hidden accept=".csv" onChange={handleFileChange} />
          </Button>
          {selectedFile && <Typography sx={{ mt: 2 }}>{selectedFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Result Dialog */}
      <Dialog open={!!uploadResult} onClose={() => setUploadResult(null)}>
        <DialogTitle>Upload Result</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {uploadResult?.message}
          </DialogContentText>
          <Typography>Created: {uploadResult?.created}</Typography>
          <Typography>Errors: {uploadResult?.errors}</Typography>
          {uploadResult?.errorList && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">Error Details:</Typography>
              <Paper sx={{ p: 1, mt: 1, maxHeight: 150, overflow: 'auto' }}>
                {uploadResult.errorList.map((error, index) => (
                  <Typography key={index} variant="caption">{error}</Typography>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;
