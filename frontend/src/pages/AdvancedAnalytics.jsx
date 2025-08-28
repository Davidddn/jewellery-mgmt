import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
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
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  Scatter,
  ReferenceLine
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
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['advancedSales', timeRange],
    queryFn: () => reportsAPI.getSalesAnalytics({ 
      type: 'date_range',
      start_date: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    })
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
    if (!salesData || !productsData || !customersData || !transactionsData) return null;

    const transactions = transactionsData.transactions || [];
    const products = productsData.products || [];
    const customers = customersData.customers || [];
    const dailySales = salesData.report?.dailySales || [];
    const salesDetails = salesData.report?.sales || [];

    // Sales trend analysis
    const salesTrend = calculateTrend(dailySales, 'total_sales');
    const salesPredictions = predictFutureValues(dailySales, 'total_sales');

    // Product performance analysis (use backend salesDetails for accuracy)
    const productRevenueMap = {};
    const productQuantityMap = {};
    salesDetails.forEach((row) => {
      // Ensure productId is a number for mapping
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
      return {
        ...product,
        revenue,
        quantitySold,
        profitMargin: product.selling_price - (product.cost_price || 0),
        stockTurnover: product.stock_quantity > 0 ? quantitySold / product.stock_quantity : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Customer segmentation
    const customerSegments = customers.map(customer => {
      const customerTransactions = transactions.filter(t => t.customer_id === customer.id);
      const totalSpent = customerTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);
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
    const lowStockProducts = products.filter(p => p.stock_quantity <= 10);
    const overStockProducts = products.filter(p => p.stock_quantity > 100);

    // Prepare separate series for actual and predicted sales
    const actualSales = dailySales.map(d => ({ ...d, isPrediction: false }));
    const predictedSales = salesPredictions.map(d => ({ ...d, isPrediction: true }));
    // For chart x-axis continuity, merge for x-axis but use separate series for Area
    const dailySalesWithPredictions = [
      ...actualSales,
      ...predictedSales
    ];

    return {
      salesTrend,
      salesPredictions,
      productPerformance: productPerformance.slice(0, 10),
      customerSegments,
      lowStockProducts,
      overStockProducts,
      dailySalesWithPredictions,
      kpis: {
        totalRevenue: transactions.reduce((sum, t) => sum + (t.final_amount || 0), 0),
        totalProducts: products.length,
        totalCustomers: customers.length,
        avgOrderValue: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + (t.final_amount || 0), 0) / transactions.length : 0,
        topSellingProduct: productPerformance[0]?.name || 'N/A',
        inventoryValue: products.reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0)
      }
    };
  }, [salesData, productsData, customersData, transactionsData]);

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

  const { kpis, salesTrend, productPerformance, customerSegments, dailySalesWithPredictions } = analyticsData;

  // Chart colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        mb: 3,
        gap: { xs: 2, md: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon color="primary" sx={{ fontSize: { xs: 28, md: 32 } }} />
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
            Advanced Analytics
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', md: 'auto' }
        }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              size={isMobile ? "medium" : "medium"}
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
              size={isMobile ? "medium" : "medium"}
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AttachMoney color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {formatCurrency(kpis.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                {salesTrend > 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                <Typography 
                  variant="caption" 
                  color={salesTrend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(salesTrend).toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ShoppingCart color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {formatCurrency(kpis.avgOrderValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Order Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Inventory color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {kpis.totalProducts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <People color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {kpis.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AttachMoney color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                {formatCurrency(kpis.inventoryValue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inventory Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ShowChart color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <ShowChart color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                {kpis.topSellingProduct}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Top Product
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts based on selected analytics type */}
      {analyticsType === 'sales' && (
        <Grid container spacing={3}>
          {/* Sales Trend with Predictions */}
          <Grid item xs={12} lg={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Sales Trend & Predictions
                </Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySalesWithPredictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={isMobile ? 10 : 12}
                      />
                      <YAxis 
                        tickFormatter={formatCurrency}
                        fontSize={isMobile ? 10 : 12}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      {/* Actual Sales */}
                      <Area 
                        type="monotone" 
                        dataKey="total_sales"
                        stroke="#8884d8" 
                        fill="#8884d8"
                        fillOpacity={0.6}
                        name="Actual Sales"
                        isAnimationActive={false}
                        connectNulls={false}
                        dot={false}
                        strokeDasharray={"3 3"}
                        data={dailySalesWithPredictions.filter(entry => !entry.isPrediction)}
                      />
                      {/* Predicted Sales */}
                      <Area 
                        type="monotone" 
                        dataKey="total_sales"
                        stroke="#ff7300" 
                        fill="#ff7300"
                        fillOpacity={0.3}
                        name="Predicted Sales"
                        strokeDasharray="5 5"
                        isAnimationActive={false}
                        connectNulls={false}
                        dot={false}
                        data={dailySalesWithPredictions.filter(entry => entry.isPrediction)}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Products Performance */}
          <Grid item xs={12} lg={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Top Products by Revenue
                </Typography>
                <Box sx={{ height: 400, overflow: 'auto' }}>
                  {productPerformance.map((product) => (
                    <Box key={product.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: '60%' }}>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {formatCurrency(product.revenue)}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(product.revenue / productPerformance[0].revenue) * 100}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Qty Sold: {product.quantitySold} | Stock: {product.stock_quantity}
                      </Typography>
                    </Box>
                  ))}
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
  );
};

export default AdvancedAnalytics;
