import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, TextField, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';
import { Upload as UploadIcon } from '@mui/icons-material';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [errorAlert, setErrorAlert] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { searchTerm }],
    queryFn: () => customersAPI.getCustomers({ search: searchTerm }),
  });

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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
      const result = await customersAPI.uploadCSV(formData);
      setUploadResult(result);
      queryClient.invalidateQueries(['customers']);
    } catch (error) {
      setErrorAlert(error.response?.data?.message || 'Failed to upload CSV.');
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
    }
  };

  const customers = data?.customers || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Customers</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          label="Search Customers"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadDialogOpen(true)}>Upload CSV</Button>
        </Box>
      </Box>

      {errorAlert && <Alert severity="error" onClose={() => setErrorAlert('')} sx={{ mb: 2 }}>{errorAlert}</Alert>}
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

      {/* Upload CSV Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload CSV</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a CSV file to upload. The CSV should have a header row with column names matching the customer fields.
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
          <Typography>Updated: {uploadResult?.updated}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
