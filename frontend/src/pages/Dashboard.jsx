import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory,
  People,
  Receipt,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    todaySales: 0,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['dailySales'],
    queryFn: () => reportsAPI.getDailySales(new Date().toISOString().split('T')[0]),
  });

  useEffect(() => {
    if (data && data.dashboard) {
      setStats({
        totalProducts: data.dashboard.lowStockProducts.length + (data.dashboard.topSelling ? data.dashboard.topSelling.length : 0),
        totalCustomers: 0, // You can fetch and set this from another API if needed
        totalSales: data.dashboard.revenue,
        todaySales: data.dashboard.revenue,
      });
    }
  }, [data]);

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' && value >= 1000000
                ? `₹${(value / 1000000).toFixed(1)}M`
                : typeof value === 'number' && value >= 1000
                ? `₹${(value / 1000).toFixed(0)}K`
                : value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Inventory sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People sx={{ color: 'white' }} />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={stats.totalSales}
            icon={<Receipt sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sales"
            value={stats.todaySales}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sales
              </Typography>
              {data && data.dashboard && data.dashboard.recentTransactions && data.dashboard.recentTransactions.length > 0 ? (
                data.dashboard.recentTransactions.map((tx, idx) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''} - ₹{tx.total_amount} ({tx.status})
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No recent sales.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Low Stock Alerts
              </Typography>
              {data && data.dashboard && data.dashboard.lowStockProducts && data.dashboard.lowStockProducts.length > 0 ? (
                data.dashboard.lowStockProducts.map((product, idx) => (
                  <Box key={idx} mb={1}>
                    <Typography variant="body2">
                      {product.name} (Stock: {product.stock})
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No low stock alerts.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 