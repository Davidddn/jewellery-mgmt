import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Card, 
  CardContent, // eslint-disable-line no-unused-vars
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  CircularProgress,
  Alert,
  Box,
  Paper,
  Avatar,
  Chip,
  TableContainer,
  useTheme,
  useMediaQuery,
  Skeleton,
  FormControl, // eslint-disable-line no-unused-vars
  InputLabel, // eslint-disable-line no-unused-vars
  Select, // eslint-disable-line no-unused-vars
  MenuItem, // eslint-disable-line no-unused-vars
  TextField,
  InputAdornment,
  IconButton, // eslint-disable-line no-unused-vars
  Autocomplete,
  Button
} from '@mui/material';
import {
  Phone,
  Email,
  Receipt,
  TrendingUp,
  Star,
  CalendarToday,
  Search,
  Refresh
} from '@mui/icons-material';

const CustomerHistory = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Fetch all customers for selection
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await axios.get('/api/customers', { headers });
        if (response.data.success) {
          setCustomers(response.data.customers || []);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchCustomerAndHistory = async () => {
      if (!selectedCustomerId) {
        setCustomer(null);
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch customer details and transaction history in parallel
        const [customerRes, transactionsRes] = await Promise.all([
          axios.get(`/api/customers/${selectedCustomerId}`, { headers }),
          axios.get(`/api/transactions/customer/${selectedCustomerId}`, { headers })
        ]);
        
        // Handle customer data
        if (customerRes.data.success) {
          setCustomer(customerRes.data.customer);
        } else {
          throw new Error(customerRes.data.message || 'Failed to load customer details');
        }
        
        // Handle transactions data
        if (transactionsRes.data.success) {
          setTransactions(transactionsRes.data.transactions || []);
        } else {
          throw new Error(transactionsRes.data.message || 'Failed to load transactions');
        }
      } catch (err) {
        console.error('Error fetching customer history:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerAndHistory();
  }, [selectedCustomerId]);

  const handleCustomerChange = (event, newValue) => {
    const customerId = newValue ? newValue.id : '';
    setSelectedCustomerId(customerId);
    // Update URL without page reload
    if (customerId) {
      navigate(`/customer-history/${customerId}`, { replace: true });
    } else {
      navigate('/customer-history', { replace: true });
    }
  };

  const handleRefresh = () => {
    if (selectedCustomerId) {
      // Force refresh by temporarily clearing and resetting
      const currentCustomerId = selectedCustomerId;
      setSelectedCustomerId('');
      setTimeout(() => setSelectedCustomerId(currentCustomerId), 100);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'bank_transfer': return '🏦';
      default: return '💰';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', p: 1 }}>
      {/* Customer Selection Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Customer Transaction History
          </Typography>
          {selectedCustomerId && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Autocomplete
            value={customers.find(c => c.id === selectedCustomerId) || null}
            onChange={handleCustomerChange}
            options={customers}
            getOptionLabel={(option) => option ? `${option.name} (${option.phone || 'No phone'})` : ''}
            loading={loadingCustomers}
            sx={{ minWidth: 300, flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Customer"
                placeholder="Search by name or phone..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {loadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                  {option.name?.charAt(0)?.toUpperCase() || 'C'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {option.phone || 'No phone'} • {option.email || 'No email'}
                  </Typography>
                </Box>
              </Box>
            )}
            noOptionsText="No customers found"
            clearOnEscape
          />
        </Box>
        
        {!selectedCustomerId && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Please select a customer to view their transaction history.
          </Alert>
        )}
      </Paper>

      {!selectedCustomerId ? null : loading ? (
        <Box sx={{ p: 3 }}>
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Skeleton variant="circular" width={80} height={80} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="30%" height={20} />
              </Box>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Skeleton variant="text" width="30%" height={32} />
            <Box sx={{ mt: 2 }}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, py: 2 }}>
                  <Skeleton variant="text" width="20%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="15%" />
                  <Skeleton variant="text" width="10%" />
                  <Skeleton variant="text" width="15%" />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      ) : error ? (
        <Box sx={{ p: 3 }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 3,
              '& .MuiAlert-message': {
                fontSize: '1rem'
              }
            }}
          >
            {error}
          </Alert>
        </Box>
      ) : (
        <>
          {/* Customer Info Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            {customer?.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {customer?.name || 'Customer'}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2, 
              alignItems: 'center',
              mb: 1
            }}>
              {customer?.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {customer.phone}
                  </Typography>
                </Box>
              )}
              {customer?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {customer.email}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Customer Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2
        }}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {customer?.total_spent ? formatCurrency(customer.total_spent) : '₹0'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Spent
            </Typography>
          </Card>
          
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Receipt sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {transactions.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Transactions
            </Typography>
          </Card>
          
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Star sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {customer?.loyalty_points || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Loyalty Points
            </Typography>
          </Card>
          
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <CalendarToday sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              {customer?.createdAt ? formatDate(customer.createdAt) : 'N/A'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Member Since
            </Typography>
          </Card>
        </Box>
      </Paper>
      
      {/* Transaction History */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Transaction History
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {transactions.length === 0 
              ? 'No transactions found' 
              : `${transactions.length} ${transactions.length === 1 ? 'transaction' : 'transactions'} found`
            }
          </Typography>
        </Box>

        {transactions.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No purchase history found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {customer ? `${customer.name} hasn't made any purchases yet.` : 'This customer has no transaction history.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>}
                  <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover' 
                      },
                      '&:last-child td': {
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        #{transaction.id}
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.items?.length || 0} item{transaction.items?.length !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getPaymentMethodIcon(transaction.payment_method)}</span>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {transaction.payment_method?.replace('_', ' ') || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.transaction_status || 'Unknown'}
                        color={getStatusColor(transaction.transaction_status)}
                        size="small"
                        sx={{ 
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={600}>
                        {formatCurrency(transaction.final_amount || 0)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
        </>
      )}
    </Box>
  );
};

export default CustomerHistory;
