import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
  Avatar,
  Autocomplete,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Download,
  GetApp,
  TableChart
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { productsAPI } from '../api/products';

const Products = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]); // ADD THIS
  const [availableTags, setAvailableTags] = useState([]); // ADD THIS
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    purity: '',
    minPrice: '',
    maxPrice: '',
    tags: '' // ADD THIS
  });

  // Image states
  const [mainImage, setMainImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [backImagePreview, setBackImagePreview] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      sku: '',
      barcode: '',
      weight: '',
      purity: '',
      metal_type: '',
      stone_type: '',
      stone_weight: '',
      cost_price: '',
      selling_price: '',
      discount_percentage: 0,
      stock_quantity: 0,
      reorder_level: 10,
      supplier: '',
      is_active: true,
      tags: []
    }
  });

  // Fetch products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => productsAPI.getProducts({ page, limit: 12, ...filters }),
    keepPreviousData: true
  });

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await productsAPI.getAllTags();
        if (response.success) {
          setAvailableTags(response.data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []); // Run once on component mount

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: (data) => {
      if (editingProduct) {
        return productsAPI.updateProduct(editingProduct.id, data);
      } else {
        return productsAPI.createProduct(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      handleClose();
    }
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: productsAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });

  const handleOpen = (product = null) => {
    setEditingProduct(product);
    if (product) {
      reset(product);
      setMainImagePreview(product.image_url ? `http://localhost:5000${product.image_url}` : '');
      setBackImagePreview(product.back_image_url ? `http://localhost:5000${product.back_image_url}` : '');
    } else {
      reset();
      setMainImagePreview('');
      setBackImagePreview('');
    }
    setMainImage(null);
    setBackImage(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setMainImage(null);
    setBackImage(null);
    setMainImagePreview('');
    setBackImagePreview('');
    reset();
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMainImage = () => {
    setMainImage(null);
    setMainImagePreview('');
  };

  const removeBackImage = () => {
    setBackImage(null);
    setBackImagePreview('');
  };

  const onSubmit = (data) => {
    const formData = new FormData();
    
    // Append all form data
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    
    // Append images
    if (mainImage) {
      formData.append('image', mainImage);
    }
    if (backImage) {
      formData.append('back_image', backImage);
    }
    
    productMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'tags') {
      setSelectedTags(value);
      setFilters(prev => ({ ...prev, [key]: value.join(',') }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      purity: '',
      minPrice: '',
      maxPrice: '',
      tags: ''
    });
    setSelectedTags([]);
    setPage(1);
  };

  // Add this state for loading
  const [exportingExcel, setExportingExcel] = useState(false);

  // Add this function
  const handleExcelExport = async () => {
    try {
      setExportingExcel(true);
      await productsAPI.exportExcel();
      // Optional: Show success message
      console.log('Excel export completed');
    } catch (error) {
      console.error('Excel export failed:', error);
      // Show error message to user
      alert('Failed to export Excel file. Please make sure you are logged in.');
    } finally {
      setExportingExcel(false);
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading products</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{ mr: 1 }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChart />}
            onClick={handleExcelExport}
            disabled={exportingExcel}
            sx={{ mr: 1 }}
          >
            {exportingExcel ? 'Exporting...' : 'Export Excel'}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Rings">Rings</MenuItem>
                  <MenuItem value="Necklaces">Necklaces</MenuItem>
                  <MenuItem value="Earrings">Earrings</MenuItem>
                  <MenuItem value="Bracelets">Bracelets</MenuItem>
                  <MenuItem value="Pendants">Pendants</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Purity</InputLabel>
                <Select
                  value={filters.purity}
                  label="Purity"
                  onChange={(e) => handleFilterChange('purity', e.target.value)}
                >
                  <MenuItem value="">All Purities</MenuItem>
                  <MenuItem value="24K">24K</MenuItem>
                  <MenuItem value="22K">22K</MenuItem>
                  <MenuItem value="18K">18K</MenuItem>
                  <MenuItem value="14K">14K</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                options={availableTags}
                value={selectedTags}
                onChange={(event, newValue) => handleFilterChange('tags', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Tags"
                    placeholder="Select tags..."
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button variant="outlined" onClick={clearFilters} size="small">
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {productsData?.products?.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}
              >
                {product.image_url ? (
                  <img
                    src={`http://localhost:5000${product.image_url}`}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'grey.300' }}>
                    <ImageIcon />
                  </Avatar>
                )}
              </CardMedia>
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap>
                  {product.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SKU: {product.sku}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {product.category && (
                    <Chip label={product.category} size="small" />
                  )}
                  {product.purity && (
                    <Chip label={product.purity} size="small" color="secondary" />
                  )}
                </Box>
                
                <Typography variant="body2" gutterBottom>
                  Weight: {product.weight}g
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  ₹{Number(product.selling_price).toLocaleString('en-IN')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Stock: {product.stock_quantity}
                </Typography>

                {/* Display Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {product.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
              
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                <IconButton
                  size="small"
                  onClick={() => handleOpen(product)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(product.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={productsData?.totalPages || 1}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Product Images
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Main Image */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Main Image
                      </Typography>
                      
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          mb: 1,
                          overflow: 'hidden'
                        }}
                      >
                        {mainImagePreview ? (
                          <>
                            <img
                              src={mainImagePreview}
                              alt="Main preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(255,255,255,0.8)'
                              }}
                              onClick={removeMainImage}
                              size="small"
                            >
                              <CloseIcon />
                            </IconButton>
                          </>
                        ) : (
                          <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                        )}
                      </Box>
                      
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<PhotoCameraIcon />}
                        size="small"
                      >
                        Choose Main Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleMainImageChange}
                        />
                      </Button>
                    </Box>
                  </Grid>
                  
                  {/* Back Image */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Back Image
                      </Typography>
                      
                      <Box
                        sx={{
                          width: '100%',
                          height: 200,
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          mb: 1,
                          overflow: 'hidden'
                        }}
                      >
                        {backImagePreview ? (
                          <>
                            <img
                              src={backImagePreview}
                              alt="Back preview"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'rgba(255,255,255,0.8)'
                              }}
                              onClick={removeBackImage}
                              size="small"
                            >
                              <CloseIcon />
                            </IconButton>
                          </>
                        ) : (
                          <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                        )}
                      </Box>
                      
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<PhotoCameraIcon />}
                        size="small"
                      >
                        Choose Back Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleBackImageChange}
                        />
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Basic Information */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Product name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Product Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="sku"
                  control={control}
                  rules={{ required: 'SKU is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="SKU"
                      error={!!errors.sku}
                      helperText={errors.sku?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        <MenuItem value="Rings">Rings</MenuItem>
                        <MenuItem value="Necklaces">Necklaces</MenuItem>
                        <MenuItem value="Earrings">Earrings</MenuItem>
                        <MenuItem value="Bracelets">Bracelets</MenuItem>
                        <MenuItem value="Pendants">Pendants</MenuItem>
                        <MenuItem value="Chains">Chains</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="subcategory"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Subcategory" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="purity"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Purity</InputLabel>
                      <Select {...field} label="Purity">
                        <MenuItem value="24K">24K</MenuItem>
                        <MenuItem value="22K">22K</MenuItem>
                        <MenuItem value="18K">18K</MenuItem>
                        <MenuItem value="14K">14K</MenuItem>
                        <MenuItem value="Silver">Silver</MenuItem>
                        <MenuItem value="Platinum">Platinum</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="metal_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Metal Type</InputLabel>
                      <Select {...field} label="Metal Type">
                        <MenuItem value="Gold">Gold</MenuItem>
                        <MenuItem value="Silver">Silver</MenuItem>
                        <MenuItem value="Platinum">Platinum</MenuItem>
                        <MenuItem value="White Gold">White Gold</MenuItem>
                        <MenuItem value="Rose Gold">Rose Gold</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="weight"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Weight (grams)"
                      type="number"
                      step="0.01"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="stone_type"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Stone Type" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="stone_weight"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Stone Weight (grams)"
                      type="number"
                      step="0.01"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="cost_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cost Price"
                      type="number"
                      step="0.01"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="selling_price"
                  control={control}
                  rules={{ required: 'Selling price is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Selling Price"
                      type="number"
                      step="0.01"
                      error={!!errors.selling_price}
                      helperText={errors.selling_price?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="discount_percentage"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Discount %"
                      type="number"
                      step="0.01"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="stock_quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Stock Quantity"
                      type="number"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="reorder_level"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Reorder Level"
                      type="number"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="supplier"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Supplier" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Barcode" />
                  )}
                />
              </Grid>

              {/* Tags Input */}
              <Grid item xs={12}>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      freeSolo
                      options={availableTags}
                      value={value || []}
                      onChange={(event, newValue) => onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          placeholder="Add tags (press Enter to add new tag)"
                          helperText="Add tags to help with search and categorization"
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={productMutation.isLoading}
            >
              {productMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                editingProduct ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Products;
