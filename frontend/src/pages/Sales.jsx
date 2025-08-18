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
  MenuItem
} from '@mui/material';
import { 
  AddShoppingCart, 
  Delete, 
  Print, 
  Preview, 
  Download,
  MoreVert
} from '@mui/icons-material';
import { productsAPI } from '../api/products';
import { transactionsAPI } from '../api/transactions';
import { customersAPI } from '../api/customers';

const Sales = () => {
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
  const [downloadingId, setDownloadingId] = useState(null);
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

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

  // Menu handlers
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Sales Point</Typography>

      <Grid container spacing={3}>
        {/* Customer Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Customer Details</Typography>
            <TextField
              fullWidth
              label="Customer Phone / Name"
              value={customerId}
              onChange={handleCustomerInputChange}
              onKeyPress={handleCustomerLookupKeyPress}
              margin="normal"
              helperText={isSearchingCustomer ? "Searching..." : "Start typing to search customers"}
              disabled={!!customer}
            />
            
            {/* Customer search results dropdown */}
            {showInlineCustomerResults && customerSearchResults.length > 0 && !customer && (
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 200, overflow: 'auto', position: 'relative', zIndex: 2 }}>
                <List dense>
                  {customerSearchResults.map((cust) => (
                    <ListItem 
                      button 
                      key={cust.id} 
                      onClick={() => handleSelectCustomer(cust)}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemText 
                        primary={cust.name} 
                        secondary={`Phone: ${cust.phone}${cust.email ? `, Email: ${cust.email}` : ''}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* No customer found message */}
            {showNoCustomerFoundMessage && !customer && !isSearchingCustomer && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">No customer found.</Typography>
                <Button variant="outlined" onClick={() => setShowNewCustomerForm(true)} sx={{ mt: 1 }}>
                  Add New Customer
                </Button>
              </Box>
            )}

            {/* Selected customer details */}
            {customer && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                <Typography><strong>Name:</strong> {customer.name}</Typography>
                <Typography><strong>Phone:</strong> {customer.phone}</Typography>
                <Typography><strong>Email:</strong> {customer.email || 'N/A'}</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleClearCustomer}
                  sx={{ mt: 1 }}
                >
                  Change Customer
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Product Scan Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, position: 'relative' }}>
            <Typography variant="h6" gutterBottom>Scan Product</Typography>
            <TextField
              fullWidth
              label="Barcode / SKU / Product Name"
              value={barcode}
              onChange={handleBarcodeChange}
              onKeyPress={handleScanProduct}
              margin="normal"
              autoFocus={!!customer}
              helperText={isSearchingProduct ? "Searching..." : "Start typing to search products or press Enter"}
            />

            {/* Product search results dropdown */}
            {showInlineProductResults && productSearchResults.length > 0 && (
              <Paper elevation={3} sx={{ mt: 1, maxHeight: 250, overflow: 'auto', position: 'absolute', left: 16, right: 16, zIndex: 1 }}>
                <List dense>
                  {productSearchResults.map((product) => (
                    <ListItem 
                      button 
                      key={product.id} 
                      onClick={() => handleSelectProduct(product)}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemText 
                        primary={product.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Price: ₹{product.selling_price} | Stock: {product.stock_quantity}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.barcode && `Barcode: ${product.barcode}`}
                              {product.barcode && product.sku && ' | '}
                              {product.sku && `SKU: ${product.sku}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* No product found message */}
            {showNoProductFoundMessage && !scannedProduct && !isSearchingProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">No product found.</Typography>
              </Box>
            )}

            {/* Scanned product details */}
            {scannedProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">{scannedProduct.name}</Typography>
                <Typography>Price: ₹{scannedProduct.selling_price}</Typography>
                <Typography>Stock: {scannedProduct.stock_quantity}</Typography>
                {scannedProduct.barcode && (
                  <Typography variant="body2">Barcode: {scannedProduct.barcode}</Typography>
                )}
                {scannedProduct.sku && (
                  <Typography variant="body2">SKU: {scannedProduct.sku}</Typography>
                )}
                <TextField
                  type="number"
                  label="Quantity"
                  value={scannedProduct.quantity}
                  onChange={(e) => setScannedProduct({
                    ...scannedProduct, 
                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  inputProps={{ min: 1 }}
                  size="small"
                  sx={{ mt: 1, width: '100px' }}
                />
                <br />
                <Button
                  variant="contained"
                  startIcon={<AddShoppingCart />}
                  onClick={handleAddToCart}
                  sx={{ mt: 2 }}
                >
                  Add to Cart
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Cart Items</Typography>
            {cart.length === 0 ? (
              <Typography>No items in cart.</Typography>
            ) : (
              <List>
                {cart.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1 }}>
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {item.name} (₹{item.selling_price})
                      </Typography>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFromCart(item.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <TextField
                        type="number"
                        label="Qty"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        inputProps={{ min: 1 }}
                        size="small"
                        sx={{ width: '80px' }}
                      />
                      <Typography variant="h6" color="primary">
                        ₹{(item.selling_price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            <Divider sx={{ my: 2 }} />
            
            {/* Updated button section with loading states */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">Total: ₹{totalAmount.toFixed(2)}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearCart}
                  startIcon={<Delete />}
                  disabled={downloadingId !== null}
                >
                  Clear Cart
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateTransaction}
                  startIcon={downloadingId === 'creating' ? <CircularProgress size={20} color="inherit" /> : <AddShoppingCart />}
                  disabled={cart.length === 0 || !customer || downloadingId !== null}
                >
                  {downloadingId === 'creating' ? 'Creating Transaction...' : 
                   downloadingId ? 'Generating Bill...' : 
                   'Create Transaction & Print Bill'}
                </Button>

                {/* Additional Invoice Actions Menu */}
                {lastTransactionId && (
                  <>
                    <IconButton 
                      onClick={handleMenuOpen}
                      disabled={downloadingId !== null}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={menuAnchorEl}
                      open={Boolean(menuAnchorEl)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem 
                        onClick={() => {
                          handleMenuClose();
                          handlePrintBill(lastTransactionId);
                        }}
                        disabled={downloadingId !== null}
                      >
                        <Print sx={{ mr: 1 }} />
                        Print Last Invoice
                      </MenuItem>
                      <MenuItem 
                        onClick={() => {
                          handleMenuClose();
                          handlePreviewInvoice(lastTransactionId);
                        }}
                        disabled={downloadingId !== null}
                      >
                        <Preview sx={{ mr: 1 }} />
                        Preview Last Invoice
                      </MenuItem>
                      <MenuItem 
                        onClick={() => {
                          handleMenuClose();
                          handleDownloadInvoice(lastTransactionId);
                        }}
                        disabled={downloadingId !== null}
                      >
                        <Download sx={{ mr: 1 }} />
                        Download Last Invoice
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Box>
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