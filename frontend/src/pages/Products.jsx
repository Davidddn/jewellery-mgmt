import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/config';
import {
  enqueueMutationIndexedDb
} from '../utils/indexedDbQueue';
import { getQueue, clearQueue } from '../utils/offlineMutationQueue';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { usePermissions } from '../hooks/usePermissions';
import { useActivityLogger } from '../hooks/useActivityLogger';
import PermissionGuard from '../components/PermissionGuard';
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
  Tabs,
  Tab,
  Fade,
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
  Publish,
  Storefront,
  Public
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { productsAPI } from '../api/products';
import { categoriesAPI } from '../api/categories';
import ImportModal from '../components/ImportModal';
import { NotificationContext } from '../contexts/NotificationContext';
import QRCode from 'react-qr-code';
import ProductQrDownloadButton from '../components/ProductQrDownloadButton';
import QRCodeGenerator from '../components/QRCodeGenerator';

// Import enhanced components
import ProductAnalyticsCard from '../components/ProductEnhancements/ProductAnalyticsCard';
import RecommendationsCard from '../components/ProductEnhancements/RecommendationsCard';
import AdvancedFilters from '../components/ProductEnhancements/AdvancedFilters';
import withRoleBasedAccess from '../hocs/withRoleBasedAccess';

import Autocomplete from '@mui/material/Autocomplete';

const Products = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const { showSnackbar } = useContext(NotificationContext);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { logEntityAction, ActivityTypes, EntityTypes } = useActivityLogger();

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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, productId: null });
  const [qrDialog, setQrDialog] = useState({ open: false, product: null });
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [offlineDialogOpen, setOfflineDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const {
    pendingActions: pendingOfflineList,
    syncStatus: offlineStatus,
    queueMutation,
    retryAction,
    retryAll,
    cancelAction,
    conflicts,
    resolveConflict
  } = useOfflineSync();
  const [conflictDialog, setConflictDialog] = useState({ open: false, conflict: null });
  
  // Enhanced features state
  const [currentTab, setCurrentTab] = useState(0);
  const [savedFilters, setSavedFilters] = useState([]);
  
  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedProductFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  
  // Open conflict dialog if a new conflict appears
  useEffect(() => {
    if (conflicts && conflicts.length > 0 && !conflictDialog.open) {
      setConflictDialog({ open: true, conflict: conflicts[0] });
    }
    if ((!conflicts || conflicts.length === 0) && conflictDialog.open) {
      setConflictDialog({ open: false, conflict: null });
    }
  }, [conflicts, conflictDialog.open]);

  const handleResolveConflict = async (action, mergedData) => {
    if (!conflictDialog.conflict) return;
    await resolveConflict(conflictDialog.conflict.id, action, mergedData);
    setConflictDialog({ open: false, conflict: null });
    showSnackbar && showSnackbar('Conflict resolved', 'success');
  };

  // Helper to format timestamp
  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  }
  // Migrate localStorage queue to IndexedDB on mount
  useEffect(() => {
    async function migrateQueue() {
      const oldQueue = getQueue();
      if (oldQueue && oldQueue.length > 0) {
        for (const item of oldQueue) {
          await queueMutation(item);
        }
        clearQueue();
      }
    }
    migrateQueue();
  }, [queueMutation]);

  // Update count from context
  useEffect(() => {
    setPendingOfflineCount(pendingOfflineList.length);
  }, [pendingOfflineList]);

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

  // Analytics query for enhanced features
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['product-analytics'],
    queryFn: () => api.get('/products/analytics').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Recommendations query for enhanced features
  const { data: recommendationsData, isLoading: recommendationsLoading, error: recommendationsError } = useQuery({
    queryKey: ['product-recommendations'],
    queryFn: () => api.get('/products/recommendations').then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3
  });

  // Get categories from API and unique purities from products
  const categories = categoriesData?.categories || [];
  const purities = products?.products ? [...new Set(products.products.map(p => p.purity).filter(Boolean))] : [];
  const tags = tagsData?.data || [];

  const handleAddProduct = () => {
    if (!hasPermission('products.create')) {
      showSnackbar('You do not have permission to create products', 'error');
      return;
    }
    setSelectedProduct(null);
    setOpenDialog(true);
    logEntityAction(ActivityTypes.CREATE, EntityTypes.PRODUCT, null);
  };

  const handleEditProduct = (product) => {
    if (!hasPermission('products.edit')) {
      showSnackbar('You do not have permission to edit products', 'error');
      return;
    }
    setSelectedProduct(product);
    setOpenDialog(true);
    logEntityAction(ActivityTypes.UPDATE, EntityTypes.PRODUCT, product.id, product);
  };

  const handleDeleteProduct = (productId) => {
    if (!hasPermission('products.delete')) {
      showSnackbar('You do not have permission to delete products', 'error');
      return;
    }
    setConfirmDialog({ open: true, productId });
  };

  const handleShowQr = (product) => {
    setQrDialog({ open: true, product });
  };

  const handleCloseQr = () => {
    setQrDialog({ open: false, product: null });
  };

  const handleConfirmDelete = async () => {
    if (!hasPermission('products.delete')) {
      showSnackbar('You do not have permission to delete products', 'error');
      setConfirmDialog({ open: false, productId: null });
      return;
    }

    const productId = confirmDialog.productId;
    const productToDelete = filteredProducts.find(p => p.id === productId);
    setConfirmDialog({ open: false, productId: null });
    
    const isOnline = window.navigator.onLine;
    if (isOnline) {
      await deleteProductMutation.mutateAsync(productId);
      showSnackbar('Product deleted successfully.', 'success');
      logEntityAction(ActivityTypes.DELETE, EntityTypes.PRODUCT, productId, productToDelete);
    } else {
      enqueueMutationIndexedDb({ url: `/api/products/${productId}`, method: 'DELETE' });
      showSnackbar('Product delete queued for sync (offline mode).', 'info');
      logEntityAction(ActivityTypes.DELETE, EntityTypes.PRODUCT, productId, { ...productToDelete, offline: true });
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(swReg => {
          swReg.sync.register('sync-mutations');
        });
      }
    }
  };

  const handleExport = () => {
    if (!hasPermission('products.export')) {
      showSnackbar('You do not have permission to export products', 'error');
      return;
    }
    exportMutation.mutate();
    logEntityAction(ActivityTypes.EXPORT, EntityTypes.PRODUCT, null, { count: filteredProducts.length });
  };

  const handleOpenImportModal = () => {
    if (!hasPermission('products.import')) {
      showSnackbar('You do not have permission to import products', 'error');
      return;
    }
    setImportModalOpen(true);
    logEntityAction(ActivityTypes.IMPORT, EntityTypes.PRODUCT, null);
  };

  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    queryClient.invalidateQueries(['products']);
  };

  // Navigation handlers for catalogue pages
  const handleViewPublicCatalogue = () => {
    navigate('/catalogue');
  };

  const handleViewCatalogueManagement = () => {
    window.open('/catalogue', '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPurityFilter('');
    setTagFilter([]);
    setMinPrice('');
    setMaxPrice('');
  };

  const getStockChipColor = (stock) => {
    if (stock <= 5) return 'error';
    if (stock <= 10) return 'warning';
    return 'success';
  };

  // Enhanced features handlers
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Filter save/load functionality
  const saveFilter = (filterName) => {
    const filterData = {
      name: filterName,
      searchTerm,
      categoryFilter,
      purityFilter,
      minPrice,
      maxPrice,
      tagFilter,
      timestamp: new Date().toISOString()
    };
    const updated = [...savedFilters, filterData];
    setSavedFilters(updated);
    localStorage.setItem('savedProductFilters', JSON.stringify(updated));
  };

  const loadFilter = (filterData) => {
    setSearchTerm(filterData.searchTerm || '');
    setCategoryFilter(filterData.categoryFilter || '');
    setPurityFilter(filterData.purityFilter || '');
    setMinPrice(filterData.minPrice || '');
    setMaxPrice(filterData.maxPrice || '');
    setTagFilter(filterData.tagFilter || []);
  };

  const handleProductView = (product) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  // Speed Dial Actions
  const speedDialActions = [
    { icon: <Add />, name: 'Add Product', onClick: handleAddProduct, permission: 'products.create' },
    { icon: <Publish />, name: 'Import Products', onClick: handleOpenImportModal, permission: 'products.import' },
    { icon: <GetApp />, name: 'Export Excel', onClick: handleExport, permission: 'products.export' },
    { icon: <FilterList />, name: 'Filters', onClick: () => setOpenDrawer(true) },
    { icon: <Storefront />, name: 'View Catalogue', onClick: handleViewPublicCatalogue },
    { icon: <Public />, name: 'Public View', onClick: handleViewCatalogueManagement },
  ].filter(action => !action.permission || hasPermission(action.permission));

  // Mobile Card View
  const renderCardView = () => (
    <Grid container spacing={2} wrap="wrap" sx={{ width: '100%', m: 0, maxWidth: '100%' }}>
      {filteredProducts.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id} sx={{ display: 'flex', minWidth: 0 }}>
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
              },
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden'
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
                color: 'white',
                width: '100%',
                overflow: 'hidden'
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%' }}
                />
              ) : (
                <ShoppingCart sx={{ fontSize: 40, opacity: 0.7 }} />
              )}
            </CardMedia>
            
            <CardContent sx={{ flexGrow: 1, p: 2, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                noWrap 
                sx={{ fontSize: '1rem', fontWeight: 600, mb: 1, minWidth: 0, wordBreak: 'break-word' }}
              >
                {product.name}
              </Typography>
              

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
                SKU: {product.sku}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <AttachMoney sx={{ fontSize: 16, color: 'success.main' }} />
                <Box sx={{ p: 0, minWidth: 0, display: 'inline' }}>
                  <Typography variant="body2" fontWeight="600" color="success.main" sx={{ wordBreak: 'break-all', display: 'inline' }}>
                    ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
                  sx={{ mb: 1, wordBreak: 'break-word', maxWidth: '100%' }}
                />
              )}
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0, flexWrap: 'wrap', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1 }}>
                <PermissionGuard permission="products.update" showFallback={false}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditProduct(product)}
                    sx={{
                      mr: 1,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 'none',
                      px: 2,
                      py: 0.5,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'primary.50',
                        boxShadow: 2,
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    Edit
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="products.delete" showFallback={false}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteProduct(product.id)}
                    sx={{
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'error.50',
                        boxShadow: 2,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </PermissionGuard>
                <IconButton
                  size="small"
                  color="primary"
                  title="Show QR Code"
                  onClick={() => handleShowQr(product)}
                  sx={{
                    ml: 1,
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      boxShadow: 2,
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Visibility />
                </IconButton>
              </Box>
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <QRCode
                  value={`${window.location.origin}/catalogue/${product.id}`}
                  size={80}
                  style={{ marginBottom: 4 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleShowQr(product)}
                  sx={{
                    fontSize: '0.85rem',
                    px: 2,
                    py: 0.5,
                    minWidth: 0,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      boxShadow: 2,
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  View
                </Button>
              </Box>
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
                sx={{
                  mr: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.50',
                    boxShadow: 2,
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Edit />
              </IconButton>
              <IconButton
                edge="end"
                color="error"
                onClick={() => handleDeleteProduct(product.id)}
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'error.50',
                    boxShadow: 2,
                    transform: 'scale(1.1)'
                  }
                }}
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
            <TableCell sx={{ fontWeight: 600, textAlign: 'center', width: 80 }}>Image</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>SKU</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120, textAlign: 'right' }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 80, textAlign: 'center' }}>Stock</TableCell>
            <TableCell sx={{ fontWeight: 600, minWidth: 120, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell sx={{ textAlign: 'center', p: 1 }}>
                <Avatar
                  src={product.image_url}
                  sx={{ bgcolor: 'primary.main', width: 40, height: 40, mx: 'auto' }}
                >
                  <ShoppingCart />
                </Avatar>
              </TableCell>
              <TableCell sx={{ minWidth: 180 }}>
                <Typography variant="body2" fontWeight="500" sx={{ wordBreak: 'break-word' }}>
                  {product.name}
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 120, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {product.sku}
              </TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                {product.category && (
                  <Chip label={product.category} size="small" variant="outlined" />
                )}
              </TableCell>
              <TableCell sx={{ minWidth: 120, textAlign: 'right' }}>
                <Typography variant="body2" color="success.main" fontWeight="600">
                  ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>
                <Chip
                  label={product.stock_quantity || 0}
                  size="small"
                  color={getStockChipColor(product.stock_quantity || 0)}
                />
              </TableCell>
              <TableCell sx={{ minWidth: 120, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <PermissionGuard permission="products.update" showFallback={false}>
                    <IconButton
                      onClick={() => handleEditProduct(product)}
                      size="medium"
                      color="primary"
                      sx={{
                        borderRadius: 2,
                        padding: 1.5,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'primary.50',
                          boxShadow: 2
                        }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </PermissionGuard>
                  <PermissionGuard permission="products.delete" showFallback={false}>
                    <IconButton
                      onClick={() => handleDeleteProduct(product.id)}
                      size="medium"
                      color="error"
                      sx={{
                        borderRadius: 2,
                        padding: 1.5,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: 'error.50',
                          boxShadow: 2
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </PermissionGuard>
                  <IconButton
                    onClick={() => handleShowQr(product)}
                    size="medium"
                    color="info"
                    title="Show QR Code"
                    sx={{
                      borderRadius: 2,
                      padding: 1.5,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        bgcolor: 'info.50',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Main component render
  if (isLoading) {
    return (
      <Box sx={{ p: 0.5 }}>
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
      <Box sx={{ p: 0.5 }}>
        <Alert severity="error">
          Failed to load products. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: { xs: 2, sm: 1 },
        px: { xs: 2, sm: 3 },
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
          >
            Products ({filteredProducts.length})
          </Typography>
          {pendingOfflineCount > 0 && (
            <Chip
              color="warning"
              label={`Offline actions: ${pendingOfflineCount}`}
              size="small"
              sx={{ fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setOfflineDialogOpen(true)}
            />
          )}
        </Box>
        
        {/* Consolidated controls for desktop */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* View Toggle */}
            <Box sx={{ 
              display: 'flex', 
              border: '1px solid', 
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 1,
              bgcolor: 'background.paper'
            }}>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'text'}
                color="primary"
                size="medium"
                onClick={() => setViewMode('table')}
                sx={{ 
                  borderRadius: 0,
                  minWidth: 90,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2
                  }
                }}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'card' ? 'contained' : 'text'}
                color="primary"
                size="medium"
                onClick={() => setViewMode('card')}
                sx={{ 
                  borderRadius: 0,
                  minWidth: 90,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2
                  }
                }}
              >
                Cards
              </Button>
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <PermissionGuard permission="products.create" showFallback={false}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleAddProduct}
                  size="medium"
                  sx={{ 
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                >
                  Add Product
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission="products.import" showFallback={false}>
                <Button
                  variant="outlined"
                  startIcon={<Publish />}
                  onClick={handleOpenImportModal}
                  size="medium"
                  sx={{ 
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 500,
                    textTransform: 'none',
                    borderWidth: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                      borderWidth: 2,
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  Import
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission="products.export" showFallback={false}>
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  size="medium"
                  sx={{ 
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 500,
                    textTransform: 'none',
                    borderWidth: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                      borderWidth: 2,
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  Export
                </Button>
              </PermissionGuard>
              
              {/* Catalogue Navigation Buttons */}
              <Button
                variant="outlined"
                startIcon={<Storefront />}
                onClick={handleViewPublicCatalogue}
                size="medium"
                sx={{ 
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderWidth: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderWidth: 2,
                    bgcolor: 'secondary.50'
                  }
                }}
                color="secondary"
              >
                View Catalogue
              </Button>
              <Button
                variant="outlined"
                startIcon={<Public />}
                onClick={handleViewCatalogueManagement}
                size="medium"
                sx={{ 
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 500,
                  textTransform: 'none',
                  borderWidth: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                    borderWidth: 2,
                    bgcolor: 'info.50'
                  }
                }}
                color="info"
              >
                Public View
              </Button>
            </Box>
          </Box>
        )}

        {/* Mobile view toggle */}
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            border: '1px solid', 
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            alignSelf: 'flex-start',
            boxShadow: 1,
            bgcolor: 'background.paper'
          }}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'text'}
              color="primary"
              size="medium"
              onClick={() => setViewMode('table')}
              sx={{ 
                borderRadius: 0,
                minWidth: 80,
                px: 2.5,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'contained' : 'text'}
              color="primary"
              size="medium"
              onClick={() => setViewMode('card')}
              sx={{ 
                borderRadius: 0,
                minWidth: 80,
                px: 2.5,
                py: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Cards
            </Button>
          </Box>
        )}
        
        {/* Mobile Catalogue Quick Access */}
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            mt: 2,
            alignSelf: 'flex-start'
          }}>
            <Button
              variant="outlined"
              startIcon={<Storefront />}
              onClick={handleViewPublicCatalogue}
              size="medium"
              color="secondary"
              sx={{ 
                fontSize: '0.875rem',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                borderWidth: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'secondary.50'
                }
              }}
            >
              Catalogue
            </Button>
            <Button
              variant="outlined"
              startIcon={<Public />}
              onClick={handleViewCatalogueManagement}
              size="medium"
              color="info"
              sx={{ 
                fontSize: '0.875rem',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                borderWidth: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'info.50'
                }
              }}
            >
              Public
            </Button>
          </Box>
        )}
      </Box>

      {/* Enhanced Features: Tabs Navigation */}
      <Box sx={{ mx: { xs: 2, sm: 3 }, mb: 2 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          aria-label="product management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Products" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Fade in={currentTab === 0}>
        <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
          {/* Enhanced Search and Filters */}
          <AdvancedFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            purityFilter={purityFilter}
            setPurityFilter={setPurityFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            categories={categories}
            purities={purities}
            tags={tags}
            onClearFilters={clearFilters}
            savedFilters={savedFilters}
            onSaveFilter={saveFilter}
            onLoadFilter={loadFilter}
          />

          {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, mx: { xs: 2, sm: 3 } }}>
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
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="medium">
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
            <FormControl fullWidth size="medium">
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
                <TextField {...params} label="Tags" size="medium" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <TextField
                label="Min Price"
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                size="medium"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Max Price"
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                size="medium"
                sx={{ flex: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
        
        {/* Clear Filters Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={clearFilters}
            startIcon={<Close />}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ px: { xs: 2, sm: 3 } }}>
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
      </Box>

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
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </SwipeableDrawer>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, productId: null })}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, productId: null })}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced QR Code Dialog */}
      <QRCodeGenerator
        open={qrDialog.open}
        onClose={handleCloseQr}
        product={qrDialog.product}
      />

      {/* Product Dialog Component */}
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

      {/* Conflict Resolution Dialog */}
      <Dialog open={conflictDialog.open} onClose={() => setConflictDialog({ open: false, conflict: null })} maxWidth="md" fullWidth>
        <DialogTitle>Resolve Conflict</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            A conflict was detected while syncing your changes. Please choose how to resolve it.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle1">Your Change (Local)</Typography>
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(conflictDialog.conflict?.local?.body, null, 2)}</pre>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1">Server Version</Typography>
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(conflictDialog.conflict?.server, null, 2)}</pre>
            </Grid>
          </Grid>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            You can keep your change, use the server version, or merge them manually.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleResolveConflict('keepLocal')} color="primary" variant="contained">Keep My Change</Button>
          <Button onClick={() => handleResolveConflict('useServer')} color="secondary" variant="outlined">Use Server Version</Button>
          <Button onClick={() => setConflictDialog({ open: false, conflict: null })}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Pending Offline Actions Dialog */}
      <Dialog open={offlineDialogOpen} onClose={() => setOfflineDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pending Offline Actions</DialogTitle>
        <DialogContent>
          {pendingOfflineList.length === 0 ? (
            <Typography>All actions are synced. No pending offline actions.</Typography>
          ) : (
            <Box>
              <Button
                size="small"
                color="primary"
                variant="contained"
                sx={{ mb: 2 }}
                onClick={async () => {
                  await retryAll();
                  setSnackbar({ open: true, message: 'Retry all complete.', severity: 'info' });
                }}
              >
                Retry All
              </Button>
              {pendingOfflineList.map((item) => (
                <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1, background: offlineStatus[item.id]==='success' ? '#e8f5e9' : offlineStatus[item.id]==='failed' ? '#ffebee' : undefined }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Method:</b> {item.method} <b>URL:</b> {item.url}
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', display: 'block', mb: 1 }}>
                    <b>Body:</b> {item.body ? JSON.stringify(item.body) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <b>Queued:</b> {formatTime(item.timestamp)}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    <b>Status:</b> {offlineStatus[item.id] ? offlineStatus[item.id].charAt(0).toUpperCase() + offlineStatus[item.id].slice(1) : 'Pending'}
                  </Typography>
                  <Button
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mr: 1 }}
                    onClick={async () => {
                      await retryAction(item);
                      setSnackbar({ open: true, message: 'Action retried.', severity: 'success' });
                    }}
                  >
                    Retry
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={async () => {
                      await cancelAction(item.id);
                      setSnackbar({ open: true, message: 'Action cancelled.', severity: 'info' });
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfflineDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
        </Box>
      </Fade>

      {/* Analytics Tab Content */}
      <Fade in={currentTab === 1}>
        <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
          <Grid container spacing={3} sx={{ mx: { xs: 2, sm: 3 }, mb: 3 }}>
            <Grid item xs={12} lg={8}>
              {analyticsData ? (
                <ProductAnalyticsCard 
                  analytics={analyticsData.analytics} 
                  loading={analyticsLoading}
                  onRefresh={refetchAnalytics}
                />
              ) : analyticsLoading ? (
                <Card elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Product Analytics</Typography>
                  <Skeleton variant="rectangular" height={200} />
                </Card>
              ) : (
                <Card elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Product Analytics</Typography>
                  <Typography color="text.secondary">No analytics data available</Typography>
                  <Button onClick={refetchAnalytics} sx={{ mt: 2 }}>
                    Refresh
                  </Button>
                </Card>
              )}
              {analyticsError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to load analytics: {analyticsError.message}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} lg={4}>
              {recommendationsData ? (
                <RecommendationsCard 
                  recommendations={recommendationsData.recommendations || []}
                  loading={recommendationsLoading}
                  onProductView={handleProductView}
                />
              ) : recommendationsLoading ? (
                <Card elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  <Skeleton variant="rectangular" height={200} />
                </Card>
              ) : (
                <Card elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Recommendations</Typography>
                  <Typography color="text.secondary">No recommendations available</Typography>
                </Card>
              )}
              {recommendationsError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to load recommendations: {recommendationsError.message}
                </Alert>
              )}
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Snackbar for feedback */}
      {snackbar.open && (
        <Box sx={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1400 }}>
          <Box sx={{ bgcolor: snackbar.severity === 'success' ? '#43a047' : snackbar.severity === 'error' ? '#d32f2f' : '#1976d2', color: '#fff', px: 3, py: 1.5, borderRadius: 2, boxShadow: 3, minWidth: 200, textAlign: 'center' }}>
            <Typography>{snackbar.message}</Typography>
            <Button size="small" sx={{ color: '#fff', ml: 2 }} onClick={() => setSnackbar(s => ({ ...s, open: false }))}>Dismiss</Button>
          </Box>
        </Box>
      )}
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
      const isOnline = window.navigator.onLine;
      if (isOnline) {
        updateMutation.mutate({ id: product.id, data });
      } else {
        // Convert FormData to plain object for offline queue
        const plainObj = {};
        data.forEach((value, key) => { plainObj[key] = value; });
  enqueueMutationIndexedDb({ url: `/api/products/${product.id}`, method: 'PUT', body: plainObj });
        setLoading(false);
        setError('You are offline. Product update will sync when back online.');
        // Register for background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(swReg => {
            swReg.sync.register('sync-mutations');
          });
        }
        onSuccess && onSuccess();
        onClose && onClose();
      }
    } else {
      const isOnline = window.navigator.onLine;
      if (isOnline) {
        createMutation.mutate(data);
      } else {
        // Convert FormData to plain object for offline queue
        const plainObj = {};
        data.forEach((value, key) => { plainObj[key] = value; });
  enqueueMutationIndexedDb({ url: '/api/products', method: 'POST', body: plainObj });
        setLoading(false);
        setError('You are offline. Product will sync when back online.');
        // Register for background sync
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(swReg => {
            swReg.sync.register('sync-mutations');
          });
        }
        onSuccess && onSuccess();
        onClose && onClose();
      }
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

const EnhancedProducts = withRoleBasedAccess(Products, {
  permission: 'products.read',
  pageName: 'Products',
  entityType: 'PRODUCT'
});

export default EnhancedProducts;