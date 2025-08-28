import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  styled,
  LinearProgress
} from '@mui/material';
import { CloudUpload, Description, Info } from '@mui/icons-material';
import { importProductsCsv } from '../api/imports';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImportData = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to import.');
            return;
        }

        setLoading(true);
        try {
            const response = await importProductsCsv(selectedFile);
            toast.success(response.data.message || 'Products imported successfully!');
            setSelectedFile(null); // Clear selected file after successful import
        } catch (error) {
            console.error('Error importing products:', error);
            toast.error(error.response?.data?.message || 'Failed to import products.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography 
                variant={isMobile ? "h5" : "h4"} 
                gutterBottom
                sx={{ mb: { xs: 2, md: 3 } }}
            >
                Import Data
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8} lg={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Description sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h2">
                                    Import Products (CSV)
                                </Typography>
                            </Box>
                            
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    Upload a CSV file with product data. Supported columns: name, sku, price, stock_quantity, category, description.
                                </Typography>
                            </Alert>

                            <Box sx={{ mb: 3 }}>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUpload />}
                                    fullWidth={isMobile}
                                    size={isMobile ? "medium" : "large"}
                                    sx={{ 
                                        mb: 2,
                                        py: { xs: 1.5, md: 2 },
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                        '&:hover': {
                                            borderStyle: 'dashed',
                                            borderWidth: 2,
                                        }
                                    }}
                                >
                                    {selectedFile ? 'Change File' : 'Choose CSV File'}
                                    <VisuallyHiddenInput
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                                
                                {selectedFile && (
                                    <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                            p: 2, 
                                            bgcolor: 'grey.50',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}
                                    >
                                        <Description color="primary" />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {selectedFile.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </Typography>
                                        </Box>
                                    </Paper>
                                )}
                            </Box>

                            {loading && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Importing products...
                                    </Typography>
                                    <LinearProgress />
                                </Box>
                            )}
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                            <Button
                                onClick={handleImport}
                                disabled={loading || !selectedFile}
                                variant="contained"
                                fullWidth={isMobile}
                                size={isMobile ? "medium" : "large"}
                                startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                            >
                                {loading ? 'Importing...' : 'Import Products'}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4} lg={6}>
                    <Card elevation={1} sx={{ bgcolor: 'primary.50', border: 1, borderColor: 'primary.200' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Info sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" color="primary.main">
                                    Import Guidelines
                                </Typography>
                            </Box>
                            
                            <Typography variant="body2" paragraph>
                                <strong>CSV Format Requirements:</strong>
                            </Typography>
                            
                            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                                <li>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        First row should contain column headers
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Required fields: name, sku, price
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Optional fields: stock_quantity, category, description
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Price should be numeric (without currency symbols)
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        SKU should be unique for each product
                                    </Typography>
                                </li>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Future import types */}
                    <Card elevation={1} sx={{ mt: 2, opacity: 0.6 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Coming Soon
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • Import Transactions<br />
                                • Import Customers<br />
                                • Import Inventory Updates
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImportData;
