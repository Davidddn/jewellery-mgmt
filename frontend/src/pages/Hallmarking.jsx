import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hallmarkingAPI } from '../api/hallmarking';
import { productsAPI } from '../api/products';

const Hallmarking = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHallmark, setEditingHallmark] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['hallmarking'],
    queryFn: hallmarkingAPI.getHallmarking, // Corrected function name
  });
  
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productsAPI.getProducts() });

  const createMutation = useMutation({
    mutationFn: hallmarkingAPI.createHallmarking,
    onSuccess: () => {
      queryClient.invalidateQueries(['hallmarking']);
      setDialogOpen(false);
    }
  });

  const handleOpenDialog = (hallmark = null) => {
    setEditingHallmark(hallmark);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);
  
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    createMutation.mutate(data);
  };

  const hallmarks = data?.hallmarking || [];
  const products = productsData?.products || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Hallmarking</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>Add Hallmark</Button>
      </Box>
      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error.message}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Hallmark Number</TableCell>
              <TableCell>Authority</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hallmarks.map((hallmark) => (
              <TableRow key={hallmark.id}>
                <TableCell>{hallmark.Product?.name}</TableCell>
                <TableCell>{hallmark.hallmark_number}</TableCell>
                <TableCell>{hallmark.certifying_authority}</TableCell>
                <TableCell>{new Date(hallmark.certification_date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingHallmark ? 'Edit' : 'Add'} Hallmark</DialogTitle>
        <Box component="form" onSubmit={handleFormSubmit}>
            <DialogContent>
                <TextField select label="Product" name="product_id" fullWidth required sx={{ mb: 2 }} SelectProps={{ native: true }}>
                    <option value=""></option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </TextField>
                <TextField label="Hallmark Number" name="hallmark_number" fullWidth required sx={{ mb: 2 }} />
                <TextField label="Certifying Authority" name="certifying_authority" fullWidth sx={{ mb: 2 }} />
                <TextField label="Certification Date" name="certification_date" type="date" fullWidth InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Hallmarking;
