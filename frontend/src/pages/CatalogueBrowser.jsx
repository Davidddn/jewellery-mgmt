// src/pages/CatalogueBrowser.jsx
// Public catalogue browser for all products
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Box,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
  Slider,
  IconButton,
  AppBar,
  Toolbar,
  InputAdornment
} from '@mui/material';
import {
  GridView,
  ViewList,
  Search,
  WhatsApp,
  FilterList,
  Close,
  Phone,
  Email
} from '@mui/icons-material';
import { productsAPI } from '../api/products';

const CatalogueBrowser = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  // Load data
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  }, [searchTerm, selectedCategory, page, setSearchParams]);

  const loadProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      // Handle the API response structure - data.products contains the array
      const productsArray = data?.products || data || [];
      setProducts(productsArray);
      
      // Calculate max price for slider
      const prices = productsArray.map(p => p.selling_price || 0);
      const max = Math.max(...prices, 0); // Add fallback to 0
      setMaxPrice(max);
      setPriceRange([0, max]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        // Handle categories API response structure
        const categoriesArray = data?.categories || data || [];
        setCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        product.category_id?.toString() === selectedCategory;
      
      const matchesPrice = product.selling_price >= priceRange[0] && 
        product.selling_price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price_low':
          return (a.selling_price || 0) - (b.selling_price || 0);
        case 'price_high':
          return (b.selling_price || 0) - (a.selling_price || 0);
        case 'newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleProductClick = (productId) => {
    navigate(`/catalogue/${productId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  const getProductImage = (product) => {
    if (product.image_url) {
      return product.image_url.startsWith('http') 
        ? product.image_url 
        : `http://localhost:5000${product.image_url}`;
    }
    return '/placeholder-product.svg';
  };

  const handleWhatsAppInquiry = () => {
    const message = "Hi! I'm interested in your jewellery collection. Could you please provide more information?";
    const phone = "1234567890"; // Replace with actual business WhatsApp number
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ 
        backgroundColor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h6" align="center">Loading catalogue...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Jewellery Catalogue
          </Typography>
          <IconButton color="inherit" onClick={() => setShowFilters(!showFilters)}>
            <FilterList />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ 
        py: 3, 
        backgroundColor: 'background.default'
      }}>
        {/* Search and Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="price_low">Price: Low to High</MenuItem>
                  <MenuItem value="price_high">Price: High to Low</MenuItem>
                  <MenuItem value="newest">Newest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newView) => newView && setViewMode(newView)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridView />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} products
              </Typography>
            </Grid>
          </Grid>

          {/* Price Range Filter */}
          {showFilters && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography gutterBottom>Price Range</Typography>
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={maxPrice}
                step={1000}
                valueLabelFormat={(value) => formatPrice(value)}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2">{formatPrice(priceRange[0])}</Typography>
                <Typography variant="body2">{formatPrice(priceRange[1])}</Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Active Filters */}
        {(searchTerm || selectedCategory) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Active Filters:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchTerm && (
                <Chip 
                  label={`Search: ${searchTerm}`} 
                  onDelete={() => setSearchTerm('')}
                  size="small"
                />
              )}
              {selectedCategory && (
                <Chip 
                  label={`Category: ${categories.find(c => c.id.toString() === selectedCategory)?.name || selectedCategory}`}
                  onDelete={() => setSelectedCategory('')}
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Products Grid */}
        <Grid container spacing={viewMode === 'grid' ? 3 : 2}>
          {paginatedProducts.map((product) => (
            <Grid 
              item 
              xs={12} 
              sm={viewMode === 'grid' ? 6 : 12} 
              md={viewMode === 'grid' ? 4 : 12} 
              lg={viewMode === 'grid' ? 3 : 12}
              key={product.id}
            >
              <Card 
                elevation={3}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  },
                  display: viewMode === 'list' ? 'flex' : 'block',
                  height: viewMode === 'list' ? 120 : 'auto'
                }}
                onClick={() => handleProductClick(product.id)}
              >
                <CardMedia
                  component="img"
                  height={viewMode === 'grid' ? 200 : 120}
                  image={getProductImage(product)}
                  alt={product.name}
                  sx={{ 
                    objectFit: 'cover',
                    width: viewMode === 'list' ? 120 : '100%',
                    flexShrink: 0
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography 
                    variant={viewMode === 'grid' ? 'h6' : 'body1'} 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {product.name}
                  </Typography>
                  
                  {product.sku && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      SKU: {product.sku}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="h6" 
                    component="p" 
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  >
                    {formatPrice(product.selling_price)}
                  </Typography>
                  
                  {viewMode === 'list' && product.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mt: 1
                      }}
                    >
                      {product.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
              size="large"
            />
          </Box>
        )}

        {/* Contact Information */}
        <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            Need Help? Contact Us
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Button
              startIcon={<Phone />}
              variant="outlined"
              href="tel:+1234567890"
            >
              Call Us
            </Button>
            <Button
              startIcon={<Email />}
              variant="outlined"
              href="mailto:info@jewellery.com"
            >
              Email Us
            </Button>
            <Button
              startIcon={<WhatsApp />}
              variant="contained"
              color="success"
              onClick={handleWhatsAppInquiry}
            >
              WhatsApp
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Floating WhatsApp Button */}
      <Fab
        color="success"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#25D366',
          '&:hover': {
            bgcolor: '#1DA851'
          }
        }}
        onClick={handleWhatsAppInquiry}
      >
        <WhatsApp />
      </Fab>
    </Box>
  );
};

export default CatalogueBrowser;
