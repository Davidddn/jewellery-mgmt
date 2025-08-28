
import React, { useState, useEffect } from 'react';
import {
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress, 
  Alert,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider
} from '@mui/material';
import { TrendingUp, AttachMoney } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goldRateAPI } from '../api/goldRate';

const GoldRate = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
    <Box sx={{ p: isMobile ? 1 : 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 3 
      }}>
        <TrendingUp color="primary" sx={{ fontSize: isMobile ? 28 : 32 }} />
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
          Manage Gold Rate
        </Typography>
      </Box>

      {/* Update Rates Form */}
      <Card 
        elevation={isMobile ? 1 : 2}
        sx={{ 
          mb: 3,
          borderRadius: isMobile ? 2 : 1
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2 
          }}>
            <AttachMoney color="primary" />
            <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Update Gold Rates
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={isMobile ? 2 : 2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="22K Gold Rate (₹/gram)"
                  type="number"
                  value={rate22k}
                  onChange={(e) => setRate22k(e.target.value)}
                  required
                  fullWidth
                  size={isMobile ? "medium" : "medium"}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="18K Gold Rate (₹/gram)"
                  type="number"
                  value={rate18k}
                  onChange={(e) => setRate18k(e.target.value)}
                  required
                  fullWidth
                  size={isMobile ? "medium" : "medium"}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="24K Gold Rate (₹/gram)"
                  type="number"
                  value={rate24k}
                  onChange={(e) => setRate24k(e.target.value)}
                  required
                  fullWidth
                  size={isMobile ? "medium" : "medium"}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={mutation.isLoading}
                  fullWidth={isMobile}
                  size={isMobile ? "large" : "medium"}
                  sx={{ mt: 1 }}
                >
                  {mutation.isLoading ? <CircularProgress size={24} /> : 'Update Gold Rates'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {errorAlert && (
        <Alert 
          severity="error" 
          onClose={() => setErrorAlert('')} 
          sx={{ mb: 3 }}
        >
          {errorAlert}
        </Alert>
      )}

      {/* Current Rates Display */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        mb: 2 
      }}>
        <TrendingUp color="primary" />
        <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
          Current Gold Rates
        </Typography>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {queryError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to fetch gold rates: {queryError.message}
        </Alert>
      )}

      {/* Current Rates Data */}
      {data?.rate && (
        <Card 
          elevation={isMobile ? 1 : 2}
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'success.light',
            border: '1px solid',
            borderColor: 'success.main'
          }}
        >
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    22K Gold
                  </Typography>
                  <Typography variant="h6" color="success.dark" sx={{ fontWeight: 'bold' }}>
                    ₹{data.rate.rate_22k}/g
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    18K Gold
                  </Typography>
                  <Typography variant="h6" color="success.dark" sx={{ fontWeight: 'bold' }}>
                    ₹{data.rate.rate_18k}/g
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    24K Gold
                  </Typography>
                  <Typography variant="h6" color="success.dark" sx={{ fontWeight: 'bold' }}>
                    ₹{data.rate.rate_24k}/g
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: isMobile ? 'left' : 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'medium' }}>
                    {new Date(data.rate.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GoldRate;
