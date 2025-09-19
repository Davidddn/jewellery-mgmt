import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Business,
  Diamond,
  LocalAtm,
  AllInclusive,
  TrendingUp,
  Security,
  Analytics,
  SupportAgent
} from '@mui/icons-material';

const PricingPage = () => {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeDialog, setUpgradeDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [yearlyBilling, setYearlyBilling] = useState(false);

  useEffect(() => {
    fetchPricingPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans?include_promotions=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPricingPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          tier: selectedPlan.id,
          billing_cycle: billingCycle,
          promo_code: promoCode || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentSubscription(data.subscription);
        setUpgradeDialog(false);
        setSelectedPlan(null);
        setPromoCode('');
      } else {
        alert(data.message || 'Failed to upgrade subscription');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription');
    }
    
    setLoading(false);
  };

  const getPlanIcon = (planId) => {
    const icons = {
      freemium: <Star color="primary" />,
      starter: <Business color="primary" />,
      professional: <Diamond color="primary" />,
      enterprise: <Analytics color="primary" />,
      lifetime: <AllInclusive color="primary" />,
      pay_per_use: <LocalAtm color="primary" />
    };
    return icons[planId] || <Business color="primary" />;
  };

  const getPlanColor = (planId) => {
    const colors = {
      freemium: 'default',
      starter: 'primary',
      professional: 'secondary',
      enterprise: 'error',
      lifetime: 'warning',
      pay_per_use: 'info'
    };
    return colors[planId] || 'default';
  };

  const formatPrice = (plan) => {
    if (plan.id === 'freemium') return 'Free';
    if (plan.id === 'pay_per_use') return '₹10/transaction';
    if (plan.id === 'lifetime') return '₹49,999 one-time';
    
    const monthlyPrice = plan.price;
    const yearlyPrice = plan.yearly_price;
    
    if (yearlyBilling && yearlyPrice) {
      const monthlySavings = monthlyPrice * 12 - yearlyPrice;
      return (
        <Box>
          <Typography variant="h4" component="span" color="primary">
            ₹{yearlyPrice.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /year (Save ₹{monthlySavings.toLocaleString()})
          </Typography>
        </Box>
      );
    }
    
    return (
      <Typography variant="h4" component="span" color="primary">
        ₹{monthlyPrice.toLocaleString()}
        <Typography variant="body1" component="span" color="text.secondary">
          /month
        </Typography>
      </Typography>
    );
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.tier === planId;
  };

  const canUpgrade = (planId) => {
    if (!currentSubscription) return true;
    
    const tierOrder = ['freemium', 'starter', 'professional', 'enterprise', 'lifetime', 'pay_per_use'];
    const currentIndex = tierOrder.indexOf(currentSubscription.tier);
    const targetIndex = tierOrder.indexOf(planId);
    
    return targetIndex > currentIndex || planId === 'pay_per_use';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Perfect Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Competitive pricing designed to grow with your jewelry business
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={yearlyBilling}
              onChange={(e) => setYearlyBilling(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Yearly Billing</Typography>
              <Chip 
                label="Save up to 20%" 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            </Box>
          }
        />
      </Box>

      {currentSubscription && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography>
            Current Plan: <strong>{currentSubscription.plan_details?.name}</strong>
            {currentSubscription.expires_at && (
              <> • Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}</>
            )}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {pricingPlans.map((plan) => {
          const isPopular = plan.id === 'professional';
          const isCurrent = isCurrentPlan(plan.id);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={plan.id}>
              <Card 
                sx={{ 
                  position: 'relative',
                  height: '100%',
                  border: isPopular ? 2 : 1,
                  borderColor: isPopular ? 'primary.main' : 'divider',
                  ...(isCurrent && { 
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    borderColor: 'success.main'
                  })
                }}
              >
                {isPopular && (
                  <Chip
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1
                    }}
                  />
                )}
                
                {isCurrent && (
                  <Chip
                    label="Current Plan"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 1
                    }}
                  />
                )}

                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {getPlanIcon(plan.id)}
                    </Box>
                    
                    <Typography variant="h5" component="h2" gutterBottom>
                      {plan.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {plan.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      {formatPrice(plan)}
                    </Box>
                    
                    {plan.target_audience && (
                      <Chip 
                        label={plan.target_audience} 
                        variant="outlined" 
                        size="small"
                        color={getPlanColor(plan.id)}
                      />
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Features Included:
                    </Typography>
                    
                    <List dense>
                      {Object.entries(plan.features).map(([feature, value]) => {
                        if (typeof value === 'boolean' && value) {
                          return (
                            <ListItem key={feature} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          );
                        } else if (typeof value === 'number' && value !== -1) {
                          return (
                            <ListItem key={feature} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={`${feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value === -1 ? 'Unlimited' : value}`}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          );
                        } else if (value === -1) {
                          return (
                            <ListItem key={feature} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <AllInclusive color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={`Unlimited ${feature.replace(/_/g, ' ')}`}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          );
                        }
                        return null;
                      })}
                    </List>

                    {plan.highlights && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          Key Highlights:
                        </Typography>
                        {plan.highlights.map((highlight, index) => (
                          <Typography key={index} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            • {highlight}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    {isCurrent ? (
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        color="success"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : canUpgrade(plan.id) ? (
                      <Button
                        fullWidth
                        variant={isPopular ? "contained" : "outlined"}
                        color="primary"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setBillingCycle(yearlyBilling ? 'yearly' : 'monthly');
                          setUpgradeDialog(true);
                        }}
                      >
                        {plan.id === 'freemium' ? 'Downgrade' : 'Upgrade Now'}
                      </Button>
                    ) : (
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        disabled
                      >
                        Lower Tier
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Competitive Analysis Section */}
      <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Why Choose Our Pricing?
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Hidden Costs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Transparent pricing with no setup fees or hidden charges. What you see is what you pay.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Flexible Options
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from freemium, pay-per-use, or lifetime options. Scale up or down as needed.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SupportAgent sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                24/7 Support
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get help when you need it with our dedicated support team and comprehensive documentation.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeDialog} onClose={() => setUpgradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upgrade to {selectedPlan?.name}
        </DialogTitle>
        
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                You&apos;re about to upgrade to the <strong>{selectedPlan.name}</strong> plan.
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Billing Cycle</InputLabel>
                <Select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  label="Billing Cycle"
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  {selectedPlan.yearly_price && (
                    <MenuItem value="yearly">
                      Yearly (Save {Math.round(((selectedPlan.price * 12 - selectedPlan.yearly_price) / (selectedPlan.price * 12)) * 100)}%)
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Promo Code (Optional)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6">
                  Total: ₹{billingCycle === 'yearly' && selectedPlan.yearly_price 
                    ? selectedPlan.yearly_price.toLocaleString() 
                    : selectedPlan.price?.toLocaleString()}
                  {billingCycle === 'monthly' && selectedPlan.id !== 'lifetime' && '/month'}
                  {billingCycle === 'yearly' && '/year'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setUpgradeDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Upgrade'}
          </Button>
        </DialogActions>
        
        {loading && <LinearProgress />}
      </Dialog>
    </Box>
  );
};

export default PricingPage;
