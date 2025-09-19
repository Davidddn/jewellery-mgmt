import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import {
  AccountBox,
  Payment,
  Warning,
  CheckCircle,
  Upgrade
} from '@mui/icons-material';

const SubscriptionSettings = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creditDialog, setCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState(100);
  const [upgradeDialog, setUpgradeDialog] = useState(false);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
        setUsage(data.subscription.usage);
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async () => {
    try {
      const response = await fetch('/api/subscription/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          credits: creditAmount,
          payment_reference: `credit_purchase_${Date.now()}`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCreditDialog(false);
        fetchSubscriptionDetails();
        alert(`Successfully purchased ${creditAmount} credits!`);
      } else {
        alert(data.message || 'Failed to purchase credits');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to purchase credits');
    }
  };

  const getUsagePercentage = (current, max) => {
    if (max === -1) return 0; // Unlimited
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Loading subscription details...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!subscription) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No subscription found. Please contact support.
        </Alert>
      </Box>
    );
  }

  const features = subscription.features || {};
  const planDetails = subscription.plan_details || {};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Subscription Management
      </Typography>

      <Grid container spacing={3}>
        {/* Current Plan Overview */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountBox sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    {planDetails.name || subscription.tier}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {planDetails.description}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip 
                    label={subscription.status}
                    color={subscription.is_active ? 'success' : 'error'}
                    icon={subscription.is_active ? <CheckCircle /> : <Warning />}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Plan Type
                  </Typography>
                  <Typography variant="body1">
                    {subscription.billing_cycle === 'yearly' ? 'Annual' : 
                     subscription.billing_cycle === 'monthly' ? 'Monthly' : 
                     subscription.tier === 'lifetime' ? 'Lifetime' :
                     subscription.tier === 'pay_per_use' ? 'Pay-per-Use' : 'Freemium'}
                  </Typography>
                </Grid>
                
                {subscription.expires_at && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Expires On
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(subscription.expires_at)}
                    </Typography>
                  </Grid>
                )}
                
                {subscription.amount_paid && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Amount Paid
                    </Typography>
                    <Typography variant="body1">
                      ₹{subscription.amount_paid.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                
                {subscription.tier === 'pay_per_use' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Credits Remaining
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {subscription.credits || 0}
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => setCreditDialog(true)}
                      >
                        Buy More
                      </Button>
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Upgrade />}
                  onClick={() => setUpgradeDialog(true)}
                >
                  Upgrade Plan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Statistics */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Statistics
              </Typography>

              {usage && (
                <Box>
                  {/* Products Usage */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Products</Typography>
                      <Typography variant="body2">
                        {usage.product_count} / {features.max_products === -1 ? '∞' : features.max_products}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUsagePercentage(usage.product_count, features.max_products)}
                      color={getStatusColor(getUsagePercentage(usage.product_count, features.max_products))}
                    />
                  </Box>

                  {/* Monthly Transactions */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Monthly Transactions</Typography>
                      <Typography variant="body2">
                        {usage.monthly_transactions} / {features.max_transactions_per_month === -1 ? '∞' : features.max_transactions_per_month}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getUsagePercentage(usage.monthly_transactions, features.max_transactions_per_month)}
                      color={getStatusColor(getUsagePercentage(usage.monthly_transactions, features.max_transactions_per_month))}
                    />
                  </Box>

                  {/* Storage (if applicable) */}
                  {features.max_storage_gb && features.max_storage_gb !== -1 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Storage</Typography>
                        <Typography variant="body2">
                          0.1 GB / {features.max_storage_gb} GB
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={getUsagePercentage(0.1, features.max_storage_gb)}
                        color="success"
                      />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Features List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Features
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Feature</TableCell>
                      <TableCell>Limit</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(features).map(([feature, value]) => {
                      const featureName = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      let displayValue = value;
                      let status = 'Available';

                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Included' : 'Not Available';
                        status = value ? 'Active' : 'Unavailable';
                      } else if (typeof value === 'number') {
                        displayValue = value === -1 ? 'Unlimited' : value;
                      }

                      return (
                        <TableRow key={feature}>
                          <TableCell>{featureName}</TableCell>
                          <TableCell>{displayValue}</TableCell>
                          <TableCell>
                            <Chip 
                              label={status}
                              size="small"
                              color={
                                status === 'Active' ? 'success' : 
                                status === 'Unavailable' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase Credits Dialog */}
      <Dialog open={creditDialog} onClose={() => setCreditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Transaction Credits</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Number of Credits"
            type="number"
            value={creditAmount}
            onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
            sx={{ mt: 2, mb: 2 }}
            inputProps={{ min: 1, max: 10000 }}
          />
          
          <Alert severity="info">
            <Typography variant="body2">
              Cost: ₹{(creditAmount * 10).toLocaleString()}
            </Typography>
            <Typography variant="body2">
              Each credit allows one transaction
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditDialog(false)}>Cancel</Button>
          <Button onClick={purchaseCredits} variant="contained" startIcon={<Payment />}>
            Purchase Credits
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)}>
        <DialogTitle>Upgrade Your Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Would you like to view available upgrade options?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setUpgradeDialog(false);
              // Navigate to pricing page
              window.location.href = '/pricing';
            }}
            variant="contained"
          >
            View Plans
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionSettings;
