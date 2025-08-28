import React, { useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../api/categories';

const CategoryDialog = ({ open, onClose, onSave, initialData }) => {
  const [form, setForm] = useState(initialData || { name: '', description: '', image_url: '' });
  React.useEffect(() => {
    setForm(initialData || { name: '', description: '', image_url: '' });
  }, [initialData, open]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <DialogContent>
        <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mb: 2 }} />
        <TextField label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={2} sx={{ mb: 2 }} />
        <TextField label="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} fullWidth sx={{ mb: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

const Categories = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesAPI.getCategories
  });

  const createMutation = useMutation({
    mutationFn: categoriesAPI.createCategory,
    onSuccess: () => queryClient.invalidateQueries(['categories'])
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesAPI.updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries(['categories'])
  });
  const deleteMutation = useMutation({
    mutationFn: categoriesAPI.deleteCategory,
    onSuccess: () => queryClient.invalidateQueries(['categories'])
  });

  const handleSave = (form) => {
    if (editData) {
      updateMutation.mutate({ id: editData.id, data: form });
    } else {
      createMutation.mutate(form);
    }
    setDialogOpen(false);
    setEditData(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Categories</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => { setEditData(null); setDialogOpen(true); }}>Add Category</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
            ) : (
              data?.categories?.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell>{cat.description}</TableCell>
                  <TableCell>{cat.image_url ? <img src={cat.image_url} alt={cat.name} style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton onClick={() => { setEditData(cat); setDialogOpen(true); }}><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton color="error" onClick={() => deleteMutation.mutate(cat.id)}><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <CategoryDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditData(null); }} onSave={handleSave} initialData={editData} />
    </Box>
  );
};

export default Categories;
