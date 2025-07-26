// Create this as a temporary component to test your API
// components/APITest.jsx

import React, { useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import axios from 'axios';

const APITest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      console.log('🧪 Test login response:', response.data);
      setResult(JSON.stringify(response.data, null, 2));
      
      // Test token verification
      if (response.data.token) {
        const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${response.data.token}`
          }
        });
        console.log('🧪 Test verify response:', verifyResponse.data);
      }
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
      setResult(`Error: ${error.response?.data?.message || error.message}`);
    }
    setLoading(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        API Test Component
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testLogin}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Testing...' : 'Test Login API'}
      </Button>
      
      {result && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {result}
          </pre>
        </Alert>
      )}
    </Box>
  );
};

export default APITest;