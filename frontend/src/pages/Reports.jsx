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
  Select, 
  MenuItem, 
  InputLabel,
  FormControl,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import { Download, TableChart, Assessment, TrendingUp } from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
    <Box sx={{ p: isMobile ? 1 : 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        mb: 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: isMobile ? 1 : 0
        }}>
          <Assessment color="primary" sx={{ fontSize: isMobile ? 28 : 32 }} />
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
            Reports
          </Typography>
        </Box>
        
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          spacing={isMobile ? 1.5 : 2} 
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          <FormControl sx={{ minWidth: isMobile ? '100%' : 150 }}>
            <InputLabel>Download Format</InputLabel>
            <Select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              label="Download Format"
              size={isMobile ? "medium" : "medium"}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<Download />} 
            onClick={() => setModalOpen(true)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
          >
            Download Report
          </Button>
        </Stack>
      </Box>
      
      {downloadError && (
        <Alert 
          severity="error" 
          onClose={() => setDownloadError(null)}
          sx={{ mb: 2 }}
        >
          {downloadError}
        </Alert>
      )}

      <Paper 
        elevation={isMobile ? 1 : 2}
        sx={{ 
          overflow: 'hidden',
          borderRadius: isMobile ? 2 : 1
        }}
      >
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile={isMobile}
          sx={{
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.875rem' : '0.9375rem',
              minWidth: isMobile ? 120 : 'auto',
              py: isMobile ? 1.5 : 1
            }
          }}
        >
          <Tab 
            label="Sales Report" 
            icon={<TrendingUp />} 
            iconPosition={isMobile ? "top" : "start"}
          />
          <Tab 
            label="Inventory Report" 
            icon={<TableChart />} 
            iconPosition={isMobile ? "top" : "start"}
          />
          <Tab 
            label="Customer Analytics" 
            icon={<Assessment />} 
            iconPosition={isMobile ? "top" : "start"}
          />
        </Tabs>

        {/* Sales Report Panel */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: isMobile ? 2 : 3 }}>
            {/* Filters */}
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={2} 
              sx={{ mb: 3 }}
              alignItems={isMobile ? 'stretch' : 'center'}
            >
              <FormControl sx={{ minWidth: isMobile ? '100%' : 150 }}>
                <InputLabel>Filter By</InputLabel>
                <Select 
                  value={salesFilters.type} 
                  name="type" 
                  label="Filter By" 
                  onChange={handleSalesFilterChange}
                  size={isMobile ? "medium" : "medium"}
                >
                  <MenuItem value="all">All Sales</MenuItem>
                  <MenuItem value="lowest">Lowest Sales</MenuItem>
                  <MenuItem value="date_range">Date Range</MenuItem>
                </Select>
              </FormControl>
              {salesFilters.type === 'date_range' && (
                <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ width: isMobile ? '100%' : 'auto' }}>
                  <TextField 
                    name="start_date" 
                    label="Start Date" 
                    type="date" 
                    value={salesFilters.start_date} 
                    onChange={handleSalesFilterChange} 
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "medium" : "medium"}
                    sx={{ width: isMobile ? '100%' : 'auto' }}
                  />
                  <TextField 
                    name="end_date" 
                    label="End Date" 
                    type="date" 
                    value={salesFilters.end_date} 
                    onChange={handleSalesFilterChange} 
                    InputLabelProps={{ shrink: true }}
                    size={isMobile ? "medium" : "medium"}
                    sx={{ width: isMobile ? '100%' : 'auto' }}
                  />
                </Stack>
              )}
            </Stack>

            {/* Loading and Error States */}
            {isSalesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
            
            {salesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load sales data: {salesError.message}
              </Alert>
            )}

            {/* Sales Data */}
            {salesData && (
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid item xs={12}>
                  <Card elevation={isMobile ? 1 : 2}>
                    <CardContent>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 2 
                      }}>
                        <TrendingUp color="primary" />
                        <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                          Sales Overview
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        height: isMobile ? 250 : 400,
                        width: '100%',
                        mt: 2
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={salesData.report?.dailySales} 
                            margin={{ 
                              top: 5, 
                              right: isMobile ? 10 : 30, 
                              left: isMobile ? 10 : 50, 
                              bottom: 5 
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              fontSize={isMobile ? 10 : 12}
                              tick={{ fontSize: isMobile ? 10 : 12 }}
                            />
                            <YAxis 
                              tickFormatter={formatCurrency}
                              fontSize={isMobile ? 10 : 12}
                              tick={{ fontSize: isMobile ? 10 : 12 }}
                            >
                              {!isMobile && (
                                <Label 
                                  value="Total Sales (₹)" 
                                  angle={-90} 
                                  position="insideLeft" 
                                  style={{ textAnchor: 'middle' }} 
                                />
                              )}
                            </YAxis>
                            <Tooltip 
                              formatter={(value) => formatCurrency(value)}
                              labelStyle={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                              contentStyle={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total_sales" stroke="#8884d8" activeDot={{ r: 8 }} name="Total Sales" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card elevation={isMobile ? 1 : 2}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                        Sales Details
                      </Typography>
                      <Box sx={{ 
                        overflowX: 'auto',
                        '& .MuiTableContainer-root': {
                          borderRadius: 1
                        }
                      }}>
                        <TableContainer component={Paper} sx={{ 
                          mt: 2, 
                          maxHeight: isMobile ? 300 : 400,
                          minWidth: { xs: 500, md: 'auto' }
                        }}>
                          <Table stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  Date
                                </TableCell>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  Product Name
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  Quantity
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  Amount
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {salesData.report?.sales && salesData.report.sales.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    {new Date(item.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    <Typography variant="body2" noWrap sx={{ 
                                      maxWidth: { xs: '120px', md: '200px' },
                                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                                    }}>
                                      {item.productName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    {item.totalQuantity}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                    {formatCurrency(item.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Inventory Report Panel */}
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3, 
            flexWrap: 'wrap', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Filter By</InputLabel>
              <Select 
                value={inventoryFilters.type} 
                name="type" 
                label="Filter By" 
                onChange={handleInventoryFilterChange}
                size={isMobile ? "medium" : "medium"}
              >
                <MenuItem value="all">All Inventory</MenuItem>
                <MenuItem value="low_stock">Low Stock</MenuItem>
                <MenuItem value="category">By Category</MenuItem>
              </Select>
            </FormControl>
            {inventoryFilters.type === 'category' && (
              <TextField 
                name="category" 
                label="Category Name" 
                value={inventoryFilters.category} 
                onChange={handleInventoryFilterChange}
                size={isMobile ? "medium" : "medium"}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
            )}
          </Box>
          
          {isInventoryLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {inventoryError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load inventory data: {inventoryError.message}
            </Alert>
          )}
          
          {inventoryData && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <Card elevation={isMobile ? 1 : 2}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      Stock by Category
                    </Typography>
                    <Box sx={{ 
                      height: isMobile ? 250 : 400,
                      width: '100%',
                      mt: 2
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={inventoryData.report?.categoryBreakdown} 
                          margin={{ 
                            top: 5, 
                            right: isMobile ? 10 : 30, 
                            left: isMobile ? 10 : 20, 
                            bottom: 5 
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="category" 
                            fontSize={isMobile ? 10 : 12}
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                          />
                          <YAxis 
                            fontSize={isMobile ? 10 : 12}
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                          >
                            {!isMobile && (
                              <Label 
                                value="Total Stock" 
                                angle={-90} 
                                position="insideLeft" 
                                style={{ textAnchor: 'middle' }} 
                              />
                            )}
                          </YAxis>
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="totalStock" fill="#82ca9d" name="Total Stock" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card elevation={isMobile ? 1 : 2}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mt: 2, mb: 2, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      Products
                    </Typography>
                    <Box sx={{ 
                      overflowX: 'auto',
                      '& .MuiTableContainer-root': {
                        borderRadius: 1
                      }
                    }}>
                      <TableContainer component={Paper} sx={{ 
                        mt: 2,
                        minWidth: { xs: 500, md: 'auto' }
                      }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Product
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Category
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Stock
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Price
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {inventoryData.report?.products && inventoryData.report.products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  <Typography variant="body2" noWrap sx={{ 
                                    maxWidth: { xs: '120px', md: '200px' },
                                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                                  }}>
                                    {product.name}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  {product.category}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  {product.stock_quantity}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  {formatCurrency(product.selling_price)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Customer Analytics Panel */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3, 
            flexWrap: 'wrap', 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel>Filter By</InputLabel>
              <Select 
                value={customerFilters.type} 
                name="type" 
                label="Filter By" 
                onChange={handleCustomerFilterChange}
                size={isMobile ? "medium" : "medium"}
              >
                <MenuItem value="all">All Customers</MenuItem>
                <MenuItem value="most_purchases">Top Customers</MenuItem>
                <MenuItem value="date">By Join Date</MenuItem>
                <MenuItem value="name">By Name</MenuItem>
              </Select>
            </FormControl>
            {customerFilters.type === 'date' && (
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <TextField 
                  name="start_date" 
                  label="Start Date" 
                  type="date" 
                  value={customerFilters.start_date} 
                  onChange={handleCustomerFilterChange} 
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? "medium" : "medium"}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                />
                <TextField 
                  name="end_date" 
                  label="End Date" 
                  type="date" 
                  value={customerFilters.end_date} 
                  onChange={handleCustomerFilterChange} 
                  InputLabelProps={{ shrink: true }}
                  size={isMobile ? "medium" : "medium"}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                />
              </Stack>
            )}
            {customerFilters.type === 'name' && (
              <TextField 
                name="name" 
                label="Customer Name" 
                value={customerFilters.name} 
                onChange={handleCustomerFilterChange}
                size={isMobile ? "medium" : "medium"}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
            )}
          </Box>
          
          {isCustomerLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {customerError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load customer data: {customerError.message}
            </Alert>
          )}
          
          {customerData && (
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <Card elevation={isMobile ? 1 : 2}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                      Customers
                    </Typography>
                    <Box sx={{ 
                      overflowX: 'auto',
                      '& .MuiTableContainer-root': {
                        borderRadius: 1
                      }
                    }}>
                      <TableContainer component={Paper} sx={{ 
                        mt: 2,
                        minWidth: { xs: 600, md: 'auto' }
                      }}>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Customer Name
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Email
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Phone
                              </TableCell>
                              <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                Total Spent
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerData.analytics?.customers && customerData.analytics.customers.map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  <Typography variant="body2" noWrap sx={{ 
                                    maxWidth: { xs: '120px', md: '200px' },
                                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                                  }}>
                                    {customer.name}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  <Typography variant="body2" noWrap sx={{ 
                                    maxWidth: { xs: '150px', md: '250px' },
                                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                                  }}>
                                    {customer.email}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  {customer.phone}
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                  {formatCurrency(customer.total_spent)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </Card>
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