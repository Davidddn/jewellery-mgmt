import React, { useState, useContext } from 'react';
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
  LinearProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { CloudUpload, Description, Info, Timeline, Person, Receipt, Inventory, Download } from '@mui/icons-material';
import { 
  importProductsCsv, 
  importCustomersCsv, 
  importTransactionsCsv, 
  importInventoryUpdates 
} from '../api/imports';
import { NotificationContext } from '../contexts/NotificationContext';

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

const importTypes = [
  {
    id: 'products',
    label: 'Products',
    icon: Description,
    importFunction: importProductsCsv,
    sampleFile: '/sample-imports/products-sample.csv',
    description: 'Upload a CSV file with product data. Supported columns: name, sku, price, stock_quantity, category, description.',
    requiredFields: 'name, sku, price',
    optionalFields: 'stock_quantity, category, description, barcode, metal_type, purity, weight',
    guidelines: [
      'First row should contain column headers',
      'Required fields: name, sku, price',
      'Price should be numeric (without currency symbols)',
      'SKU should be unique for each product'
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Person,
    importFunction: importCustomersCsv,
    sampleFile: '/sample-imports/customers-sample.csv',
    description: 'Upload a CSV file with customer data. Supported columns: name, email, phone, address, date_of_birth, gender.',
    requiredFields: 'name',
    optionalFields: 'email, phone, address, date_of_birth, gender, loyalty_points, total_spent',
    guidelines: [
      'First row should contain column headers',
      'Required field: name',
      'Email should be in valid format if provided',
      'Date of birth should be in YYYY-MM-DD format'
    ]
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    importFunction: importTransactionsCsv,
    sampleFile: '/sample-imports/transactions-sample.csv',
    description: 'Upload a CSV file with transaction data. Supported columns: customer_id, total_amount, payment_method, transaction_status.',
    requiredFields: 'customer_id, total_amount, payment_method',
    optionalFields: 'user_id, transaction_type, discount_amount, tax_amount, final_amount, payment_status, transaction_status, notes',
    guidelines: [
      'First row should contain column headers',
      'Required fields: customer_id, total_amount, payment_method',
      'Customer ID must exist in the system',
      'Total amount should be numeric'
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Updates',
    icon: Inventory,
    importFunction: importInventoryUpdates,
    sampleFile: '/sample-imports/inventory-sample.csv',
    description: 'Upload a CSV file with inventory updates. Supported columns: sku, stock_quantity, cost_price, selling_price.',
    requiredFields: 'sku, stock_quantity',
    optionalFields: 'cost_price, selling_price, reorder_level',
    guidelines: [
      'First row should contain column headers',
      'Required fields: sku, stock_quantity',
      'SKU must exist in the system',
      'Stock quantity should be numeric'
    ]
  }
];

const ImportData = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeTab, setActiveTab] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useContext(NotificationContext);

    const currentImportType = importTypes[activeTab];

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSelectedFile(null); // Clear selected file when changing tabs
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            showSnackbar('Please select a file to import.', 'error');
            return;
        }
        setLoading(true);
        try {
            const response = await currentImportType.importFunction(selectedFile);
            showSnackbar(response.data.message || `${currentImportType.label} imported successfully!`, 'success');
            setSelectedFile(null); // Clear selected file after successful import
        } catch (error) {
            console.error(`Error importing ${currentImportType.label.toLowerCase()}:`, error);
            showSnackbar(error.response?.data?.message || `Failed to import ${currentImportType.label.toLowerCase()}.`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 0.5 }}>
            <Typography 
                variant={isMobile ? "h5" : "h4"} 
                gutterBottom
                sx={{ mb: { xs: 2, md: 3 } }}
            >
                Import Data
            </Typography>

            <Paper elevation={1} sx={{ mb: 3 }}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    {importTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                            <Tab
                                key={type.id}
                                label={type.label}
                                icon={<IconComponent />}
                                iconPosition="start"
                                sx={{ 
                                    minHeight: 64,
                                    '& .MuiTab-iconWrapper': {
                                        mb: 0,
                                        mr: 1
                                    }
                                }}
                            />
                        );
                    })}
                </Tabs>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8} lg={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <currentImportType.icon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" component="h2">
                                    Import {currentImportType.label} (CSV)
                                </Typography>
                            </Box>
                            
                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    {currentImportType.description}
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
                                        Importing {currentImportType.label.toLowerCase()}...
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
                                {loading ? 'Importing...' : `Import ${currentImportType.label}`}
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
                            
                            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                                {currentImportType.guidelines.map((guideline, index) => (
                                    <li key={index}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {guideline}
                                        </Typography>
                                    </li>
                                ))}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="body2" paragraph>
                                <strong>Required Fields:</strong> {currentImportType.requiredFields}
                            </Typography>
                            
                            <Typography variant="body2">
                                <strong>Optional Fields:</strong> {currentImportType.optionalFields}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" fontWeight="medium">
                                    Download Sample CSV
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Download />}
                                    href={currentImportType.sampleFile}
                                    download
                                    sx={{ borderRadius: 2 }}
                                >
                                    Download
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Audit Trail Link */}
                    <Card elevation={1} sx={{ mt: 2, border: 1, borderColor: 'primary.200' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Timeline sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" color="primary.main">
                                    Track Your Imports
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                All import activities are logged for audit and compliance purposes.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                href="/audit-logs"
                                sx={{ borderRadius: 2 }}
                            >
                                View Audit Logs
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImportData;
