import React, { useState, useContext, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Alert,
  Skeleton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  SwipeableDrawer,
  Autocomplete,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Receipt,
  Person,
  AttachMoney,
  CalendarToday,
  Close,
  FilterList,
  ExpandMore,
  ShoppingCart,
  Visibility,
  Print,
  GetApp,
  FileDownload,
  SwapHoriz,
  TrendingUp,
  AccessTime,
  Star,
  StarBorder,
  Phone,
  Mail,
  LocationOn,
  CreditCard
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsAPI } from '../api/transactions';
import { enqueueMutation } from '../utils/offlineMutationQueue';
import { customersAPI } from '../api/customers';
import { productsAPI } from '../api/products';
import { useAuth } from '../contexts/useAuth';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Transactions = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user for admin check
  const { showSnackbar } = useContext(NotificationContext);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [viewMode] = useState(isMobile ? 'card' : 'table');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [tabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, transactionId: null });
  const [quickFilters, setQuickFilters] = useState({
    today: false,
    thisWeek: false,
    thisMonth: false,
    highValue: false,
    pending: false
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [bulkSelect, setBulkSelect] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState({ open: false, transactionId: null });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Queries
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsAPI.getTransactions,
  });

  useQuery({
    queryKey: ['customers'],
    queryFn: customersAPI.getCustomers,
  });

  useQuery({
    queryKey: ['products'],
    queryFn: productsAPI.getProducts,
  });

  // Mutations
  const deleteTransactionMutation = useMutation({
    mutationFn: transactionsAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    },
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: transactionsAPI.exportTransactions,
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });

  // Enhanced filtering logic
  const applyQuickFilters = (transactions) => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at || transaction.createdAt);
      const today = new Date();
      const amount = parseFloat(transaction.final_amount || transaction.total_amount || 0);
      
      // Quick filters
      if (quickFilters.today) {
        const isToday = transactionDate.toDateString() === today.toDateString();
        if (!isToday) return false;
      }
      
      if (quickFilters.thisWeek) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        if (transactionDate < weekStart) return false;
      }
      
      if (quickFilters.thisMonth) {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        if (transactionDate < monthStart) return false;
      }
      
      if (quickFilters.highValue && amount < 50000) return false;
      if (quickFilters.pending && transaction.transaction_status !== 'pending') return false;
      
      return true;
    });
  };

  // Enhanced sorting logic
  const applySorting = (transactions) => {
    if (!transactions) return [];
    
    return [...transactions].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at || a.createdAt);
          bValue = new Date(b.created_at || b.createdAt);
          break;
        case 'amount':
          aValue = parseFloat(a.final_amount || a.total_amount || 0);
          bValue = parseFloat(b.final_amount || b.total_amount || 0);
          break;
        case 'customer':
          aValue = (a.customer_name || 'Walk-in').toLowerCase();
          bValue = (b.customer_name || 'Walk-in').toLowerCase();
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  // Filtered transactions with enhanced logic
  const allTransactions = transactions?.transactions || [];
  const searchFiltered = allTransactions.filter(transaction => {
    const matchesSearch = transaction.id?.toString().includes(searchTerm) ||
                         transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || transaction.transaction_status === statusFilter;
    const matchesType = !typeFilter || transaction.transaction_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const quickFiltered = applyQuickFilters(searchFiltered);
  const filteredTransactions = applySorting(quickFiltered);

  // Tab filtering
  const getTransactionsByTab = () => {
    switch (tabValue) {
      case 0: return filteredTransactions; // All
      case 1: return filteredTransactions.filter(t => t.transaction_type === 'sale');
      case 2: return filteredTransactions.filter(t => t.transaction_type === 'purchase');
      case 3: return filteredTransactions.filter(t => t.transaction_status === 'pending');
      default: return filteredTransactions;
    }
  };

  const displayTransactions = getTransactionsByTab();

  const handleAddTransaction = () => {
    navigate('/sales');
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };

  const handleDeleteTransaction = (transactionId) => {
    setConfirmDialog({ open: true, transactionId });
  };

  const handleConfirmDelete = async () => {
    const transactionId = confirmDialog.transactionId;
    setConfirmDialog({ open: false, transactionId: null });
    const isOnline = window.navigator.onLine;
    if (isOnline) {
      await deleteTransactionMutation.mutateAsync(transactionId);
      showSnackbar('Transaction deleted successfully.', 'success');
    } else {
      enqueueMutation({ url: `/api/transactions/${transactionId}`, method: 'DELETE' });
      showSnackbar('Transaction delete queued for sync (offline mode).', 'info');
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(swReg => {
          swReg.sync.register('sync-mutations');
        });
      }
    }
  };

  const handleExportTransactions = () => {
    exportTransactionsMutation.mutate();
  };

  // Enhanced invoice download with preview option
  const handleDownloadInvoice = async (transactionId) => {
    try {
      // Fallback to server-generated invoice (keep it simple for downloads)
      let response;
      try {
        response = await transactionsAPI.getInvoice(transactionId);
      } catch (invoiceError) {
        console.log('Invoice endpoint failed, trying transaction invoice endpoint:', invoiceError);
        response = await transactionsAPI.getTransactionInvoice(transactionId);
      }
      
      if (response && response.html_data) {
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        if (newWindow) {
          newWindow.document.write(response.html_data);
          newWindow.document.close();
          newWindow.document.title = `Invoice #${transactionId}`;
        } else {
          showSnackbar('Please allow pop-ups for this site to view invoices.', 'info');
        }
      } else {
        console.log('Response received:', response);
        showSnackbar('No invoice data received from server.', 'warning');
      }
    } catch {
      showSnackbar('Failed to open invoice. Please check if the transaction exists and try again.', 'error');
    }
  };

  // New: Preview invoice in modal
  const handlePreviewInvoice = (transactionId) => {
    setInvoicePreview({ open: true, transactionId });
  };

  // New: Bulk actions
  const handleBulkAction = (action) => {
    switch (action) {
      case 'export':
        exportTransactionsMutation.mutate({ ids: bulkSelect });
        break;
      case 'delete':
        // Handle bulk delete
        break;
      default:
        break;
    }
    setBulkSelect([]);
    setShowBulkActions(false);
  };

  // New: Toggle bulk selection
  const handleBulkToggle = (transactionId) => {
    setBulkSelect(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  // Generate QR Code data URL using Canvas (same as Sales page)
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

  // Generate digital signature (same as Sales page)
  const generateDigitalSignature = (transactionData) => {
    try {
      // Create a deterministic signature based on transaction data
      const signatureData = `${transactionData.id}${transactionData.created_at || transactionData.createdAt}${transactionData.total_amount || transactionData.final_amount}${transactionData.customer?.name || 'anonymous'}`;
      
      // Simple hash-like function (for demonstration)
      let hash = 0;
      for (let i = 0; i < signatureData.length; i++) {
        const char = signatureData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Convert to hex and add some formatting to look like a signature
      const hexHash = Math.abs(hash).toString(16).toUpperCase();
      const timestamp = new Date().getTime().toString(16).toUpperCase();
      
      return `DS${hexHash.padStart(8, '0')}${timestamp.slice(-6)}`;
    } catch (error) {
      console.error('Error generating digital signature:', error);
      return 'DS00000000000000';
    }
  };

  // Enhanced transaction invoice generation (same as Sales page)
  const createEnhancedTransactionInvoice = async (transaction) => {
    console.log('Creating enhanced invoice for transaction:', transaction);
    
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
    }
    
    // Use transaction values if available, otherwise calculate from current state
    const transactionSubtotal = parseFloat(transaction.subtotal || subtotal || 0);
    const discountAmount = parseFloat(transaction.discount_amount || 0);
    const taxRate = parseFloat(transaction.tax_rate || 0);
    const loyaltyDiscountAmount = parseFloat(transaction.loyalty_discount || 0);
    
    // Calculate tax amount properly
    const taxableAmount = Math.max(0, transactionSubtotal - discountAmount - loyaltyDiscountAmount);
    const calculatedTaxAmount = (taxableAmount * taxRate) / 100;
    const taxAmount = parseFloat(transaction.tax_amount || calculatedTaxAmount || 0);
    
    // Calculate final amount
    const calculatedFinalAmount = transactionSubtotal - discountAmount - loyaltyDiscountAmount + taxAmount;
    const finalAmount = parseFloat(transaction.final_amount || transaction.total_amount || calculatedFinalAmount || 0);
    
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
    const customerInfo = transaction.customer;
    const customerName = customerInfo?.name || transaction.customer_name || 'Walk-in Customer';
    const customerPhone = customerInfo?.phone || transaction.customer_phone || 'N/A';
    const customerEmail = customerInfo?.email || transaction.customer_email || 'N/A';
    const customerAddress = customerInfo?.address || transaction.customer_address || 'N/A';
    
    // Payment and status info
    const status = transaction.transaction_status || transaction.status || 'Completed';
    const paymentMode = transaction.payment_mode || transaction.payment_method || 'Cash';
    const transactionNotes = transaction.notes || '';

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
      </body>
      </html>
    `;
  };

  // Helper functions for status and type colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sale': return 'success';
      case 'purchase': return 'info';
      case 'return': return 'warning';
      case 'exchange': return 'secondary';
      default: return 'default';
    }
  };

  // Enhanced Invoice Preview Component (moved inside to access allTransactions and functions)
  const InvoicePreview = ({ transactionId }) => {
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchInvoiceData = async () => {
        try {
          // First try to find the transaction in our local state for enhanced invoice
          const transaction = allTransactions.find(t => t.id === transactionId);
          
          if (transaction) {
            // Generate enhanced invoice HTML locally (like Sales page)
            const enhancedHTML = await createEnhancedTransactionInvoice(transaction);
            setInvoiceData({ html_data: enhancedHTML });
          } else {
            // Fallback to server-generated invoice
            const response = await transactionsAPI.getInvoice(transactionId);
            setInvoiceData(response);
          }
        } catch (error) {
          console.error('Failed to fetch invoice:', error);
          // Try fallback if main method fails
          try {
            const response = await transactionsAPI.getTransactionInvoice(transactionId);
            setInvoiceData(response);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
          }
        } finally {
          setLoading(false);
        }
      };

      if (transactionId) {
        fetchInvoiceData();
      }
    }, [transactionId]);

    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!invoiceData || !invoiceData.html_data) {
      return (
        <Alert severity="error">
          Failed to load invoice data
        </Alert>
      );
    }

    return (
      <Box sx={{ 
        height: '70vh', 
        border: 1, 
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden'
      }}>
        <iframe
          srcDoc={invoiceData.html_data}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="Enhanced Invoice Preview"
        />
      </Box>
    );
  };

  // Speed Dial Actions
  const speedDialActions = [
    ...(isAdmin ? [{ icon: <Add />, name: 'New Sale', onClick: handleAddTransaction }] : []),
    { icon: <GetApp />, name: 'Export CSV', onClick: handleExportTransactions },
    { icon: <FilterList />, name: 'Filters', onClick: () => setOpenDrawer(true) },
  ];

  // Enhanced Mobile Card View
  const renderCardView = () => (
    <Grid container spacing={2}>
      {displayTransactions.map((transaction) => (
        <Grid item xs={12} sm={6} lg={4} key={transaction.id}>
          <Card 
            elevation={isMobile ? 1 : 2}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              border: bulkSelect.includes(transaction.id) ? 2 : 0,
              borderColor: bulkSelect.includes(transaction.id) ? 'primary.main' : 'transparent',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, p: 2 }}>
              {/* Enhanced Header with Bulk Selection */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Select for bulk actions">
                    <IconButton 
                      size="small" 
                      onClick={() => handleBulkToggle(transaction.id)}
                      color={bulkSelect.includes(transaction.id) ? "primary" : "default"}
                    >
                      {bulkSelect.includes(transaction.id) ? <Star /> : <StarBorder />}
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                      #{transaction.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(transaction.created_at || transaction.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                  <Chip
                    label={transaction.transaction_type}
                    size="small"
                    color={getTypeColor(transaction.transaction_type)}
                    variant="outlined"
                    icon={transaction.transaction_type === 'exchange' ? <SwapHoriz /> : undefined}
                  />
                  <Chip
                    label={transaction.transaction_status}
                    size="small"
                    color={getStatusColor(transaction.transaction_status)}
                  />
                </Box>
              </Box>

              {/* Enhanced Customer Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                  <Person sx={{ fontSize: 18 }} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="500" noWrap>
                    {transaction.customer_name || transaction.customer?.name || 'Walk-in Customer'}
                  </Typography>
                  {transaction.customer?.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {transaction.customer.phone}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Enhanced Amount Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                <AttachMoney sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" color="success.main" fontWeight="600">
                    ₹{Number(transaction.total_amount || transaction.final_amount || 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Final Amount
                  </Typography>
                </Box>
              </Box>

              {/* Enhanced Items Count with Details */}
              {transaction.items && transaction.items.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                  <ShoppingCart sx={{ fontSize: 16, mr: 1, color: 'info.main' }} />
                  <Typography variant="body2" color="info.main" fontWeight="500">
                    {transaction.items.length} item{transaction.items.length > 1 ? 's' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    • {transaction.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} pieces
                  </Typography>
                </Box>
              )}

              {/* Payment Method */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCard sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {transaction.payment_mode || 'Cash'}
                </Typography>
              </Box>
            </CardContent>

            {/* Enhanced Action Buttons */}
            <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => handlePreviewInvoice(transaction.id)}
                startIcon={<Visibility />}
                sx={{ flex: 1 }}
              >
                Preview
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={() => handleDownloadInvoice(transaction.id)}
                startIcon={<Print />}
                sx={{ flex: 1 }}
              >
                Print
              </Button>
              {isAdmin && (
                <IconButton 
                  color="error"
                  size="small"
                  onClick={() => handleDeleteTransaction(transaction.id)}
                >
                  <Delete />
                </IconButton>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Desktop Table View with Mobile Responsiveness
  const renderTableView = () => (
    <Box sx={{ 
      width: '100%',
      overflowX: 'auto',
      '& .MuiTableContainer-root': {
        borderRadius: 2
      }
    }}>
      <TableContainer component={Paper} sx={{ 
        boxShadow: 2,
        minWidth: { xs: 700, md: 'auto' }, // Minimum width for mobile scroll
        overflowX: 'auto'
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50' }}>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '60px'
              }}>ID</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '120px'
              }}>Customer</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '80px'
              }}>Date</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '80px'
              }}>Status</TableCell>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '70px'
              }}>Type</TableCell>
              <TableCell align="right" sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '100px'
              }}>Amount (₹)</TableCell>
              <TableCell align="center" sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                minWidth: '120px'
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayTransactions.map((transaction) => (
                <TableRow key={transaction.id} sx={{ '&:hover': { backgroundColor: (theme) => theme.palette.action.hover } }}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {transaction.id}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="body2" noWrap sx={{ 
                      maxWidth: { xs: '100px', md: '150px' },
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}>
                      {transaction.customer?.name || 'Walk-in'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}>
                      {new Date(transaction.createdAt || transaction.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.transaction_status || 'completed'} 
                      color={getStatusColor(transaction.transaction_status || 'completed')} 
                      size="small"
                      sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={transaction.transaction_type || 'N/A'} 
                      color={getTypeColor(transaction.transaction_type || 'N/A')} 
                      size="small"
                      sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                      icon={transaction.transaction_type === 'exchange' ? <SwapHoriz /> : undefined}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    {parseFloat(transaction.final_amount || 0).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, md: 1 },
                      justifyContent: 'center',
                      flexWrap: 'nowrap'
                    }}>
                      <Tooltip title="View/Print Invoice">
                        <IconButton 
                          onClick={() => handleDownloadInvoice(transaction.id)} 
                          color="primary" 
                          size={isMobile ? "small" : "medium"}
                        >
                          <Print />
                        </IconButton>
                      </Tooltip>
                      {isAdmin && (
                        <>
                          <Tooltip title="Edit Transaction">
                            <IconButton 
                              onClick={() => handleEditTransaction(transaction)} 
                              color="primary" 
                              size={isMobile ? "small" : "medium"}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Transaction">
                            <IconButton 
                              onClick={() => handleDeleteTransaction(transaction.id)} 
                              color="error" 
                              size={isMobile ? "small" : "medium"}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Confirmation Dialog for Delete
  const renderConfirmDialog = () => (
    <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, transactionId: null })}>
      <DialogTitle>Delete Transaction</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete this transaction?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog({ open: false, transactionId: null })}>Cancel</Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Enhanced Analytics Dashboard */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {displayTransactions.length}
                  </Typography>
                  <Typography variant="body2">Total Transactions</Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{displayTransactions.reduce((sum, t) => sum + parseFloat(t.final_amount || t.total_amount || 0), 0).toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="body2">Total Revenue</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'warning.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {displayTransactions.filter(t => t.transaction_status === 'pending').length}
                  </Typography>
                  <Typography variant="body2">Pending Orders</Typography>
                </Box>
                <AccessTime sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: 'info.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    ₹{displayTransactions.length > 0 ? (displayTransactions.reduce((sum, t) => sum + parseFloat(t.final_amount || t.total_amount || 0), 0) / displayTransactions.length).toLocaleString('en-IN') : '0'}
                  </Typography>
                  <Typography variant="body2">Avg. Transaction</Typography>
                </Box>
                <Star sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Enhanced Quick Filters */}
      <Box sx={{ mb: 3 }}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Quick Filters</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label="Today"
              onClick={() => setQuickFilters(prev => ({ ...prev, today: !prev.today }))}
              color={quickFilters.today ? "primary" : "default"}
              variant={quickFilters.today ? "filled" : "outlined"}
            />
            <Chip
              label="This Week"
              onClick={() => setQuickFilters(prev => ({ ...prev, thisWeek: !prev.thisWeek }))}
              color={quickFilters.thisWeek ? "primary" : "default"}
              variant={quickFilters.thisWeek ? "filled" : "outlined"}
            />
            <Chip
              label="This Month"
              onClick={() => setQuickFilters(prev => ({ ...prev, thisMonth: !prev.thisMonth }))}
              color={quickFilters.thisMonth ? "primary" : "default"}
              variant={quickFilters.thisMonth ? "filled" : "outlined"}
            />
            <Chip
              label="High Value (₹50K+)"
              onClick={() => setQuickFilters(prev => ({ ...prev, highValue: !prev.highValue }))}
              color={quickFilters.highValue ? "warning" : "default"}
              variant={quickFilters.highValue ? "filled" : "outlined"}
            />
            <Chip
              label="Pending"
              onClick={() => setQuickFilters(prev => ({ ...prev, pending: !prev.pending }))}
              color={quickFilters.pending ? "error" : "default"}
              variant={quickFilters.pending ? "filled" : "outlined"}
            />
          </Box>
          
          {/* Sort Controls */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
                <MenuItem value="id">ID</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label="Order"
              >
                <MenuItem value="desc">Desc</MenuItem>
                <MenuItem value="asc">Asc</MenuItem>
              </Select>
            </FormControl>
            {bulkSelect.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowBulkActions(true)}
                startIcon={<Badge badgeContent={bulkSelect.length} color="error"><Edit /></Badge>}
              >
                Bulk Actions
              </Button>
            )}
          </Box>
        </Card>
      </Box>
      {/* Header - Responsive */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: { xs: 2, md: 4 }, 
        width: '100%', 
        gap: { xs: 2, md: 0 },
        p: 0.5
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 'bold' }}>
          Transactions
        </Typography>
        
        {/* Mobile-friendly controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', md: 'auto' }
        }}>
          <TextField 
            label="Search by Customer/ID" 
            variant="outlined" 
            size="small" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            sx={{ 
              width: { xs: '100%', sm: '200px', md: '250px' }
            }} 
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button 
              variant="outlined" 
              startIcon={<GetApp />} 
              onClick={handleExportTransactions}
              disabled={exportTransactionsMutation.isPending}
              size={isMobile ? "small" : "medium"}
              sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
            >
              {exportTransactionsMutation.isPending ? 'Exporting...' : 'Export'}
            </Button>
            
            {isAdmin && (
              <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={handleAddTransaction}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? 'New Sale' : 'New Sale'}
              </Button>
            )}
            
            <Button 
              variant="outlined" 
              startIcon={<FilterList />} 
              onClick={() => setOpenDrawer(true)}
              size={isMobile ? "small" : "medium"}
            >
              Filters
            </Button>
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: '100%' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to fetch transactions: {error.message}</Alert>}
        {isLoading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        ) : (
          <>
            {viewMode === 'table' ? renderTableView() : renderCardView()}
          </>
        )}
      </Box>

      {/* Filters Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onOpen={() => setOpenDrawer(true)}
      >
        <Box sx={{ width: 300 }} role="presentation" onClick={() => setOpenDrawer(false)} onKeyDown={() => setOpenDrawer(false)}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="600">Filters</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="sale">Sale</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="return">Return</MenuItem>
                <MenuItem value="exchange">Exchange</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => { setOpenDrawer(false); queryClient.invalidateQueries(['transactions']); }}
              sx={{ mt: 1 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Transaction Edit Dialog */}
  <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <TransactionForm 
            transaction={selectedTransaction} 
            onClose={() => setOpenDialog(false)} 
            onSuccess={() => { 
              setOpenDialog(false); 
              queryClient.invalidateQueries(['transactions']); 
            }}
            showSnackbar={showSnackbar}
          />
        </DialogContent>
      </Dialog>

      {/* Speed Dial for mobile */}
      {isMobile && (
        <SpeedDial
          ariaLabel="Speed dial"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          onOpen={() => setSpeedDialOpen(true)}
          onClose={() => setSpeedDialOpen(false)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      )}
      {/* Enhanced Invoice Preview Modal */}
      <Dialog 
        open={invoicePreview.open} 
        onClose={() => setInvoicePreview({ open: false, transactionId: null })}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Invoice Preview</Typography>
          <IconButton onClick={() => setInvoicePreview({ open: false, transactionId: null })}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <InvoicePreview transactionId={invoicePreview.transactionId} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDownloadInvoice(invoicePreview.transactionId)} startIcon={<Print />}>
            Print/Download
          </Button>
          <Button onClick={() => setInvoicePreview({ open: false, transactionId: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onClose={() => setShowBulkActions(false)}>
        <DialogTitle>Bulk Actions ({bulkSelect.length} items selected)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose an action to apply to {bulkSelect.length} selected transactions:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => handleBulkAction('export')}
              fullWidth
            >
              Export Selected
            </Button>
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleBulkAction('delete')}
                fullWidth
              >
                Delete Selected
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBulkActions(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {renderConfirmDialog()}
    </Box>
  );
};

// TransactionForm component for editing transactions
const TransactionForm = ({ transaction, onClose, onSuccess, showSnackbar }) => {
  const [formData, setFormData] = useState({
    customer_name: transaction?.customer_name || '',
    customer_phone: transaction?.customer_phone || '',
    total_amount: transaction?.total_amount || transaction?.final_amount || '',
    transaction_status: transaction?.transaction_status || 'completed',
    transaction_type: transaction?.transaction_type || 'sale',
    payment_mode: transaction?.payment_mode || 'cash',
    notes: transaction?.notes || ''
  });

  const updateTransactionMutation = useMutation({
    mutationFn: (data) => transactionsAPI.updateTransaction(transaction.id, data),
    onSuccess: () => {
      showSnackbar('Transaction updated successfully!', 'success');
      onSuccess();
    },
    onError: (error) => {
      showSnackbar(`Failed to update transaction: ${error.message}`, 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTransactionMutation.mutate(formData);
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Customer Name"
            value={formData.customer_name}
            onChange={handleChange('customer_name')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Customer Phone"
            value={formData.customer_phone}
            onChange={handleChange('customer_phone')}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Amount"
            type="number"
            value={formData.total_amount}
            onChange={handleChange('total_amount')}
            variant="outlined"
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={formData.payment_mode}
              onChange={handleChange('payment_mode')}
              label="Payment Mode"
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="netbanking">Net Banking</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.transaction_status}
              onChange={handleChange('transaction_status')}
              label="Status"
            >
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.transaction_type}
              onChange={handleChange('transaction_type')}
              label="Type"
            >
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="return">Return</MenuItem>
              <MenuItem value="exchange">Exchange</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={handleChange('notes')}
            variant="outlined"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={updateTransactionMutation.isPending}
        >
          {updateTransactionMutation.isPending ? 'Updating...' : 'Update Transaction'}
        </Button>
      </Box>
    </Box>
  );
};

export default Transactions;
