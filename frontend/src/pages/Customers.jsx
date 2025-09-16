import React, { useState, useContext, useEffect } from 'react';
import { enqueueMutation } from '../utils/offlineMutationQueue';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Alert,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Chip,
  Badge,
  SwipeableDrawer
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Phone,
  Email,
  Person,
  Close,
  LocationOn,
  FilterList,
  History
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersAPI } from '../api/customers';
import { NotificationContext } from '../contexts/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { useActivityLogger } from '../hooks/useActivityLogger';
import PermissionGuard from '../components/PermissionGuard';
import withRoleBasedAccess from '../hocs/withRoleBasedAccess';

const Customers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { showSnackbar } = useContext(NotificationContext);
  const { hasPermission } = usePermissions();
  const { logEntityAction, logSearch, ActivityTypes, EntityTypes } = useActivityLogger();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? 'card' : 'table');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, customerId: null });

  // Queries
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customersAPI.getCustomers,
  });

  // Mutations
  const deleteCustomerMutation = useMutation({
    mutationFn: customersAPI.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
    },
  });

  // Filtered customers
  const filteredCustomers = customers?.customers?.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return customer.name?.toLowerCase().includes(searchLower) ||
           customer.email?.toLowerCase().includes(searchLower) ||
           customer.phone?.includes(searchTerm);
  }) || [];

  // Log search activity
  useEffect(() => {
    if (searchTerm.length > 2) {
      const delayedSearch = setTimeout(() => {
        logSearch('customers', searchTerm, filteredCustomers.length);
      }, 500);
      return () => clearTimeout(delayedSearch);
    }
  }, [searchTerm, filteredCustomers.length, logSearch]);

  const handleAddCustomer = () => {
    if (!hasPermission('customers.create')) {
      showSnackbar('You do not have permission to create customers', 'error');
      return;
    }
    setSelectedCustomer(null);
    setOpenDialog(true);
    logEntityAction(ActivityTypes.CREATE, EntityTypes.CUSTOMER, null);
  };

  const handleEditCustomer = (customer) => {
    if (!hasPermission('customers.update')) {
      showSnackbar('You do not have permission to edit customers', 'error');
      return;
    }
    setSelectedCustomer(customer);
    setOpenDialog(true);
    logEntityAction(ActivityTypes.UPDATE, EntityTypes.CUSTOMER, customer.id, customer);
  };

  const handleDeleteCustomer = (customerId) => {
    if (!hasPermission('customers.delete')) {
      showSnackbar('You do not have permission to delete customers', 'error');
      return;
    }
    setConfirmDialog({ open: true, customerId });
  };

  const handleConfirmDelete = async () => {
    if (!hasPermission('customers.delete')) {
      showSnackbar('You do not have permission to delete customers', 'error');
      setConfirmDialog({ open: false, customerId: null });
      return;
    }

    const customerId = confirmDialog.customerId;
    const customerToDelete = filteredCustomers.find(c => c.id === customerId);
    setConfirmDialog({ open: false, customerId: null });
    
    const isOnline = window.navigator.onLine;
    if (isOnline) {
      await deleteCustomerMutation.mutateAsync(customerId);
      showSnackbar('Customer deleted successfully.', 'success');
      logEntityAction(ActivityTypes.DELETE, EntityTypes.CUSTOMER, customerId, customerToDelete);
    } else {
      enqueueMutation({ url: `/api/customers/${customerId}`, method: 'DELETE' });
      showSnackbar('Customer delete queued for sync (offline mode).', 'info');
      logEntityAction(ActivityTypes.DELETE, EntityTypes.CUSTOMER, customerId, customerToDelete, null, { offline: true });
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(swReg => {
          swReg.sync.register('sync-mutations');
        });
      }
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      // Show toast or alert instead
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csv', selectedFile);

    try {
      const result = await customersAPI.uploadCSV(formData);
      setUploadResult(result);
      queryClient.invalidateQueries(['customers']);
    } catch (error) {
      console.error('Error uploading CSV:', error);
      // Show error toast or alert instead
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  };

  // Speed Dial Actions
  const speedDialActions = [
    { icon: <Add />, name: 'Add Customer', onClick: handleAddCustomer, permission: 'customers.create' },
    { icon: <FilterList />, name: 'Search', onClick: () => setOpenDrawer(true) },
  ].filter(action => !action.permission || hasPermission(action.permission));

  // Mobile Card View
  const renderCardView = () => (
    <Grid container spacing={2}>
      {filteredCustomers.map((customer) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
          <Card 
            elevation={isMobile ? 1 : 2}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    mr: 2
                  }}
                >
                  {getInitials(customer.name)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    noWrap 
                    sx={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    {customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    ID: {customer.id}
                  </Typography>
                </Box>
              </Box>
              
              {customer.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" noWrap>
                    {customer.phone}
                  </Typography>
                </Box>
              )}
              
              {customer.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" noWrap>
                    {customer.email}
                  </Typography>
                </Box>
              )}
              
              {customer.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {customer.address}
                  </Typography>
                </Box>
              )}

              {customer.loyalty_points > 0 && (
                <Chip
                  label={`${customer.loyalty_points} points`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              <PermissionGuard permission="customers.update" showFallback={false}>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEditCustomer(customer)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="customers.delete" showFallback={false}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteCustomer(customer.id)}
                >
                  <Delete />
                </IconButton>
              </PermissionGuard>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View
  const renderTableView = () => (
  <TableContainer component={Paper} elevation={1} sx={{ overflowX: 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Loyalty Points</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow key={customer.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {getInitials(customer.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {customer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {customer.id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  {customer.phone && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Phone sx={{ fontSize: 16, mr: 1 }} />
                      {customer.phone}
                    </Typography>
                  )}
                  {customer.email && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ fontSize: 16, mr: 1 }} />
                      {customer.email}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    maxWidth: 200,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {customer.address || 'N/A'}
                </Typography>
              </TableCell>
              <TableCell>
                {customer.loyalty_points > 0 ? (
                  <Chip
                    label={customer.loyalty_points}
                    size="small"
                    color="success"
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">0</Typography>
                )}
              </TableCell>
              <TableCell>
                <PermissionGuard permission="customers.update" showFallback={false}>
                  <IconButton
                    onClick={() => handleEditCustomer(customer)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <Edit />
                  </IconButton>
                </PermissionGuard>
                <PermissionGuard permission="customers.delete" showFallback={false}>
                  <IconButton
                    onClick={() => handleDeleteCustomer(customer.id)}
                    size="small"
                    color="error"
                    sx={{ mr: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </PermissionGuard>
                <IconButton
                  component={Link}
                  to={`/customer-history/${customer.id}`}
                  size="small"
                  color="primary"
                  title="View Purchase History"
                >
                  <History />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Customers</Typography>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" height={24} />
                      <Skeleton variant="text" height={20} width="60%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 0.5 }}>
        <Alert severity="error">
          Failed to load customers. Please try again.
        </Alert>
      </Box>
    );
  }

  // Confirmation Dialog for Delete
  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, customerId: null })}>
      <DialogTitle>Delete Customer</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete this customer?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog({ open: false, customerId: null })}>Cancel</Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%',
      overflow: 'hidden',
      p: 0.5 
    }}>
      {renderConfirmDialog()}
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold"
        >
          Customers ({filteredCustomers.length})
        </Typography>
        
        {!isMobile && (
          <PermissionGuard permission="customers.create" showFallback={false}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddCustomer}
            >
              Add Customer
            </Button>
          </PermissionGuard>
        )}
      </Box>

      {/* Search */}
      {!isMobile && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={viewMode === 'table' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('table')}
                  size="small"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('card')}
                  size="small"
                >
                  Cards
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Content */}
      {filteredCustomers.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No customers found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first customer'}
          </Typography>
          <PermissionGuard permission="customers.create" showFallback={false}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddCustomer}
            >
              Add Customer
            </Button>
          </PermissionGuard>
        </Paper>
      ) : (
        <>
          {/* Desktop Table View */}
          {!isMobile && viewMode === 'table' && renderTableView()}
          
          {/* Card View (Mobile and Desktop) */}
          {(isMobile || viewMode === 'card') && renderCardView()}
        </>
      )}

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Customer actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={speedDialOpen}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                setSpeedDialOpen(false);
              }}
            />
          ))}
        </SpeedDial>
      )}

      {/* Mobile Search Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onOpen={() => setOpenDrawer(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: { borderRadius: '16px 16px 0 0', maxHeight: '50vh' }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Search Customers</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setOpenDrawer(false);
            }}
          >
            Clear Search
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* Customer Dialog */}
      <CustomerDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        customer={selectedCustomer}
        onSuccess={() => {
          setOpenDialog(false);
          queryClient.invalidateQueries(['customers']);
        }}
      />

      {/* Upload CSV Dialog */}
  <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} fullScreen={isMobile}>
        <DialogTitle>Upload CSV</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a CSV file to upload. The CSV should have a header row with column names matching the customer fields.
          </DialogContentText>
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            Select File
            <input type="file" hidden accept=".csv" onChange={handleFileChange} />
          </Button>
          {selectedFile && <Typography sx={{ mt: 2 }}>{selectedFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Result Dialog */}
  <Dialog open={!!uploadResult} onClose={() => setUploadResult(null)} fullScreen={isMobile}>
        <DialogTitle>Upload Result</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {uploadResult?.message}
          </DialogContentText>
          <Typography>Created: {uploadResult?.created}</Typography>
          <Typography>Updated: {uploadResult?.updated}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadResult(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Customer Dialog Component
const CustomerDialog = ({ open, onClose, customer, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    anniversary_date: ''
  });

  React.useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        date_of_birth: customer.date_of_birth || '',
        anniversary_date: customer.anniversary_date || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        anniversary_date: ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnline = window.navigator.onLine;
    try {
      if (customer) {
        if (isOnline) {
          const result = await customersAPI.updateCustomer(customer.id, formData);
          console.log('Update result:', result);
          onSuccess();
        } else {
          enqueueMutation({ url: `/api/customers/${customer.id}`, method: 'PUT', body: formData });
          onSuccess();
          // Register for background sync
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(swReg => {
              swReg.sync.register('sync-mutations');
            });
          }
        }
      } else {
        if (isOnline) {
          const result = await customersAPI.createCustomer(formData);
          console.log('Create result:', result);
          onSuccess();
        } else {
          enqueueMutation({ url: '/api/customers', method: 'POST', body: formData });
          onSuccess();
          // Register for background sync
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(swReg => {
              swReg.sync.register('sync-mutations');
            });
          }
        }
      }
    } catch (error) {
      // Show error to user
      console.error('Failed to save customer:', error);
      alert(`Failed to save customer: ${error.message || 'Unknown error'}`);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: isMobile ? {} : { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={isMobile ? 3 : 4}
                value={formData.address}
                onChange={handleChange('address')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange('date_of_birth')}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Anniversary Date"
                type="date"
                value={formData.anniversary_date}
                onChange={handleChange('anniversary_date')}
                InputLabelProps={{ shrink: true }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          {!isMobile && (
            <Button onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            {customer ? 'Update Customer' : 'Add Customer'}
          </Button>
          {isMobile && (
            <Button 
              onClick={onClose}
              fullWidth
              size="large"
            >
              Cancel
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

const EnhancedCustomers = withRoleBasedAccess(Customers, {
  permission: 'customers.read',
  pageName: 'Customers',
  entityType: 'CUSTOMER'
});

export default EnhancedCustomers;
