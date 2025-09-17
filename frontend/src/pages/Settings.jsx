import React, { useState, useContext, useEffect } from 'react';
import {
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert, 
  Switch, 
  FormControlLabel, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Chip, 
  Divider, 
  Stack,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge
} from '@mui/material';
import { 
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
  CheckCircle as CheckCircleIcon, RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CloudUpload as CloudUploadIcon, Close as CloseIcon // ADD THESE
} from '@mui/icons-material';
import { useAuth } from '../contexts/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import { settingsAPI } from '../api/settings';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { NotificationContext } from '../contexts/NotificationContext';

// --- Validation Schemas ---
const profileSchema = yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  email: yup.string().trim().email('Invalid email format').required('Email is required'),
  phone: yup.string().trim().nullable(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword'), null], 'Passwords must match').required('Please confirm password'),
});

const userManagementSchema = (isEditing) => yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  username: yup.string().trim().required('Username is required'),
  email: yup.string().trim().email('Invalid email format').required('Email is required'),
  phone: yup.string().trim().nullable(),
  password: yup.string().when({
    is: () => !isEditing,
    then: (schema) => schema.min(6, 'Password must be at least 6 characters').required('Password is required for new users'),
    otherwise: (schema) => schema.min(6, 'Password must be at least 6 characters').notRequired(),
  }),
  role: yup.string().oneOf(['admin', 'manager', 'sales', 'inventory']).required('Role is required'),
  is_active: yup.boolean(),
});

const settingsSchema = yup.object({
  shop_name: yup.string().trim().required('Shop name is required'),
  shop_address: yup.string().trim().required('Shop address is required'),
  gst_percentage: yup.number().typeError('GST must be a number').min(0, 'GST cannot be negative').required('GST percentage is required'),
  phone: yup.string().trim(),
  email: yup.string().trim().email('Invalid email format'),
  website: yup.string().trim().url('Invalid URL format'),
  established_year: yup.number().min(1900, 'Invalid year').max(new Date().getFullYear(), 'Year cannot be in future'),
  gst_number: yup.string().trim(),
  pan_number: yup.string().trim(),
  tax_number: yup.string().trim(),
  bank_name: yup.string().trim(),
  bank_account: yup.string().trim(),
  bank_ifsc: yup.string().trim(),
});

// --- Components ---
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  // Theme and responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 1. HOOKS AND STATE
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [errorAlert, setErrorAlert] = useState('');
  const [successAlert, setSuccessAlert] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFilters, setUserFilters] = useState({ name: '', role: 'all', status: 'all' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);
  const [allLogos, setAllLogos] = useState([]);
  const [selectedLogoForPreview, setSelectedLogoForPreview] = useState(null);
  const [logoManagementOpen, setLogoManagementOpen] = useState(false); // ADD THIS
  const [uploadPreview, setUploadPreview] = useState(null); // ADD THIS
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false); // ADD THIS
  const { showSnackbar } = useContext(NotificationContext);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  // 2. FORMS (DECLARED BEFORE DATA FETCHING)
  const { control: profileControl, handleSubmit: handleProfileSubmit, reset: resetProfileForm, formState: { errors: profileErrors } } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' }
  });

  const { control: passwordControl, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const { control: userFormControl, handleSubmit: handleUserFormSubmit, reset: resetUserForm, setValue, formState: { errors: userFormErrors } } = useForm({
    resolver: yupResolver(userManagementSchema(!!editingUser)),
    defaultValues: { firstName: '', lastName: '', username: '', email: '', phone: '', password: '', role: 'sales', is_active: true }
  });

  const { control: settingsControl, handleSubmit: handleSettingsSubmit, reset: resetSettingsForm, formState: { errors: settingsErrors } } = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: { 
      shop_name: '', 
      shop_address: '', 
      gst_percentage: '',
      phone: '',
      email: '',
      website: '',
      established_year: '',
      gst_number: '',
      pan_number: '',
      tax_number: '',
      bank_name: '',
      bank_account: '',
      bank_ifsc: ''
    }
  });

  // 3. DATA FETCHING (BEFORE EFFECTS THAT USE THE DATA)
  const { data: usersData, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ['users', userFilters],
    queryFn: async () => {
      try {
        const result = await usersAPI.getAllUsers(userFilters);
        return result;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    enabled: user?.role === 'admin',
    retry: 2,
    retryDelay: 1000,
  });



  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['logo', logoRefreshKey],
    queryFn: () => settingsAPI.getLogo(),
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 0 // Always fetch fresh data
  });

  const { data: settingsData, isLoading: areSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getSettings(),
  });

  const { data: allLogosData, isLoading: isAllLogosLoading } = useQuery({
    queryKey: ['all-logos', logoRefreshKey],
    queryFn: () => settingsAPI.getAllLogos(),
    refetchOnWindowFocus: false,
  });

  // 4. MUTATIONS
  const restoreDatabaseMutation = useMutation({
    mutationFn: settingsAPI.restoreDatabase,
    onSuccess: () => {
      showSnackbar('Database restored successfully! Please refresh the page.', 'success');
      queryClient.clear();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to restore database.', 'error'),
  });

  // Add missing mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      showSnackbar('Profile updated successfully!', 'success');
      queryClient.invalidateQueries(['user']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to update profile.', 'error'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      showSnackbar('Password changed successfully!', 'success');
      resetPasswordForm();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to change password.', 'error'),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => settingsAPI.updateSettings(data),
    onSuccess: () => {
      showSnackbar('Settings updated successfully!', 'success');
      queryClient.invalidateQueries(['settings']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to update settings.', 'error'),
  });

  const createUserMutation = useMutation({
    mutationFn: (userData) => usersAPI.createUser(userData),
    onSuccess: () => {
      showSnackbar('User created successfully!', 'success');
      queryClient.invalidateQueries(['users']);
      handleCloseUserDialog();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to create user.', 'error'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }) => usersAPI.updateUser(id, userData),
    onSuccess: () => {
      showSnackbar('User updated successfully!', 'success');
      queryClient.invalidateQueries(['users']);
      handleCloseUserDialog();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to update user.', 'error'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => usersAPI.deleteUser(userId),
    onSuccess: () => {
      showSnackbar('User deleted successfully!', 'success');
      queryClient.invalidateQueries(['users']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to delete user.', 'error'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file) => settingsAPI.uploadLogo(file),
    onSuccess: () => {
      showSnackbar('Logo uploaded successfully!', 'success');
      setLogoRefreshKey(prev => prev + 1);
      setLogoFile(null);
      setUploadPreview(null);
      queryClient.invalidateQueries(['logo']);
      queryClient.invalidateQueries(['all-logos']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to upload logo.', 'error'),
  });

  const setActiveLogoMutation = useMutation({
    mutationFn: (filename) => settingsAPI.setActiveLogo(filename),
    onSuccess: () => {
      showSnackbar('Logo set as active successfully!', 'success');
      setLogoRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries(['logo']);
      queryClient.invalidateQueries(['all-logos']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to set active logo.', 'error'),
  });

  const resetSettingsMutation = useMutation({
    mutationFn: () => settingsAPI.resetSettings(),
    onSuccess: () => {
      showSnackbar('Settings reset successfully!', 'success');
      queryClient.invalidateQueries(['settings']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to reset settings.', 'error'),
  });

  const clearAllDataMutation = useMutation({
    mutationFn: () => settingsAPI.clearAllData(),
    onSuccess: () => {
      showSnackbar('All data cleared successfully!', 'success');
      queryClient.clear();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to clear data.', 'error'),
  });

  const factoryResetMutation = useMutation({
    mutationFn: () => settingsAPI.factoryReset(),
    onSuccess: () => {
      showSnackbar('Factory reset completed successfully!', 'success');
      queryClient.clear();
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to perform factory reset.', 'error'),
  });

  // Data Export Mutations
  const exportAllDataMutation = useMutation({
    mutationFn: settingsAPI.exportAllData,
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('All data exported successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to export data.', 'error'),
  });

  const exportProductsMutation = useMutation({
    mutationFn: settingsAPI.exportProducts,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('Products exported successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to export products.', 'error'),
  });

  const exportCustomersMutation = useMutation({
    mutationFn: settingsAPI.exportCustomers,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('Customers exported successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to export customers.', 'error'),
  });

  const exportTransactionsMutation = useMutation({
    mutationFn: settingsAPI.exportTransactions,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('Transactions exported successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to export transactions.', 'error'),
  });

  // Database Operations Mutations
  const backupDatabaseMutation = useMutation({
    mutationFn: settingsAPI.backupDatabase,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSnackbar('Database backup created successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to create backup.', 'error'),
  });

  // Data Cleanup Mutations
  const cleanDuplicatesMutation = useMutation({
    mutationFn: settingsAPI.cleanDuplicates,
    onSuccess: (data) => {
      showSnackbar(`Cleaned ${data.removed || 0} duplicate records successfully!`, 'success');
      queryClient.invalidateQueries();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to clean duplicates.', 'error'),
  });

  const archiveOldDataMutation = useMutation({
    mutationFn: settingsAPI.archiveOldData,
    onSuccess: (data) => {
      showSnackbar(`Archived ${data.archived || 0} old records successfully!`, 'success');
      queryClient.invalidateQueries();
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to archive data.', 'error'),
  });

  const rebuildIndexesMutation = useMutation({
    mutationFn: settingsAPI.rebuildIndexes,
    onSuccess: () => {
      showSnackbar('Database indexes rebuilt successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to rebuild indexes.', 'error'),
  });

  const validateDataMutation = useMutation({
    mutationFn: settingsAPI.validateData,
    onSuccess: (data) => {
      showSnackbar(`Data validation completed! Found ${data.issues || 0} issues.`, data.issues > 0 ? 'warning' : 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to validate data.', 'error'),
  });

  const updateStatisticsMutation = useMutation({
    mutationFn: settingsAPI.updateStatistics,
    onSuccess: () => {
      showSnackbar('Database statistics updated successfully!', 'success');
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to update statistics.', 'error'),
  });

  const syncInventoryMutation = useMutation({
    mutationFn: settingsAPI.syncInventory,
    onSuccess: (data) => {
      showSnackbar(`Inventory sync completed! Updated ${data.updated || 0} items.`, 'success');
      queryClient.invalidateQueries(['products']);
    },
    onError: (err) => showSnackbar(err.response?.data?.message || 'Failed to sync inventory.', 'error'),
  });

  // 5. EFFECTS (AFTER DATA FETCHING)
  useEffect(() => {
    if (user) {
      resetProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, resetProfileForm]);

  useEffect(() => {
    if (settingsData) {
      resetSettingsForm({
        shop_name: settingsData.shop_name || '',
        shop_address: settingsData.shop_address || '',
        gst_percentage: settingsData.gst_percentage || '18',
        phone: settingsData.phone || '',
        email: settingsData.email || '',
        website: settingsData.website || '',
        established_year: settingsData.established_year || '',
        gst_number: settingsData.gst_number || '',
        pan_number: settingsData.pan_number || '',
        tax_number: settingsData.tax_number || '',
        bank_name: settingsData.bank_name || '',
        bank_account: settingsData.bank_account || '',
        bank_ifsc: settingsData.bank_ifsc || ''
      });
    }
  }, [settingsData, resetSettingsForm]);

  useEffect(() => {
    if (logoData) {
      try {
        const objectUrl = URL.createObjectURL(logoData);
        setLogoPreview(objectUrl);
        
        return () => URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Error creating logo URL:', error);
        setLogoPreview('');
      }
    } else {
      setLogoPreview('');
    }
  }, [logoData]);

  useEffect(() => {
    if (allLogosData) {
      setAllLogos(allLogosData);
    }
  }, [allLogosData]);

  useEffect(() => {
    if (successAlert || errorAlert) {
      const timer = setTimeout(() => {
        setSuccessAlert('');
        setErrorAlert('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successAlert, errorAlert]);

  // 6. EVENT HANDLERS AND OTHER FUNCTIONS
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setErrorAlert('');
    setSuccessAlert('');
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      // Create preview for upload
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserFilterChange = (e) => {
    const { name, value } = e.target;
    setUserFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const onProfileSave = (data) => updateProfileMutation.mutate(data);
  const onPasswordSave = (data) => changePasswordMutation.mutate(data);
  const onSettingsSave = (data) => updateSettingsMutation.mutate(data);
  const onUserFormSave = (data) => {
    if (editingUser) {
      if (!data.password) delete data.password;
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleOpenUserDialog = (userToEdit = null) => {
    setEditingUser(userToEdit);
    if (userToEdit) {
      Object.keys(userToEdit).forEach(key => setValue(key, userToEdit[key]));
      setValue('password', '');
    } else {
      resetUserForm({ firstName: '', lastName: '', username: '', email: '', phone: '', password: '', role: 'sales', is_active: true });
    }
    setUserDialogOpen(true);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
    resetUserForm();
  };

  const handleDeleteUser = (userId) => {
    setConfirmDialog({ open: true, action: 'delete', userId });
  };

  const handleConfirmAction = async () => {
    const action = confirmDialog.action;
    const userId = confirmDialog.userId;
    const file = confirmDialog.file;
    setConfirmDialog({ open: false, action: null, file: null, userId: null });
    
    if (action === 'delete' && userId) {
      deleteUserMutation.mutate(userId);
    } else if (action === 'reset') {
      resetSettingsMutation.mutate();
    } else if (action === 'clearData') {
      clearAllDataMutation.mutate();
    } else if (action === 'factoryReset') {
      factoryResetMutation.mutate();
    } else if (action === 'restore' && file) {
      restoreDatabaseMutation.mutate(file);
    }
  };

  const handleSelectLogo = (filename) => {
    setActiveLogoMutation.mutate(filename);
  };

  const handlePreviewLogo = (logoInfo) => {
    setSelectedLogoForPreview(logoInfo);
  };

  const handleOpenLogoManagement = () => {
    setLogoManagementOpen(true);
  };

  const handleCloseLogoManagement = () => {
    setLogoManagementOpen(false);
    setLogoFile(null);
    setUploadPreview(null);
  };

  const handleUploadFromModal = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleOpenSettingsDialog = () => {
    setSettingsDialogOpen(true);
  };

  const handleCloseSettingsDialog = () => {
    setSettingsDialogOpen(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  // 7. EARLY RETURNS
  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 8. RENDER
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Alert Messages */}
      {successAlert && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessAlert('')}>
          {successAlert}
        </Alert>
      )}
      {errorAlert && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAlert('')}>
          {errorAlert}
        </Alert>
      )}

      {/* Confirmation Dialog for Destructive Actions */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: null })}>
        <DialogTitle>
          {confirmDialog.action === 'reset' && '⚠️ Confirm Settings Reset'}
          {confirmDialog.action === 'clearData' && '🗑️ Confirm Data Deletion'}
          {confirmDialog.action === 'factoryReset' && '💥 Confirm Factory Reset'}
          {confirmDialog.action === 'restore' && '🔄 Confirm Database Restore'}
          {!['reset', 'clearData', 'factoryReset', 'restore'].includes(confirmDialog.action) && 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {confirmDialog.action === 'reset' && 
              'Are you sure you want to reset all business settings to their default values? This action cannot be undone.'
            }
            {confirmDialog.action === 'clearData' && 
              'Are you sure you want to delete ALL data including products, customers, transactions, and sales records? This action is PERMANENT and cannot be undone.'
            }
            {confirmDialog.action === 'factoryReset' && 
              'Are you sure you want to perform a complete factory reset? This will delete ALL data, reset ALL settings, and return the system to its initial state. This action is PERMANENT and cannot be undone.'
            }
            {confirmDialog.action === 'restore' && 
              `Are you sure you want to restore the database from "${confirmDialog.file?.name}"? This will OVERWRITE ALL current data and cannot be undone.`
            }
            {!['reset', 'clearData', 'factoryReset', 'restore'].includes(confirmDialog.action) && 
              'Are you sure you want to proceed with this action?'
            }
          </Typography>
          {(confirmDialog.action === 'clearData' || confirmDialog.action === 'factoryReset' || confirmDialog.action === 'restore') && (
            <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                ⚠️ WARNING: This action is irreversible!
              </Typography>
              <Typography variant="body2" color="error.main">
                Please ensure you have a recent backup before proceeding.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: null })}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            color="error" 
            variant="contained"
            disabled={
              (confirmDialog.action === 'reset' && resetSettingsMutation.isLoading) ||
              (confirmDialog.action === 'clearData' && clearAllDataMutation.isLoading) ||
              (confirmDialog.action === 'factoryReset' && factoryResetMutation.isLoading) ||
              (confirmDialog.action === 'restore' && restoreDatabaseMutation.isLoading)
            }
          >
            {(confirmDialog.action === 'reset' && resetSettingsMutation.isLoading) ||
             (confirmDialog.action === 'clearData' && clearAllDataMutation.isLoading) ||
             (confirmDialog.action === 'factoryReset' && factoryResetMutation.isLoading) ||
             (confirmDialog.action === 'restore' && restoreDatabaseMutation.isLoading)
              ? 'Processing...' : 'Confirm'
            }
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        mb: 3,
        gap: { xs: 2, sm: 1 },
        px: 0.5,
        py: 2
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
        >
          Settings
        </Typography>
      </Box>
      
      <Box sx={{ px: 0.5 }}>
        <Paper 
          elevation={isMobile ? 1 : 2}
          sx={{ 
            overflow: 'hidden',
            borderRadius: { xs: 2, sm: 1 },
            width: '100%',
            maxWidth: '100%'
          }}
        >
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile={isMobile}
          sx={{
            '& .MuiTab-root': {
              fontSize: isMobile ? '0.875rem' : '0.9375rem',
              minWidth: isMobile ? 80 : 'auto',
              py: isMobile ? 1.5 : 1
            }
          }}
        >
          <Tab label="General" />
          <Tab label="Profile" />
          <Tab label="Security" />
          {user?.role === 'admin' && <Tab label="User Management" />}
          {user?.role === 'admin' && <Tab label="Data Management" />}
        </Tabs>

        {/* General Settings */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                Business Information
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<EditIcon />} 
                onClick={handleOpenSettingsDialog}
                size={isMobile ? "small" : "medium"}
              >
                Edit Settings
              </Button>
            </Box>

            {/* Display current settings in read-only format */}
            {areSettingsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Shop Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.shop_name || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">GST Percentage</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.gst_percentage ? `${settingsData.gst_percentage}%` : 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Shop Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.shop_address || 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.phone || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Email Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.email || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Website</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.website || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Established Year</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.established_year || 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Legal Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Legal & Tax Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">GST Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.gst_number || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">PAN Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.pan_number || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Tax Registration Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.tax_number || 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Banking Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Banking Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">Bank Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.bank_name || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">Account Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.bank_account || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="textSecondary">IFSC Code</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {settingsData?.bank_ifsc || 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Company Logo */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    Company Logo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ border: '2px dashed #ccc', p: 2, borderRadius: 2, minWidth: 200, textAlign: 'center' }}>
                      {isLogoLoading ? (
                        <CircularProgress />
                      ) : logoPreview ? (
                        <img 
                          key={logoRefreshKey}
                          src={logoPreview} 
                          alt="Company Logo" 
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '100px', 
                            display: 'block',
                            objectFit: 'contain',
                            margin: '0 auto'
                          }}
                          onError={(e) => {
                            console.error('Logo image failed to load');
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          width: '200px', 
                          height: '100px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'grey.100',
                          color: 'grey.500',
                          fontSize: '14px',
                          border: '1px dashed #ccc',
                          margin: '0 auto'
                        }}>
                          No Logo Selected
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Button 
                        variant="contained" 
                        startIcon={<CloudUploadIcon />}
                        onClick={handleOpenLogoManagement}
                        size={isMobile ? "small" : "medium"}
                        sx={{ mb: 1 }}
                      >
                        Manage Logos
                      </Button>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Upload new logos or select from existing ones
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Profile Settings */}
        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" gutterBottom>My Profile</Typography>
          <Box component="form" onSubmit={handleProfileSubmit(onProfileSave)} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="firstName" control={profileControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="First Name" error={!!profileErrors.firstName} helperText={profileErrors.firstName?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="lastName" control={profileControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Last Name" error={!!profileErrors.lastName} helperText={profileErrors.lastName?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={profileControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Email Address" type="email" error={!!profileErrors.email} helperText={profileErrors.email?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={profileControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Phone Number" error={!!profileErrors.phone} helperText={profileErrors.phone?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Username" value={user?.username || ''} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''} disabled />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" disabled={updateProfileMutation.isLoading}>
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>Change Password</Typography>
          <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSave)} noValidate sx={{ mt: 1, maxWidth: 400 }}>
            <Controller name="currentPassword" control={passwordControl} render={({ field }) => 
              <TextField {...field} fullWidth margin="normal" label="Current Password" type="password" error={!!passwordErrors.currentPassword} helperText={passwordErrors.currentPassword?.message} />
            } />
            <Controller name="newPassword" control={passwordControl} render={({ field }) => 
              <TextField {...field} fullWidth margin="normal" label="New Password" type="password" error={!!passwordErrors.newPassword} helperText={passwordErrors.newPassword?.message} />
            } />
            <Controller name="confirmPassword" control={passwordControl} render={({ field }) => 
              <TextField {...field} fullWidth margin="normal" label="Confirm New Password" type="password" error={!!passwordErrors.confirmPassword} helperText={passwordErrors.confirmPassword?.message} />
            } />
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={changePasswordMutation.isLoading}>
              {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </TabPanel>

        {/* User Management (Admin Only) */}
        {user?.role === 'admin' && (
          <TabPanel value={currentTab} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">User List</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenUserDialog()}>
                Add User
              </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Search by Name or Username" name="name" value={userFilters.name} onChange={handleUserFilterChange} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select name="role" value={userFilters.role} label="Role" onChange={handleUserFilterChange}>
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="sales">Sales</MenuItem>
                      <MenuItem value="inventory">Inventory</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select name="status" value={userFilters.status} label="Status" onChange={handleUserFilterChange}>
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {isUsersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : usersError ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Failed to Load Users
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {usersError?.response?.data?.message || usersError?.message || 'An unknown error occurred'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => window.location.reload()}
                  sx={{ mr: 2 }}
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => queryClient.invalidateQueries(['users'])}
                >
                  Retry Loading
                </Button>
                {import.meta.env.DEV && (
                  <Box component="pre" sx={{ mt: 2, fontSize: '0.75rem', textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto' }}>
                    {JSON.stringify(usersError, null, 2)}
                  </Box>
                )}
              </Paper>
            ) : (
              <Box sx={{ 
                overflowX: 'auto',
                width: '100%',
                '& .MuiTableContainer-root': {
                  borderRadius: 2
                }
              }}>
                <TableContainer component={Paper} sx={{ 
                  overflowX: 'auto',
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Full Name
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Username
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Email
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Role
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                          Status
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          fontSize: { xs: '0.75rem', md: '0.875rem' },
                          minWidth: '120px'
                        }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(usersData?.users) ? (
                        usersData.users.length > 0 ? (
                          usersData.users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Typography variant="body2" noWrap sx={{ 
                                  maxWidth: { xs: '120px', md: '200px' },
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}>
                                  {`${u.firstName} ${u.lastName}`}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                {u.username}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Typography variant="body2" noWrap sx={{ 
                                  maxWidth: { xs: '150px', md: '250px' },
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}>
                                  {u.email}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ 
                                textTransform: 'capitalize',
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}>
                                {u.role}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Chip 
                                  label={u.is_active ? 'Active' : 'Inactive'}
                                  color={u.is_active ? 'success' : 'default'}
                                  size={isMobile ? "small" : "medium"}
                                  sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: { xs: 0.5, md: 1 },
                                  justifyContent: 'center'
                                }}>
                                  <IconButton 
                                    onClick={() => handleOpenUserDialog(u)} 
                                    color="primary" 
                                    disabled={u.id === user.id}
                                    size={isMobile ? "small" : "medium"}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton 
                                    onClick={() => handleDeleteUser(u.id)} 
                                    color="error" 
                                    disabled={u.id === user.id}
                                    size={isMobile ? "small" : "medium"}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="textSecondary">
                                No users found with current filters
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      ) : Array.isArray(usersData) ? (
                        usersData.length > 0 ? (
                          usersData.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Typography variant="body2" noWrap sx={{ 
                                  maxWidth: { xs: '120px', md: '200px' },
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}>
                                  {`${u.firstName} ${u.lastName}`}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                {u.username}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Typography variant="body2" noWrap sx={{ 
                                  maxWidth: { xs: '150px', md: '250px' },
                                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                                }}>
                                  {u.email}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ 
                                textTransform: 'capitalize',
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}>
                                {u.role}
                              </TableCell>
                              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                                <Chip 
                                  label={u.is_active ? 'Active' : 'Inactive'}
                                  color={u.is_active ? 'success' : 'default'}
                                  size={isMobile ? "small" : "medium"}
                                  sx={{ fontSize: { xs: '0.625rem', md: '0.75rem' } }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: { xs: 0.5, md: 1 },
                                  justifyContent: 'center'
                                }}>
                                  <IconButton 
                                    onClick={() => handleOpenUserDialog(u)} 
                                    color="primary" 
                                    disabled={u.id === user.id}
                                    size={isMobile ? "small" : "medium"}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton 
                                    onClick={() => handleDeleteUser(u.id)} 
                                    color="error" 
                                    disabled={u.id === user.id}
                                    size={isMobile ? "small" : "medium"}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                              <Typography variant="body2" color="textSecondary">
                                No users found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="error" gutterBottom>
                              Error loading users. The data format is unexpected.
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                              Expected: Array of users or object with 'users' property
                            </Typography>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => queryClient.invalidateQueries(['users'])}
                              sx={{ mr: 1 }}
                            >
                              Retry
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => window.location.reload()}
                            >
                              Refresh Page
                            </Button>
                            {import.meta.env.DEV && (
                              <Box component="pre" sx={{ mt: 2, fontSize: '0.75rem', textAlign: 'left', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, overflow: 'auto', maxHeight: '200px' }}>
                                <strong>usersData:</strong> {JSON.stringify(usersData, null, 2)}
                                <br/><strong>userFilters:</strong> {JSON.stringify(userFilters, null, 2)}
                                <br/><strong>user.role:</strong> {user?.role}
                                <br/><strong>Query enabled:</strong> {user?.role === 'admin'}
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>
        )}

        {/* Data Management (Admin Only) */}
        {user?.role === 'admin' && (
          <TabPanel value={currentTab} index={4}>
            <Typography variant="h6" gutterBottom>Data Management</Typography>
            
            {/* Data Export Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                Data Export
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        📊 All Data
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Export complete database including all products, customers, sales, and settings
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        disabled={exportAllDataMutation.isLoading}
                        onClick={() => exportAllDataMutation.mutate()}
                      >
                        {exportAllDataMutation.isLoading ? '⏳ Exporting...' : 'Export All Data'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        💎 Products
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Export product catalog, prices, stock levels, and categories
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        disabled={exportProductsMutation.isLoading}
                        onClick={() => exportProductsMutation.mutate()}
                      >
                        {exportProductsMutation.isLoading ? '⏳ Exporting...' : 'Export Products'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        👥 Customers
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Export customer information, contact details, and purchase history
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        disabled={exportCustomersMutation.isLoading}
                        onClick={() => exportCustomersMutation.mutate()}
                      >
                        {exportCustomersMutation.isLoading ? '⏳ Exporting...' : 'Export Customers'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%', border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        💰 Transactions
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Export all sales transactions, payments, and invoices
                      </Typography>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        disabled={exportTransactionsMutation.isLoading}
                        onClick={() => exportTransactionsMutation.mutate()}
                      >
                        {exportTransactionsMutation.isLoading ? '⏳ Exporting...' : 'Export Sales'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Data Backup Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                Database Backup & Restore
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      💾 Create Backup
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Create a full backup of your database including all products, customers, sales, and settings.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      sx={{ mb: 1 }}
                      disabled={backupDatabaseMutation.isLoading}
                      onClick={() => backupDatabaseMutation.mutate()}
                    >
                      {backupDatabaseMutation.isLoading ? '⏳ Creating...' : 'Create Full Backup'}
                    </Button>
                    <Typography variant="caption" color="textSecondary">
                      Last backup: Never • Recommended: Weekly
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc02' }}>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      ⚠️ Restore Database
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Restore your database from a previous backup. This will overwrite all current data.
                    </Typography>
                    <input
                      type="file"
                      accept=".sql,.backup"
                      style={{ display: 'none' }}
                      id="restore-backup-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setConfirmDialog({ 
                            open: true, 
                            action: 'restore',
                            file: file
                          });
                        }
                      }}
                    />
                    <Button 
                      variant="outlined" 
                      color="warning"
                      fullWidth
                      sx={{ mb: 1 }}
                      onClick={() => document.getElementById('restore-backup-input').click()}
                    >
                      Choose Backup File
                    </Button>
                    <Typography variant="caption" color="warning.main">
                      ⚠️ This action cannot be undone
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Data Cleanup Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                Data Cleanup & Maintenance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="🧹 Clean Duplicate Records"
                        secondary="Remove duplicate customers, products, or transactions"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={cleanDuplicatesMutation.isLoading}
                        onClick={() => cleanDuplicatesMutation.mutate()}
                      >
                        {cleanDuplicatesMutation.isLoading ? 'Cleaning...' : 'Clean Duplicates'}
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="🗑️ Archive Old Data"
                        secondary="Archive transactions older than 2 years"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={archiveOldDataMutation.isLoading}
                        onClick={() => archiveOldDataMutation.mutate()}
                      >
                        {archiveOldDataMutation.isLoading ? 'Archiving...' : 'Archive Data'}
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="📊 Rebuild Indexes"
                        secondary="Optimize database performance"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={rebuildIndexesMutation.isLoading}
                        onClick={() => rebuildIndexesMutation.mutate()}
                      >
                        {rebuildIndexesMutation.isLoading ? 'Rebuilding...' : 'Rebuild Indexes'}
                      </Button>
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="🔍 Data Validation"
                        secondary="Check for inconsistent or invalid data"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={validateDataMutation.isLoading}
                        onClick={() => validateDataMutation.mutate()}
                      >
                        {validateDataMutation.isLoading ? 'Validating...' : 'Validate Data'}
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="📈 Update Statistics"
                        secondary="Refresh database statistics for better performance"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={updateStatisticsMutation.isLoading}
                        onClick={() => updateStatisticsMutation.mutate()}
                      >
                        {updateStatisticsMutation.isLoading ? 'Updating...' : 'Update Stats'}
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="🔄 Sync Inventory"
                        secondary="Recalculate stock levels and fix discrepancies"
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled={syncInventoryMutation.isLoading}
                        onClick={() => syncInventoryMutation.mutate()}
                      >
                        {syncInventoryMutation.isLoading ? 'Syncing...' : 'Sync Inventory'}
                      </Button>
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </Paper>

            {/* Danger Zone */}
            <Paper sx={{ p: 3, border: '2px solid #f44336', bgcolor: '#fef5f5' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main' }}>
                ⚠️ Danger Zone
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                These actions are permanent and cannot be undone. Please proceed with extreme caution.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    fullWidth
                    onClick={() => setConfirmDialog({ open: true, action: 'reset' })}
                  >
                    🔄 Reset All Settings
                  </Button>
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    Reset all business settings to default
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    fullWidth
                    disabled={user?.role !== 'admin' || clearAllDataMutation.isLoading}
                    onClick={() => setConfirmDialog({ open: true, action: 'clearData' })}
                  >
                    {clearAllDataMutation.isLoading ? '🔄 Clearing...' : '🗑️ Clear All Data'}
                  </Button>
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    Delete all products, customers, and sales
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    fullWidth
                    disabled={user?.role !== 'admin' || factoryResetMutation.isLoading}
                    onClick={() => setConfirmDialog({ open: true, action: 'factoryReset' })}
                  >
                    {factoryResetMutation.isLoading ? '🔄 Resetting...' : '💥 Factory Reset'}
                  </Button>
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                    Reset entire system to initial state
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </TabPanel>
        )}
      </Paper>
      </Box>

      {/* Add/Edit User Dialog */}
  <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <Box component="form" onSubmit={handleUserFormSubmit(onUserFormSave)}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller name="firstName" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="First Name" error={!!userFormErrors.firstName} helperText={userFormErrors.firstName?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="lastName" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Last Name" error={!!userFormErrors.lastName} helperText={userFormErrors.lastName?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="username" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Username" error={!!userFormErrors.username} helperText={userFormErrors.username?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Email" type="email" error={!!userFormErrors.email} helperText={userFormErrors.email?.message} />
                } />
              </Grid>
              <Grid item xs={12}>
                <Controller name="phone" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Phone" error={!!userFormErrors.phone} helperText={userFormErrors.phone?.message} />
                } />
              </Grid>
              <Grid item xs={12}>
                <Controller name="password" control={userFormControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Password" type="password" error={!!userFormErrors.password} helperText={editingUser ? 'Leave blank to keep current' : userFormErrors.password?.message} />
                } />
              </Grid>
              <Grid item xs={12}>
                <Controller name="role" control={userFormControl} render={({ field }) => (
                  <FormControl fullWidth error={!!userFormErrors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role">
                      <MenuItem value="sales">Sales</MenuItem>
                      <MenuItem value="inventory">Inventory</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="is_active" control={userFormControl} render={({ field }) => 
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="User Active" />
                } />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createUserMutation.isLoading || updateUserMutation.isLoading}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Logo Management Dialog */}
  <Dialog fullScreen={isMobile}
        open={logoManagementOpen} 
        onClose={handleCloseLogoManagement}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0'
        }}>
          Logo Management
          <IconButton onClick={handleCloseLogoManagement}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {/* Upload New Logo Section */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Upload New Logo
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              {/* Upload Preview */}
              <Box sx={{ 
                border: '2px dashed #1976d2', 
                borderRadius: 2, 
                p: 2, 
                minWidth: 200,
                textAlign: 'center',
                bgcolor: 'white'
              }}>
                {uploadPreview ? (
                  <img 
                    src={uploadPreview}
                    alt="Upload Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '120px', 
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    width: '200px', 
                    height: '120px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'primary.main',
                    gap: 1
                  }}>
                    <CloudUploadIcon sx={{ fontSize: 40 }} />
                    <Typography variant="body2">
                      Upload Preview
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Upload Controls */}
              <Box sx={{ flex: 1 }}>
                <Stack spacing={2}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Choose Logo File
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={handleLogoChange} 
                    />
                  </Button>
                  
                  {logoFile && (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'success.50', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'success.200'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Selected File:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {logoFile.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Size: {formatFileSize(logoFile.size)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Button 
                    variant="contained" 
                    onClick={handleUploadFromModal}
                    disabled={!logoFile || uploadLogoMutation.isLoading}
                    fullWidth
                  >
                    {uploadLogoMutation.isLoading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  
                  <Typography variant="caption" color="textSecondary">
                    Accepted formats: JPG, PNG. Max size: 5MB
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Paper>

          <Divider sx={{ my: 2 }} />

          {/* Existing Logos Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Select from Existing Logos
            </Typography>
            {isAllLogosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : allLogos.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="body1" color="textSecondary">
                  No logos uploaded yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Upload your first logo using the section above
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {allLogos.map((logoInfo, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={logoInfo.filename}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: index === 0 ? '3px solid #1976d2' : '1px solid #e0e0e0',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      {index === 0 && (
                        <Chip 
                          label="Current Active" 
                          color="primary" 
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8, 
                            zIndex: 1,
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                      <CardMedia
                        component="img"
                        height="140"
                        image={`${getApiUrl()}${logoInfo.url}`}
                        alt={`Logo ${logoInfo.filename}`}
                        sx={{ 
                          objectFit: 'contain', 
                          p: 2,
                          cursor: 'pointer'
                        }}
                        onClick={() => handlePreviewLogo(logoInfo)}
                      />
                      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                        <Typography variant="caption" color="textSecondary" gutterBottom>
                          Uploaded: {formatDate(logoInfo.uploadDate)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          Size: {formatFileSize(logoInfo.size)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ 
                          display: 'block', 
                          wordBreak: 'break-all',
                          fontSize: '0.65rem',
                          opacity: 0.7
                        }} component="span">
                          {logoInfo.filename}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ pt: 0, pb: 2 }}>
                        {index === 0 ? (
                          <Button 
                            size="small" 
                            disabled
                            startIcon={<CheckCircleIcon />}
                            sx={{ 
                              color: 'success.main',
                              fontWeight: 'bold',
                              width: '100%'
                            }}
                          >
                            Currently Active
                          </Button>
                        ) : (
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleSelectLogo(logoInfo.filename)}
                            disabled={setActiveLogoMutation.isLoading}
                            startIcon={<RadioButtonUncheckedIcon />}
                            sx={{ width: '100%' }}
                          >
                            {setActiveLogoMutation.isLoading ? 'Setting...' : 'Set as Active'}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f8f9fa'
        }}>
          <Button 
            onClick={handleCloseLogoManagement}
            variant="outlined"
          >
            Close
          </Button>
          <Typography variant="body2" color="textSecondary" sx={{ flex: 1, ml: 2 }}>
            Click on any logo to preview, or use "Set as Active" to change your current logo
          </Typography>
        </DialogActions>
      </Dialog>

      {/* Logo Preview Dialog */}
  <Dialog fullScreen={isMobile}
        open={!!selectedLogoForPreview} 
        onClose={() => setSelectedLogoForPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          Logo Preview
          <IconButton onClick={() => setSelectedLogoForPreview(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedLogoForPreview && (
            <Box sx={{ textAlign: 'center' }}>
              <img 
                src={`${getApiUrl()}${selectedLogoForPreview.url}`}
                alt={`Logo ${selectedLogoForPreview.filename}`}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  objectFit: 'contain',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Paper sx={{ mt: 3, p: 2, textAlign: 'left', bgcolor: '#f8f9fa' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" component="div">
                      <strong>Filename:</strong><br />
                      {selectedLogoForPreview.filename}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" component="div">
                      <strong>File Size:</strong><br />
                      {formatFileSize(selectedLogoForPreview.size)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" component="div">
                      <strong>Upload Date:</strong><br />
                      {formatDate(selectedLogoForPreview.uploadDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLogoForPreview(null)}>
            Close
          </Button>
          {selectedLogoForPreview && allLogos[0]?.filename !== selectedLogoForPreview.filename && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleSelectLogo(selectedLogoForPreview.filename);
                setSelectedLogoForPreview(null);
              }}
              disabled={setActiveLogoMutation.isLoading}
            >
              {setActiveLogoMutation.isLoading ? 'Setting as Active...' : 'Set as Active Logo'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Settings Edit Dialog */}
      <Dialog 
        open={settingsDialogOpen} 
        onClose={handleCloseSettingsDialog} 
        maxWidth="md" 
        fullWidth 
        fullScreen={isMobile}
      >
        <DialogTitle>
          Edit Business Settings
        </DialogTitle>
        <Box component="form" onSubmit={handleSettingsSubmit(onSettingsSave)}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="shop_name" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField 
                      {...field} 
                      fullWidth 
                      label="Shop Name" 
                      error={!!settingsErrors.shop_name} 
                      helperText={settingsErrors.shop_name?.message} 
                    />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="gst_percentage" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField 
                      {...field} 
                      fullWidth 
                      label="GST Percentage" 
                      type="number" 
                      error={!!settingsErrors.gst_percentage} 
                      helperText={settingsErrors.gst_percentage?.message} 
                    />
                  } 
                />
              </Grid>
              <Grid item xs={12}>
                <Controller 
                  name="shop_address" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField 
                      {...field} 
                      fullWidth 
                      label="Shop Address" 
                      multiline 
                      rows={3} 
                      error={!!settingsErrors.shop_address} 
                      helperText={settingsErrors.shop_address?.message} 
                    />
                  } 
                />
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2, color: 'primary.main' }}>
                  Contact Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="phone" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Phone Number" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="email" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Email Address" type="email" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="website" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Website URL" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="established_year" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Established Year" type="number" />
                  } 
                />
              </Grid>

              {/* Legal Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2, color: 'primary.main' }}>
                  Legal & Tax Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="gst_number" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="GST Number" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="pan_number" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="PAN Number" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="tax_number" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Tax Registration Number" />
                  } 
                />
              </Grid>

              {/* Banking Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2, color: 'primary.main' }}>
                  Banking Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller 
                  name="bank_name" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Bank Name" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller 
                  name="bank_account" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="Account Number" />
                  } 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller 
                  name="bank_ifsc" 
                  control={settingsControl} 
                  render={({ field }) => 
                    <TextField {...field} fullWidth label="IFSC Code" />
                  } 
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSettingsDialog}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Settings;
