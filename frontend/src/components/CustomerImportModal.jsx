import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';
import { UploadFile } from '@mui/icons-material';

const CustomerImportModal = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: customersAPI.importCustomers,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'An error occurred during import.');
    }
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a valid .csv or .xlsx file.');
        setFile(null);
      }
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>Import Customers</DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
            border: '2px dashed grey',
            borderRadius: 2,
            bgcolor: 'background.default'
          }}
        >
          <UploadFile sx={{ fontSize: 48, color: 'text.secondary' }} />
          <Typography variant="h6" gutterBottom>
            Click to upload or drag and drop
          </Typography>
          <Typography variant="body2" color="text.secondary">
            XLSX or CSV file
          </Typography>
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Select File
            <input type="file" hidden onChange={handleFileChange} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
          </Button>
          {file && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {mutation.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Customers imported successfully!</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!file || mutation.isPending}>
          {mutation.isPending ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerImportModal;
