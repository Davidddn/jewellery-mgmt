import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Refresh
} from '@mui/icons-material';

const ProductAnalyticsCard = ({ analytics, onRefresh, loading = false }) => {
  if (!analytics) return null;

  const {
    totalProducts = 0,
    lowStockCount = 0,
    totalValue = 0,
    avgPrice = 0,
    topCategories = [],
    trending = []
  } = analytics;

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">
            Product Analytics
          </Typography>
          <Tooltip title="Refresh Analytics">
            <IconButton 
              size="medium" 
              onClick={onRefresh} 
              disabled={loading}
              sx={{
                borderRadius: 2,
                padding: 1.5,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'primary.50',
                  transform: 'scale(1.1)',
                  boxShadow: 1
                }
              }}
            >
              <Refresh sx={{ 
                animation: loading ? 'spin 1s linear infinite' : 'none',
                fontSize: '1.25rem'
              }} />
            </IconButton>
          </Tooltip>
        </Box>

        {loading ? (
          <LinearProgress sx={{ mb: 2 }} />
        ) : (
          <Grid container spacing={2}>
            {/* Key Metrics */}
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.contrastText">
                  {totalProducts}
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  Total Products
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="warning.contrastText">
                  {lowStockCount}
                </Typography>
                <Typography variant="body2" color="warning.contrastText">
                  Low Stock Items
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="success.contrastText">
                  ₹{(totalValue / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  Inventory Value
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="info.contrastText">
                  ₹{avgPrice.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="info.contrastText">
                  Avg. Price
                </Typography>
              </Box>
            </Grid>

            {/* Top Categories */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                Top Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {topCategories.map((category, index) => (
                  <Chip
                    key={category.name}
                    label={`${category.name} (${category.count})`}
                    color={index === 0 ? 'primary' : 'default'}
                    variant={index === 0 ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Trending Products */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                Trending Products
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {trending.slice(0, 3).map((product, index) => (
                  <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star color={index === 0 ? 'primary' : 'action'} fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {product.name}
                    </Typography>
                    <Chip
                      label={product.trend === 'up' ? '+' + product.change + '%' : product.change + '%'}
                      size="small"
                      color={product.trend === 'up' ? 'success' : 'error'}
                      icon={product.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductAnalyticsCard;
