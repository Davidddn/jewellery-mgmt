import React, { useState } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Select, MenuItem, InputLabel,
  FormControl,
} from '@mui/material';
import { Download, TableChart } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../api/reports';
import DownloadModal from '../components/DownloadModal'; // Import DownloadModal
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Label,
} from 'recharts';
import { productsAPI } from '../api/products'; // Import productsAPI

// Helper to format currency
const formatCurrency = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Reports = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [exportingExcel, setExportingExcel] = useState(false); // State for Excel exporting

  // State for filters
  const [salesFilters, setSalesFilters] = useState({ type: 'all', start_date: '', end_date: '', name: '' });
  const [inventoryFilters, setInventoryFilters] = useState({ type: 'all', category: '' });
  const [customerFilters, setCustomerFilters] = useState({ type: 'all', start_date: '', end_date: '', name: '' });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // --- Filter Change Handlers ---
  const handleSalesFilterChange = (e) => {
    const { name, value } = e.target;
    setSalesFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleInventoryFilterChange = (e) => {
    const { name, value } = e.target;
    setInventoryFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleCustomerFilterChange = (e) => {
    const { name, value } = e.target;
    setCustomerFilters(prev => ({ ...prev, [name]: value }));
  };

  // --- Data Fetching Hooks ---
  const { data: salesData, isLoading: isSalesLoading, error: salesError } = useQuery({
    queryKey: ['salesReport', salesFilters],
    queryFn: () => reportsAPI.getSalesAnalytics(salesFilters),
    enabled: currentTab === 0,
  });

  const { data: inventoryData, isLoading: isInventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['inventoryReport', inventoryFilters],
    queryFn: () => reportsAPI.getInventoryReports(inventoryFilters),
    enabled: currentTab === 1,
  });

  const { data: customerData, isLoading: isCustomerLoading, error: customerError } = useQuery({
    queryKey: ['customerReport', customerFilters],
    queryFn: () => reportsAPI.getCustomerAnalytics(customerFilters),
    enabled: currentTab === 2,
  });

  const handleDownload = async (params) => {
    setDownloadError(null);
    try {
        switch (currentTab) {
            case 0: await reportsAPI.downloadSalesReport(params, downloadFormat); break;
            case 1: await reportsAPI.downloadInventoryReport(params, downloadFormat); break;
            case 2: await reportsAPI.downloadCustomerReport(params, downloadFormat); break;
            default: break;
        }
    } catch (error) {
        console.error("Download failed", error);
        setDownloadError('Failed to download report. Please try again.');
    }
  };

  const salesDownloadOptions = [
    { value: 'all', label: 'All Sales' },
    { value: 'date_range', label: 'Sales by Date Range', needsDateRange: true },
    { value: 'lowest', label: 'Lowest Sales (by amount)' },
  ];
  const inventoryDownloadOptions = [
    { value: 'all', label: 'All Inventory' },
    { value: 'low_stock', label: 'Low Stock Items' },
    { value: 'category', label: 'Inventory by Category', needsTextInput: true, textInputLabel: 'Category Name', textInputName: 'category' },
  ];
  const customerDownloadOptions = [
    { value: 'all', label: 'All Customers' },
    { value: 'date', label: 'Customers by Join Date', needsDateRange: true },
    { value: 'name', label: 'Search by Customer Name', needsTextInput: true, textInputLabel: 'Customer Name', textInputName: 'name' },
    { value: 'most_purchases', label: 'Top Customers (by spending)' },
  ];

  const getDownloadOptions = () => {
      switch(currentTab) {
          case 0: return salesDownloadOptions;
          case 1: return inventoryDownloadOptions;
          case 2: return customerDownloadOptions;
          default: return [];
      }
  }
  const getModalTitle = () => {
    switch(currentTab) {
        case 0: return "Download Sales Report";
        case 1: return "Download Inventory Report";
        case 2: return "Download Customer Report";
        default: return "Download Report";
    }
  }

  // Add similar Excel export functionality to the Reports page
  const handleProductsExcelExport = async () => {
    try {
      setExportingExcel(true);
      await productsAPI.exportExcel();
      console.log('Products Excel export completed');
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export Excel file. Please make sure you are logged in.');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Download Format</InputLabel>
            <Select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              label="Download Format"
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Download />} onClick={() => setModalOpen(true)}>
            Download Report
          </Button>
        </Box>
      </Box>
      
      {downloadError && <Alert severity="error" onClose={() => setDownloadError(null)}>{downloadError}</Alert>}

      <Paper>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Sales Report" />
          <Tab label="Inventory Report" />
          <Tab label="Customer Analytics" />
        </Tabs>

        {/* Sales Report Panel */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Filter By</InputLabel>
              <Select value={salesFilters.type} name="type" label="Filter By" onChange={handleSalesFilterChange}>
                <MenuItem value="all">All Sales</MenuItem>
                <MenuItem value="lowest">Lowest Sales</MenuItem>
                <MenuItem value="date_range">Date Range</MenuItem>
              </Select>
            </FormControl>
            {salesFilters.type === 'date_range' && (
              <>
                <TextField name="start_date" label="Start Date" type="date" value={salesFilters.start_date} onChange={handleSalesFilterChange} InputLabelProps={{ shrink: true }} />
                <TextField name="end_date" label="End Date" type="date" value={salesFilters.end_date} onChange={handleSalesFilterChange} InputLabelProps={{ shrink: true }} />
              </>
            )}
          </Box>
          {isSalesLoading && <CircularProgress />}
          {salesError && <Alert severity="error">Failed to load sales data: {salesError.message}</Alert>}
          {salesData && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">Sales Overview</Typography>
                <Paper sx={{ p: 2, mt: 2, height: { xs: 300, md: 500 },width: { xs: 300, md: 1150 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData.report?.dailySales} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatCurrency}>
                        <Label value="Total Sales (₹)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                      </YAxis>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="total_sales" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Sales" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 4 }}>Sales Details</Typography>
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData.report?.sales && salesData.report.sales.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.totalQuantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Inventory Report Panel */}
        <TabPanel value={currentTab} index={1}>
           <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Filter By</InputLabel>
              <Select value={inventoryFilters.type} name="type" label="Filter By" onChange={handleInventoryFilterChange}>
                <MenuItem value="all">All Inventory</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="category">By Category</MenuItem>
              </Select>
            </FormControl>
            {inventoryFilters.type === 'category' && (
              <TextField name="category" label="Category Name" value={inventoryFilters.category} onChange={handleInventoryFilterChange} />
            )}
          </Box>
          {isInventoryLoading && <CircularProgress />}
          {inventoryError && <Alert severity="error">Failed to load inventory data: {inventoryError.message}</Alert>}
          {inventoryData && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6">Stock by Category</Typography>
                <Paper sx={{ p: 2, mt: 2, height: { xs: 300, md: 500 }, width: { xs: 300, md: 1150 } }}><ResponsiveContainer width="100%" height="100%"><BarChart data={inventoryData.report?.categoryBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis><Label value="Total Stock" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} /></YAxis><Tooltip /><Legend /><Bar dataKey="totalStock" fill="#82ca9d" name="Total Stock" /></BarChart></ResponsiveContainer></Paper>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ mt: 4 }}>Products</Typography>
                <TableContainer component={Paper} sx={{ mt: 2 }}><Table stickyHeader><TableHead><TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell align="right">Stock</TableCell><TableCell align="right">Price</TableCell></TableRow></TableHead><TableBody>{inventoryData.report?.products && inventoryData.report.products.map((product) => (<TableRow key={product.id}><TableCell>{product.name}</TableCell><TableCell>{product.category}</TableCell><TableCell align="right">{product.stock_quantity}</TableCell><TableCell align="right">{formatCurrency(product.selling_price)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Customer Analytics Panel */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Filter By</InputLabel>
              <Select value={customerFilters.type} name="type" label="Filter By" onChange={handleCustomerFilterChange}>
                <MenuItem value="all">All Customers</MenuItem>
                <MenuItem value="most_purchases">Top Customers</MenuItem>
                <MenuItem value="date">By Join Date</MenuItem>
                <MenuItem value="name">By Name</MenuItem>
              </Select>
            </FormControl>
            {customerFilters.type === 'date' && (
              <>
                <TextField name="start_date" label="Start Date" type="date" value={customerFilters.start_date} onChange={handleCustomerFilterChange} InputLabelProps={{ shrink: true }} />
                <TextField name="end_date" label="End Date" type="date" value={customerFilters.end_date} onChange={handleCustomerFilterChange} InputLabelProps={{ shrink: true }} />
              </>
            )}
            {customerFilters.type === 'name' && (
              <TextField name="name" label="Customer Name" value={customerFilters.name} onChange={handleCustomerFilterChange} />
            )}
          </Box>
          {isCustomerLoading && <CircularProgress />}
          {customerError && <Alert severity="error">Failed to load customer data: {customerError.message}</Alert>}
          {customerData && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6">Customers</Typography>
                <TableContainer component={Paper} sx={{ mt: 2 }}><Table><TableHead><TableRow><TableCell>Customer Name</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell align="right">Total Spent</TableCell></TableRow></TableHead><TableBody>{customerData.analytics?.customers && customerData.analytics.customers.map((customer) => (<TableRow key={customer.id}><TableCell>{customer.name}</TableCell><TableCell>{customer.email}</TableCell><TableCell>{customer.phone}</TableCell><TableCell align="right">{formatCurrency(customer.total_spent)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>

      <DownloadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDownload={handleDownload}
        options={getDownloadOptions()}
        title={getModalTitle()}
      />

      {/* Add button for Excel export */}
      <Button
        variant="contained"
        startIcon={<TableChart />}
        onClick={handleProductsExcelExport}
        disabled={exportingExcel}
        sx={{ mb: 2 }}
      >
        {exportingExcel ? 'Exporting...' : 'Export Products to Excel'}
      </Button>
    </Box>
  );
};

export default Reports;