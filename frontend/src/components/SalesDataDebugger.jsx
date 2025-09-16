import React, { useState } from 'react';
import { reportsAPI } from '../api/reports';
import { Button, Box, Typography, Paper } from '@mui/material';

const SalesDataDebugger = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testSalesAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      };
      console.log('Testing sales analytics API with params:', params);
      const data = await reportsAPI.getSalesAnalytics(params);
      console.log('API Response:', data);
      setResult(data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Sales Data API Debugger</Typography>
      <Button 
        variant="contained" 
        onClick={testSalesAPI} 
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testing...' : 'Test Sales Analytics API'}
      </Button>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}
      
      {result && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>API Result:</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
            {JSON.stringify(result, null, 2)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SalesDataDebugger;
