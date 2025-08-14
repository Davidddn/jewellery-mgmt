import React, { useState } from 'react';
import {
  Typography, Box, TextField, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, FormControlLabel, Switch, Avatar, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI } from '../api/products';
import { useAuth } from '../contexts/useAuth';

const Products = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [purityFilter, setPurityFilter] = useState('');
  const [errorAlert, setErrorAlert] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  
  // State for image handling
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState('');
  const [backImagePreview, setBackImagePreview] = useState('');

  // Define user permissions
  const canAdd = user.role === 'admin' || user.role === 'manager';
  const canEdit = user.role === 'admin' || user.role === 'manager' || user.role === 'inventory';
  const canDelete = user.role === 'admin';

  // Fetching data with filters
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['products', { searchTerm, purity: purityFilter }],
    queryFn: () => productsAPI.getProducts({ search: searchTerm, purity: purityFilter }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: productsAPI.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setAddDialogOpen(false);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to create product.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, productData }) => productsAPI.updateProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setEditDialogOpen(false);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to update product.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setDeleteDialogOpen(false);
    },
    onError: (err) => {
      setErrorAlert(err.response?.data?.message || 'Failed to delete product.');
      setDeleteDialogOpen(false);
    },
  });

  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleFilterChange = (event) => setPurityFilter(event.target.value);

  const handleImageChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'front') {
        setFrontImageFile(file);
        setFrontImagePreview(URL.createObjectURL(file));
      } else {
        setBackImageFile(file);
        setBackImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFormSubmit = (event, mutation, closeDialog, isEdit = false) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    
    formData.set('is_active', formElement.is_active.checked);
    if (frontImageFile) formData.append('image', frontImageFile); // Maps to 'image_url' on backend
    if (backImageFile) formData.append('back_image', backImageFile); // Requires backend support
    
    if (isEdit) {
      mutation.mutate({ id: editingProduct.id, productData: formData });
    } else {
      mutation.mutate(formData);
    }
    closeDialog();
  };
  
  const resetImageState = () => {
    setFrontImageFile(null);
    setBackImageFile(null);
    setFrontImagePreview('');
    setBackImagePreview('');
  };

  // Dialog handlers
  const handleOpenAddDialog = () => {
    resetImageState();
    setAddDialogOpen(true);
  };
  const handleCloseAddDialog = () => setAddDialogOpen(false);
  
  const handleOpenEditDialog = (product) => {
    resetImageState();
    setEditingProduct(product);
    setFrontImagePreview(product.image_url || '');
    setBackImagePreview(product.back_image_url || ''); // Assuming a back_image_url field
    setEditDialogOpen(true);
  };
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleOpenDeleteDialog = (id) => setDeletingProductId(id);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);
  const handleDeleteConfirm = () => deleteMutation.mutate(deletingProductId);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorAlert('Please select a file to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csv', selectedFile);

    try {
      const result = await productsAPI.uploadCSV(formData);
      setUploadResult(result);
      queryClient.invalidateQueries(['products']);
    } catch (error) {
      setErrorAlert(error.response?.data?.message || 'Failed to upload CSV.');
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
    }
  };

  const products = data?.products || [];

  // This form now reflects the fields in your seed-data.sql and Product.js model
  const renderProductForm = (product = {}) => (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} sm={6}><TextField name="name" label="Product Name" fullWidth required defaultValue={product.name} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="sku" label="SKU" fullWidth required defaultValue={product.sku} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="category" label="Category" fullWidth defaultValue={product.category} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="subcategory" label="Subcategory" fullWidth defaultValue={product.subcategory} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="barcode" label="Barcode" fullWidth defaultValue={product.barcode} /></Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Metal Type</InputLabel>
          <Select
            name="metal_type"
            label="Metal Type"
            defaultValue={product.metal_type || ''}
            required
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="Gold">Gold</MenuItem>
            <MenuItem value="Silver">Silver</MenuItem>
            <MenuItem value="Platinum">Platinum</MenuItem>
            <MenuItem value="Diamond">Diamond</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Purity</InputLabel>
          <Select
            name="purity"
            label="Purity"
            defaultValue={product.purity || ''}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="24K">24K</MenuItem>
            <MenuItem value="22K">22K</MenuItem>
            <MenuItem value="18K">18K</MenuItem>
            <MenuItem value="14K">14K</MenuItem>
            <MenuItem value="10K">10K</MenuItem>
            <MenuItem value="925">925 (Silver)</MenuItem>
            <MenuItem value="PT950">PT950 (Platinum)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}><TextField name="weight" label="Weight (grams)" type="number" fullWidth defaultValue={product.weight} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="stone_type" label="Stone Type" fullWidth defaultValue={product.stone_type} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="stone_weight" label="Stone Weight (carats)" type="number" fullWidth defaultValue={product.stone_weight} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="cost_price" label="Cost Price" type="number" fullWidth required defaultValue={product.cost_price} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="selling_price" label="Selling Price" type="number" fullWidth required defaultValue={product.selling_price} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="stock_quantity" label="Stock Quantity" type="number" fullWidth required defaultValue={product.stock_quantity} /></Grid>
      <Grid item xs={12} sm={6}><TextField name="reorder_level" label="Reorder Level" type="number" fullWidth defaultValue={product.reorder_level} /></Grid>
      <Grid item xs={12}><TextField name="supplier" label="Supplier" fullWidth defaultValue={product.supplier} /></Grid>
      <Grid item xs={12}><TextField name="description" label="Description" multiline rows={3} fullWidth defaultValue={product.description} /></Grid>
      
      {/* Dual Image Uploaders */}
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Product Image</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={frontImagePreview} sx={{ width: 80, height: 80 }} variant="rounded" />
          <Button variant="outlined" component="label" startIcon={<UploadIcon />}> Upload <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e, 'front')} /> </Button>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Background Image</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={backImagePreview} sx={{ width: 80, height: 80 }} variant="rounded" />
          <Button variant="outlined" component="label" startIcon={<UploadIcon />}> Upload <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(e, 'back')} /> </Button>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel control={<Switch name="is_active" defaultChecked={product.is_active !== false} />} label="Product Active" />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom>Products</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Purity</InputLabel>
            <Select value={purityFilter} label="Filter by Purity" onChange={handleFilterChange}>
              <MenuItem value=""><em>All</em></MenuItem>
              <MenuItem value="18K">18K</MenuItem>
              <MenuItem value="14K">14K</MenuItem>
              <MenuItem value="22K">22K</MenuItem>
              <MenuItem value="925">925 Silver</MenuItem>
              <MenuItem value="950">950 Platinum</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Search Products" variant="outlined" size="small" value={searchTerm} onChange={handleSearchChange} />
          {canAdd && <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>Add Product</Button>}
          {canAdd && <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadDialogOpen(true)}>Upload CSV</Button>}
        </Box>
      </Box>

      {errorAlert && <Alert severity="error" onClose={() => setErrorAlert('')} sx={{ mb: 2 }}>{errorAlert}</Alert>}
      {isLoading && <CircularProgress />}
      {queryError && !isLoading && <Alert severity="error">Failed to fetch products: {queryError.message}</Alert>}
      
      {!isLoading && !queryError && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Metal Type</TableCell>
                <TableCell>Purity</TableCell>
                <TableCell align="right">Selling Price (₹)</TableCell>
                <TableCell align="right">Stock</TableCell>
                {(canEdit || canDelete) && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.metal_type}</TableCell>
                  <TableCell>{product.purity}</TableCell>
                  <TableCell align="right">{parseFloat(product.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell align="right">{product.stock_quantity}</TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell align="center">
                      {canEdit && <IconButton onClick={() => handleOpenEditDialog(product)} color="primary"><EditIcon /></IconButton>}
                      {canDelete && <IconButton onClick={() => handleOpenDeleteDialog(product.id)} color="error"><DeleteIcon /></IconButton>}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Product Dialogs */}
      <Dialog open={addDialogOpen || editDialogOpen} onClose={editDialogOpen ? handleCloseEditDialog : handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editDialogOpen ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <Box component="form" onSubmit={(e) => handleFormSubmit(e, editDialogOpen ? updateMutation : createMutation, editDialogOpen ? handleCloseEditDialog : handleCloseAddDialog, editDialogOpen)}>
          <DialogContent>
            {renderProductForm(editDialogOpen ? editingProduct : {})}
          </DialogContent>
          <DialogActions>
            <Button onClick={editDialogOpen ? handleCloseEditDialog : handleCloseAddDialog}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {editDialogOpen ? (updateMutation.isLoading ? 'Saving...' : 'Save Changes') : (createMutation.isLoading ? 'Adding...' : 'Add Product')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this product? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={deleteMutation.isLoading}>
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload CSV Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload CSV</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select a CSV file to upload. The CSV should have a header row with column names matching the product fields.
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
      <Dialog open={!!uploadResult} onClose={() => setUploadResult(null)}>
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

export default Products;
