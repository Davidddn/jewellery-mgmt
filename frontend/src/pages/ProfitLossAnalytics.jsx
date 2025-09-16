import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  MonetizationOn,
  AccountBalance,
  Receipt,
  Download,
  Analytics,
  Assessment
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { profitLossAPI } from '../api/profitLoss';

const ProfitLossAnalytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    end_date: new Date().toISOString().split('T')[0] // Today
  });
  const [granularity, setGranularity] = useState('monthly');

  // Queries
  const { 
    data: profitLossData, 
    isLoading: plLoading, 
    error: plError 
  } = useQuery({
    queryKey: ['profit-loss-statement', dateRange, granularity],
    queryFn: () => profitLossAPI.getProfitLossStatement({ ...dateRange, granularity }),
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  const { 
    data: realtimeMetrics, 
    isLoading: metricsLoading 
  } = useQuery({
    queryKey: ['realtime-profit-metrics'],
    queryFn: profitLossAPI.getRealtimeProfitMetrics,
    refetchInterval: 60 * 1000 // Refresh every minute
  });

  // Note: expenseImpact available for future enhancements
  useQuery({
    queryKey: ['expense-impact', dateRange],
    queryFn: () => profitLossAPI.getExpenseImpactAnalysis(dateRange)
  });

  // Handle export
  const handleExport = async (format) => {
    try {
      await profitLossAPI.exportProfitLossStatement({ 
        ...dateRange, 
        granularity, 
        format 
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  // Format currency
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;

  // Loading state
  if (plLoading || metricsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (plError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load profit & loss data: {plError.message}
      </Alert>
    );
  }

  const plStatement = profitLossData?.data || {};
  const metrics = realtimeMetrics?.data || {};

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
          Profit & Loss Analytics
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('csv')}
            size={isMobile ? "small" : "medium"}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('pdf')}
            size={isMobile ? "small" : "medium"}
          >
            Export PDF
          </Button>
        </Stack>
      </Box>

      {/* Real-time Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(metrics.today?.profit)}
                  </Typography>
                  <Typography variant="body2">Today's Profit</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {metrics.today?.margin >= 0 ? <TrendingUp /> : <TrendingDown />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {formatPercentage(metrics.today?.margin)} margin
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(metrics.month?.profit)}
                  </Typography>
                  <Typography variant="body2">This Month's Profit</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {metrics.month?.margin >= 0 ? <TrendingUp /> : <TrendingDown />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {formatPercentage(metrics.month?.margin)} margin
                    </Typography>
                  </Box>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(metrics.month?.revenue)}
                  </Typography>
                  <Typography variant="body2">Monthly Revenue</Typography>
                  <Typography variant="caption">
                    vs {formatCurrency(metrics.month?.expenses)} expenses
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPercentage(plStatement.summary?.profit_margin)}
                  </Typography>
                  <Typography variant="body2">Overall Profit Margin</Typography>
                  <Typography variant="caption">
                    {formatCurrency(plStatement.summary?.net_profit)} net profit
                  </Typography>
                </Box>
                <Analytics sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filter Options</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Granularity</InputLabel>
              <Select
                value={granularity}
                label="Granularity"
                onChange={(e) => setGranularity(e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Profit/Loss Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Profit & Loss Trend</Typography>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={plStatement.periods || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.6}
              name="Revenue"
            />
            <Area 
              type="monotone" 
              dataKey="cogs" 
              stackId="2" 
              stroke="#ff7300" 
              fill="#ff7300" 
              fillOpacity={0.6}
              name="COGS"
            />
            <Area 
              type="monotone" 
              dataKey="operating_expenses" 
              stackId="2" 
              stroke="#ffc658" 
              fill="#ffc658" 
              fillOpacity={0.6}
              name="Operating Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="net_profit" 
              stroke="#82ca9d" 
              strokeWidth={3}
              name="Net Profit"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Summary Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Financial Summary</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MonetizationOn color="success" sx={{ mr: 1 }} />
                    Total Revenue
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {formatCurrency(plStatement.summary?.total_revenue)}
                </TableCell>
                <TableCell align="right">100%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Receipt color="warning" sx={{ mr: 1 }} />
                    Cost of Goods Sold
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>
                  {formatCurrency(plStatement.summary?.total_cogs)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentage((plStatement.summary?.total_cogs / plStatement.summary?.total_revenue) * 100)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Box sx={{ fontWeight: 'bold' }}>Gross Profit</Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(plStatement.summary?.gross_profit)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentage((plStatement.summary?.gross_profit / plStatement.summary?.total_revenue) * 100)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountBalance color="error" sx={{ mr: 1 }} />
                    Operating Expenses
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>
                  {formatCurrency(plStatement.summary?.total_operating_expenses)}
                </TableCell>
                <TableCell align="right">
                  {formatPercentage((plStatement.summary?.total_operating_expenses / plStatement.summary?.total_revenue) * 100)}
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: 'action.selected' }}>
                <TableCell component="th" scope="row">
                  <Box sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Net Profit</Box>
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem',
                  color: plStatement.summary?.net_profit >= 0 ? 'success.main' : 'error.main'
                }}>
                  {formatCurrency(plStatement.summary?.net_profit)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {formatPercentage(plStatement.summary?.profit_margin)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Expense Categories Breakdown */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Expense Categories</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plStatement.expenses_by_category || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, total_amount }) => 
                    `${category}: ${formatCurrency(total_amount)}`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_amount"
                  nameKey="category"
                >
                  {(plStatement.expenses_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Top Expense Categories</Typography>
            <Stack spacing={2}>
              {metrics.top_expense_categories?.slice(0, 5).map((category, index) => (
                <Box key={category.category} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={index + 1} 
                      size="small" 
                      color="primary" 
                      sx={{ mr: 2, minWidth: '32px' }}
                    />
                    <Typography variant="body1" fontWeight="medium">
                      {category.category}
                    </Typography>
                  </Box>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(category.total_amount)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfitLossAnalytics;
