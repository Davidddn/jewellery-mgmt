import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Tabs, Tab, TextField, Button, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert
} from '@mui/material';
import { productsAPI } from '../api/products';

const initialForm = {
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
  discount_percentage: '',
  stock_quantity: '',
  reorder_level: '',
  supplier: '',
  is_active: true,
};

const Products = () => {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getProducts();
      setProducts(res.products || []);
    } catch {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 0) fetchProducts();
  }, [tab]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await productsAPI.createProduct({
        ...form,
        weight: form.weight ? parseFloat(form.weight) : null,
        stone_weight: form.stone_weight ? parseFloat(form.stone_weight) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : null,
        stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
        reorder_level: form.reorder_level ? parseInt(form.reorder_level) : null,
      });
      setSuccess('Product added successfully!');
      setForm(initialForm);
      fetchProducts();
      setTab(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Products
      </Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Product List" />
        <Tab label="Add New Jewelry" />
      </Tabs>
      {tab === 0 && (
        <Box>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Barcode</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Purity</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Selling Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id || p.sku}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell>{p.barcode}</TableCell>
                      <TableCell>{p.weight}</TableCell>
                      <TableCell>{p.purity}</TableCell>
                      <TableCell>{p.stock_quantity}</TableCell>
                      <TableCell>{p.selling_price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
      {tab === 1 && (
        <Box component="form" onSubmit={handleAddProduct} sx={{ maxWidth: 600, mt: 2 }}>
          <Grid container spacing={2}>
            {Object.keys(initialForm).map((key) => (
              key !== 'is_active' ? (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    name={key}
                    value={form[key]}
                    onChange={handleFormChange}
                    fullWidth
                  />
                </Grid>
              ) : null
            ))}
            <Grid item xs={12}>
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                />{' '}
                Active
              </label>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Jewelry'}
              </Button>
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            {success && (
              <Grid item xs={12}>
                <Alert severity="success">{success}</Alert>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Products; 