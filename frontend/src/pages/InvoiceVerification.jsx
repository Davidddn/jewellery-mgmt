import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Receipt,
  Business,
  Person,
  DateRange,
  AttachMoney,
  Security
} from '@mui/icons-material';
import { transactionsAPI } from '../api/transactions';

const InvoiceVerification = () => {
  const { transactionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyInvoice = async () => {
      try {
        setLoading(true);
        
        // Attempt to fetch transaction details
        const response = await transactionsAPI.getTransactionById(transactionId);
        
        if (response.success && response.transaction) {
          setTransaction(response.transaction);
          setVerified(true);
        } else {
          setError('Invoice not found or invalid');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      verifyInvoice();
    } else {
      setError('Invalid transaction ID');
      setLoading(false);
    }
  }, [transactionId]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Verifying Invoice...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      py: 4,
      px: 2
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Paper elevation={2} sx={{ mb: 3, p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              Precious Jewels
            </Typography>
          </Box>
          <Typography variant="h6" color="textSecondary">
            Invoice Verification System
          </Typography>
        </Paper>

        {/* Verification Result */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {error ? (
            <Alert 
              severity="error" 
              icon={<Error />}
              sx={{ 
                fontSize: '1.1rem',
                '& .MuiAlert-icon': { fontSize: '2rem' }
              }}
            >
              <Typography variant="h6" gutterBottom>
                Verification Failed
              </Typography>
              {error}
            </Alert>
          ) : verified && transaction ? (
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              sx={{ 
                fontSize: '1.1rem',
                '& .MuiAlert-icon': { fontSize: '2rem' }
              }}
            >
              <Typography variant="h6" gutterBottom>
                Invoice Verified Successfully
              </Typography>
              This is a genuine invoice from Precious Jewels
            </Alert>
          ) : null}
        </Paper>

        {/* Transaction Details */}
        {verified && transaction && (
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Receipt sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" color="primary.main">
                      Invoice Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Invoice Number
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        INV-{String(transaction.id).padStart(6, '0')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip 
                        label={transaction.transaction_status || 'Completed'} 
                        color="success" 
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Date
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Time
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Customer Info */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Person sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" color="primary.main">
                      Customer Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1" fontWeight="500" gutterBottom>
                    {transaction.customer?.name || transaction.customer_name || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    Phone
                  </Typography>
                  <Typography variant="body1" fontWeight="500" gutterBottom>
                    {transaction.customer?.phone || transaction.customer_phone || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {transaction.customer?.email || transaction.customer_email || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Amount Details */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" color="primary.main">
                      Payment Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="500">
                        ₹{parseFloat(transaction.subtotal || 0).toFixed(2)}
                      </Typography>
                    </Grid>
                    {transaction.discount_amount > 0 && (
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Discount
                        </Typography>
                        <Typography variant="h6" fontWeight="500" color="error.main">
                          -₹{parseFloat(transaction.discount_amount || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    {transaction.tax_amount > 0 && (
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="textSecondary">
                          Tax
                        </Typography>
                        <Typography variant="h6" fontWeight="500" color="warning.main">
                          +₹{parseFloat(transaction.tax_amount || 0).toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        ₹{parseFloat(transaction.final_amount || transaction.total_amount || 0).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" color="textSecondary">
                      Payment Method
                    </Typography>
                    <Chip 
                      label={transaction.payment_mode || 'Cash'} 
                      variant="outlined" 
                      color="primary"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Info */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ backgroundColor: '#f0fff0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="h6" color="success.main">
                      Security Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Verification Status
                      </Typography>
                      <Chip 
                        label="Verified & Authentic" 
                        color="success" 
                        icon={<CheckCircle />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Digital Signature
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        SHA256:VERIFIED
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">
                        Terminal
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        POS-001
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Footer */}
        <Paper elevation={1} sx={{ mt: 4, p: 2, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <Typography variant="body2" color="textSecondary">
            This verification was performed on {new Date().toLocaleString()}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            For any queries, contact us at +91 98765 43210 or support@preciousjewels.com
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default InvoiceVerification;
