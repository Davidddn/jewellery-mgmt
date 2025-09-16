// src/pages/PublicCatalogue.jsx
// Public catalogue page for QR code links
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Paper,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Share,
  Favorite,
  FavoriteBorder,
  ShoppingCart,
  WhatsApp,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Store,
  Phone,
  Email
} from '@mui/icons-material';
import { QRCode } from 'react-qr-code';
import { productsAPI } from '../api/products';

const PublicCatalogue = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [shareDialog, setShareDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await productsAPI.getProduct(productId);
        
        // Handle different response formats
        if (response?.success && response?.product) {
          setProduct(response.product);
        } else if (response && !response.success) {
          setError(response.message || 'Product not found');
        } else if (response) {
          // Direct product object response
          setProduct(response);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    loadWishlist();
  }, [productId]);

  const loadWishlist = () => {
    const saved = localStorage.getItem('catalogue-wishlist');
    if (saved) {
      setWishlist(JSON.parse(saved));
    }
  };

  const saveWishlist = (newWishlist) => {
    localStorage.setItem('catalogue-wishlist', JSON.stringify(newWishlist));
    setWishlist(newWishlist);
  };

  const toggleWishlist = () => {
    const isInWishlist = wishlist.includes(productId);
    let newWishlist;
    
    if (isInWishlist) {
      newWishlist = wishlist.filter(id => id !== productId);
      showSnackbar('Removed from wishlist', 'info');
    } else {
      newWishlist = [...wishlist, productId];
      showSnackbar('Added to wishlist', 'success');
    }
    
    saveWishlist(newWishlist);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this beautiful ${product.name} - ₹${product.selling_price}`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        showSnackbar('Link copied to clipboard', 'success');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    setShareDialog(false);
  };

  const handleInquiry = () => {
    const message = `Hi! I'm interested in ${product.name} (SKU: ${product.sku}). Could you please provide more details?`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
        <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading product...</Typography>
        </Container>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ 
        backgroundColor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Product Not Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              The product you're looking for doesn't exist or has been removed.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
              Browse Catalogue
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const isInWishlist = wishlist.includes(productId);

  return (
    <Box sx={{ 
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Product Catalogue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Jewelry Collection
          </Typography>
        </Box>
        <IconButton onClick={toggleWishlist} color={isInWishlist ? 'error' : 'default'}>
          {isInWishlist ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
        <IconButton onClick={() => setShareDialog(true)}>
          <Share />
        </IconButton>
      </Box>

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ backgroundColor: 'background.paper' }}>
            <CardMedia
              component="img"
              height="400"
              image={product.image_url ? 
                (product.image_url.startsWith('http') ? product.image_url : product.image_url) 
                : '/placeholder-product.svg'
              }
              alt={product.name}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
          
          {/* QR Code Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setQrDialog(true)}
            sx={{ mt: 2 }}
          >
            View QR Code
          </Button>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 16 }}>
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              {product.name}
            </Typography>
            
            <Typography variant="h5" color="primary" sx={{ mb: 3, fontWeight: 600 }}>
              ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
            </Typography>

            {/* Product Info */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Product Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">SKU</Typography>
                  <Typography variant="body1" fontWeight="500">{product.sku}</Typography>
                </Grid>
                
                {product.category && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Category</Typography>
                    <Chip label={product.category} size="small" />
                  </Grid>
                )}
                
                {product.purity && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Purity</Typography>
                    <Typography variant="body1" fontWeight="500">{product.purity}</Typography>
                  </Grid>
                )}
                
                {product.weight && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Weight</Typography>
                    <Typography variant="body1" fontWeight="500">{product.weight}g</Typography>
                  </Grid>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Availability</Typography>
                  <Chip 
                    label={product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    color={product.stock_quantity > 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Description */}
            {product.description && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                  {product.description}
                </Typography>
              </Paper>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<WhatsApp />}
                onClick={handleInquiry}
                sx={{ flex: 1, minWidth: 200 }}
              >
                Inquire Now
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<Phone />}
                href="tel:+1234567890"
                sx={{ flex: 1, minWidth: 150 }}
              >
                Call Us
              </Button>
            </Box>

            {/* Store Info */}
            <Paper variant="outlined" sx={{ p: 3, mt: 3, backgroundColor: 'background.paper' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Store color="primary" />
                <Typography variant="h6" color="primary">
                  Jewelry Store
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Visit our store for more collections and personalized service
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button size="small" startIcon={<Phone />} href="tel:+1234567890">
                  Call
                </Button>
                <Button size="small" startIcon={<Email />} href="mailto:info@jewelrystore.com">
                  Email
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Share Dialog */}
      <Dialog open={shareDialog} onClose={() => setShareDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Share Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WhatsApp />}
                onClick={() => handleShare('whatsapp')}
                sx={{ color: '#25D366', borderColor: '#25D366' }}
              >
                WhatsApp
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Facebook />}
                onClick={() => handleShare('facebook')}
                sx={{ color: '#1877F2', borderColor: '#1877F2' }}
              >
                Facebook
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Twitter />}
                onClick={() => handleShare('twitter')}
                sx={{ color: '#1DA1F2', borderColor: '#1DA1F2' }}
              >
                Twitter
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => handleShare('copy')}
              >
                Copy Link
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onClose={() => setQrDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Product QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <QRCode
            value={window.location.href}
            size={200}
            style={{ marginBottom: 16 }}
          />
          <Typography variant="body2" color="text.secondary">
            Scan to view this product
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleInquiry}
      >
        <WhatsApp />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};

export default PublicCatalogue;
