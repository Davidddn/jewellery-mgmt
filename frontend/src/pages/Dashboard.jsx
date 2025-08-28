import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Alert, List, ListItem, ListItemText, Avatar, Divider, TextField, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Paper, LinearProgress, Badge, IconButton, Collapse, AlertTitle, ListItemIcon, useTheme, useMediaQuery
} from '@mui/material';
import { 
  Inventory, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Group, 
  VerifiedUser, 
  Loyalty as LoyaltyIcon, 
  Warning, 
  ExpandMore, 
  ExpandLess, 
  Refresh,
  AttachMoney,
  People,
  ShoppingCart
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';
import { goldRateAPI } from '../api/goldRate';
import { hallmarkingAPI } from '../api/hallmarking';
import { productsAPI } from '../api/products';
import { transactionsAPI } from '../api/transactions';
import { useAuth } from '../contexts/useAuth';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Responsive helpers must be inside components
// StatCard Component
const StatCard = ({ title, value, icon, color, isCurrency = false }) => (
  <Card sx={{ height: '100%', boxShadow: 2 }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" gutterBottom>{title}</Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {isCurrency ? `₹${Number(value).toLocaleString('en-IN')}` : value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

// Update Rates Dialog Component
const UpdateRatesDialog = ({ open, onClose, rates }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const queryClient = useQueryClient();
    const [purity, setPurity] = useState('24K');
    const [rate, setRate] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && rates?.[purity]) {
            setRate(rates[purity].rate);
            setError('');
        }
    }, [purity, rates, open]);

    const updateRatesMutation = useMutation({
        mutationFn: goldRateAPI.updateGoldRates,
        onSuccess: () => {
            queryClient.invalidateQueries(['goldRate']);
            onClose();
        },
        onError: (err) => {
            setError(err.message || 'Failed to update rates');
        }
    });

    const handleUpdate = () => {
        if (!rate || isNaN(parseFloat(rate))) {
            setError('Please enter a valid rate');
            return;
        }
        
        if (parseFloat(rate) <= 0) {
            setError('Rate must be greater than 0');
            return;
        }

        updateRatesMutation.mutate({ 
            rates: [{ purity, rate: parseFloat(rate) }] 
        });
    };

    return (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile} disableRestoreFocus={false} disableEnforceFocus={false}>
            <DialogTitle>Update Gold Rates</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                    <InputLabel>Purity</InputLabel>
                    <Select 
                        value={purity} 
                        label="Purity" 
                        onChange={(e) => setPurity(e.target.value)}
                    >
                        <MenuItem value="24K">24K</MenuItem>
                        <MenuItem value="22K">22K</MenuItem>
                        <MenuItem value="18K">18K</MenuItem>
                    </Select>
                </FormControl>
                <TextField 
                    label="New Rate" 
                    value={rate} 
                    onChange={(e) => {
                        setRate(e.target.value);
                        setError('');
                    }} 
                    type="number"
                    fullWidth
                    error={!!error}
                    helperText={error}
                    InputProps={{
                        inputProps: { min: 0 }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleUpdate} 
                    variant="contained"
                    disabled={updateRatesMutation.isPending}
                >
                    {updateRatesMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// GoldRatesComparison Dialog Component
const GoldRatesComparison = ({ open, onClose, liveRates, manualRates }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const purities = ['24K', '22K', '18K'];

    const formatRate = (rate) => {
        if (!rate) return 'N/A';
        return `₹${Number(rate).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        })}`;
    };

    return (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile} disableRestoreFocus={false} disableEnforceFocus={false}>
            <DialogTitle>Compare Gold Rates</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                            Live Rates
                        </Typography>
                        <Card variant="outlined">
                            <CardContent>
                                <List dense>
                                    {purities.map((purity) => (
                                        <ListItem key={purity} disableGutters>
                                            <ListItemText primary={`${purity} Gold`} />
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formatRate(liveRates?.[purity]?.rate)}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                            Manual Rates
                        </Typography>
                        <Card variant="outlined">
                            <CardContent>
                                <List dense>
                                    {purities.map((purity) => (
                                        <ListItem key={purity} disableGutters>
                                            <ListItemText primary={`${purity} Gold`} />
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formatRate(manualRates?.[purity]?.rate)}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// GoldRateCard with Manual Input as Popup
const GoldRateCard = ({ goldData, isLoading, error }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
    
    const rates = goldData?.rates;

    const resetRatesMutation = useMutation({
        mutationFn: goldRateAPI.resetGoldRates,
        onSuccess: (data) => {
            console.log("Reset successful:", data);
            queryClient.invalidateQueries(['goldRate']);
        },
        onError: (err) => {
            console.error("Failed to reset rates:", err);
        }
    });

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Today's Gold Rate (per 10g)</Typography>
                    {rates?.source === 'manual' && (
                        <Chip label="Manual Override" color="primary" />
                    )}
                </Box>
                {isLoading && <CircularProgress size={24} />}
                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                {rates && (
                  <List dense>
                    <ListItem disableGutters>
                      <ListItemText primary="24K Gold" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {rates['24K']?.source === 'live-api' && (
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                          }} />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {rates['24K']?.rate 
                            ? `₹${Number(rates['24K'].rate).toLocaleString('en-IN', {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2
                              })}` 
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                    <ListItem disableGutters>
                      <ListItemText primary="22K Gold" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {rates['22K']?.source === 'live-api' && (
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                          }} />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {rates['22K']?.rate 
                            ? `₹${Number(rates['22K'].rate).toLocaleString('en-IN', {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2
                              })}` 
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                    <ListItem disableGutters>
                      <ListItemText primary="18K Gold" />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {rates['18K']?.source === 'live-api' && (
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                          }} />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {rates['18K']?.rate 
                            ? `₹${Number(rates['18K'].rate).toLocaleString('en-IN', {
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 2
                              })}` 
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </ListItem>
                  </List>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {user?.role === 'admin' && (
                        <Button 
                            variant="contained" 
                            onClick={() => setUpdateDialogOpen(true)}
                        >
                            Manually Update Rates
                        </Button>
                    )}
                    <Button 
                        variant="outlined" 
                        onClick={() => setComparisonDialogOpen(true)}
                    >
                        Compare Rates
                    </Button>
                    {user?.role === 'admin' && (
                        <Button 
                            variant="outlined" 
                            color="secondary"
                            onClick={() => resetRatesMutation.mutate()}
                            disabled={resetRatesMutation.isPending}
                        >
                            {resetRatesMutation.isPending ? 'Resetting...' : 'Reset to Live Rates'}
                        </Button>
                    )}
                </Box>
            </CardContent>

            <UpdateRatesDialog 
                open={updateDialogOpen} 
                onClose={() => setUpdateDialogOpen(false)} 
                rates={rates} 
            />

            <GoldRatesComparison
                open={comparisonDialogOpen}
                onClose={() => setComparisonDialogOpen(false)}
                liveRates={goldData?.liveApiRates}
                manualRates={goldData?.manualDbRates}
            />
        </Card>
    );
};

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedSections, setExpandedSections] = React.useState({
    analytics: !isMobile,
    recent: !isMobile,
    alerts: true // Always show alerts expanded
  });


  // Queries with debug logging
  const { data: dashboardData, isLoading, error, refetch: refetchDashboard } = useQuery({
    queryKey: ['dailySales'],
    queryFn: () => reportsAPI.getDailySales(new Date().toISOString().split('T')[0]),
    onSuccess: (data) => {
      console.log('Dashboard API Response:', data);
    },
    onError: (err) => {
      console.error('Dashboard API Error:', err);
    }
  });

  const { data: goldData, isLoading: isGoldLoading, error: goldError } = useQuery({
    queryKey: ['goldRate'],
    queryFn: goldRateAPI.getLatestGoldRate,
    onSuccess: (data) => {
      console.log('Gold Rate API Response:', data);
    },
    onError: (err) => {
      console.error('Gold Rate API Error:', err);
    }
  });

  const { isLoading: isHallmarkingLoading } = useQuery({
    queryKey: ['allHallmarking'],
    queryFn: hallmarkingAPI.getHallmarking,
    onError: (err) => {
      console.error('Hallmarking API Error:', err);
    }
  });

  const { data: lowStockProducts, isLoading: loadingLowStock } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: () => productsAPI.getLowStockProducts?.(10) || Promise.resolve({ products: [] }),
    refetchInterval: 30000,
    retry: 1,
    onError: (err) => {
      console.error('Low Stock Products API Error:', err);
    }
  });

  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionsAPI.getRecentTransactions?.(5) || Promise.resolve({ transactions: [] }),
    refetchInterval: 10000,
    retry: 1,
    onError: (err) => {
      console.error('Recent Transactions API Error:', err);
    }
  });

  const { data: salesAnalyticsRaw } = useQuery({
    queryKey: ['sales-analytics'],
    queryFn: () => reportsAPI.getSalesAnalytics(),
    retry: 1,
    onSuccess: (data) => {
      console.log('Sales Analytics API Response:', data);
    },
    onError: (err) => {
      console.error('Sales Analytics API Error:', err);
    }
  });

  // Transform backend response to Chart.js format
  const salesAnalytics = React.useMemo(() => {
    const dailySales = salesAnalyticsRaw?.report?.dailySales || [];
    if (!Array.isArray(dailySales) || dailySales.length === 0) {
      return { labels: [], datasets: [] };
    }
    return {
      labels: dailySales.map((d) => d.date),
      datasets: [
        {
          label: 'Total Sales',
          data: dailySales.map((d) => d.total_sales),
          fill: false,
          borderColor: '#1976d2',
          backgroundColor: '#1976d2',
          tension: 0.3,
        },
      ],
    };
  }, [salesAnalyticsRaw]);

  const { data: inventoryAnalytics } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: () => reportsAPI.getInventoryAnalytics?.() || Promise.resolve({ data: null }),
    retry: 1,
    onSuccess: (data) => {
      console.log('Inventory Analytics API Response:', data);
    },
    onError: (err) => {
      console.error('Inventory Analytics API Error:', err);
    }
  });

  if (isLoading || isHallmarkingLoading) {
    return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard data: {error.message}</Alert>;
  }

  // Fallback data
  const stats = dashboardData?.data || {
    todaySales: 0,
    todayTransactions: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRefresh = () => {
    refetchDashboard();
  };

  // Stat cards data
  const statCards = [
    {
      title: 'Today\'s Sales',
      value: `₹${Number(stats.todaySales || 0).toLocaleString('en-IN')}`,
      icon: <AttachMoney />,
      color: 'success',
      trend: stats.salesGrowth || 0,
    },
    {
      title: 'Transactions',
      value: stats.todayTransactions || 0,
      icon: <Receipt />,
      color: 'info',
      trend: stats.transactionGrowth || 0,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers || 0,
      icon: <People />,
      color: 'primary',
      trend: stats.customerGrowth || 0,
    },
    {
      title: 'Products',
      value: stats.totalProducts || 0,
      icon: <ShoppingCart />,
      color: 'warning',
      trend: stats.productGrowth || 0,
    },
  ];

  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: { xs: 1, sm: 0 }
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
        >
          Dashboard
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card 
              elevation={isMobile ? 1 : 2}
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {card.title}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      fontWeight="bold"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                    >
                      {card.value}
                    </Typography>
                    {card.trend !== 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {card.trend > 0 ? (
                          <TrendingUp color="success" sx={{ fontSize: '1rem' }} />
                        ) : (
                          <TrendingDown color="error" sx={{ fontSize: '1rem' }} />
                        )}
                        <Typography 
                          variant="caption" 
                          color={card.trend > 0 ? 'success.main' : 'error.main'}
                          sx={{ ml: 0.5, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                        >
                          {Math.abs(card.trend)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box 
                    sx={{ 
                      color: `${card.color}.main`,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gold Rate Card */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <GoldRateCard 
            goldData={goldData} 
            isLoading={isGoldLoading} 
            error={goldError?.message} 
          />
        </Grid>
      </Grid>

      {/* Low Stock Alerts */}
      <Paper 
        elevation={isMobile ? 1 : 2} 
        sx={{ mb: 3, overflow: 'hidden' }}
      >
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: isMobile ? 'pointer' : 'default'
        }}
        onClick={isMobile ? () => toggleSection('alerts') : undefined}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            <Typography variant="h6" fontWeight="600">
              Stock Alerts
            </Typography>
            {lowStockProducts?.products?.length > 0 && (
              <Chip 
                label={lowStockProducts.products.length} 
                color="warning" 
                size="small" 
              />
            )}
          </Box>
          {isMobile && (
            <IconButton size="small">
              {expandedSections.alerts ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
        
        <Collapse in={expandedSections.alerts}>
          <Divider />
          <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
            {loadingLowStock ? (
              <LinearProgress />
            ) : lowStockProducts?.products?.length > 0 ? (
              <List dense={isMobile}>
                {lowStockProducts.products.slice(0, isMobile ? 3 : 5).map((product, index) => (
                  <ListItem 
                    key={product.id} 
                    divider={index < (isMobile ? 2 : 4)}
                    sx={{ px: { xs: 0, sm: 1 } }}
                  >
                    <ListItemIcon>
                      <Inventory color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={product.name}
                      secondary={
                        <span>
                          <Typography variant="caption" color="text.secondary" component="span">
                            Stock: {product.stock_quantity} | SKU: {product.sku}
                          </Typography>
                          <Box component="span" sx={{ display: 'block' }}>
                            <LinearProgress
                              variant="determinate"
                              value={(product.stock_quantity / 50) * 100}
                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                              color={product.stock_quantity <= 5 ? 'error' : 'warning'}
                            />
                          </Box>
                        </span>
                      }
                    />
                    <Chip
                      label={`${product.stock_quantity} left`}
                      color={product.stock_quantity <= 5 ? 'error' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success">
                <AlertTitle>All Stock Levels Good</AlertTitle>
                No products are currently running low on stock.
              </Alert>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Charts and Recent Activity */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Sales Analytics Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={isMobile ? 1 : 2} sx={{ overflow: 'hidden' }}>
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: isMobile ? 'pointer' : 'default'
            }}
            onClick={isMobile ? () => toggleSection('analytics') : undefined}
            >
              <Typography variant="h6" fontWeight="600">
                Sales Analytics
              </Typography>
              {isMobile && (
                <IconButton size="small">
                  {expandedSections.analytics ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
            
            <Collapse in={expandedSections.analytics}>
              <Divider />
              <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
                <Box sx={{ height: { xs: 250, sm: 300, md: 350 } }}>
                  <Line
                    data={salesAnalytics}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: !isMobile,
                          position: 'top',
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              return '₹' + value.toLocaleString('en-IN');
                            },
                            font: {
                              size: isMobile ? 10 : 12,
                            },
                          },
                        },
                        x: {
                          ticks: {
                            font: {
                              size: isMobile ? 10 : 12,
                            },
                          },
                        },
                      },
                      elements: {
                        point: {
                          radius: isMobile ? 2 : 3,
                        },
                      },
                    }}
                  />
                  {(!salesAnalytics?.data || !Array.isArray(salesAnalytics.data.datasets) || salesAnalytics.data.datasets.length === 0) && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <AlertTitle>No Sales Data</AlertTitle>
                      Sales analytics will appear here once you have transaction data.
                    </Alert>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Paper>
        </Grid>

        {/* Inventory Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={isMobile ? 1 : 2} sx={{ height: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                Inventory
              </Typography>
              <Box sx={{ height: { xs: 200, sm: 250, lg: 280 } }}>
                <Doughnut
                  data={
                    inventoryAnalytics?.data && Array.isArray(inventoryAnalytics.data.datasets)
                      ? inventoryAnalytics.data
                      : { labels: [], datasets: [] }
                  }
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: isMobile ? 'bottom' : 'right',
                        labels: {
                          boxWidth: isMobile ? 12 : 15,
                          font: {
                            size: isMobile ? 10 : 12,
                          },
                        },
                      },
                    },
                  }}
                />
                {(!inventoryAnalytics?.data || !Array.isArray(inventoryAnalytics.data.datasets) || inventoryAnalytics.data.datasets.length === 0) && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <AlertTitle>No Inventory Data</AlertTitle>
                    Add products to see inventory distribution.
                  </Alert>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper elevation={isMobile ? 1 : 2} sx={{ overflow: 'hidden' }}>
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: isMobile ? 'pointer' : 'default'
            }}
            onClick={isMobile ? () => toggleSection('recent') : undefined}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Recent Transactions
                </Typography>
                {recentTransactions?.transactions?.length > 0 && (
                  <Badge 
                    badgeContent={recentTransactions.transactions.length} 
                    color="primary" 
                  />
                )}
              </Box>
              {isMobile && (
                <IconButton size="small">
                  {expandedSections.recent ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </Box>
            
            <Collapse in={expandedSections.recent}>
              <Divider />
              <Box sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
                {loadingTransactions ? (
                  <LinearProgress />
                ) : recentTransactions?.transactions?.length > 0 ? (
                  <List dense={isMobile}>
                    {recentTransactions.transactions.map((transaction, index) => (
                      <ListItem 
                        key={transaction.id} 
                        divider={index < recentTransactions.transactions.length - 1}
                        sx={{ 
                          px: { xs: 0, sm: 1 },
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <span>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                flexDirection: { xs: 'column', sm: 'row' },
                                width: '100%'
                              }}>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="500"
                                  component="span"
                                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                >
                                  Transaction #{transaction.id}
                                </Typography>
                                <Chip
                                  label={`₹${Number(transaction.total_amount || 0).toLocaleString('en-IN')}`}
                                  color="success"
                                  size={isMobile ? "small" : "medium"}
                                  sx={{ mt: { xs: 0.5, sm: 0 } }}
                                />
                              </Box>
                            </span>
                          }
                          secondary={
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              component="span"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                              {new Date(transaction.createdAt).toLocaleString()} | 
                              Customer: {transaction.customer_name || 'Walk-in'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    <AlertTitle>No Recent Transactions</AlertTitle>
                    Recent transaction activity will appear here.
                  </Alert>
                )}
              </Box>
            </Collapse>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;