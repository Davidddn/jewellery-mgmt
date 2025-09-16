import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Badge,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh,
  Wifi,
  WifiOff,
  Notifications,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Inventory,
  People,
  Timeline
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';
import { productsAPI } from '../api/products';
import { usersAPI } from '../api/users';
import { NotificationContext } from '../contexts/NotificationContext';

// Simulated WebSocket hook (replace with actual WebSocket implementation)
const useRealTimeData = (endpoint, refetchInterval = 5000) => {
  const [isConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, refetchInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [refetchInterval]);
  
  return { isConnected, lastUpdate };
};

const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const RealTimeDashboard = () => {
  console.log("RealTimeDashboard mounted");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { showSnackbar } = useContext(NotificationContext);
  
  const [realtimeStats, setRealtimeStats] = useState({
    todaysSales: 0,
    todaysTransactions: 0,
    activeUsers: 0,
    lowStockAlerts: 0,
    recentTransactions: []
  });
  const [salesTimelineData, setSalesTimelineData] = useState([]);

  // Real-time connection status
  const { isConnected, lastUpdate } = useRealTimeData('/api/realtime', 10000);

  // Data queries with reasonable caching and refetch intervals
  const { data: transactionData, isLoading: transactionsLoading, error: transactionError } = useQuery({
    queryKey: ['realtime-transaction-stats'],
    queryFn: transactionsAPI.getRealtimeStats,
    refetchInterval: 30000, // Refetch every 30 seconds (not 10 seconds)
    staleTime: 25000, // Consider data stale after 25 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Reduce retry attempts
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  // Update state when transaction data changes
  useEffect(() => {
    console.log('Realtime Transactions API Response:', transactionData);
    if (transactionData?.data) {
      setRealtimeStats(prev => ({
        ...prev,
        todaysSales: transactionData.data.todaysSales || 0,
        todaysTransactions: transactionData.data.todaysTransactions || 0,
        recentTransactions: transactionData.data.recentTransactions || []
      }));
    }
  }, [transactionData]);

  const { data: productData } = useQuery({
    queryKey: ['realtime-product-stats'],
    queryFn: productsAPI.getRealtimeStats,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 55000, // Consider data stale after 55 seconds  
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Update state when product data changes
  useEffect(() => {
    console.log('Realtime Products API Response:', productData);
    if (productData?.data) {
      setRealtimeStats(prev => ({
        ...prev,
        lowStockAlerts: productData.data.lowStockAlerts || 0
      }));
    }
  }, [productData]);

  const { data: userData } = useQuery({
    queryKey: ['realtime-user-stats'],
    queryFn: usersAPI.getActiveUserCount,
    refetchInterval: 120000, // Refetch every 2 minutes
    staleTime: 110000, // Consider data stale after 110 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Update state when user data changes
  useEffect(() => {
    console.log('Realtime Users API Response:', userData);
    if (userData?.data) {
      setRealtimeStats(prev => ({
        ...prev,
        activeUsers: userData.data.activeUsers || 0
      }));
    }
  }, [userData]);

  const { data: salesTimelineApiData } = useQuery({
    queryKey: ['sales-timeline'],
    queryFn: transactionsAPI.getSalesTimeline,
    refetchInterval: 120000, // Refetch every 2 minutes
    staleTime: 110000, // Consider data stale after 110 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false
  });

  // Update state when sales timeline data changes
  useEffect(() => {
    console.log('Sales Timeline API Response:', salesTimelineApiData);
    if (salesTimelineApiData?.data) {
      const formattedData = salesTimelineApiData.data.map(item => ({
        hour: item.hour,
        sales: parseFloat(item.sales) || 0
      }));
      setSalesTimelineData(formattedData);
    }
  }, [salesTimelineApiData]);

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['realtime-transaction-stats'] });
    queryClient.invalidateQueries({ queryKey: ['realtime-product-stats'] });
    queryClient.invalidateQueries({ queryKey: ['realtime-user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['sales-timeline'] });
    showSnackbar('Data refreshed successfully!', 'success');
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        icon: <Wifi color="success" />,
        text: 'Connected',
        color: 'success'
      };
    }
    return {
      icon: <WifiOff color="error" />,
      text: 'Disconnected',
      color: 'error'
    };
  };

  const connectionStatus = getConnectionStatus();

  // Show loading only for initial load, but be more permissive
  const isInitialLoading = transactionsLoading && !transactionData && !transactionError;
  
  // Add debugging
  console.log('Debug - Loading states:', {
    transactionsLoading,
    hasTransactionData: !!transactionData,
    hasTransactionError: !!transactionError,
    transactionErrorMessage: transactionError?.message,
    isInitialLoading,
    realtimeStats
  });

  if (isInitialLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 400, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading real-time dashboard...
        </Typography>
      </Box>
    );
  }
  
  // Show error state if all queries failed
  if (transactionError && !transactionData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 400, gap: 2 }}>
        <Typography variant="h6" color="error">
          Failed to load dashboard data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {transactionError?.message || 'Unknown error occurred'}
        </Typography>
        <button onClick={handleManualRefresh}>Retry</button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      p: 0
    }}>
      {/* Header with real-time status */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        mb: 3,
        px: 0.5,
        py: 1,
        gap: { xs: 2, md: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Timeline color="primary" sx={{ fontSize: { xs: 28, md: 32 } }} />
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
            Real-Time Dashboard
          </Typography>
          <Chip 
            icon={connectionStatus.icon}
            label={connectionStatus.text}
            color={connectionStatus.color}
            variant="outlined"
            size="small"
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleManualRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Real-time KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AttachMoney sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {formatCurrency(realtimeStats.todaysSales)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Today's Sales
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Live
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ShoppingCart sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {realtimeStats.todaysTransactions}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Today's Orders
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <TrendingUp sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  Live
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <People sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {realtimeStats.activeUsers}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Active Users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <Badge variant="dot" color="success">
                  <Typography variant="caption">
                    Online
                  </Typography>
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ 
            background: realtimeStats.lowStockAlerts > 0 
              ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
              : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: realtimeStats.lowStockAlerts > 0 ? 'white' : 'text.primary'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Badge badgeContent={realtimeStats.lowStockAlerts} color="error">
                <Inventory sx={{ fontSize: 32, mb: 1 }} />
              </Badge>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {realtimeStats.lowStockAlerts}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Stock Alerts
              </Typography>
              {realtimeStats.lowStockAlerts > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Notifications sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    Action Required
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Real-time Sales Chart */}
        <Grid item xs={12} lg={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Today's Sales Timeline (Hourly)
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      fontSize={isMobile ? 10 : 12}
                    />
                    <YAxis 
                      tickFormatter={formatCurrency}
                      fontSize={isMobile ? 10 : 12}
                    />
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Sales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Transactions
              </Typography>
              <Box sx={{ 
                height: 300, 
                overflow: 'hidden', // Hide scrollbar
                '&:hover': {
                  overflow: 'auto' // Show scrollbar only on hover
                },
                // Hide scrollbar for webkit browsers
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                // Hide scrollbar for Firefox
                scrollbarWidth: 'none'
              }}>
                {realtimeStats.recentTransactions.length === 0 ? (
                  <Alert severity="info">No recent transactions</Alert>
                ) : (
                  realtimeStats.recentTransactions.map((transaction) => (
                    <Box 
                      key={transaction.id} 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          #{transaction.id}
                        </Typography>
                        <Chip 
                          label={formatCurrency(transaction.final_amount || 0)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Customer: {transaction.customer?.name || 'Walk-in'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label="NEW"
                          color="success"
                          size="small"
                          sx={{ fontSize: '0.625rem' }}
                        />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2 }}
          action={
            <IconButton onClick={handleManualRefresh} color="inherit" size="small">
              <Refresh />
            </IconButton>
          }
        >
          Real-time connection lost. Data may not be current. Click refresh to update manually.
        </Alert>
      )}
    </Box>
  );
};

export default RealTimeDashboard;