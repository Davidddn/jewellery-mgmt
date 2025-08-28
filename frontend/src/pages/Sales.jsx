import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Stack
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
  QrCodeScanner
} from '@mui/icons-material';
import { productsAPI } from '../api/products';
import { useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';
import { customersAPI } from '../api/customers';

const Sales = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showInlineCustomerResults, setShowInlineCustomerResults] = useState(false);
  const [showNoCustomerFoundMessage, setShowNoCustomerFoundMessage] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // New states for product search
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showInlineProductResults, setShowInlineProductResults] = useState(false);
  const [showNoProductFoundMessage, setShowNoProductFoundMessage] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // New state for adding customer
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Loading and menu states
  const [, setDownloadingId] = useState(null);
  const [, setLastTransactionId] = useState(null);  
  // const [, setMenuAnchorEl] = useState(null); // Unused, commented out

  // Refs for debouncing
  const customerTimeoutRef = useRef(null);
  const productTimeoutRef = useRef(null);

  useEffect(() => {
    // Calculate total amount whenever cart changes
    const newTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    setTotalAmount(newTotal);
  }, [cart]);

  // Customer search functions
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
    setScannedProduct({ ...selectedProduct, quantity: 1 });
    setBarcode(selectedProduct.barcode || selectedProduct.sku || selectedProduct.name);
    setShowInlineProductResults(false);
    setShowNoProductFoundMessage(false);
    setProductSearchResults([]);
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

  const handleSelectCustomer = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setCustomerId(selectedCustomer.name);
    setShowInlineCustomerResults(false);
    setShowNoCustomerFoundMessage(false);
    setCustomerSearchResults([]);
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
        setNewCustomerData({ name: '', phone: '', email: '' });
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
      alert('Cart is empty. Add products to create a transaction.');
      return;
    }
    if (!customer) {
      alert('Please select a customer for the transaction.');
      return;
    }

    const transactionData = {
      customer_id: customer.id,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      payment_mode: 'cash',
    };

    try {
      setDownloadingId('creating'); // Show loading during transaction creation
      const response = await transactionsAPI.createTransaction(transactionData);
      if (response.success) {
        setLastTransactionId(response.transaction.id);
        alert('Transaction created successfully!');
        handleClearCart();
        handleClearCustomer();
        await handlePrintBill(response.transaction.id);
        // Invalidate analytics queries so dashboard updates
        queryClient.invalidateQueries(['advancedSales']);
        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['transactions']);
        queryClient.invalidateQueries(['customers']);
      } else {
        alert(response.message || 'Failed to create transaction.');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error creating transaction.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintBill = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      
      console.log(`Printing bill for transaction ${transactionId}`);
      
      // Use the same working API pattern as Transactions.jsx
      const response = await transactionsAPI.getInvoice(transactionId, 'pdf');
      console.log('Invoice API response:', response);
      
      if (response.success && response.html_data) {
        // Create HTML blob and open for printing
        const blob = new Blob([response.html_data], { type: 'text/html' });
        const fileURL = URL.createObjectURL(blob);
        
        // Open in new window for printing
        const printWindow = window.open(fileURL, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            // Auto-print when loaded
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        } else {
          alert('Please allow popups to print the invoice');
        }
        
        console.log('Bill opened for printing successfully');
      } else if (response.pdf_data) {
        // Handle actual PDF data if available
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
        // Fallback to simple bill
        await handleCreateSimpleBill(transactionId);
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      
      // Fallback to simple HTML bill
      try {
        await handleCreateSimpleBill(transactionId);
      } catch (fallbackError) {
        console.error('Fallback bill generation also failed:', fallbackError);
        alert('Failed to generate bill. Transaction was created successfully.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Preview and download invoice functions (currently unused)
  // These functions are preserved for future invoice management features
  /*
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
  */

  const handleCreateSimpleBill = async (transactionId) => {
    try {
      // Get transaction details (assuming getTransactionById exists)
      let transactionDetails = null;
      
      if (typeof transactionsAPI.getTransactionById === 'function') {
        const response = await transactionsAPI.getTransactionById(transactionId);
        if (response.success) {
          transactionDetails = response.transaction;
        }
      }

      // Create a simple HTML bill
      const billHTML = createBillHTML(transactionDetails || {
        id: transactionId,
        customer: customer,
        items: cart,
        total: totalAmount,
        created_at: new Date().toISOString()
      });

      // Open bill in new window for printing
      const billWindow = window.open('', '_blank');
      billWindow.document.write(billHTML);
      billWindow.document.close();
      billWindow.print();
    } catch (error) {
      console.error('Error creating simple bill:', error);
      alert('Could not generate bill, but transaction was created successfully.');
    }
  };

  const createBillHTML = (transaction) => {
    console.log('Creating bill for transaction:', transaction);
    
    // Handle different date field names
    const transactionDate = transaction.createdAt || transaction.created_at || transaction.date || new Date().toISOString();
    const formattedDate = new Date(transactionDate).toLocaleString();
    
    // Handle different amount field names
    const amount = transaction.final_amount || transaction.total_amount || totalAmount || 0;
    
    // Handle customer data
    const customerInfo = transaction.customer || customer;
    const customerName = customerInfo.name || transaction.customer_name || 'Walk-in Customer';
    const customerPhone = customerInfo.phone || transaction.customer_phone || 'N/A';
    const customerEmail = customerInfo.email || transaction.customer_email || 'N/A';
    
    // Handle status
    const status = transaction.transaction_status || transaction.status || 'Completed';
    
    // Handle payment mode
    const paymentMode = transaction.payment_mode || transaction.payment_method || 'Cash';
    
    // Handle items if available
    const items = transaction.items || cart || [];
    
    console.log('Bill data:', {
      transactionDate,
      formattedDate,
      amount,
      customerName,
      status,
      paymentMode,
      itemsCount: items.length
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Transaction ${transaction.id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background: white;
            color: #333;
            line-height: 1.6;
          }
          .container { max-width: 800px; margin: 0 auto; }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #2196F3; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          .header h1 { 
            color: #2196F3; 
            font-size: 28px; 
            margin-bottom: 5px;
          }
          .header p { 
            color: #666; 
            font-size: 16px;
          }
          .section { 
            margin-bottom: 25px; 
            padding: 15px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
          }
          .section h3 { 
            color: #2196F3; 
            margin-bottom: 10px;
            font-size: 18px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            padding: 5px 0;
          }
          .info-row:nth-child(even) { background: #f8f9fa; }
          .info-label { 
            font-weight: 600; 
            color: #555;
            min-width: 120px;
          }
          .info-value { 
            color: #333;
            flex: 1;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
          }
          .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
          }
          .items-table th { 
            background-color: #2196F3; 
            color: white;
            font-weight: 600;
          }
          .items-table tr:nth-child(even) { 
            background-color: #f8f9fa;
          }
          .total-section { 
            background: #e3f2fd;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .total-amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2196F3;
            margin: 10px 0;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 14px;
            color: #666;
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
          }
          @media print { 
            body { margin: 0; }
            .container { max-width: none; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Store Name</h1>
            <p>Transaction Receipt</p>
          </div>
          
          <div class="section">
            <h3>Transaction Details</h3>
            <div class="info-row">
              <span class="info-label">Transaction ID:</span>
              <span class="info-value">${transaction.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time:</span>
              <span class="info-value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${status}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Mode:</span>
              <span class="info-value">${paymentMode}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${customerPhone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${customerEmail}</span>
            </div>
          </div>

          ${items.length > 0 ? `
          <div class="section">
            <h3>Items Purchased</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.name || 'Unknown Item'}</td>
                    <td>₹${parseFloat(item.selling_price || 0).toFixed(2)}</td>
                    <td>${item.quantity || 1}</td>
                    <td>₹${parseFloat(item.selling_price * item.quantity || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="total-section">
            <h3>Total Amount</h3>
            <div class="total-amount">₹${parseFloat(amount).toFixed(2)}</div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
            <br>
            <p style="font-size: 12px; color: #999;">
              This is a computer generated receipt.
            </p>
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
  */  return (
    <Box sx={{ 
      p: isMobile ? 1 : 3,
      pb: isMobile ? 10 : 3, // Extra padding for mobile FAB
      minHeight: '100vh',
      backgroundColor: isMobile ? theme.palette.background.default : 'transparent'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
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
            <TextField
              fullWidth
              label="Customer Phone / Name"
              value={customerId}
              onChange={handleCustomerInputChange}
              onKeyPress={handleCustomerLookupKeyPress}
              margin="normal"
              size={isMobile ? "medium" : "medium"}
              helperText={isSearchingCustomer ? "Searching..." : "Start typing to search customers"}
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
                    <Typography variant="body2">
                      <strong>Name:</strong> {customer.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {customer.phone}
                    </Typography>
                    <Typography variant="body2">
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
            <TextField
              fullWidth
              label="Barcode / SKU / Product Name"
              value={barcode}
              onChange={handleBarcodeChange}
              onKeyPress={handleScanProduct}
              margin="normal"
              size={isMobile ? "medium" : "medium"}
              autoFocus={!!customer && !isMobile}
              helperText={isSearchingProduct ? "Searching..." : "Start typing to search products or press Enter"}
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
                        py: isMobile ? 1.5 : 1
                      }}
                    >
                      <ListItemText 
                        primary={product.name}
                        secondary={                          <>
                            <Typography component="span" variant="body2" sx={{ fontSize: isMobile ? '0.875rem' : '0.75rem' }}>
                              Price: ₹{product.selling_price} | Stock: {product.stock_quantity}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" color="textSecondary" sx={{ fontSize: isMobile ? '0.75rem' : '0.7rem' }}>
                              {product.barcode && `Barcode: ${product.barcode}`}
                              {product.barcode && product.sku && ' | '}
                              {product.sku && `SKU: ${product.sku}`}
                            </Typography>
                          </>}
                        primaryTypographyProps={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem' 
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

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
                    <Typography variant="body2">
                      <strong>Price:</strong> ₹{scannedProduct.selling_price}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Stock:</strong> {scannedProduct.stock_quantity}
                    </Typography>
                    {scannedProduct.barcode && (
                      <Typography variant="body2">
                        <strong>Barcode:</strong> {scannedProduct.barcode}
                      </Typography>
                    )}
                    {scannedProduct.sku && (
                      <Typography variant="body2">
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
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    ₹{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                
                <Stack spacing={isMobile ? 2 : 1} direction={isMobile ? 'column' : 'row'}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCreateTransaction}
                    disabled={!customer || cart.length === 0}
                    size={isMobile ? "large" : "medium"}
                    sx={{ 
                      flex: isMobile ? 'none' : 1,
                      py: isMobile ? 1.5 : 1
                    }}
                  >
                    Complete Sale
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearCart}
                    size={isMobile ? "medium" : "medium"}
                    color="error"
                  >
                    Clear Cart
                  </Button>
                </Stack>
                
                {!customer && (
                  <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                    Please select a customer to complete the sale
                  </Typography>
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
    </Box>
  );
};

export default Sales;