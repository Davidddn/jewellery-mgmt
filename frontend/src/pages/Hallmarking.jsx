import React, { useState } from 'react';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, useMediaQuery, Card, CardContent, Grid, Chip, Stack, Fab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hallmarkingAPI } from '../api/hallmarking';
import { productsAPI } from '../api/products';

const Hallmarking = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  // Mobile Card View
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {hallmarks.map((hallmark) => (
        <Grid item xs={12} key={hallmark.id}>
          <Card elevation={1}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {hallmark.Product?.name}
                  </Typography>
                  <Chip 
                    label={new Date(hallmark.certification_date).toLocaleDateString()} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Hallmark Number:</strong> {hallmark.hallmark_number}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Authority:</strong> {hallmark.certifying_authority}
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
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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
            />
            <TextField 
              label="Certifying Authority" 
              name="certifying_authority" 
              fullWidth 
              sx={{ mb: 2 }}
              size={isMobile ? "small" : "medium"}
            />
            <TextField 
              label="Certification Date" 
              name="certification_date" 
              type="date" 
              fullWidth 
              InputLabelProps={{ shrink: true }} 
              sx={{ mb: 2 }}
              size={isMobile ? "small" : "medium"}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Hallmarking;
