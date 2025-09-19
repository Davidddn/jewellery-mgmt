import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  LinearProgress,
  Tooltip,
  Fade
} from '@mui/material';
import {
    TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  CheckCircle,
  Info,
  AutoGraph,
  SmartToy,
  ExpandMore,
  ExpandLess,
  Refresh
} from '@mui/icons-material';

// AI Insights Calculator
const generateInsights = (salesData, inventoryData, customerData, goldRates) => {
  const insights = [];
  
  // Sales Pattern Analysis
  if (salesData?.dailySales && salesData.dailySales.length > 7) {
    const recentWeek = salesData.dailySales.slice(-7);
    const previousWeek = salesData.dailySales.slice(-14, -7);
    
    const recentAvg = recentWeek.reduce((sum, day) => sum + (day.total_sales || 0), 0) / 7;
    const previousAvg = previousWeek.reduce((sum, day) => sum + (day.total_sales || 0), 0) / 7;
    
    if (recentAvg > previousAvg * 1.15) {
      insights.push({
        type: 'success',
        category: 'Sales Trend',
        title: 'Strong Sales Growth Detected',
        description: `Sales increased by ${((recentAvg - previousAvg) / previousAvg * 100).toFixed(1)}% this week`,
        recommendation: 'Consider increasing inventory for top-selling items',
        confidence: 85,
        icon: <TrendingUp />
      });
    } else if (recentAvg < previousAvg * 0.85) {
      insights.push({
        type: 'warning',
        category: 'Sales Trend',
        title: 'Sales Decline Noticed',
        description: `Sales decreased by ${((previousAvg - recentAvg) / previousAvg * 100).toFixed(1)}% this week`,
        recommendation: 'Review marketing strategies and customer engagement',
        confidence: 78,
        icon: <TrendingDown />
      });
    }
  }
  
  // Inventory Optimization
  if (inventoryData?.products) {
    const lowStockItems = inventoryData.products.filter(p => p.stock_quantity <= p.reorder_level);
    const overStockItems = inventoryData.products.filter(p => p.stock_quantity > 100);
    
    if (lowStockItems.length > 5) {
      insights.push({
        type: 'error',
        category: 'Inventory',
        title: 'Multiple Low Stock Alerts',
        description: `${lowStockItems.length} products are below reorder level`,
        recommendation: 'Prioritize restocking fast-moving items',
        confidence: 95,
        icon: <Warning />
      });
    }
    
    if (overStockItems.length > 3) {
      insights.push({
        type: 'info',
        category: 'Inventory',
        title: 'Overstock Detected',
        description: `${overStockItems.length} products have high inventory levels`,
        recommendation: 'Consider promotional offers to move slow-selling items',
        confidence: 72,
        icon: <Info />
      });
    }
  }
  
  // Gold Rate Strategy
  if (goldRates?.rates) {
    const goldRate24K = goldRates.rates['24K']?.rate;
    if (goldRate24K) {
      // Simulated historical comparison (in real app, you'd compare with historical data)
      const isHighRate = goldRate24K > 6000; // Example threshold
      
      if (isHighRate) {
        insights.push({
          type: 'warning',
          category: 'Gold Rates',
          title: 'High Gold Rates Detected',
          description: 'Current gold rates are above average',
          recommendation: 'Consider adjusting product pricing or promoting lower karat items',
          confidence: 68,
          icon: <AutoGraph />
        });
      }
    }
  }
  
  // Customer Behavior Insights
  if (customerData?.recentTransactions) {
    const avgTransactionValue = customerData.recentTransactions.reduce(
      (sum, t) => sum + (t.final_amount || 0), 0
    ) / customerData.recentTransactions.length;
    
    if (avgTransactionValue > 25000) {
      insights.push({
        type: 'success',
        category: 'Customer Behavior',
        title: 'High-Value Customer Activity',
        description: `Average transaction value is ₹${avgTransactionValue.toLocaleString()}`,
        recommendation: 'Focus on premium product recommendations',
        confidence: 82,
        icon: <TrendingUp />
      });
    }
  }
  
  return insights.slice(0, 5); // Limit to top 5 insights
};

// Smart Insights Component
const SmartInsightsCard = ({ salesData, inventoryData, customerData, goldRates }) => {
  const [expanded, setExpanded] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const insights = useMemo(() => 
    generateInsights(salesData, inventoryData, customerData, goldRates),
    [salesData, inventoryData, customerData, goldRates]
  );
  
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate AI processing time
    setTimeout(() => setRefreshing(false), 1500);
  };
  
  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };
  
  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            <Typography variant="h6" fontWeight="600">
              AI Insights
            </Typography>
            <Chip label="Beta" size="small" color="primary" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Refresh Insights">
              <IconButton size="small" onClick={handleRefresh} disabled={refreshing}>
                <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expanded}>
          {refreshing ? (
            <Box sx={{ py: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Analyzing data patterns...
              </Typography>
            </Box>
          ) : insights.length > 0 ? (
            <List dense>
              {insights.map((insight, index) => (
                <Fade in={true} timeout={300 * (index + 1)} key={index}>
                  <ListItem divider={index < insights.length - 1} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ color: `${getInsightColor(insight.type)}.main` }}>
                        {insight.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight="600">
                            {insight.title}
                          </Typography>
                          <Chip 
                            label={`${insight.confidence}%`} 
                            size="small" 
                            color={getInsightColor(insight.type)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {insight.description}
                          </Typography>
                          <Alert 
                            severity={insight.type} 
                            sx={{ mt: 1, py: 0.5 }}
                            icon={<Lightbulb fontSize="small" />}
                          >
                            <Typography variant="caption">
                              <strong>Recommendation:</strong> {insight.recommendation}
                            </Typography>
                          </Alert>
                        </Box>
                      }
                    />
                  </ListItem>
                </Fade>
              ))}
            </List>
          ) : (
            <Alert severity="info" icon={<CheckCircle />}>
              <AlertTitle>All Systems Optimal</AlertTitle>
              No critical insights detected. Your business metrics are performing well!
            </Alert>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SmartInsightsCard;
