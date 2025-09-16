import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  Skeleton,
  Tabs,
  Tab,
  Fade
} from '@mui/material';
import {
  Add,
  Analytics,
  ViewModule,
  ViewList,
  Refresh
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Import existing components
import ProductAnalyticsCard from '../components/ProductEnhancements/ProductAnalyticsCard';
import RecommendationsCard from '../components/ProductEnhancements/RecommendationsCard';
import AdvancedFilters from '../components/ProductEnhancements/AdvancedFilters';

// Import existing functionality (you'll need to adapt these from your current Products.jsx)
import { productsAPI } from '../api/products';
import { NotificationContext } from '../contexts/NotificationContext';

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`products-tabpanel-${index}`}
      aria-labelledby={`products-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const EnhancedProducts = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useContext(NotificationContext);
  const navigate = useNavigate();

  // State for enhanced features
  const [activeTab, setActiveTab] = useState(0);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [purityFilter, setPurityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);

  // Enhanced queries
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['product-analytics'],
    queryFn: productsAPI.getAnalytics,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['product-recommendations'],
    queryFn: () => productsAPI.getRecommendations(null, 5),
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const { data: products, isLoading: productsLoading, error } = useQuery({
    queryKey: ['products', { searchTerm, categoryFilter, purityFilter, minPrice, maxPrice, tagFilter }],
    queryFn: () => productsAPI.searchProductsWithFilters({
      search: searchTerm,
      category: categoryFilter,
      purity: purityFilter,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      tags: tagFilter.length > 0 ? tagFilter.join(',') : undefined
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsAPI.getCategories,
  });

  const { data: purities } = useQuery({
    queryKey: ['product-purities'],
    queryFn: productsAPI.getPurities,
  });

  const { data: tags } = useQuery({
    queryKey: ['product-tags'],
    queryFn: productsAPI.getAllTags,
  });

  // Enhanced handlers
  const handleRefreshAnalytics = async () => {
    setRefreshingAnalytics(true);
    try {
      await queryClient.invalidateQueries(['product-analytics']);
      await queryClient.invalidateQueries(['product-recommendations']);
      showSnackbar?.('Analytics refreshed successfully', 'success');
    } catch {
      showSnackbar?.('Failed to refresh analytics', 'error');
    } finally {
      setRefreshingAnalytics(false);
    }
  };

  const handleViewProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleAddProduct = () => {
    navigate('/products/add');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPurityFilter('');
    setMinPrice('');
    setMaxPrice('');
    setTagFilter([]);
  };

  const handleSaveFilter = (filterData) => {
    const filterName = prompt('Enter a name for this filter:');
    if (filterName) {
      const newFilter = { ...filterData, name: filterName };
      const updated = [...savedFilters, newFilter];
      setSavedFilters(updated);
      localStorage.setItem('savedProductFilters', JSON.stringify(updated));
      showSnackbar?.('Filter saved successfully', 'success');
    }
  };

  const handleLoadFilter = (filter) => {
    setSearchTerm(filter.searchTerm || '');
    setCategoryFilter(filter.categoryFilter || '');
    setPurityFilter(filter.purityFilter || '');
    setMinPrice(filter.minPrice || '');
    setMaxPrice(filter.maxPrice || '');
    setTagFilter(filter.tagFilter || []);
    showSnackbar?.('Filter loaded successfully', 'success');
  };

  // Load saved filters on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedProductFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Tab configurations
  const tabs = [
    { label: 'All Products', icon: <ViewModule /> },
    { label: 'Analytics', icon: <Analytics /> }
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load products: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            Product Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefreshAnalytics}
              disabled={refreshingAnalytics}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ px: 3 }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{ textTransform: 'none', minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ px: 3 }}>
        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ProductAnalyticsCard
                analytics={analytics?.analytics}
                onRefresh={handleRefreshAnalytics}
                loading={analyticsLoading || refreshingAnalytics}
              />
            </Grid>
            <Grid item xs={12}>
              <RecommendationsCard
                recommendations={recommendations?.recommendations || []}
                onViewProduct={handleViewProduct}
                loading={recommendationsLoading}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={activeTab} index={0}>
          {/* Advanced Filters */}
          <AdvancedFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            purityFilter={purityFilter}
            setPurityFilter={setPurityFilter}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            categories={categories?.categories || []}
            purities={purities?.purities || []}
            tags={tags?.tags || []}
            onClearFilters={clearFilters}
            savedFilters={savedFilters}
            onSaveFilter={handleSaveFilter}
            onLoadFilter={handleLoadFilter}
          />

          {/* Products List */}
          {productsLoading ? (
            <Grid container spacing={2}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Skeleton variant="rectangular" height={300} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Fade in={!productsLoading} timeout={300}>
              <Box>
                {products?.products?.length === 0 ? (
                  <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No products found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {searchTerm || categoryFilter ? 'Try adjusting your search criteria' : 'Get started by adding your first product'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddProduct}
                    >
                      Add Product
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {products?.products?.map((product) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        {/* You would render your existing product card component here */}
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                          <Typography variant="h6" noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {product.sku}
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            ₹{product.selling_price?.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Stock: {product.stock_quantity}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Fade>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default EnhancedProducts;
