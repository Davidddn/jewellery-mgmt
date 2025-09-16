import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, useMediaQuery, Card, CardContent, Grid, Chip, Stack, Fab, IconButton, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon, Verified as VerifiedIcon, Search as SearchIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hallmarkingAPI } from '../api/hallmarking';
import { productsAPI } from '../api/products';

const Hallmarking = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHallmark, setEditingHallmark] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedHallmark, setSelectedHallmark] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['hallmarking'],
    queryFn: hallmarkingAPI.getHallmarking,
  });
  
  const { data: productsData } = useQuery({ 
    queryKey: ['products'], 
    queryFn: () => productsAPI.getProducts() 
  });

  const createMutation = useMutation({
    mutationFn: hallmarkingAPI.createHallmarking,
    onSuccess: () => {
      queryClient.invalidateQueries(['hallmarking']);
      setDialogOpen(false);
      setEditingHallmark(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => hallmarkingAPI.updateHallmarking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['hallmarking']);
      setDialogOpen(false);
      setEditingHallmark(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: hallmarkingAPI.deleteHallmarking,
    onSuccess: () => {
      queryClient.invalidateQueries(['hallmarking']);
      handleCloseMenu();
    }
  });

  const handleOpenDialog = (hallmark = null) => {
    setEditingHallmark(hallmark);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingHallmark(null);
  };

  const handleOpenMenu = (event, hallmark) => {
    setAnchorEl(event.currentTarget);
    setSelectedHallmark(hallmark);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedHallmark(null);
  };

  const handleEdit = () => {
    handleOpenDialog(selectedHallmark);
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (selectedHallmark && window.confirm('Are you sure you want to delete this hallmarking record?')) {
      deleteMutation.mutate(selectedHallmark.id);
    }
  };
  
  const handleFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    if (editingHallmark) {
      updateMutation.mutate({ id: editingHallmark.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const hallmarks = data?.hallmarking || [];
  const products = productsData?.products || [];

  // Filter hallmarks based on search term
  const filteredHallmarks = hallmarks.filter(hallmark => 
    hallmark.Product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hallmark.hallmark_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hallmark.certifying_authority?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile Card View
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {filteredHallmarks.map((hallmark) => (
        <Grid item xs={12} key={hallmark.id}>
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {hallmark.Product?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={new Date(hallmark.certification_date).toLocaleDateString()} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleOpenMenu(e, hallmark)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Hallmark Number:</strong> {hallmark.hallmark_number}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Authority:</strong> {hallmark.certifying_authority}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Product Details:</strong> {hallmark.Product?.metal_type} - {hallmark.Product?.purity}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View
  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Metal Type</TableCell>
            <TableCell>Purity</TableCell>
            <TableCell>Hallmark Number</TableCell>
            <TableCell>Authority</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredHallmarks.map((hallmark) => (
            <TableRow key={hallmark.id}>
              <TableCell>{hallmark.Product?.name}</TableCell>
              <TableCell>{hallmark.Product?.metal_type}</TableCell>
              <TableCell>{hallmark.Product?.purity}</TableCell>
              <TableCell>{hallmark.hallmark_number}</TableCell>
              <TableCell>{hallmark.certifying_authority}</TableCell>
              <TableCell>{new Date(hallmark.certification_date).toLocaleDateString()}</TableCell>
              <TableCell align="center">
                <IconButton 
                  size="small" 
                  onClick={(e) => handleOpenMenu(e, hallmark)}
                >
                  <MoreVertIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', p: 0.5 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom={isMobile}
          sx={{ mb: { xs: 0, sm: 2 } }}
        >
          Hallmarking
        </Typography>
        {!isMobile ? (
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Add Hallmark
          </Button>
        ) : (
          <Fab
            color="primary"
            aria-label="add hallmark"
            onClick={() => handleOpenDialog()}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>

      {/* Search Box */}
      <TextField
        fullWidth
        placeholder="Search by product name, hallmark number, or authority..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
        }}
        size={isMobile ? "small" : "medium"}
      />
      
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {!isLoading && !error && (
        isMobile ? renderMobileView() : renderTableView()
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingHallmark ? 'Edit' : 'Add'} Hallmark
        </DialogTitle>
        <Box component="form" onSubmit={handleFormSubmit}>
          <DialogContent sx={{ pb: 1 }}>
            <TextField 
              select 
              label="Product" 
              name="product_id" 
              fullWidth 
              required 
              sx={{ mb: 2 }} 
              SelectProps={{ native: true }}
              size={isMobile ? "small" : "medium"}
              defaultValue={editingHallmark?.product_id || ''}
            >
              <option value=""></option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>
            <TextField 
              label="Hallmark Number" 
              name="hallmark_number" 
              fullWidth 
              required 
              sx={{ mb: 2 }}
              size={isMobile ? "small" : "medium"}
              defaultValue={editingHallmark?.hallmark_number || ''}
            />
            <TextField 
              label="Certifying Authority" 
              name="certifying_authority" 
              fullWidth 
              sx={{ mb: 2 }}
              size={isMobile ? "small" : "medium"}
              defaultValue={editingHallmark?.certifying_authority || ''}
            />
            <TextField 
              label="Certification Date" 
              name="certification_date" 
              type="date" 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              sx={{ mb: 2 }}
              size={isMobile ? "small" : "medium"}
              defaultValue={editingHallmark?.certification_date ? new Date(editingHallmark.certification_date).toISOString().split('T')[0] : ''}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          elevation: 3,
          sx: {
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Hallmarking;
