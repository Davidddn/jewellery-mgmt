
import React, { useState, useEffect } from 'react';
import {
  Typography, Box, TextField, Button, Paper, CircularProgress, Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goldRateAPI } from '../api/goldRate';

const GoldRate = () => {
  const queryClient = useQueryClient();
  const [rate22k, setRate22k] = useState('');
  const [rate18k, setRate18k] = useState('');
  const [rate24k, setRate24k] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['latestGoldRate'],
    queryFn: goldRateAPI.getLatestGoldRate,
  });

  const mutation = useMutation({
    mutationFn: goldRateAPI.createGoldRate,
    onSuccess: () => {
      queryClient.invalidateQueries(['latestGoldRate']);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to update gold rate.'),
  });

  useEffect(() => {
    if (data?.rate) {
      setRate22k(data.rate.rate_22k);
      setRate18k(data.rate.rate_18k);
      setRate24k(data.rate.rate_24k);
    }
  }, [data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({ rate_22k: rate22k, rate_18k: rate18k, rate_24k: rate24k });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Manage Gold Rate</Typography>
      <Paper sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="22K Gold Rate"
            type="number"
            value={rate22k}
            onChange={(e) => setRate22k(e.target.value)}
            required
          />
          <TextField
            label="18K Gold Rate"
            type="number"
            value={rate18k}
            onChange={(e) => setRate18k(e.target.value)}
            required
          />
          <TextField
            label="24K Gold Rate"
            type="number"
            value={rate24k}
            onChange={(e) => setRate24k(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" disabled={mutation.isLoading}>
            {mutation.isLoading ? <CircularProgress size={24} /> : 'Update Rate'}
          </Button>
        </Box>
      </Paper>

      {errorAlert && <Alert severity="error" onClose={() => setErrorAlert('')} sx={{ mt: 2 }}>{errorAlert}</Alert>}

      <Typography variant="h5" sx={{ mt: 4 }}>Current Rates</Typography>
      {isLoading && <CircularProgress />}
      {queryError && <Alert severity="error">Failed to fetch gold rates: {queryError.message}</Alert>}
      {data?.rate && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography>22K: {data.rate.rate_22k}</Typography>
          <Typography>18K: {data.rate.rate_18k}</Typography>
          <Typography>24K: {data.rate.rate_24k}</Typography>
          <Typography>Date: {new Date(data.rate.date).toLocaleDateString()}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default GoldRate;
