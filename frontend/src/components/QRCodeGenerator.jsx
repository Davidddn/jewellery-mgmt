// src/components/QRCodeGenerator.jsx
// Enhanced QR code component with multiple formats and styles
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  Share,
  ContentCopy,
  WhatsApp,
  Print
} from '@mui/icons-material';
import { QRCode } from 'react-qr-code';

const QRCodeGenerator = ({ open, onClose, product }) => {
  const [qrSize, setQrSize] = useState(200);
  const [includeInfo, setIncludeInfo] = useState(true);
  const [_qrStyle, _setQrStyle] = useState('normal');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fgColor, setFgColor] = useState('#000000');

  if (!product) return null;

  const qrValue = `${window.location.origin}/catalogue/${product.id}`;

  const downloadQR = (format = 'png') => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = qrSize + (includeInfo ? 100 : 0);
    canvas.height = qrSize + (includeInfo ? 150 : 0);

    img.onload = () => {
      // White background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, (canvas.width - qrSize) / 2, includeInfo ? 20 : (canvas.height - qrSize) / 2, qrSize, qrSize);

      if (includeInfo) {
        // Add product info
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(product.name, canvas.width / 2, qrSize + 50);
        
        ctx.font = '12px Arial';
        ctx.fillText(`₹${Number(product.selling_price || 0).toLocaleString('en-IN')}`, canvas.width / 2, qrSize + 70);
        ctx.fillText(`SKU: ${product.sku}`, canvas.width / 2, qrSize + 90);
        
        // Add store info
        ctx.fillStyle = '#666666';
        ctx.font = '10px Arial';
        ctx.fillText('Scan to view details', canvas.width / 2, qrSize + 110);
        ctx.fillText('Jewelry Store Collection', canvas.width / 2, qrSize + 125);
      }

      // Download
      const link = document.createElement('a');
      link.download = `${product.sku}-qr-code.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    };

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const shareQR = (platform) => {
    const text = `Check out ${product.name} - ₹${product.selling_price}`;
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${qrValue}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(qrValue);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    const svg = document.getElementById('qr-code-svg').outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${product.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            .qr-container { 
              display: inline-block; 
              border: 2px solid #000; 
              padding: 20px; 
              margin: 20px;
            }
            h2 { margin: 10px 0; color: #333; }
            p { margin: 5px 0; color: #666; }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svg}
            <h2>${product.name}</h2>
            <p><strong>₹${Number(product.selling_price || 0).toLocaleString('en-IN')}</strong></p>
            <p>SKU: ${product.sku}</p>
            <p><small>Scan to view details</small></p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">QR Code Generator</Typography>
          <Chip label="Digital Catalogue" color="primary" size="small" />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* QR Code Preview */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                bgcolor: bgColor,
                minHeight: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QRCode
                id="qr-code-svg"
                value={qrValue}
                size={qrSize}
                bgColor={bgColor}
                fgColor={fgColor}
                level="M"
                style={{ marginBottom: includeInfo ? 16 : 0 }}
              />
              
              {includeInfo && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ color: fgColor, mb: 1 }}>
                    {product.name}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: fgColor, mb: 1 }}>
                    SKU: {product.sku}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                    Scan to view details
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Customization Options */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
              <Typography variant="body1" gutterBottom>{product.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                SKU: {product.sku}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price: ₹{Number(product.selling_price || 0).toLocaleString('en-IN')}
              </Typography>
              {product.category && (
                <Chip label={product.category} size="small" sx={{ mt: 1 }} />
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Customization
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>QR Code Size</InputLabel>
              <Select
                value={qrSize}
                label="QR Code Size"
                onChange={(e) => setQrSize(e.target.value)}
              >
                <MenuItem value={150}>Small (150px)</MenuItem>
                <MenuItem value={200}>Medium (200px)</MenuItem>
                <MenuItem value={250}>Large (250px)</MenuItem>
                <MenuItem value={300}>Extra Large (300px)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={includeInfo}
                  onChange={(e) => setIncludeInfo(e.target.checked)}
                />
              }
              label="Include Product Information"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Colors</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="caption">Background</Typography>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: 40, height: 30, border: 'none', borderRadius: 4 }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption">QR Code</Typography>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ width: 40, height: 30, border: 'none', borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>QR Code URL</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                  {qrValue}
                </Typography>
              </Paper>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Tooltip title="Download as PNG">
                <IconButton onClick={() => downloadQR('png')} color="primary">
                  <Download />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Print QR Code">
                <IconButton onClick={printQR} color="primary">
                  <Print />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Copy Link">
                <IconButton onClick={() => shareQR('copy')} color="primary">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Share on WhatsApp">
                <IconButton onClick={() => shareQR('whatsapp')} sx={{ color: '#25D366' }}>
                  <WhatsApp />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => downloadQR('png')} variant="contained" startIcon={<Download />}>
          Download PNG
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeGenerator;
