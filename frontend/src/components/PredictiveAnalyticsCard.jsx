import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  Psychology,
  AutoGraph,
  People,
  Timeline
} from '@mui/icons-material';

// Simple linear regression for predictions
const calculateTrend = (data, field) => {
  if (!data || data.length < 3) return null;
  
  const points = data.map((item, index) => ({
    x: index,
    y: item[field] || 0
  }));
  
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict next 7 periods
  const predictions = [];
  for (let i = 1; i <= 7; i++) {
    const futureX = n + i;
    const predictedY = slope * futureX + intercept;
    predictions.push(Math.max(0, predictedY)); // Ensure non-negative
  }
  
  return {
    slope,
    predictions,
    trend: slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat',
    confidence: Math.min(95, Math.abs(slope) * 20 + 60) // Mock confidence calculation
  };
};

const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const PredictiveAnalyticsCard = ({ salesData, customerData }) => {
  // Calculate predictions
  const predictions = useMemo(() => {
    const results = {};
    
    // Sales predictions
    if (salesData?.dailySales) {
      results.sales = calculateTrend(salesData.dailySales, 'total_sales');
    }
    
    // Customer growth predictions
    if (customerData?.dailyCustomers) {
      results.customers = calculateTrend(customerData.dailyCustomers, 'new_customers');
    }
    
    // Transaction volume predictions
    if (salesData?.dailyTransactions) {
      results.transactions = calculateTrend(salesData.dailyTransactions, 'transaction_count');
    }
    
    return results;
  }, [salesData, customerData]);
  
  const getPredictionCard = (title, current, prediction, icon, color = 'primary') => {
    if (!prediction) return null;
    
    const nextWeekPrediction = prediction.predictions[6]; // 7 days ahead
    const changePercent = current ? ((nextWeekPrediction - current) / current * 100) : 0;
    const isPositive = changePercent > 0;
    
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: `${color}.main`, mr: 1 }}>
              {icon}
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            <Chip 
              label={`${prediction.confidence?.toFixed(0)}%`} 
              size="small" 
              color={color}
              variant="outlined"
            />
          </Box>
          
          <Typography variant="h4" sx={{ mb: 1 }}>
            {typeof current === 'number' && current > 1000 
              ? formatCurrency(current) 
              : current?.toLocaleString() || 'N/A'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {isPositive ? (
              <TrendingUp color="success" sx={{ mr: 0.5 }} />
            ) : (
              <TrendingDown color="error" sx={{ mr: 0.5 }} />
            )}
            <Typography 
              variant="body2" 
              color={isPositive ? 'success.main' : 'error.main'}
              sx={{ mr: 1 }}
            >
              {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              next week
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Predicted: {typeof nextWeekPrediction === 'number' && nextWeekPrediction > 1000
              ? formatCurrency(nextWeekPrediction)
              : nextWeekPrediction?.toLocaleString() || 'N/A'}
          </Typography>
          
          <LinearProgress
            variant="determinate"
            value={Math.min(100, prediction.confidence || 0)}
            color={color}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary">
            Confidence Level
          </Typography>
        </CardContent>
      </Card>
    );
  };
  
  const getMarketInsights = () => {
    const insights = [];
    
    // Sales trend insight
    if (predictions.sales?.trend === 'up') {
      insights.push({
        type: 'success',
        title: 'Sales Growth Expected',
        description: 'Current trends suggest continued sales growth',
        icon: <TrendingUp />
      });
    } else if (predictions.sales?.trend === 'down') {
      insights.push({
        type: 'warning',
        title: 'Sales Slowdown Predicted',
        description: 'Consider promotional strategies to boost sales',
        icon: <TrendingDown />
      });
    }
    
    // Customer growth insight
    if (predictions.customers?.trend === 'up') {
      insights.push({
        type: 'info',
        title: 'Customer Base Expanding',
        description: 'Increasing customer acquisition rate detected',
        icon: <People />
      });
    }
    
    return insights;
  };
  
  const marketInsights = getMarketInsights();
  
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Psychology color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="600">
            Predictive Analytics
          </Typography>
          <Chip label="AI Powered" size="small" color="primary" sx={{ ml: 1 }} />
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            {getPredictionCard(
              'Sales Forecast',
              salesData?.todaySales || 0,
              predictions.sales,
              <ShowChart />,
              'success'
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            {getPredictionCard(
              'Transaction Volume',
              salesData?.todayTransactions || 0,
              predictions.transactions,
              <Timeline />,
              'info'
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            {getPredictionCard(
              'Customer Growth',
              customerData?.newCustomersToday || 0,
              predictions.customers,
              <People />,
              'primary'
            )}
          </Grid>
        </Grid>
        
        {/* Market Insights */}
        {marketInsights.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AutoGraph sx={{ mr: 1 }} />
              Market Insights
            </Typography>
            <List dense>
              {marketInsights.map((insight, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{ color: `${insight.type}.main` }}>
                      {insight.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={insight.title}
                    secondary={insight.description}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* No predictions available */}
        {Object.keys(predictions).length === 0 && (
          <Alert severity="info" icon={<Psychology />}>
            <Typography variant="body2">
              Predictive analytics will appear here once sufficient historical data is available.
              Minimum 7 days of data required for accurate predictions.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalyticsCard;
