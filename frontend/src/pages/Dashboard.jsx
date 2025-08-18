import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, CircularProgress, Alert, List, ListItem, ListItemText, Avatar, Divider, TextField, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { Inventory, Receipt, TrendingUp, Group, VerifiedUser, Loyalty as LoyaltyIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';
import { goldRateAPI } from '../api/goldRate';
import { hallmarkingAPI } from '../api/hallmarking';
import { useAuth } from '../contexts/useAuth';

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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableRestoreFocus={false} disableEnforceFocus={false}>
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
                    disabled={updateRatesMutation.isLoading}
                >
                    {updateRatesMutation.isLoading ? 'Updating...' : 'Update'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// GoldRatesComparison Dialog Component
const GoldRatesComparison = ({ open, onClose, liveRates, manualRates }) => {
    const purities = ['24K', '22K', '18K'];

    const formatRate = (rate) => {
        if (!rate) return 'N/A';
        return `₹${Number(rate).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        })}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableRestoreFocus={false} disableEnforceFocus={false}>
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
    const authContext = useAuth(); // Get the whole context object
    const { user } = authContext; // Destructure user from the context object
    const queryClient = useQueryClient(); // Add queryClient here
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
    
    const rates = goldData?.rates; // Extract rates from goldData
   // const source = goldData?.source; // Extract source from goldData

   // const liveRates = source === 'live-api' ? rates : null;
   // const manualRates = (source === 'manual' || source === 'manual-fallback') ? rates : null;

    const resetRatesMutation = useMutation({
        mutationFn: goldRateAPI.resetGoldRates,
        onSuccess: (data) => {
            console.log("Reset successful:", data); // Add this line
            queryClient.invalidateQueries(['goldRate']);
            // Optionally show a success message
        },
        onError: (err) => {
            console.error("Failed to reset rates:", err); // Add this line
            // Optionally show an error message
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
                            disabled={resetRatesMutation.isLoading}
                        >
                            {resetRatesMutation.isLoading ? 'Resetting...' : 'Reset to Live Rates'}
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
}


const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dailySales'],
    queryFn: () => reportsAPI.getDailySales(new Date().toISOString().split('T')[0]),
  });

  const { data: goldData, isLoading: isGoldLoading, error: goldError } = useQuery({
    queryKey: ['goldRate'],
    queryFn: goldRateAPI.getLatestGoldRate,
  });

  // Fetch hallmarking data
  const { data: hallmarkingData, isLoading: isHallmarkingLoading, error: hallmarkingError } = useQuery({
    queryKey: ['allHallmarking'],
    queryFn: hallmarkingAPI.getHallmarking,
  });

  if (isLoading || isHallmarkingLoading) {
    return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard data: {error.message}</Alert>;
  }

  const dashboardData = data?.dashboard || {};
  const recentHallmarking = hallmarkingData?.hallmarking || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Today's Revenue" value={dashboardData.revenue || 0} icon={<TrendingUp />} color="success.main" isCurrency={true} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Today's Transactions" value={dashboardData.transactionCount || 0} icon={<Receipt />} color="primary.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Low Stock Items" value={dashboardData.lowStockProducts?.length || 0} icon={<Inventory />} color="warning.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Customers" value={dashboardData.totalCustomers || 0} icon={<Group />} color="secondary.main" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Selling Products Today</Typography>
              <List>
                {dashboardData.topSelling?.length > 0 ? (
                  dashboardData.topSelling.map((item, idx) => (
                    <ListItem key={idx} disableGutters divider><ListItemText primary={item.product?.name || `Product ID: ${item.product_id}`} secondary={`Sold: ${item.total_sold}`} /></ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No sales data for today.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
            <GoldRateCard goldData={goldData} isLoading={isGoldLoading} error={goldError?.message} />
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Low Stock Alerts</Typography>
                    {dashboardData.lowStockProducts?.length > 0 ? (
                        <List>
                            {dashboardData.lowStockProducts.map((product) => (
                                <ListItem key={product.id} disableGutters divider>
                                    <ListItemText 
                                      primary={product.name} 
                                      secondary={`Current Stock: ${product.stock_quantity}`} 
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          All products are well-stocked.
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Grid>
      {/* Hallmarking Section */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}><VerifiedUser /></Avatar>
                <Typography variant="h6">Recent Hallmarking Records</Typography>
              </Box>
              {isHallmarkingLoading && <CircularProgress size={24} />}
              {hallmarkingError && <Alert severity="error">Failed to load hallmarking data: {hallmarkingError.message}</Alert>}
              {!isHallmarkingLoading && !hallmarkingError && (
                <List>
                  {recentHallmarking.length > 0 ? (
                    recentHallmarking.slice(0, 5).map((record) => (
                      <ListItem key={record.id} disableGutters divider>
                        <ListItemText 
                          primary={`Hallmark No: ${record.hallmark_number}`}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {record.product?.name} ({record.product?.purity})
                              </Typography>
                              {` — Certified: ${new Date(record.certification_date).toLocaleDateString()}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      No recent hallmarking records found.
                    </Typography>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Loyalty Program Section (Placeholder) */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}><LoyaltyIcon /></Avatar>
                <Typography variant="h6">Loyalty Program Overview</Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Manage and view customer loyalty details.
              </Typography>
              <Button variant="contained" color="secondary" href="/loyalty" disabled>
                Go to Loyalty Page (Coming Soon)
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                For detailed loyalty statistics, a backend summary endpoint would be beneficial.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;