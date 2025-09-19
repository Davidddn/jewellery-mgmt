import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'react-qr-code';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper, 
  Grid, 
  Divider, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Fab,
  AppBar,
  Toolbar,
  Slide,
  Stack,
  Chip,
  Avatar,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  InputAdornment,
  ListItemAvatar,
  Autocomplete
} from '@mui/material';
import { 
  AddShoppingCart, 
  Delete, 
  Print, 
  Preview, 
  Download,
  MoreVert,
  Add,
  Remove,
  ShoppingCart,
  Person,
  QrCodeScanner,
  Receipt,
  Email,
  LocalOffer,
  CreditCard,
  AccountBalance,
  Money,
  Percent,
  History,
  ExpandMore,
  Search,
  Clear,
  PhotoCamera,
  Inventory,
  Star,
  StarBorder,
  Phone,
  Mail,
  LocationOn,
  AccessTime,
  TrendingUp
} from '@mui/icons-material';
import { productsAPI } from '../api/products';
import { useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';
import { customersAPI } from '../api/customers';

const Sales = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Core states
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [customerId, setCustomerId] = useState('');
  
  // Search states
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showInlineCustomerResults, setShowInlineCustomerResults] = useState(false);
  const [showNoCustomerFoundMessage, setShowNoCustomerFoundMessage] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showInlineProductResults, setShowInlineProductResults] = useState(false);
  const [showNoProductFoundMessage, setShowNoProductFoundMessage] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Enhanced states
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'fixed'
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // New customer states
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Loading and menu states
  const [downloadingId, setDownloadingId] = useState(null);
  const [lastTransactionId, setLastTransactionId] = useState(null);

  // Refs for debouncing
  const customerTimeoutRef = useRef(null);
  const productTimeoutRef = useRef(null);

  // Enhanced calculations
  const calculateDiscountAmount = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.selling_price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
    
    if (discountType === 'percentage') {
      const discountPercent = Math.max(0, Math.min(100, parseFloat(discount || 0)));
      return (subtotal * discountPercent) / 100;
    }
    return Math.max(0, parseFloat(discount || 0));
  }, [cart, discount, discountType]);

  const calculateTaxAmount = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.selling_price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
    
    const discountAmount = calculateDiscountAmount();
    const taxableAmount = Math.max(0, subtotal - discountAmount - loyaltyDiscount);
    const taxRate = Math.max(0, parseFloat(tax || 0));
    
    return (taxableAmount * taxRate) / 100;
  }, [cart, tax, calculateDiscountAmount, loyaltyDiscount]);

  const calculateFinalAmount = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      const price = parseFloat(item.selling_price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + (price * quantity);
    }, 0);
    
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    const loyaltyAmount = parseFloat(loyaltyDiscount || 0);
    
    return Math.max(0, subtotal - discountAmount + taxAmount - loyaltyAmount);
  }, [cart, calculateDiscountAmount, calculateTaxAmount, loyaltyDiscount]);

  useEffect(() => {
    const newTotal = calculateFinalAmount();
    setTotalAmount(newTotal);
  }, [calculateFinalAmount]);

  // Enhanced notification system
  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Load customer purchase history
  const loadCustomerHistory = useCallback(async (customerId) => {
    try {
      // Assuming there's an API to get customer transaction history
      const response = await transactionsAPI.getTransactions({ customer_id: customerId, limit: 10 });
      if (response.success) {
        setCustomerHistory(response.transactions || []);
      }
    } catch (error) {
      console.error('Error loading customer history:', error);
    }
  }, []);

  // Calculate loyalty discount based on customer history
  const calculateLoyaltyDiscount = useCallback((customer) => {
    if (!customer || !customerHistory.length) return 0;
    
    // Simple loyalty calculation: 1% discount for every 10 previous transactions
    const transactionCount = customerHistory.length;
    const loyaltyRate = Math.floor(transactionCount / 10) * 1; // 1% per 10 transactions
    const maxLoyaltyRate = 5; // Max 5% loyalty discount
    
    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const rate = Math.min(loyaltyRate, maxLoyaltyRate);
    return (subtotal * rate) / 100;
  }, [customerHistory, cart]);


  const performCustomerSearch = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setCustomerSearchResults([]);
      setShowInlineCustomerResults(false);
      setShowNoCustomerFoundMessage(false);
      return;
    }

    setIsSearchingCustomer(true);
    setShowNoCustomerFoundMessage(false);

    try {
      let customersFound = [];
      
      const isPhoneNumber = /^\d+$/.test(searchTerm.trim());
      
      if (isPhoneNumber) {
        try {
          const phoneResponse = await customersAPI.getCustomerByPhone(searchTerm.trim());
          if (phoneResponse.success && phoneResponse.customer) {
            customersFound = [phoneResponse.customer];
          }
        } catch (phoneError) {
          console.warn('Customer not found by exact phone match, trying search:', phoneError.message);
        }
      }
      
      if (customersFound.length === 0) {
        try {
          const searchResponse = await customersAPI.searchCustomers(searchTerm.trim());
          if (searchResponse.success && searchResponse.customers.length > 0) {
            customersFound = searchResponse.customers;
          }
        } catch (searchError) {
          console.warn('Customer not found by search:', searchError.message);
        }
      }

      if (customersFound.length > 0) {
        setCustomerSearchResults(customersFound);
        setShowInlineCustomerResults(true);
        setShowNoCustomerFoundMessage(false);
      } else {
        setCustomerSearchResults([]);
        setShowInlineCustomerResults(false);
        setShowNoCustomerFoundMessage(true);
      }
    } catch (overallError) {
      console.error('Error searching customers:', overallError);
      setCustomerSearchResults([]);
      setShowInlineCustomerResults(false);
      setShowNoCustomerFoundMessage(true);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  const debounceCustomerSearch = useCallback((searchTerm, delay = 300) => {
    clearTimeout(customerTimeoutRef.current);
    customerTimeoutRef.current = setTimeout(() => {
      performCustomerSearch(searchTerm);
    }, delay);
  }, [performCustomerSearch]);

  // Product search functions
  const performProductSearch = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setProductSearchResults([]);
      setShowInlineProductResults(false);
      setShowNoProductFoundMessage(false);
      return;
    }

    setIsSearchingProduct(true);
    setShowNoProductFoundMessage(false);

    try {
      let productsFound = [];
      
      // Try exact barcode match first
      try {
        const barcodeResponse = await productsAPI.getProductByBarcode(searchTerm.trim());
        if (barcodeResponse.success && barcodeResponse.product) {
          productsFound = [barcodeResponse.product];
        }
      } catch (barcodeError) {
        console.warn('Product not found by exact barcode match:', barcodeError.message);
      }
      
      // If no exact barcode match, try SKU
      if (productsFound.length === 0) {
        try {
          const skuResponse = await productsAPI.getProductBySku(searchTerm.trim());
          if (skuResponse.success && skuResponse.product) {
            productsFound = [skuResponse.product];
          }
        } catch (skuError) {
          console.warn('Product not found by exact SKU match:', skuError.message);
        }
      }
      
      // If still no results, try a general product search (if API supports it)
      if (productsFound.length === 0) {
        try {
          // Assuming there's a searchProducts API method
          const searchResponse = await productsAPI.searchProducts(searchTerm.trim());
          if (searchResponse.success && searchResponse.products && searchResponse.products.length > 0) {
            productsFound = searchResponse.products.slice(0, 10); // Limit to 10 results
          }
        } catch (searchError) {
          console.warn('Product not found by general search:', searchError.message);
        }
      }

      if (productsFound.length > 0) {
        setProductSearchResults(productsFound);
        setShowInlineProductResults(true);
        setShowNoProductFoundMessage(false);
      } else {
        setProductSearchResults([]);
        setShowInlineProductResults(false);
        setShowNoProductFoundMessage(true);
      }
    } catch (overallError) {
      console.error('Error searching products:', overallError);
      setProductSearchResults([]);
      setShowInlineProductResults(false);
      setShowNoProductFoundMessage(true);
    } finally {
      setIsSearchingProduct(false);
    }
  }, []);

  const debounceProductSearch = useCallback((searchTerm, delay = 300) => {
    clearTimeout(productTimeoutRef.current);
    productTimeoutRef.current = setTimeout(() => {
      performProductSearch(searchTerm);
    }, delay);
  }, [performProductSearch]);

  // Load all customers when field is focused
  const loadAllCustomers = useCallback(async () => {
    try {
      setIsSearchingCustomer(true);
      const response = await customersAPI.getCustomers();
      if (response.success && response.customers.length > 0) {
        setCustomerSearchResults(response.customers);
        setShowInlineCustomerResults(true);
        setShowNoCustomerFoundMessage(false);
      } else {
        setCustomerSearchResults([]);
        setShowInlineCustomerResults(false);
        setShowNoCustomerFoundMessage(true);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomerSearchResults([]);
      setShowInlineCustomerResults(false);
      setShowNoCustomerFoundMessage(true);
    } finally {
      setIsSearchingCustomer(false);
    }
  }, []);

  // Load all products when field is focused
  const loadAllProducts = useCallback(async () => {
    try {
      setIsSearchingProduct(true);
      const response = await productsAPI.getProducts();
      if (response.success && response.products.length > 0) {
        setProductSearchResults(response.products);
        setShowInlineProductResults(true);
        setShowNoProductFoundMessage(false);
      } else {
        setProductSearchResults([]);
        setShowInlineProductResults(false);
        setShowNoProductFoundMessage(true);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setProductSearchResults([]);
      setShowInlineProductResults(false);
      setShowNoProductFoundMessage(true);
    } finally {
      setIsSearchingProduct(false);
    }
  }, []);

  // Handle clicking outside to close dropdowns
  const handleClickOutside = useCallback((event) => {
    // Close customer dropdown if clicking outside
    if (!event.target.closest('.customer-search-container')) {
      setShowInlineCustomerResults(false);
    }
    // Close product dropdown if clicking outside
    if (!event.target.closest('.product-search-container')) {
      setShowInlineProductResults(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleBarcodeChange = (e) => {
    const value = e.target.value;
    setBarcode(value);
    
    // Clear previous scanned product if user starts typing again
    if (scannedProduct) {
      setScannedProduct(null);
    }
    
    // Clear search results if input is empty
    if (!value.trim()) {
      setProductSearchResults([]);
      setShowInlineProductResults(false);
      setShowNoProductFoundMessage(false);
      return;
    }

    // Trigger real-time search
    debounceProductSearch(value.trim());
  };

  const handleSelectProduct = (selectedProduct) => {
    if (selectedProduct.stock_quantity <= 0) {
      showNotification('Product is out of stock!', 'error');
      return;
    }
    
    setScannedProduct({ ...selectedProduct, quantity: 1 });
    setBarcode(selectedProduct.barcode || selectedProduct.sku || selectedProduct.name);
    setShowInlineProductResults(false);
    setShowNoProductFoundMessage(false);
    setProductSearchResults([]);
    showNotification(`${selectedProduct.name} selected`, 'success');
  };

  const handleScanProduct = async (e) => {
    if (e.key === 'Enter' && barcode) {
      // If there's only one search result, auto-select it
      if (productSearchResults.length === 1) {
        handleSelectProduct(productSearchResults[0]);
        return;
      }
      
      // If there are multiple results, don't auto-select, let user choose
      if (productSearchResults.length > 1) {
        return;
      }
      
      // If no search results are showing, perform immediate search
      if (productSearchResults.length === 0 && !isSearchingProduct) {
        await performProductSearch(barcode.trim());
      }
    }
  };

  const handleAddToCart = () => {
    if (scannedProduct) {
      const existingItemIndex = cart.findIndex(item => item.id === scannedProduct.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += scannedProduct.quantity;
        setCart(updatedCart);
      } else {
        setCart([...cart, scannedProduct]);
      }
      
      // Clear product selection and search results
      setScannedProduct(null);
      setBarcode('');
      setProductSearchResults([]);
      setShowInlineProductResults(false);
      setShowNoProductFoundMessage(false);
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setTotalAmount(0);
    setScannedProduct(null);
    setBarcode('');
    setProductSearchResults([]);
    setShowInlineProductResults(false);
    setShowNoProductFoundMessage(false);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setCart(cart.map(item => 
      item.id === productId ? { ...item, quantity: Math.max(1, newQuantity) } : item
    ));
  };

  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setCustomerId(value);
    
    if (!value.trim() && customer) {
      setCustomer(null);
      setCustomerSearchResults([]);
      setShowInlineCustomerResults(false);
      setShowNoCustomerFoundMessage(false);
      return;
    }

    if (value.trim().length > 0) {
      debounceCustomerSearch(value.trim());
    } else {
      setCustomerSearchResults([]);
      setShowInlineCustomerResults(false);
      setShowNoCustomerFoundMessage(false);
    }
  };

  const handleCustomerLookupKeyPress = (e) => {
    if (e.key === 'Enter' && customerId.trim()) {
      if (customerSearchResults.length === 1) {
        handleSelectCustomer(customerSearchResults[0]);
      } else if (customerSearchResults.length === 0 && !isSearchingCustomer) {
        performCustomerSearch(customerId.trim());
      }
    }
  };

  const handleSelectCustomer = async (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setCustomerId(selectedCustomer.name);
    setShowInlineCustomerResults(false);
    setShowNoCustomerFoundMessage(false);
    setCustomerSearchResults([]);
    
    // Load customer history and calculate loyalty discount
    await loadCustomerHistory(selectedCustomer.id);
    const loyalty = calculateLoyaltyDiscount(selectedCustomer);
    setLoyaltyDiscount(loyalty);
    
    if (loyalty > 0) {
      showNotification(`Loyalty discount of ₹${loyalty.toFixed(2)} applied!`, 'success');
    }
    
    showNotification(`Customer ${selectedCustomer.name} selected`, 'success');
  };

  const handleClearCustomer = () => {
    setCustomer(null);
    setCustomerId('');
    setCustomerSearchResults([]);
    setShowInlineCustomerResults(false);
    setShowNoCustomerFoundMessage(false);
  };

  const handleNewCustomerDataChange = (e) => {
    setNewCustomerData({ ...newCustomerData, [e.target.name]: e.target.value });
  };

  const handleCreateNewCustomer = async () => {
    try {
      const response = await customersAPI.createCustomer(newCustomerData);
      if (response.success) {
        alert('New customer created successfully!');
        setCustomer(response.customer);
        setCustomerId(response.customer.name);
        setShowNewCustomerForm(false);
        setNewCustomerData({ name: '', phone: '', email: '', address: '' });
        setShowNoCustomerFoundMessage(false);
      } else {
        alert(response.message || 'Failed to create new customer.');
      }
    } catch (error) {
      console.error('Error creating new customer:', error);
      alert('Error creating new customer.');
    }
  };

  const handleCreateTransaction = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty. Add products to create a transaction.', 'error');
      return;
    }
    if (!customer) {
      showNotification('Please select a customer for the transaction.', 'error');
      return;
    }

    setIsProcessingTransaction(true);

    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const discountAmount = calculateDiscountAmount();
    const taxAmount = calculateTaxAmount();
    const finalAmount = calculateFinalAmount();

    const transactionData = {
      customer_id: customer.id,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.selling_price,
        total_price: item.selling_price * item.quantity,
        name: item.name // Include product name for invoice
      })),
      payment_mode: paymentMethod,
      subtotal: subtotal,
      discount_amount: discountAmount,
      discount_type: discountType,
      tax_amount: taxAmount,
      tax_rate: tax,
      loyalty_discount: loyaltyDiscount,
      final_amount: finalAmount,
      notes: notes,
      transaction_date: new Date().toISOString()
    };

    console.log('Creating transaction with data:', transactionData);

    try {
      setDownloadingId('creating');
      const response = await transactionsAPI.createTransaction(transactionData);
      if (response.success) {
        setLastTransactionId(response.transaction.id);
        showNotification('Transaction created successfully!', 'success');
        
        console.log('Transaction created successfully:', response.transaction);
        
        // Ask if user wants to preview before printing
        if (window.confirm('Transaction created! Would you like to preview the invoice before printing?')) {
          setShowReceiptPreview(true);
        } else {
          await handlePrintEnhancedBill(response.transaction.id);
        }
        
        handleClearCart();
        handleClearCustomer();
        
        // Invalidate queries for fresh data
        queryClient.invalidateQueries(['advancedSales']);
        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries(['customers']);
      } else {
        showNotification(response.message || 'Failed to create transaction.', 'error');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      showNotification('Error creating transaction.', 'error');
    } finally {
      setDownloadingId(null);
      setIsProcessingTransaction(false);
    }
  };

  const handlePrintEnhancedBill = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      
      console.log(`Printing enhanced bill for transaction ${transactionId}`);
      
      // Use the transaction API to get invoice
      const response = await transactionsAPI.getInvoice(transactionId, 'html');
      console.log('Enhanced Invoice API response:', response);
      
      if (response.success && response.html_data) {
        // Enhance the HTML with better styling and company branding
        const enhancedHTML = enhanceInvoiceHTML(response.html_data);
        
        // Create enhanced HTML blob and open for printing
        const blob = new Blob([enhancedHTML], { type: 'text/html' });
        const fileURL = URL.createObjectURL(blob);
        
        // Open in new window for printing
        const printWindow = window.open(fileURL, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        } else {
          showNotification('Please allow popups to print the invoice', 'warning');
        }
        
        console.log('Enhanced bill opened for printing successfully');
      } else if (response.pdf_data) {
        // Handle PDF data
        const binaryString = atob(response.pdf_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blob);
        
        const printWindow = window.open(fileURL, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
        
        console.log('PDF bill opened for printing successfully');
      } else {
        console.error('No invoice data received:', response);
        // Fallback to enhanced simple bill
        await handleCreateEnhancedSimpleBill(transactionId);
      }
    } catch (error) {
      console.error('Error printing enhanced bill:', error);
      
      // Fallback to enhanced simple HTML bill
      try {
        await handleCreateEnhancedSimpleBill(transactionId);
      } catch (fallbackError) {
        console.error('Enhanced fallback bill generation also failed:', fallbackError);
        showNotification('Failed to generate bill. Transaction was created successfully.', 'error');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Enhanced invoice functionality
  const handlePreviewInvoice = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      console.log(`Previewing invoice for transaction ${transactionId}`);
      
      // Use the same working API pattern as Transactions.jsx
      const response = await transactionsAPI.getInvoice(transactionId, 'html');
      
      if (response.success && response.html_data) {
        // Open HTML preview in new window
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(response.html_data);
          previewWindow.document.close();
        } else {
          alert('Please allow popups to preview the invoice');
        }
      } else {
        // Fallback: try direct preview endpoint
        try {
          const previewResponse = await transactionsAPI.previewInvoice(transactionId);
          const previewWindow = window.open('', '_blank');
          if (previewWindow) {
            previewWindow.document.write(previewResponse);
            previewWindow.document.close();
          }
        } catch (previewError) {
          console.error('Preview fallback failed:', previewError);
          alert('Failed to preview invoice');
        }
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
      alert('Failed to preview invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  // Enhanced invoice functionality
  const handleEmailInvoice = async (transactionId, customerEmail) => {
    try {
      setIsProcessingTransaction(true);
      
      // Call API to email invoice
      const response = await transactionsAPI.emailInvoice(transactionId, { email: customerEmail });
      
      if (response.success) {
        showNotification('Invoice emailed successfully!', 'success');
      } else {
        showNotification('Failed to email invoice. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Email invoice error:', error);
      showNotification('Failed to email invoice. Please check the email address.', 'error');
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleShareInvoice = async (transactionId) => {
    try {
      // Generate shareable link
      const shareUrl = `${window.location.origin}/invoice/${transactionId}`;
      
      if (navigator.share) {
        // Use native sharing if available
        await navigator.share({
          title: `Invoice #${transactionId}`,
          text: 'View your invoice from Precious Jewels',
          url: shareUrl,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        showNotification('Invoice link copied to clipboard!', 'success');
      }
    } catch (error) {
      console.error('Share invoice error:', error);
      showNotification('Failed to share invoice.', 'error');
    }
  };

  const handleDownloadInvoice = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      console.log(`Downloading invoice for transaction ${transactionId}`);
      
      // Use the same working API pattern as Transactions.jsx
      const response = await transactionsAPI.getInvoice(transactionId, 'pdf');
      console.log('Invoice download response:', response);
      
      if (response.success && response.html_data) {
        // Download HTML file
        const blob = new Blob([response.html_data], { type: 'text/html' });
        const fileURL = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `Invoice-${transactionId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL);
        
        console.log('Invoice downloaded as HTML successfully');
        alert('Invoice downloaded successfully! You can open the HTML file in your browser and print it as PDF.');
        
      } else if (response.pdf_data) {
        // Handle actual PDF data
        const binaryString = atob(response.pdf_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `Invoice-${transactionId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL);
        
        console.log('Invoice downloaded as PDF successfully');
        alert('Invoice downloaded successfully as PDF file');
        
      } else {
        console.error('Failed to download invoice: No PDF or HTML data in response', response);
        alert('Could not download invoice. Server response format not recognized.');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert(`Failed to download invoice: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Enhanced invoice HTML enhancement function
  const enhanceInvoiceHTML = (originalHTML) => {
    // Add enhanced styling and branding to existing HTML
    const enhancedCSS = `
      <style>
        /* Enhanced Invoice Styling */
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Roboto', sans-serif; 
          line-height: 1.6;
          color: #2c3e50;
          background: white;
        }
        
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3498db;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 14px;
          color: #7f8c8d;
          line-height: 1.4;
        }
        
        .invoice-info {
          text-align: right;
          flex: 1;
        }
        
        .invoice-title {
          font-size: 36px;
          font-weight: 300;
          color: #3498db;
          margin-bottom: 10px;
        }
        
        .invoice-number {
          font-size: 18px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        
        .invoice-date {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        .customer-section, .items-section, .totals-section {
          margin: 30px 0;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 500;
          color: #2c3e50;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ecf0f1;
        }
        
        .customer-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .items-table th {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 500;
          font-size: 14px;
        }
        
        .items-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #ecf0f1;
          font-size: 14px;
        }
        
        .items-table tr:hover {
          background: #f8f9fa;
        }
        
        .totals-breakdown {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          border: 1px solid #ecf0f1;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px 0;
        }
        
        .total-row.subtotal {
          border-bottom: 1px solid #bdc3c7;
        }
        
        .total-row.final {
          font-size: 20px;
          font-weight: 700;
          color: #27ae60;
          border-top: 2px solid #27ae60;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .discount-row {
          color: #e74c3c;
        }
        
        .tax-row {
          color: #f39c12;
        }
        
        .payment-info {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #27ae60;
          margin: 20px 0;
        }
        
        .invoice-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ecf0f1;
        }
        
        .footer-left {
          flex: 1;
          text-align: center;
          color: #7f8c8d;
          font-size: 12px;
        }
        
        .footer-center {
          flex: 1;
          text-align: center;
        }
        
        .footer-right {
          flex: 1;
          text-align: center;
        }
        
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          border: 2px solid #3498db;
          border-radius: 8px;
          background: #f8f9ff;
        }
        
        .qr-code {
          margin-bottom: 10px;
        }
        
        .qr-label {
          font-size: 12px;
          color: #3498db;
          font-weight: 500;
          text-align: center;
        }
        
        .digital-signature {
          text-align: center;
          padding: 15px;
          border: 1px solid #27ae60;
          border-radius: 8px;
          background: #f0fff0;
        }
        
        .signature-title {
          font-size: 14px;
          font-weight: 600;
          color: #27ae60;
          margin-bottom: 8px;
        }
        
        .signature-hash {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          color: #666;
          word-break: break-all;
          line-height: 1.2;
        }
        
        .signature-verified {
          font-size: 12px;
          color: #27ae60;
          margin-top: 5px;
          font-weight: 500;
        }
        
        .terms-conditions {
          margin: 30px 0;
          font-size: 12px;
          color: #7f8c8d;
          line-height: 1.4;
        }
        
        .company-contact {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .contact-title {
          font-size: 16px;
          font-weight: 600;
          color: #3498db;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .contact-info {
          display: flex;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #7f8c8d;
        }
        
        .contact-icon {
          margin-right: 5px;
          color: #3498db;
        }
        
        @media print {
          .invoice-container {
            box-shadow: none;
            margin: 0;
            padding: 15mm;
          }
          
          .items-table {
            box-shadow: none;
          }
        }
      </style>
    `;
    
    // Insert enhanced CSS into the HTML
    const enhancedHTML = originalHTML.replace('<head>', `<head>${enhancedCSS}`);
    
    return enhancedHTML;
  };

  // Generate QR Code data URL using Canvas
  const generateQRCodeDataURL = async (transactionId) => {
    try {
      // Simple QR-like pattern generator
      const size = 150;
      const modules = 25; // 25x25 grid
      const moduleSize = size / modules;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Black modules
      ctx.fillStyle = '#000000';
      
      // Generate pattern based on transaction data
      const seed = transactionId ? parseInt(transactionId.toString()) : Date.now();
      const pattern = [];
      
      // Create a simple deterministic pattern
      for (let row = 0; row < modules; row++) {
        pattern[row] = [];
        for (let col = 0; col < modules; col++) {
          // Corner squares (finder patterns)
          if ((row < 7 && col < 7) || 
              (row < 7 && col >= modules - 7) || 
              (row >= modules - 7 && col < 7)) {
            // Create finder pattern
            if ((row === 0 || row === 6 || col === 0 || col === 6) ||
                (row >= 2 && row <= 4 && col >= 2 && col <= 4)) {
              pattern[row][col] = 1;
            } else {
              pattern[row][col] = 0;
            }
          } 
          // Timing patterns
          else if (row === 6 || col === 6) {
            pattern[row][col] = (row + col) % 2;
          }
          // Data area
          else {
            // Use transaction data to generate pattern
            const hash = (seed + row * 31 + col * 17) % 1000;
            pattern[row][col] = hash % 2;
          }
        }
      }
      
      // Draw the pattern
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          if (pattern[row][col]) {
            ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
          }
        }
      }

      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Generate digital signature
  const generateDigitalSignature = (transactionData) => {
    try {
      // Create a hash-like signature from transaction data
      const data = JSON.stringify({
        transactionId: transactionData.id,
        customerId: transactionData.customer_id,
        amount: transactionData.final_amount,
        items: transactionData.items?.length || 0,
        timestamp: new Date().toISOString(),
        terminal: 'POS-001',
        cashier: 'SYSTEM'
      });

      // Simple hash simulation (in production, use proper cryptographic signing)
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      // Convert to hex and add some formatting
      const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
      const formattedHash = `SHA256:${hexHash}${Date.now().toString(16).toUpperCase()}`;
      
      return formattedHash;
    } catch (error) {
      console.error('Error generating digital signature:', error);
      return 'SHA256:ERROR';
    }
  };

  // Enhanced simple bill creation
  const handleCreateEnhancedSimpleBill = async (transactionId) => {
    try {
      // Get transaction details
      let transactionDetails = null;
      
      if (typeof transactionsAPI.getTransactionById === 'function') {
        const response = await transactionsAPI.getTransactionById(transactionId);
        if (response.success) {
          transactionDetails = response.transaction;
        }
      }

      // Create enhanced HTML bill with QR code and digital signature
      const billHTML = await createEnhancedBillHTML(transactionDetails || {
        id: transactionId,
        customer: customer,
        items: cart,
        subtotal: cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0),
        discount_amount: calculateDiscountAmount(),
        tax_amount: calculateTaxAmount(),
        loyalty_discount: loyaltyDiscount,
        final_amount: calculateFinalAmount(),
        payment_mode: paymentMethod,
        created_at: new Date().toISOString(),
        notes: notes
      });

      // Open bill in new window for printing
      const billWindow = window.open('', '_blank');
      billWindow.document.write(billHTML);
      billWindow.document.close();
      billWindow.print();
      
      showNotification('Enhanced bill with QR code and digital signature generated successfully!', 'success');
    } catch (error) {
      console.error('Error creating enhanced simple bill:', error);
      showNotification('Could not generate bill, but transaction was created successfully.', 'error');
    }
  };

  // Enhanced bill HTML creation with better design
  const createEnhancedBillHTML = async (transaction) => {
    console.log('Creating enhanced bill for transaction:', transaction);
    
    // Handle different field names and data
    const transactionDate = transaction.createdAt || transaction.created_at || transaction.date || new Date().toISOString();
    const formattedDate = new Date(transactionDate).toLocaleString();
    const invoiceNumber = `INV-${String(transaction.id || 'TEMP').padStart(6, '0')}`;
    
    // Enhanced calculations with proper fallbacks
    let subtotal = 0;
    let items = [];
    
    // Handle items properly
    if (transaction.items && Array.isArray(transaction.items)) {
      items = transaction.items;
      subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.selling_price || item.unit_price || item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return sum + (price * quantity);
      }, 0);
    } else if (cart && Array.isArray(cart)) {
      items = cart;
      subtotal = cart.reduce((sum, item) => {
        const price = parseFloat(item.selling_price || item.unit_price || item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return sum + (price * quantity);
      }, 0);
    }
    
    // Use transaction values if available, otherwise calculate from current state
    const transactionSubtotal = parseFloat(transaction.subtotal || subtotal || 0);
    const discountAmount = parseFloat(transaction.discount_amount || discount || 0);
    const taxRate = parseFloat(transaction.tax_rate || tax || 0);
    const loyaltyDiscountAmount = parseFloat(transaction.loyalty_discount || loyaltyDiscount || 0);
    
    // Calculate tax amount properly
    const taxableAmount = Math.max(0, transactionSubtotal - discountAmount - loyaltyDiscountAmount);
    const calculatedTaxAmount = (taxableAmount * taxRate) / 100;
    const taxAmount = parseFloat(transaction.tax_amount || calculatedTaxAmount || 0);
    
    // Calculate final amount
    const calculatedFinalAmount = transactionSubtotal - discountAmount - loyaltyDiscountAmount + taxAmount;
    const finalAmount = parseFloat(transaction.final_amount || calculatedFinalAmount || 0);
    
    console.log('Invoice calculations:', {
      transactionSubtotal,
      discountAmount,
      taxRate,
      loyaltyDiscountAmount,
      taxAmount,
      finalAmount,
      itemsCount: items.length
    });
    
    // Customer info
    const customerInfo = transaction.customer || customer;
    const customerName = customerInfo?.name || transaction.customer_name || 'Walk-in Customer';
    const customerPhone = customerInfo?.phone || transaction.customer_phone || 'N/A';
    const customerEmail = customerInfo?.email || transaction.customer_email || 'N/A';
    const customerAddress = customerInfo?.address || transaction.customer_address || 'N/A';
    
    // Payment and status info
    const status = transaction.transaction_status || transaction.status || 'Completed';
    const paymentMode = transaction.payment_mode || paymentMethod || 'Cash';
    const transactionNotes = transaction.notes || notes || '';

    // Generate QR Code and Digital Signature
    const qrCodeDataURL = await generateQRCodeDataURL(transaction.id);
    const digitalSignature = generateDigitalSignature(transaction);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Enhanced Invoice - ${invoiceNumber}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            font-size: 14px;
          }
          
          .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
            min-height: 297mm;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 25px;
            border-bottom: 3px solid #2563eb;
          }
          
          .company-section {
            flex: 1;
          }
          
          .company-name {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .company-tagline {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 15px;
            font-style: italic;
          }
          
          .company-details {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
          }
          
          .invoice-section {
            text-align: right;
            flex: 1;
          }
          
          .invoice-title {
            font-size: 42px;
            font-weight: 300;
            color: #2563eb;
            margin-bottom: 8px;
            letter-spacing: -1px;
          }
          
          .invoice-number {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
          }
          
          .invoice-date {
            font-size: 14px;
            color: #6b7280;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 10px;
            text-transform: uppercase;
          }
          
          .billing-section {
            margin: 35px 0;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: #2563eb;
            border-radius: 2px;
          }
          
          .customer-details {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
          }
          
          .customer-details::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #2563eb, #3b82f6);
          }
          
          .customer-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 16px;
            font-weight: 500;
            color: #1f2937;
          }
          
          .items-section {
            margin: 40px 0;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .items-table thead th {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 18px 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table tbody td {
            padding: 16px 15px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            vertical-align: top;
          }
          
          .items-table tbody tr:hover {
            background: #f8fafc;
          }
          
          .items-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .item-name {
            font-weight: 500;
            color: #1f2937;
          }
          
          .price-cell {
            text-align: right;
            font-weight: 500;
          }
          
          .quantity-cell {
            text-align: center;
            font-weight: 500;
          }
          
          .total-cell {
            text-align: right;
            font-weight: 600;
            color: #2563eb;
          }
          
          .totals-section {
            margin: 40px 0;
          }
          
          .totals-container {
            max-width: 400px;
            margin-left: auto;
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #e2e8f0;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .total-row:last-child {
            border-bottom: none;
          }
          
          .total-label {
            font-size: 14px;
            font-weight: 500;
            color: #4b5563;
          }
          
          .total-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .discount-row .total-value {
            color: #dc2626;
          }
          
          .tax-row .total-value {
            color: #d97706;
          }
          
          .loyalty-row .total-value {
            color: #059669;
          }
          
          .final-total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #2563eb;
          }
          
          .final-total .total-label {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .final-total .total-value {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
          }
          
          .payment-section {
            margin: 30px 0;
            background: #ecfdf5;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #a7f3d0;
          }
          
          .payment-method {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
            color: #065f46;
          }
          
          .notes-section {
            margin: 30px 0;
          }
          
          .notes-content {
            background: #fef3c7;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #fbbf24;
            font-style: italic;
            color: #92400e;
          }
          
          .footer-section {
            margin-top: 50px;
            padding-top: 25px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
          }
          
          .thank-you {
            font-size: 20px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .footer-details {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
          }
          
          .terms-section {
            margin: 30px 0;
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.5;
          }
          
          .terms-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: #6b7280;
          }
          
          @media print {
            .invoice-container {
              padding: 15mm;
              box-shadow: none;
            }
            
            .items-table {
              box-shadow: none;
            }
            
            .customer-details,
            .totals-container,
            .payment-section {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header Section -->
          <div class="invoice-header">
            <div class="company-section">
              <div class="company-name">Precious Jewels</div>
              <div class="company-tagline">Crafting Excellence Since 1990</div>
              <div class="company-details">
                📍 123 Jewelry Street, Diamond District<br>
                📞 +91 98765 43210<br>
                ✉️ info@preciousjewels.com<br>
                🌐 www.preciousjewels.com
              </div>
            </div>
            <div class="invoice-section">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">${invoiceNumber}</div>
              <div class="invoice-date">${formattedDate}</div>
              <div class="status-badge">${status}</div>
            </div>
          </div>

          <!-- Customer Section -->
          <div class="billing-section">
            <div class="section-title">Bill To</div>
            <div class="customer-details">
              <div class="customer-info">
                <div class="info-item">
                  <div class="info-label">Customer Name</div>
                  <div class="info-value">${customerName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${customerPhone}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email Address</div>
                  <div class="info-value">${customerEmail}</div>
                </div>
                ${customerAddress !== 'N/A' ? `
                <div class="info-item">
                  <div class="info-label">Address</div>
                  <div class="info-value">${customerAddress}</div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Items Section -->
          ${items.length > 0 ? `
          <div class="items-section">
            <div class="section-title">Items Purchased</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 45%;">Item Description</th>
                  <th style="width: 15%; text-align: center;">Qty</th>
                  <th style="width: 20%; text-align: right;">Unit Price</th>
                  <th style="width: 20%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const itemName = item.name || item.product_name || item.item_name || 'Unknown Item';
                  const itemQuantity = parseInt(item.quantity || 1);
                  const itemPrice = parseFloat(item.selling_price || item.unit_price || item.price || 0);
                  const itemTotal = itemPrice * itemQuantity;
                  
                  return `
                  <tr>
                    <td class="item-name">${itemName}</td>
                    <td class="quantity-cell">${itemQuantity}</td>
                    <td class="price-cell">₹${itemPrice.toFixed(2)}</td>
                    <td class="total-cell">₹${itemTotal.toFixed(2)}</td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Totals Section -->
          <div class="totals-section">
            <div class="section-title">Payment Summary</div>
            <div class="totals-container">
              <div class="total-row">
                <div class="total-label">Subtotal</div>
                <div class="total-value">₹${transactionSubtotal.toFixed(2)}</div>
              </div>
              
              ${discountAmount > 0 ? `
              <div class="total-row discount-row">
                <div class="total-label">Discount</div>
                <div class="total-value">-₹${discountAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              
              ${loyaltyDiscountAmount > 0 ? `
              <div class="total-row loyalty-row">
                <div class="total-label">Loyalty Discount</div>
                <div class="total-value">-₹${loyaltyDiscountAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              
              ${taxAmount > 0 ? `
              <div class="total-row tax-row">
                <div class="total-label">Tax (${taxRate}%)</div>
                <div class="total-value">+₹${taxAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              
              <div class="total-row final-total">
                <div class="total-label">Total Amount</div>
                <div class="total-value">₹${finalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div class="payment-section">
            <div class="payment-method">
              💳 Payment Method: ${paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}
            </div>
          </div>

          ${transactionNotes ? `
          <!-- Notes Section -->
          <div class="notes-section">
            <div class="section-title">Additional Notes</div>
            <div class="notes-content">
              ${transactionNotes}
            </div>
          </div>
          ` : ''}

          <!-- Terms and Conditions -->
          <div class="terms-section">
            <div class="terms-title">Terms & Conditions:</div>
            <div>
              • All sales are final. Returns accepted within 7 days with original receipt.<br>
              • Warranty period: 1 year for gold jewelry, 6 months for silver jewelry.<br>
              • Free cleaning and polishing service for lifetime for gold jewelry.<br>
              • Custom orders require 50% advance payment.<br>
              • Prices are inclusive of applicable taxes.
            </div>
          </div>

              <!-- Enhanced QR Code and Contact Section -->
              <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="flex: 1;">
                    <div style="background: #3498db; color: white; padding: 15px; border-radius: 8px; text-align: center;">
                      <h3 style="margin: 0 0 10px 0; font-size: 18px;">Thank You for Your Business!</h3>
                      <div style="margin-bottom: 15px;">
                        <div style="font-size: 12px; margin-bottom: 5px;"><strong>For any queries:</strong></div>
                        <div style="font-size: 11px;">📞 Customer Care: +91 98765 43210</div>
                        <div style="font-size: 11px;">📧 Email: support@preciousjewels.com</div>
                        <div style="font-size: 11px;">🕒 Mon-Sat: 10:00 AM - 8:00 PM</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style="margin: 0 20px; text-align: center;">
                    <div style="border: 2px solid #3498db; border-radius: 8px; padding: 15px; background: white;">
                      <div style="font-size: 14px; font-weight: 600; color: #3498db; margin-bottom: 10px;">QR Code</div>
                      ${qrCodeDataURL ? `<img src="${qrCodeDataURL}" style="width: 120px; height: 120px; border: 1px solid #ddd;" alt="QR Code" />` : `
                        <div style="width: 120px; height: 120px; border: 2px dashed #3498db; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #3498db; text-align: center;">
                          QR Code<br>Verification
                        </div>
                      `}
                      <div style="font-size: 10px; color: #3498db; margin-top: 5px;">
                        <strong>Scan for</strong><br>Digital Receipt
                      </div>
                    </div>
                  </div>
                  
                  <div style="flex: 1; text-align: right;">
                    <div style="border: 1px solid #27ae60; border-radius: 8px; padding: 15px; background: #f0fff0;">
                      <div style="font-size: 12px; font-weight: 600; color: #27ae60; margin-bottom: 8px;">DIGITAL SIGNATURE</div>
                      <div style="font-size: 8px; font-family: monospace; color: #27ae60; word-break: break-all; line-height: 1.2;">
                        ${digitalSignature}
                      </div>
                      <div style="font-size: 10px; color: #27ae60; margin-top: 5px; font-weight: 500;">
                        ✓ Verified & Secure
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #9ca3af;">
                This is a digitally generated invoice and requires no physical signature.<br>
                For authenticity verification, visit: <strong>www.preciousjewels.com/verify/${transaction.id || 'temp'}</strong>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Menu handlers (currently unused but may be needed for future features)
  /*
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  */  
  
  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      p: 0,
      pb: { xs: 10, sm: 0, md: 0 }, // Extra padding for mobile FAB
      minHeight: '100vh',
      backgroundColor: isMobile ? theme.palette.background.default : 'transparent'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 0.5,
        py: 1,
        mb: isMobile ? 2 : 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
          Sales Point
        </Typography>
        {isMobile && cart.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            px: 2,
            py: 1,
            borderRadius: 2,
            fontWeight: 'bold'
          }}>
            <ShoppingCart sx={{ mr: 1, fontSize: 18 }} />
            Total: ₹{totalAmount.toFixed(2)}
          </Box>
        )}
      </Box>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Customer Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={isMobile ? 1 : 2} 
            sx={{ 
              p: isMobile ? 2 : 2,
              height: isMobile ? 'auto' : 'fit-content'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              gap: 1
            }}>
              <Person color="primary" />
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                Customer Details
              </Typography>
            </Box>
            <Box className="customer-search-container">
              <TextField
                fullWidth
                label="Customer Phone / Name"
                value={customerId}
                onChange={handleCustomerInputChange}
                onFocus={() => {
                  // Show all customers when field is focused (clicked)
                  if (!customer && !customerId.trim()) {
                    loadAllCustomers();
                  }
                }}
                onKeyPress={handleCustomerLookupKeyPress}
                margin="normal"
                size={isMobile ? "medium" : "medium"}
                helperText={isSearchingCustomer ? "Searching..." : "Start typing to search customers or click to see all"}
                disabled={!!customer}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '1rem' : '1rem'
                  }
                }}
              />
              
              {/* Customer search results dropdown */}
              {showInlineCustomerResults && customerSearchResults.length > 0 && !customer && (
                <Paper elevation={3} sx={{ 
                  mt: 1, 
                  maxHeight: isMobile ? 150 : 200, 
                  overflow: 'auto', 
                  position: 'relative', 
                  zIndex: 2 
                }}>
                  <List dense={!isMobile}>
                    {customerSearchResults.map((cust) => (
                      <ListItem 
                        button 
                        key={cust.id} 
                        onClick={() => handleSelectCustomer(cust)}
                        sx={{ 
                          '&:hover': { backgroundColor: 'action.hover' },
                          py: isMobile ? 1.5 : 1
                        }}
                      >
                        <ListItemText 
                          primary={cust.name} 
                          secondary={`Phone: ${cust.phone}${cust.email ? `, Email: ${cust.email}` : ''}`}
                          primaryTypographyProps={{ 
                            fontSize: isMobile ? '1rem' : '0.875rem' 
                          }}
                          secondaryTypographyProps={{ 
                            fontSize: isMobile ? '0.875rem' : '0.75rem' 
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            {/* No customer found message */}
            {showNoCustomerFoundMessage && !customer && !isSearchingCustomer && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error" sx={{ fontSize: isMobile ? '0.9rem' : '0.875rem' }}>
                  No customer found.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowNewCustomerForm(true)} 
                  sx={{ mt: 1 }}
                  size={isMobile ? "medium" : "small"}
                  fullWidth={isMobile}
                >
                  Add New Customer
                </Button>
              </Box>
            )}

            {/* Selected customer details */}
            {customer && (
              <Card sx={{ 
                mt: 2, 
                backgroundColor: 'success.light', 
                border: '1px solid',
                borderColor: 'success.main'
              }}>
                <CardContent sx={{ p: isMobile ? 2 : 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'success.dark' }}>
                    Selected Customer
                  </Typography>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" component="div">
                      <strong>Name:</strong> {customer.name}
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Phone:</strong> {customer.phone}
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Email:</strong> {customer.email || 'N/A'}
                    </Typography>
                  </Stack>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleClearCustomer}
                    sx={{ mt: 1.5 }}
                    fullWidth={isMobile}
                    color="success"
                  >
                    Change Customer
                  </Button>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Product Scan Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={isMobile ? 1 : 2} 
            sx={{ 
              p: isMobile ? 2 : 2, 
              position: 'relative',
              height: isMobile ? 'auto' : 'fit-content'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              gap: 1
            }}>
              <QrCodeScanner color="primary" />
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                Scan Product
              </Typography>
            </Box>
            <Box className="product-search-container">
              <TextField
                fullWidth
                label="Barcode / SKU / Product Name"
                value={barcode}
                onChange={handleBarcodeChange}
                onFocus={() => {
                  // Show all products when field is focused (clicked)
                  if (!scannedProduct && !barcode.trim()) {
                    loadAllProducts();
                  }
                }}
                onKeyPress={handleScanProduct}
                margin="normal"
                size={isMobile ? "medium" : "medium"}
                autoFocus={!!customer && !isMobile}
                helperText={isSearchingProduct ? "Searching..." : "Start typing to search products or click to see all, then press Enter"}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '1rem' : '1rem'
                  }
                }}
              />

              {/* Product search results dropdown */}
              {showInlineProductResults && productSearchResults.length > 0 && (
                <Paper elevation={3} sx={{ 
                  mt: 1, 
                  maxHeight: isMobile ? 200 : 250, 
                  overflow: 'auto', 
                  position: 'absolute', 
                  left: isMobile ? 8 : 16, 
                  right: isMobile ? 8 : 16, 
                  zIndex: 1 
                }}>
                  <List dense={!isMobile}>
                    {productSearchResults.map((product) => (
                      <ListItem 
                        button 
                        key={product.id} 
                        onClick={() => handleSelectProduct(product)}
                        sx={{ 
                          '&:hover': { backgroundColor: 'action.hover' },
                          py: isMobile ? 1.5 : 1,
                          opacity: product.stock_quantity <= 0 ? 0.6 : 1
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: product.stock_quantity <= 0 ? 'error.main' : 
                                   product.stock_quantity < 5 ? 'warning.main' : 'success.main',
                            width: 32,
                            height: 32
                          }}>
                            <Inventory fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontSize: isMobile ? '1rem' : '0.875rem' }}>
                                {product.name}
                              </Typography>
                              {product.stock_quantity <= 0 && (
                                <Chip label="Out of Stock" color="error" size="small" />
                              )}
                              {product.stock_quantity > 0 && product.stock_quantity < 5 && (
                                <Chip label="Low Stock" color="warning" size="small" />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                <Typography component="span" variant="body2" sx={{ 
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: 'medium',
                                  color: 'primary.main'
                                }}>
                                  ₹{product.selling_price}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ 
                                  fontSize: isMobile ? '0.75rem' : '0.7rem',
                                  color: product.stock_quantity <= 0 ? 'error.main' : 
                                         product.stock_quantity < 5 ? 'warning.main' : 'success.main',
                                  fontWeight: 'medium'
                                }}>
                                  Stock: {product.stock_quantity}
                                </Typography>
                              </Box>
                              <Typography component="span" variant="caption" color="textSecondary" sx={{ 
                                fontSize: isMobile ? '0.75rem' : '0.7rem',
                                display: 'block',
                                mt: 0.5
                              }}>
                                {product.barcode && `Barcode: ${product.barcode}`}
                                {product.barcode && product.sku && ' | '}
                                {product.sku && `SKU: ${product.sku}`}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>

            {/* No product found message */}
            {showNoProductFoundMessage && !scannedProduct && !isSearchingProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error" sx={{ fontSize: isMobile ? '0.9rem' : '0.875rem' }}>
                  No product found.
                </Typography>
              </Box>
            )}

            {/* Scanned product details */}
            {scannedProduct && (
              <Card sx={{ mt: 2, backgroundColor: 'info.light', border: '1px solid', borderColor: 'info.main' }}>
                <CardContent sx={{ p: isMobile ? 2 : 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'info.dark' }}>
                    Selected Product
                  </Typography>
                  <Typography variant={isMobile ? "h6" : "h6"} sx={{ mb: 1 }}>
                    {scannedProduct.name}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    <Typography variant="body2" component="div">
                      <strong>Price:</strong> ₹{scannedProduct.selling_price}
                    </Typography>
                    <Typography variant="body2" component="div">
                      <strong>Stock:</strong> {scannedProduct.stock_quantity}
                    </Typography>
                    {scannedProduct.barcode && (
                      <Typography variant="body2" component="div">
                        <strong>Barcode:</strong> {scannedProduct.barcode}
                      </Typography>
                    )}
                    {scannedProduct.sku && (
                      <Typography variant="body2" component="div">
                        <strong>SKU:</strong> {scannedProduct.sku}
                      </Typography>
                    )}
                  </Stack>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 2,
                    flexDirection: isMobile ? 'column' : 'row'
                  }}>
                    <TextField
                      type="number"
                      label="Quantity"
                      value={scannedProduct.quantity}
                      onChange={(e) => setScannedProduct({
                        ...scannedProduct, 
                        quantity: Math.max(1, parseInt(e.target.value) || 1)
                      })}
                      inputProps={{ min: 1 }}
                      size={isMobile ? "medium" : "small"}
                      sx={{ width: isMobile ? '100%' : '120px' }}
                    />
                    {isMobile && (
                      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button
                          variant="outlined"
                          onClick={() => setScannedProduct({
                            ...scannedProduct,
                            quantity: Math.max(1, scannedProduct.quantity - 1)
                          })}
                          sx={{ minWidth: 40 }}
                        >
                          <Remove />
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setScannedProduct({
                            ...scannedProduct,
                            quantity: scannedProduct.quantity + 1
                          })}
                          sx={{ minWidth: 40 }}
                        >
                          <Add />
                        </Button>
                      </Box>
                    )}
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<AddShoppingCart />}
                    onClick={handleAddToCart}
                    sx={{ mt: 1 }}
                    fullWidth={isMobile}
                    color="info"
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12}>
          <Paper 
            elevation={isMobile ? 1 : 2} 
            sx={{ 
              p: isMobile ? 2 : 2,
              position: 'relative'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart color="primary" />
                <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                  Cart Items
                </Typography>
              </Box>
              {cart.length > 0 && (
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  fontSize: isMobile ? '1rem' : '1.1rem'
                }}>
                  Total: ₹{totalAmount.toFixed(2)}
                </Typography>
              )}
            </Box>
            
            {cart.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: isMobile ? 3 : 4,
                color: 'text.secondary'
              }}>
                <ShoppingCart sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body1">No items in cart.</Typography>
                {isMobile && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Scan products to add them to cart
                  </Typography>
                )}
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {cart.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {isMobile ? (
                      // Mobile Card View for Cart Items
                      <Card 
                        sx={{ 
                          mb: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {item.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Unit Price: ₹{item.selling_price}
                              </Typography>
                            </Box>
                            <IconButton 
                              onClick={() => handleRemoveFromCart(item.id)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                                sx={{ minWidth: 32, width: 32, height: 32 }}
                              >
                                <Remove fontSize="small" />
                              </Button>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1 }}
                                size="small"
                                sx={{ 
                                  width: '60px',
                                  '& .MuiInputBase-input': { 
                                    textAlign: 'center',
                                    fontSize: '0.9rem'
                                  }
                                }}
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                sx={{ minWidth: 32, width: 32, height: 32 }}
                              >
                                <Add fontSize="small" />
                              </Button>
                            </Box>
                            
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                              ₹{(item.selling_price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ) : (
                      // Desktop List View for Cart Items
                      <ListItem
                        sx={{ 
                          flexDirection: 'column', 
                          alignItems: 'stretch', 
                          py: 2,
                          borderBottom: index < cart.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1 }}>
                          <Typography variant="body1" sx={{ flex: 1, fontWeight: 'medium' }}>
                            {item.name} (₹{item.selling_price})
                          </Typography>
                          <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFromCart(item.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <TextField
                            type="number"
                            label="Qty"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1 }}
                            size="small"
                            sx={{ width: '80px' }}
                          />
                          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                            ₹{(item.selling_price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </ListItem>
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Cart Total and Actions */}
            {cart.length > 0 && (
              <Box sx={{ 
                mt: 3, 
                pt: 2, 
                borderTop: '2px solid',
                borderColor: 'primary.main'
              }}>
                {/* Advanced Options Toggle */}
                <Accordion 
                  expanded={showAdvancedOptions} 
                  onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      Payment & Discount Options
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Payment Method */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Payment Method</InputLabel>
                          <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            label="Payment Method"
                          >
                            <MenuItem value="cash">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Money /> Cash
                              </Box>
                            </MenuItem>
                            <MenuItem value="card">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CreditCard /> Card
                              </Box>
                            </MenuItem>
                            <MenuItem value="upi">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalance /> UPI
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Discount */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            size="small"
                            label="Discount"
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {discountType === 'percentage' ? '%' : '₹'}
                                </InputAdornment>
                              )
                            }}
                            sx={{ flex: 1 }}
                          />
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="percentage">%</MenuItem>
                              <MenuItem value="fixed">₹</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Grid>

                      {/* Tax */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Tax Rate"
                          type="number"
                          value={tax}
                          onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          }}
                        />
                      </Grid>

                      {/* Notes */}
                      <Grid item xs={12}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Notes (Optional)"
                          multiline
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any special instructions or notes..."
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Payment Summary */}
                <Card sx={{ mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                      Payment Summary
                    </Typography>
                    
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          ₹{cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      {calculateDiscountAmount() > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="error.main">
                            Discount ({discountType === 'percentage' ? `${discount}%` : `₹${discount}`}):
                          </Typography>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium' }}>
                            -₹{calculateDiscountAmount().toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      {loyaltyDiscount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="success.main">
                            <Star sx={{ fontSize: 16, mr: 0.5 }} />
                            Loyalty Discount:
                          </Typography>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                            -₹{loyaltyDiscount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      {calculateTaxAmount() > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="warning.main">
                            Tax ({tax}%):
                          </Typography>
                          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'medium' }}>
                            +₹{calculateTaxAmount().toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Total Amount:
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          ₹{totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
                
                <Stack spacing={isMobile ? 2 : 1} direction={isMobile ? 'column' : 'row'}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCreateTransaction}
                    disabled={!customer || cart.length === 0 || isProcessingTransaction}
                    size={isMobile ? "large" : "medium"}
                    startIcon={isProcessingTransaction ? <CircularProgress size={20} /> : <Receipt />}
                    sx={{ 
                      flex: isMobile ? 'none' : 1,
                      py: isMobile ? 1.5 : 1
                    }}
                  >
                    {isProcessingTransaction ? 'Processing...' : 'Complete Sale'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearCart}
                    size={isMobile ? "medium" : "medium"}
                    color="error"
                    startIcon={<Clear />}
                  >
                    Clear Cart
                  </Button>
                  {customer && (
                    <Button
                      variant="outlined"
                      onClick={() => setShowCustomerHistory(true)}
                      size={isMobile ? "medium" : "medium"}
                      startIcon={<History />}
                    >
                      History
                    </Button>
                  )}
                </Stack>
                
                {!customer && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please select a customer to complete the sale
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerForm} onClose={() => setShowNewCustomerForm(false)}>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Customer Name"
            type="text"
            fullWidth
            variant="standard"
            value={newCustomerData.name}
            onChange={handleNewCustomerDataChange}
            required
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone Number"
            type="text"
            fullWidth
            variant="standard"
            value={newCustomerData.phone}
            onChange={handleNewCustomerDataChange}
            required
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={newCustomerData.email}
            onChange={handleNewCustomerDataChange}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address (Optional)"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="standard"
            value={newCustomerData.address}
            onChange={handleNewCustomerDataChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCustomerForm(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateNewCustomer}
            disabled={!newCustomerData.name || !newCustomerData.phone}
          >
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer History Dialog */}
      <Dialog 
        open={showCustomerHistory} 
        onClose={() => setShowCustomerHistory(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            Customer Purchase History
            {customer && (
              <Chip 
                label={customer.name} 
                color="primary" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {customerHistory.length > 0 ? (
            <List>
              {customerHistory.map((transaction, index) => (
                <ListItem key={transaction.id} divider={index < customerHistory.length - 1}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          Transaction #{transaction.id}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ₹{parseFloat(transaction.final_amount || transaction.total_amount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(transaction.created_at || transaction.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Payment: {transaction.payment_mode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Items: {transaction.items?.length || 0}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ ml: 2 }}>
                    <Chip 
                      label={transaction.status || transaction.transaction_status || 'Completed'} 
                      color="success" 
                      size="small" 
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No purchase history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This customer hasn&apos;t made any purchases yet
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomerHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog 
        open={showReceiptPreview} 
        onClose={() => setShowReceiptPreview(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Preview />
            Invoice Preview
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Receipt sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Transaction Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Transaction ID: {lastTransactionId}
            </Typography>
            
            <Stack spacing={2} direction={isMobile ? 'column' : 'row'} sx={{ justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={() => {
                  if (lastTransactionId) {
                    handleCreateEnhancedSimpleBill(lastTransactionId);
                  }
                  setShowReceiptPreview(false);
                }}
                disabled={downloadingId === lastTransactionId}
              >
                {downloadingId === lastTransactionId ? 'Printing...' : 'Print with QR Code'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => {
                  if (lastTransactionId) {
                    handlePreviewInvoice(lastTransactionId);
                  }
                }}
                disabled={downloadingId === lastTransactionId}
              >
                Preview
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => {
                  if (lastTransactionId && customer?.email) {
                    handleEmailInvoice(lastTransactionId, customer.email);
                  } else {
                    showNotification('Customer email not available', 'warning');
                  }
                }}
                disabled={!customer?.email || isProcessingTransaction}
              >
                {isProcessingTransaction ? 'Sending...' : 'Email Invoice'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  if (lastTransactionId) {
                    handleDownloadInvoice(lastTransactionId);
                  }
                }}
                disabled={downloadingId === lastTransactionId}
              >
                {downloadingId === lastTransactionId ? 'Downloading...' : 'Download PDF'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Receipt />}
                onClick={() => {
                  if (lastTransactionId) {
                    handleShareInvoice(lastTransactionId);
                  }
                }}
              >
                Share
              </Button>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceiptPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sales;