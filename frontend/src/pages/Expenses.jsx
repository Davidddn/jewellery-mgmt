import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Pagination,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { expenseApi } from '../api/expenses';

const expenseCategories = [
  'Raw Materials',
  'Equipment',
  'Rent',
  'Utilities',
  'Marketing',
  'Staff',
  'Transportation',
  'Office Supplies',
  'Insurance',
  'Legal',
  'Other'
];

const ExpensePage = () => {
  const queryClient = useQueryClient();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    vendor: '',
    notes: ''
  });

  // Build query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    category: categoryFilter,
    startDate: dateRange.start,
    endDate: dateRange.end,
    sortBy,
    sortOrder
  }), [currentPage, pageSize, searchTerm, categoryFilter, dateRange, sortBy, sortOrder]);

  // Queries
  const {
    data: expensesData,
    isLoading,
    error: fetchError
  } = useQuery({
    queryKey: ['expenses', queryParams],
    queryFn: () => expenseApi.getExpenses(queryParams),
    keepPreviousData: true
  });

  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useQuery({
    queryKey: ['expense-analytics', { category: categoryFilter, ...dateRange }],
    queryFn: () => expenseApi.getAnalytics({ 
      category: categoryFilter, 
      start_date: dateRange.start, 
      end_date: dateRange.end 
    }),
    enabled: analyticsDialogOpen
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: expenseApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-analytics']);
      handleDialogClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => expenseApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-analytics']);
      handleDialogClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: expenseApi.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-analytics']);
    }
  });

  const exportMutation = useMutation({
    mutationFn: expenseApi.exportExpenses
  });

  // Event handlers
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: '',
      vendor: '',
      notes: ''
    });
  };

  const handleFormSubmit = async () => {
    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({ id: editingExpense.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || '',
      date: expense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      payment_method: expense.payment_method || '',
      vendor: expense.vendor || '',
      notes: expense.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handleDownload = async (format) => {
    try {
      await exportMutation.mutateAsync({ format, ...queryParams });
    } catch (error) {
      console.error('Error exporting expenses:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const expenses = expensesData?.expenses || [];
  const pagination = expensesData?.pagination || {};
  const loading = isLoading || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Expense Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            size="large"
          >
            Add Expense
          </Button>
        </Box>

        {/* Error Alert */}
        {fetchError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load expenses: {fetchError.message}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Total Expenses
                </Typography>
                <Typography variant="h4" color="primary">
                  {pagination.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(expenses.reduce((sum, exp) => sum + Number(exp.amount), 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Categories
                </Typography>
                <Typography variant="h4" color="info.main">
                  {new Set(expenses.map(exp => exp.category).filter(Boolean)).size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Avg. Amount
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(expenses.length ? 
                    expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) / expenses.length : 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Enhanced Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {expenseCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="amount">Amount</MenuItem>
                  <MenuItem value="description">Description</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button
                variant="outlined"
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                size="small"
                sx={{ minWidth: '50px' }}
              >
                {sortOrder === 'ASC' ? '↑' : '↓'}
              </Button>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min((currentPage - 1) * pageSize + 1, pagination.total || 0)} - {Math.min(currentPage * pageSize, pagination.total || 0)} of {pagination.total || 0} expenses
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                onClick={() => handleDownload('csv')}
                startIcon={<DownloadIcon />}
                variant="outlined"
              >
                CSV
              </Button>
              <Button
                size="small"
                onClick={() => handleDownload('pdf')}
                startIcon={<DownloadIcon />}
                variant="outlined"
              >
                PDF
              </Button>
              <Button
                size="small"
                onClick={() => setAnalyticsDialogOpen(true)}
                startIcon={<AnalyticsIcon />}
                variant="outlined"
              >
                Analytics
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Expenses Table */}
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No expenses found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {expense.description}
                        </Typography>
                        {expense.notes && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {expense.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <Chip 
                            label={expense.category} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Uncategorized
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {expense.vendor || '-'}
                        </Typography>
                        {expense.payment_method && (
                          <Chip 
                            label={expense.payment_method.toUpperCase()} 
                            size="small" 
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(expense)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(expense.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pb: 2 }}>
            <Pagination
              count={Math.ceil((pagination.total || 0) / pageSize)}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </Paper>

        {/* Analytics Dialog */}
        <Dialog
          open={analyticsDialogOpen}
          onClose={() => setAnalyticsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Expense Analytics
            <IconButton
              aria-label="close"
              onClick={() => setAnalyticsDialogOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {analyticsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : analytics?.analytics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Summary</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                      <Typography variant="h4" color="primary">
                        ₹{analytics.analytics.totalExpenses?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Count</Typography>
                      <Typography variant="h6">
                        {analytics.analytics.expensesByCategory?.reduce((total, cat) => total + parseInt(cat.count || 0), 0) || 0} expenses
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Categories</Typography>
                      <Typography variant="h6">
                        {analytics.analytics.expensesByCategory?.length || 0} categories
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>By Category</Typography>
                  <Box sx={{ height: 200, overflow: 'auto' }}>
                    <List dense>
                      {analytics.analytics.expensesByCategory?.map((item) => (
                        <ListItem key={item.category}>
                          <ListItemText
                            primary={item.category || 'Uncategorized'}
                            secondary={`₹${parseInt(item.total_amount || 0).toLocaleString()} (${item.count || 0} items)`}
                          />
                        </ListItem>
                      )) || []}
                    </List>
                  </Box>
                </Grid>
              </Grid>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Add/Edit Expense Dialog */}
        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    {expenseCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    label="Payment Method"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="upi">UPI</MenuItem>
                    <MenuItem value="cheque">Cheque</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading || !formData.description || !formData.amount || !formData.category}
            >
              {loading ? <CircularProgress size={20} /> : (editingExpense ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default ExpensePage;
