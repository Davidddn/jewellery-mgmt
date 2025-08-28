import React, { useState } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Alert,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  SwipeableDrawer,
  Autocomplete,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Receipt,
  Person,
  AttachMoney,
  CalendarToday,
  Close,
  FilterList,
  ExpandMore,
  ShoppingCart,
  Visibility,
  Print,
  GetApp,
  FileDownload
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';
import { customersAPI } from '../api/customers';
import { productsAPI } from '../api/products';
import { useAuth } from '../contexts/useAuth';

const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user for admin check

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewMode] = useState(isMobile ? 'card' : 'table');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [tabValue] = useState(0);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Queries
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsAPI.getTransactions,
  });

  useQuery({
    queryKey: ['customers'],
    queryFn: customersAPI.getCustomers,
  });

  useQuery({
    queryKey: ['products'],
    queryFn: productsAPI.getProducts,
  });

  // Mutations
  const deleteTransactionMutation = useMutation({
    mutationFn: transactionsAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    },
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: transactionsAPI.exportTransactions,
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });

  // Filtered transactions
  const allTransactions = transactions?.transactions || [];
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.id?.toString().includes(searchTerm) ||
                         transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || transaction.transaction_status === statusFilter;
    const matchesType = !typeFilter || transaction.transaction_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Tab filtering
  const getTransactionsByTab = () => {
    switch (tabValue) {
      case 0: return filteredTransactions; // All
      case 1: return filteredTransactions.filter(t => t.transaction_type === 'sale');
      case 2: return filteredTransactions.filter(t => t.transaction_type === 'purchase');
      case 3: return filteredTransactions.filter(t => t.transaction_status === 'pending');
      default: return filteredTransactions;
    }
  };

  const displayTransactions = getTransactionsByTab();

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setOpenDialog(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransactionMutation.mutateAsync(transactionId);
    }
  };

  const handleExportTransactions = () => {
    exportTransactionsMutation.mutate();
  };

  const handleDownloadInvoice = async (transactionId) => {
    try {
      // Try to get the invoice HTML with authentication
      let response;
      try {
        // Request default format (pdf) to get JSON response with html_data field
        response = await transactionsAPI.getInvoice(transactionId);
      } catch (invoiceError) {
        console.log('Invoice endpoint failed, trying transaction invoice endpoint:', invoiceError);
        // Fallback: try transaction invoice endpoint
        response = await transactionsAPI.getTransactionInvoice(transactionId);
      }
      
      if (response && response.html_data) {
        // Open new window and write the HTML content
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        if (newWindow) {
          newWindow.document.write(response.html_data);
          newWindow.document.close();
          // Set the window title
          newWindow.document.title = `Invoice #${transactionId}`;
        } else {
          alert('Please allow pop-ups for this site to view invoices.');
        }
      } else {
        console.log('Response received:', response);
        alert('No invoice data received from server.');
      }
    } catch (error) {
      console.error('Error opening invoice:', error);
      alert('Failed to open invoice. Please check if the transaction exists and try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sale': return 'success';
      case 'purchase': return 'info';
      case 'return': return 'warning';
      default: return 'default';
    }
  };

  // Speed Dial Actions
  const speedDialActions = [
    ...(isAdmin ? [{ icon: <Add />, name: 'New Transaction', onClick: handleAddTransaction }] : []),
    { icon: <GetApp />, name: 'Export CSV', onClick: handleExportTransactions },
    { icon: <FilterList />, name: 'Filters', onClick: () => setOpenDrawer(true) },
  ];

  // Mobile Card View
  const renderCardView = () => (
    <Grid container spacing={2}>
      {displayTransactions.map((transaction) => (
        <Grid item xs={12} sm={6} lg={4} key={transaction.id}>
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
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                    #{transaction.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(transaction.created_at || transaction.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                  <Chip
                    label={transaction.transaction_type}
                    size="small"
                    color={getTypeColor(transaction.transaction_type)}
                    variant="outlined"
                  />
                  <Chip
                    label={transaction.transaction_status}
                    size="small"
                    color={getStatusColor(transaction.transaction_status)}
                  />
                </Box>
              </Box>

              {/* Customer */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" noWrap>
                  {transaction.customer_name || 'Walk-in Customer'}
                </Typography>
              </Box>

              {/* Amount */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="success.main" fontWeight="600">
                  ₹{Number(transaction.total_amount || transaction.final_amount || 0).toLocaleString('en-IN')}
                </Typography>
              </Box>

              {/* Items Count */}
              {transaction.items && transaction.items.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShoppingCart sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}

              {/* Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => handleDownloadInvoice(transaction.id)}
                  startIcon={<Print />}
                >
                  Invoice
                </Button>
                {isAdmin && (
                  <>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => handleEditTransaction(transaction)}
                      startIcon={<Edit />}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      startIcon={<Delete />}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View with Mobile Responsiveness
  const renderTableView = () => (
    <Box sx={{ 
      width: '100%',
      overflowX: 'auto',
      '& .MuiTableContainer-root': {
        borderRadius: 2
      }
    }}>
      <TableContainer component={Paper} sx={{ 
        boxShadow: 2,
        minWidth: { xs: 700, md: 'auto' }, // Minimum width for mobile scroll
        overflowX: 'auto'
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '60px'
              }}>ID</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '120px'
              }}>Customer</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '80px'
              }}>Date</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '80px'
              }}>Status</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '70px'
              }}>Type</TableCell>
              <TableCell align="right" sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '100px'
              }}>Amount (₹)</TableCell>
              <TableCell align="center" sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '120px'
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayTransactions.map((transaction) => (
                <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: (theme) => theme.palette.action.hover } }}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {transaction.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="body2" noWrap sx={{ 
                      maxWidth: { xs: '100px', md: '150px' },
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}>
                      {transaction.customer?.name || 'Walk-in'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}>
                      {new Date(transaction.createdAt || transaction.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.transaction_status || 'completed'} 
                      color={getStatusColor(transaction.transaction_status || 'completed')} 
                      size="small"
                      sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.transaction_type || 'N/A'} 
                      color={getTypeColor(transaction.transaction_type || 'N/A')} 
                      size="small"
                      sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    {parseFloat(transaction.final_amount || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, md: 1 },
                      justifyContent: 'center',
                      flexWrap: 'nowrap'
                    }}>
                      <Tooltip title="View/Print Invoice">
                        <IconButton 
                          onClick={() => handleDownloadInvoice(transaction.id)} 
                          color="primary" 
                          size={isMobile ? "small" : "medium"}
                        >
                          <Print />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && (
                        <>
                          <Tooltip title="Edit Transaction">
                            <IconButton 
                              onClick={() => handleEditTransaction(transaction)} 
                              color="primary" 
                              size={isMobile ? "small" : "medium"}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Transaction">
                            <IconButton 
                              onClick={() => handleDeleteTransaction(transaction.id)} 
                              color="error" 
                              size={isMobile ? "small" : "medium"}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header - Responsive */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: { xs: 2, md: 4 }, 
        width: '100%', 
        maxWidth: '1200px',
        gap: { xs: 2, md: 0 }
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
          Transactions
        </Typography>
        
        {/* Mobile-friendly controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', md: 'auto' }
        }}>
          <TextField 
            label="Search by Customer/ID" 
            variant="outlined" 
            size="small" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            sx={{ 
              width: { xs: '100%', sm: '200px', md: '250px' }
            }} 
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button 
              variant="outlined" 
              startIcon={<GetApp />} 
              onClick={handleExportTransactions}
              disabled={exportTransactionsMutation.isPending}
              size={isMobile ? "small" : "medium"}
              sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
            >
              {exportTransactionsMutation.isPending ? 'Exporting...' : 'Export'}
            </Button>
            
            {isAdmin && (
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleAddTransaction}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? 'New' : 'New Transaction'}
              </Button>
            )}
            
            <Button 
              variant="outlined" 
              startIcon={<FilterList />} 
              onClick={() => setOpenDrawer(true)}
              size={isMobile ? "small" : "medium"}
            >
              Filters
            </Button>
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: '100%', maxWidth: '1200px' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to fetch transactions: {error.message}</Alert>}
        {isLoading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        ) : (
          <>
            {viewMode === 'table' ? renderTableView() : renderCardView()}
          </>
        )}
      </Box>

      {/* Filters Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onOpen={() => setOpenDrawer(true)}
      >
        <Box sx={{ width: 300 }} role="presentation" onClick={() => setOpenDrawer(false)} onKeyDown={() => setOpenDrawer(false)}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="600">Filters</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="return">Return</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => { setOpenDrawer(false); queryClient.invalidateQueries(['transactions']); }}
              sx={{ mt: 1 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Transaction Dialog */}
  <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>{selectedTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        <DialogContent>
          <TransactionForm 
            transaction={selectedTransaction} 
            onClose={() => setOpenDialog(false)} 
            onSuccess={() => { 
              setOpenDialog(false); 
              queryClient.invalidateQueries(['transactions']); 
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Speed Dial for mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Speed dial"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      )}
    </Box>
  );
};

export default Transactions;

const TransactionForm = ({ transaction, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const isEdit = !!transaction;

  // State
  const [customerId, setCustomerId] = useState(transaction?.customer_id || '');
  const [productId, setProductId] = useState(transaction?.product_id || '');
  const [quantity, setQuantity] = useState(transaction?.quantity || 1);
  const [paymentMode, setPaymentMode] = useState(transaction?.payment_mode || 'cash');
  const [transactionDate, setTransactionDate] = useState(transaction?.created_at ? new Date(transaction.created_at) : new Date());
  const [status, setStatus] = useState(transaction?.transaction_status || 'completed');
  const [type, setType] = useState(transaction?.transaction_type || 'sale');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customersAPI.getCustomers,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productsAPI.getProducts,
  });

  // Mutations
  const addTransactionMutation = useMutation({
    mutationFn: transactionsAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      onSuccess();
    },
  });

  const editTransactionMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsAPI.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      onSuccess();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const transactionData = {
      customer_id: customerId,
      product_id: productId,
      quantity,
      payment_mode: paymentMode,
      transaction_date: transactionDate.toISOString(),
      transaction_status: status,
      transaction_type: type,
      notes,
    };

    try {
      if (isEdit) {
        await editTransactionMutation.mutateAsync({ id: transaction.id, data: transactionData });
      } else {
        await addTransactionMutation.mutateAsync(transactionData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Customer</InputLabel>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              label="Customer"
              disabled={loading}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {customers?.customers?.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.phone})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Product</InputLabel>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              label="Product"
              disabled={loading}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {products?.products?.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Quantity"
            variant="outlined"
            size="small"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, e.target.value))}
            fullWidth
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">#</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              label="Payment Mode"
              disabled={loading}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="net_banking">Net Banking</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Transaction Date"
            variant="outlined"
            size="small"
            type="date"
            value={transactionDate.toISOString().split('T')[0]}
            onChange={(e) => setTransactionDate(new Date(e.target.value))}
            fullWidth
            disabled={loading}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
              disabled={loading}
            >
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              label="Type"
              disabled={loading}
            >
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="return">Return</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Notes"
            variant="outlined"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            disabled={loading}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            type="submit" 
            fullWidth 
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Transaction' : 'Create Transaction'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
