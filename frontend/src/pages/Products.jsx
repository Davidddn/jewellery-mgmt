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
  Avatar,
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
  Card,
  CardContent,
  CardMedia,
  CardActions,
  useTheme,
  useMediaQuery,
  Fab,
  SwipeableDrawer,
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
  SpeedDialIcon
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  GetApp,
  Visibility,
  Close,
  MoreVert,
  ShoppingCart,
  AttachMoney,
  Inventory,
  Publish
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { productsAPI } from '../api/products';
import { categoriesAPI } from '../api/categories';
import ImportModal from '../components/ImportModal';


import Autocomplete from '@mui/material/Autocomplete';

const Products = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [purityFilter, setPurityFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tagFilter, setTagFilter] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? 'card' : 'table');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);


  // Products query
  const { data: products, isLoading, error } = useQuery({
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

  // Mutations
  const deleteProductMutation = useMutation({
    mutationFn: productsAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });

  const exportMutation = useMutation({
    mutationFn: productsAPI.exportExcel,
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products.xlsx';
      link.click();
    },
  });

  // Filtered products
  const filteredProducts = products?.products || [];

  // Fetch tags for filter
  const { data: tagsData } = useQuery({
    queryKey: ['product-tags'],
    queryFn: productsAPI.getAllTags
  });

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getCategories
  });

  // Get categories from API and unique purities from products
  const categories = categoriesData?.categories || [];
  const purities = products?.products ? [...new Set(products.products.map(p => p.purity).filter(Boolean))] : [];
  const tags = tagsData?.data || [];

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProductMutation.mutateAsync(productId);
    }
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleOpenImportModal = () => {
    setImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    queryClient.invalidateQueries(['products']);
  };


  const getStockChipColor = (stock) => {
    if (stock <= 5) return 'error';
    if (stock <= 10) return 'warning';
    return 'success';
  };

  // Speed Dial Actions
  const speedDialActions = [
    { icon: <Add />, name: 'Add Product', onClick: handleAddProduct },
    { icon: <Publish />, name: 'Import Products', onClick: handleOpenImportModal },
    { icon: <GetApp />, name: 'Export Excel', onClick: handleExport },
    { icon: <FilterList />, name: 'Filters', onClick: () => setOpenDrawer(true) },
  ];

  // Mobile Card View
  const renderCardView = () => (
    <Grid container spacing={2} wrap="wrap" sx={{ width: '100%', m: 0 }}>
      {filteredProducts.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id} sx={{ display: 'flex' }}>
          <Card 
            elevation={isMobile ? 1 : 2}
            sx={{ 
              width: '100%',
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardMedia
              component="div"
              sx={{
                height: 140,
                background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ShoppingCart sx={{ fontSize: 40, opacity: 0.7 }} />
              )}
            </CardMedia>
            
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                noWrap 
                sx={{ fontSize: '1rem', fontWeight: 600, mb: 1 }}
              >
                {product.name}
              </Typography>
              

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                SKU: {product.sku}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoney sx={{ fontSize: 16, color: 'success.main' }} />
                <TableCell>
                <Typography variant="body2" fontWeight="600" color="success.main">
                  ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
                </Typography>
              </TableCell>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Inventory sx={{ fontSize: 16 }} />
                <Chip
                  label={`${product.stock_quantity || 0} in stock`}
                  size="small"
                  color={getStockChipColor(product.stock_quantity || 0)}
                />
              </Box>
              
              {product.category && (
                <Chip
                  label={product.category}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              )}
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={() => handleEditProduct(product)}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Mobile List View
  const renderListView = () => (
    <List>
      {filteredProducts.map((product, index) => (
        <React.Fragment key={product.id}>
          <ListItem
            sx={{ px: { xs: 1, sm: 2 } }}
          >
            <ListItemAvatar>
              <Avatar
                src={product.image_url}
                sx={{ 
                  bgcolor: 'primary.main',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 }
                }}
              >
                <ShoppingCart />
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body1" fontWeight="500">
                    {product.name}
                  </Typography>
                  <Chip
                    label={`₹${Number(product.selling_price || 0).toLocaleString('en-IN')}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              )}
              secondary={(
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    SKU: {product.sku} | Category: {product.category || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={`${product.stock_quantity || 0} in stock`}
                      size="small"
                      color={getStockChipColor(product.stock_quantity || 0)}
                    />
                  </Box>
                </Box>
              )}
            />
            
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleEditProduct(product)}
                sx={{ mr: 1 }}
              >
                <Edit />
              </IconButton>
              <IconButton
                edge="end"
                color="error"
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          {index < filteredProducts.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );

  // Desktop Table View
  const renderTableView = () => (
    <TableContainer component={Paper} elevation={1} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table stickyHeader sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell>
                <Avatar
                  src={product.image_url}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  <ShoppingCart />
                </Avatar>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="500">
                  {product.name}
                </Typography>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>
                {product.category && (
                  <Chip label={product.category} size="small" variant="outlined" />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="success.main" fontWeight="600">
                  ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={product.stock_quantity || 0}
                  size="small"
                  color={getStockChipColor(product.stock_quantity || 0)}
                />
              </TableCell>
              <TableCell>
                <IconButton
                  onClick={() => handleEditProduct(product)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteProduct(product.id)}
                  size="small"
                  color="error"
                >
                  <Delete />
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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Products</Typography>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">
          Failed to load products. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1, sm: 2, md: 3 },
      width: '100%',
      maxWidth: '1400px',
      mx: 'auto',
      boxSizing: 'border-box',
    }}>
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
          Products ({filteredProducts.length})
        </Typography>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
            <Button
              variant="outlined"
              startIcon={<Publish />}
              onClick={handleOpenImportModal}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              Export
            </Button>
          </Box>
        )}
      </Box>


      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
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
              }}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Purity</InputLabel>
              <Select
                value={purityFilter}
                label="Purity"
                onChange={(e) => setPurityFilter(e.target.value)}
              >
                <MenuItem value="">All Purities</MenuItem>
                {purities.map((purity) => (
                  <MenuItem key={purity} value={purity}>
                    {purity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              multiple
              options={tags}
              value={tagFilter}
              onChange={(_, value) => setTagFilter(value)}
              renderInput={(params) => (
                <TextField {...params} label="Tags" size={isMobile ? 'small' : 'medium'} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Min Price"
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ width: '50%' }}
              />
              <TextField
                label="Max Price"
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                size={isMobile ? 'small' : 'medium'}
                sx={{ width: '50%' }}
              />
            </Box>
          </Grid>
          {!isMobile && (
            <Grid item xs={12} md={1}>
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
          )}
        </Grid>
      </Paper>

      {/* Content */}
      {filteredProducts.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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
        <>
          {/* Desktop Table View */}
          {!isMobile && viewMode === 'table' && renderTableView()}
          
          {/* Card View (Mobile and Desktop) */}
          {(isMobile || viewMode === 'card') && renderCardView()}
          
          {/* Mobile List View Alternative */}
          {isMobile && (
            <Paper elevation={1} sx={{ mt: 2 }}>
              {renderListView()}
            </Paper>
          )}
        </>
      )}

      {/* Mobile Speed Dial */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Product actions"
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

      {/* Mobile Filter Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onOpen={() => setOpenDrawer(true)}
        disableSwipeToOpen
        PaperProps={{
          sx: { borderRadius: '16px 16px 0 0', maxHeight: '60vh' }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Purity</InputLabel>
            <Select
              value={purityFilter}
              label="Purity"
              onChange={(e) => setPurityFilter(e.target.value)}
            >
              <MenuItem value="">All Purities</MenuItem>
              {purities.map((purity) => (
                <MenuItem key={purity} value={purity}>
                  {purity}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            options={tags}
            value={tagFilter}
            onChange={(_, value) => setTagFilter(value)}
            renderInput={(params) => (
              <TextField {...params} label="Tags" sx={{ mb: 2 }} />
            )}
          />
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Min Price"
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              size={isMobile ? 'small' : 'medium'}
              sx={{ width: '50%' }}
            />
            <TextField
              label="Max Price"
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              size={isMobile ? 'small' : 'medium'}
              sx={{ width: '50%' }}
            />
          </Box>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setCategoryFilter('');
              setSearchTerm('');
              setPurityFilter('');
              setTagFilter([]);
              setMinPrice('');
              setMaxPrice('');
              setOpenDrawer(false);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* Product Dialog */}
      <ProductDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        product={selectedProduct}
        onSuccess={() => {
          setOpenDialog(false);
          queryClient.invalidateQueries(['products']);
        }}
      />
      <ImportModal
        open={importModalOpen}
        onClose={handleCloseImportModal}
        onSuccess={() => {
          handleCloseImportModal();
          queryClient.invalidateQueries(['products']);
        }}
      />
    </Box>
  );
};

// Product Dialog Component


const ProductDialog = ({ open, onClose, product, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    selling_price: '',
    stock_quantity: '',
    description: '',
    weight: '',
    purity: '',
    making_charges: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        selling_price: product.selling_price || '',
        stock_quantity: product.stock_quantity || '',
        description: product.description || '',
        weight: product.weight || '',
        purity: product.purity || '',
        making_charges: product.making_charges || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        selling_price: '',
        stock_quantity: '',
        description: '',
        weight: '',
        purity: '',
        making_charges: '',
      });
    }
    setError('');
  }, [product, open]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setLoading(false);
      setError('');
      onSuccess && onSuccess();
      onClose && onClose();
    },
    onError: (err) => {
      setLoading(false);
      setError(err?.response?.data?.message || err.message || 'Failed to update product');
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => productsAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setLoading(false);
      setError('');
      onSuccess && onSuccess();
      onClose && onClose();
    },
    onError: (err) => {
      setLoading(false);
      setError(err?.response?.data?.message || err.message || 'Failed to create product');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Use FormData for file/image support, else use plain object
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (product) {
      updateMutation.mutate({ id: product.id, data });
    } else {
      createMutation.mutate(data);
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
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
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
          {product ? 'Edit Product' : 'Add New Product'}
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        )}
      </DialogTitle>
      
  <form onSubmit={handleSubmit} encType="multipart/form-data">
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={handleChange('sku')}
                required
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={handleChange('category')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={formData.selling_price}
                onChange={handleChange('selling_price')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={handleChange('stock_quantity')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (grams)"
                type="number"
                value={formData.weight}
                onChange={handleChange('weight')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purity"
                value={formData.purity}
                onChange={handleChange('purity')}
                placeholder="e.g., 22K, 18K"
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Making Charges"
                type="number"
                value={formData.making_charges}
                onChange={handleChange('making_charges')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={isMobile ? 3 : 4}
                value={formData.description}
                onChange={handleChange('description')}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          {!isMobile && (
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            disabled={loading}
          >
            {loading ? (product ? 'Updating...' : 'Adding...') : (product ? 'Update Product' : 'Add Product')}
          </Button>
          {isMobile && (
            <Button 
              onClick={onClose}
              fullWidth
              size="large"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </DialogActions>
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </form>
    </Dialog>
  );
};

export default Products;
