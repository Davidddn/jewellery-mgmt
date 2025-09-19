import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Inventory,
  People,
  ShoppingCart,
  Analytics as AnalyticsIcon,
    ShowChart
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';
import { transactionsAPI } from '../api/transactions';
import { productsAPI } from '../api/products';
import { customersAPI } from '../api/customers';

// Utility functions for analytics
const calculateTrend = (data, field) => {
  if (!data || data.length < 2) return 0;
  const recent = data.slice(-7); // Last 7 data points
  const older = data.slice(-14, -7); // Previous 7 data points
  
  const recentAvg = recent.reduce((sum, item) => sum + (item[field] || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, item) => sum + (item[field] || 0), 0) / (older.length || 1);
  
  return olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;
};

const predictFutureValues = (data, field, periodsAhead = 7) => {
  if (!data || data.length < 3) return [];
  
  // Simple linear regression for prediction
  const points = data.map((item, index) => ({ x: index, y: item[field] || 0 }));
  const n = points.length;
  
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const predictions = [];
  for (let i = 1; i <= periodsAhead; i++) {
    const futureX = n + i - 1;
    const predictedY = Math.max(0, slope * futureX + intercept);
    predictions.push({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      [field]: Math.round(predictedY),
      isPrediction: true
    });
  }
  
  return predictions;
};

const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const AdvancedAnalytics = () => {
  // (refreshAnalytics removed; handled in Sales.jsx after sale)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsType, setAnalyticsType] = useState('sales');

  // Data fetching
  const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['advancedSales', timeRange],
    queryFn: () => {
      const params = {
        start_date: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      };
      console.log('Fetching sales analytics with params:', params);
      return reportsAPI.getSalesAnalytics(params);
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000, // 30 seconds
    onError: (error) => {
      console.error('Sales analytics query error:', error);
    },
    onSuccess: (data) => {
      console.log('Sales analytics query success:', data);
    }
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsAPI.getProducts
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersAPI.getCustomers
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsAPI.getTransactions
  });

  // Advanced analytics calculations
  const analyticsData = useMemo(() => {
    console.log('Analytics Data Debug:', { 
      salesData: salesData, 
      salesLoading, 
      salesError,
      productsData: !!productsData, 
      customersData: !!customersData, 
      transactionsData: !!transactionsData 
    });
    
    if (salesError) {
      console.error('Sales data error:', salesError);
    }
    
    // Allow processing even without sales data for now
    if (!productsData || !customersData || !transactionsData) return null;

    const transactions = transactionsData.transactions || transactionsData.data || [];
    const products = productsData.products || productsData.data || [];
    const customers = customersData.customers || customersData.data || [];
    const dailySales = salesData?.report?.dailySales || salesData?.data?.dailySales || [];
    const salesDetails = salesData?.report?.sales || salesData?.data?.sales || [];

    console.log('Sales Data Structure:', { 
      salesData: salesData, 
      hasReport: !!salesData?.report,
      hasData: !!salesData?.data,
      dailySalesLength: dailySales.length,
      dailySalesData: dailySales,
      salesDetailsLength: salesDetails.length 
    });
    console.log('Processed Data:', { 
      transactions: transactions.length, 
      products: products.length, 
      customers: customers.length, 
      dailySales: dailySales.length,
      salesDataExists: !!salesData
    });

    // Sales trend analysis
    const salesTrend = calculateTrend(dailySales, 'total_sales');
    const salesPredictions = predictFutureValues(dailySales, 'total_sales');

    // Product performance analysis with safer data handling
    const productRevenueMap = {};
    const productQuantityMap = {};
    
    // Process transactions to get product performance
    transactions.forEach((transaction) => {
      console.log('Processing transaction:', transaction);
      
      // Check if transaction has items (detailed breakdown)
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          const productId = Number(item.product_id || item.productId);
          const quantity = Number(item.quantity || 1);
          const totalPrice = Number(item.total_price || item.amount || 0);
          
          if (productId && totalPrice > 0) {
            productRevenueMap[productId] = (productRevenueMap[productId] || 0) + totalPrice;
            productQuantityMap[productId] = (productQuantityMap[productId] || 0) + quantity;
            console.log(`Product ${productId}: Added revenue ${totalPrice}, quantity ${quantity}`);
          }
        });
      } else if (transaction.transaction_type === 'sale' && transaction.transaction_status === 'completed') {
        // Fallback: if no items, try to distribute to first product or create mock data
        const amount = Number(transaction.final_amount || transaction.total_amount || transaction.amount || 0);
        if (amount > 0 && products.length > 0) {
          // For demo purposes, assign to first product if no detailed items
          const firstProductId = Number(products[0].id);
          productRevenueMap[firstProductId] = (productRevenueMap[firstProductId] || 0) + amount;
          productQuantityMap[firstProductId] = (productQuantityMap[firstProductId] || 0) + 1;
          console.log(`Fallback: Assigned transaction ${transaction.id} to product ${firstProductId}`);
        }
      }
    });

    // Also process from sales details if available
    salesDetails.forEach((row) => {
      const productId = Number(row.productId || row.product_id);
      if (productId) {
        productRevenueMap[productId] = (productRevenueMap[productId] || 0) + Number(row.totalAmount || 0);
        productQuantityMap[productId] = (productQuantityMap[productId] || 0) + Number(row.totalQuantity || 0);
      }
    });

    const productPerformance = products.map(product => {
      const id = Number(product.id);
      const revenue = productRevenueMap[id] || 0;
      const quantitySold = productQuantityMap[id] || 0;
      const stockQuantity = Number(product.stock_quantity) || Number(product.quantity) || 0;
      const sellingPrice = Number(product.selling_price) || Number(product.price) || 0;
      const costPrice = Number(product.cost_price) || Number(product.cost) || 0;
      
      console.log(`Product ${product.name} (ID: ${id}):`, { 
        revenue, 
        quantitySold, 
        stockQuantity, 
        sellingPrice 
      });
      
      return {
        ...product,
        id,
        revenue,
        quantitySold,
        stock_quantity: stockQuantity,
        profitMargin: sellingPrice - costPrice,
        stockTurnover: stockQuantity > 0 ? quantitySold / stockQuantity : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Customer segmentation with safer data handling
    const customerSegments = customers.map(customer => {
      const customerTransactions = transactions.filter(t => t.customer_id === customer.id || t.customerId === customer.id);
      const totalSpent = customerTransactions.reduce((sum, t) => sum + (Number(t.final_amount) || Number(t.total_amount) || 0), 0);
      const transactionCount = customerTransactions.length;
      const avgOrderValue = transactionCount > 0 ? totalSpent / transactionCount : 0;
      
      let segment = 'New';
      if (totalSpent > 100000) segment = 'VIP';
      else if (totalSpent > 50000) segment = 'Premium';
      else if (totalSpent > 20000) segment = 'Regular';
      
      return {
        ...customer,
        totalSpent,
        transactionCount,
        avgOrderValue,
        segment
      };
    });

    // Inventory insights
    const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= 10);
    const overStockProducts = products.filter(p => (p.stock_quantity || 0) > 100);

    // Prepare chart data with safer handling - fallback to empty data if no sales data
    const actualSales = dailySales && dailySales.length > 0 
      ? dailySales.map(d => ({ 
          date: d.date, 
          actual_sales: d.total_sales || 0,
          predicted_sales: null,
          isPrediction: false 
        }))
      : [];
      
    const predictedSales = salesPredictions && salesPredictions.length > 0
      ? salesPredictions.map(d => ({ 
          date: d.date, 
          actual_sales: null,
          predicted_sales: d.total_sales || 0,
          isPrediction: true 
        }))
      : [];
      
    const dailySalesWithPredictions = [...actualSales, ...predictedSales];

    console.log('Chart Data Debug:', {
      dailySalesCount: dailySales.length,
      actualSalesCount: actualSales.length,
      predictedSalesCount: predictedSales.length,
      combinedCount: dailySalesWithPredictions.length,
      sampleActual: actualSales.slice(0, 2),
      samplePredicted: predictedSales.slice(0, 2)
    });

    // Calculate KPIs with fallback values
    const completedTransactions = transactions.filter(t => t.transaction_type === 'sale' && t.transaction_status === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (Number(t.final_amount) || Number(t.total_amount) || Number(t.amount) || 0), 0);
    const avgOrderValue = completedTransactions.length > 0 ? totalRevenue / completedTransactions.length : 0;
    const inventoryValue = products.reduce((sum, p) => sum + ((Number(p.selling_price) || Number(p.price) || 0) * (Number(p.stock_quantity) || Number(p.quantity) || 0)), 0);

    console.log('KPI Calculations:', { 
      completedTransactions: completedTransactions.length, 
      totalRevenue, 
      avgOrderValue, 
      inventoryValue 
    });

    return {
      salesTrend,
      salesPredictions,
      productPerformance: productPerformance.slice(0, 10),
      customerSegments,
      lowStockProducts,
      overStockProducts,
      dailySalesWithPredictions,
      dailySales,
      kpis: {
        totalRevenue,
        totalProducts: products.length,
        totalCustomers: customers.length,
        avgOrderValue,
        topSellingProduct: productPerformance[0]?.name || 'No Sales',
        inventoryValue
      }
    };
  }, [salesData, productsData, customersData, transactionsData, salesError, salesLoading]);

  if (salesLoading || productsLoading || customersLoading || transactionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try again.
      </Alert>
    );
  }

  const { kpis, salesTrend, productPerformance, customerSegments, dailySalesWithPredictions, dailySales } = analyticsData;

  // Chart colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        mb: 3,
        gap: { xs: 2, md: 1 },
        px: { xs: 2, sm: 3 },
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon color="primary" sx={{ fontSize: { xs: 28, md: 32 } }} />
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Advanced Analytics
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', md: 'auto' }
        }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              size="medium"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="365d">Last Year</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
            <InputLabel>Focus</InputLabel>
            <Select
              value={analyticsType}
              onChange={(e) => setAnalyticsType(e.target.value)}
              label="Focus"
              size="medium"
            >
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="inventory">Inventory</MenuItem>
              <MenuItem value="customers">Customers</MenuItem>
              <MenuItem value="predictions">Predictions</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ px: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '0.9rem', md: '1rem' }, 
                  fontWeight: 600,
                  wordBreak: 'keep-all',
                  lineHeight: 1.2,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {formatCurrency(kpis.totalRevenue || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Revenue
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  {salesTrend > 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                  <Typography 
                    variant="caption" 
                    color={salesTrend > 0 ? 'success.main' : 'error.main'}
                    sx={{ ml: 0.5, fontWeight: 600 }}
                  >
                    {Math.abs(salesTrend || 0).toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <ShoppingCart color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '0.9rem', md: '1rem' }, 
                  fontWeight: 600,
                  wordBreak: 'keep-all',
                  lineHeight: 1.2,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {formatCurrency(kpis.avgOrderValue || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Order Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Inventory color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' }, 
                  fontWeight: 600,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {kpis.totalProducts || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' }, 
                  fontWeight: 600,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {kpis.totalCustomers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={2.4}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <AttachMoney color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ 
                  fontSize: { xs: '0.9rem', md: '1rem' }, 
                  fontWeight: 600,
                  wordBreak: 'keep-all',
                  lineHeight: 1.2,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {formatCurrency(kpis.inventoryValue || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inventory Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <ShowChart color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    fontWeight: 600,
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {kpis.topSellingProduct || 'No Sales'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Top Product
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Charts based on selected analytics type */}
      <Box sx={{ px: { xs: 2, sm: 3 } }}>
        {analyticsType === 'sales' && (
          <Grid container spacing={3}>
            {/* Sales Trend with Predictions */}
            <Grid item xs={12} lg={8}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Sales Trend & Predictions
                  </Typography>
                  <Box sx={{ height: 400, width: '100%' }}>
                    {dailySalesWithPredictions && dailySalesWithPredictions.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailySalesWithPredictions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            fontSize={12}
                            tick={{ fill: '#666' }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
                            fontSize={12}
                            tick={{ fill: '#666' }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(value), name]}
                            labelFormatter={(value) => `Date: ${value}`}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #ccc',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="actual_sales"
                            stroke="#8884d8" 
                            fill="#8884d8"
                            fillOpacity={0.6}
                            name="Actual Sales"
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="predicted_sales"
                            stroke="#ff7300" 
                            fill="#ff7300"
                            fillOpacity={0.3}
                            name="Predicted Sales"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: 'text.secondary',
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        <Typography>No sales data available</Typography>
                        {salesError && (
                          <Typography variant="caption" color="error">
                            Error: {salesError.message}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Debug: Daily Sales: {dailySales?.length || 0}, Combined: {dailySalesWithPredictions?.length || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sales Data Loaded: {salesData ? 'Yes' : 'No'}, Loading: {salesLoading ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Products by Revenue */}
            <Grid item xs={12} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Top Products by Revenue
                  </Typography>
                  <Box sx={{ height: 400, overflow: 'auto' }}>
                    {productPerformance && productPerformance.length > 0 ? (
                      productPerformance.map((product, index) => (
                        <Box key={product.id} sx={{ 
                          mb: 3, 
                          p: 2, 
                          bgcolor: index === 0 ? 'primary.light' : 'grey.50', 
                          borderRadius: 2,
                          border: index === 0 ? '2px solid' : '1px solid',
                          borderColor: index === 0 ? 'primary.main' : 'grey.200'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ 
                                maxWidth: '60%',
                                fontWeight: index === 0 ? 700 : 500,
                                color: index === 0 ? 'primary.contrastText' : 'text.primary'
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: index === 0 ? 'primary.contrastText' : 'primary.main',
                                fontWeight: 600
                              }}
                            >
                              {formatCurrency(product.revenue || 0)}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={productPerformance[0]?.revenue > 0 ? (product.revenue / productPerformance[0].revenue) * 100 : 0}
                            sx={{ 
                              mb: 1, 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: index === 0 ? 'primary.dark' : 'grey.300'
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: index === 0 ? 'primary.contrastText' : 'text.secondary',
                              display: 'block'
                            }}
                          >
                            Qty Sold: {product.quantitySold || 0} | Stock: {product.stock_quantity || 0}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: 'text.secondary' 
                      }}>
                        <Typography>No product data available</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {analyticsType === 'customers' && (
          <Grid container spacing={3}>
          {/* Customer Segmentation */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Customer Segmentation
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          customerSegments.reduce((acc, customer) => {
                            acc[customer.segment] = (acc[customer.segment] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([segment, count]) => ({ segment, count }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ segment, count }) => `${segment}: ${count}`}
                      >
                        {colors.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Value Distribution */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Customer Value Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={customerSegments.slice(0, 20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="transactionCount" 
                        name="Transactions"
                        fontSize={isMobile ? 10 : 12}
                      />
                      <YAxis 
                        dataKey="totalSpent" 
                        name="Total Spent"
                        tickFormatter={formatCurrency}
                        fontSize={isMobile ? 10 : 12}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'totalSpent' ? formatCurrency(value) : value,
                          name === 'totalSpent' ? 'Total Spent' : 'Transactions'
                        ]}
                      />
                      <Scatter dataKey="totalSpent" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {analyticsType === 'inventory' && (
        <Grid container spacing={3}>
          {/* Inventory Health */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Inventory Health Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="error.dark">
                        {analyticsData.lowStockProducts.length}
                      </Typography>
                      <Typography variant="body2">
                        Low Stock Items
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="warning.dark">
                        {analyticsData.overStockProducts.length}
                      </Typography>
                      <Typography variant="body2">
                        Overstock Items
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="h4" color="success.dark">
                        {kpis.totalProducts - analyticsData.lowStockProducts.length - analyticsData.overStockProducts.length}
                      </Typography>
                      <Typography variant="body2">
                        Optimal Stock
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      </Box>
    </Box>
  );
};

export default AdvancedAnalytics;
