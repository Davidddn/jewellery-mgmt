import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Tabs, Tab, TextField, Button, Paper, Grid, CircularProgress, Alert, Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../api/auth';
import { usersAPI } from '../api/users';
import { settingsAPI } from '../api/settings';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  // 1. HOOKS AND STATE
  const { user, logout, isLoading: isAuthLoading } = useAuth();
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
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', userFilters],
    queryFn: () => usersAPI.getAllUsers(userFilters),
    enabled: user?.role === 'admin',
  });

  const { data: logoData, isLoading: isLogoLoading } = useQuery({
    queryKey: ['logo', logoRefreshKey],
    queryFn: () => settingsAPI.getLogo(),
    retry: 1,
    refetchOnWindowFocus: false
  });

  const { data: settingsData, isLoading: areSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getSettings(),
  });

  // 4. MUTATIONS
  const updateProfileMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setSuccessAlert('Profile updated successfully!');
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to update profile.'),
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: (passwordData) => authAPI.changePassword(passwordData),
    onSuccess: () => {
      setSuccessAlert('Password changed successfully! Please log in again.');
      resetPasswordForm();
      setTimeout(() => logout(), 3000);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to change password.'),
  });

  const createUserMutation = useMutation({
    mutationFn: usersAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSuccessAlert('User created successfully!');
      setUserDialogOpen(false);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to create user.'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }) => usersAPI.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSuccessAlert('User updated successfully!');
      setUserDialogOpen(false);
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to update user.'),
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setSuccessAlert('User deleted successfully!');
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to delete user.'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: settingsAPI.uploadLogo,
    onSuccess: () => {
      setSuccessAlert('Logo uploaded successfully!');
      setLogoFile(null);
      setLogoRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries(['logo']);
    },
    onError: (error) => {
      setErrorAlert('Failed to upload logo: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      setSuccessAlert('Settings updated successfully!');
    },
    onError: (err) => setErrorAlert(err.response?.data?.message || 'Failed to update settings.'),
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
      console.log('📝 Populating settings form with data:', settingsData);
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

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
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
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
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
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      
      {/* Success/Error Alerts */}
      {errorAlert && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorAlert('')}>
          {errorAlert}
        </Alert>
      )}
      {successAlert && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessAlert('')}>
          {successAlert}
        </Alert>
      )}

      <Paper>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="General" />
          <Tab label="Profile" />
          <Tab label="Security" />
          {user?.role === 'admin' && <Tab label="User Management" />}
          {user?.role === 'admin' && <Tab label="Data Management" />}
        </Tabs>

        {/* General Settings */}
        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" gutterBottom>Business Information</Typography>
          <Box component="form" onSubmit={handleSettingsSubmit(onSettingsSave)} noValidate sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Basic Information</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="shop_name" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Shop Name" error={!!settingsErrors.shop_name} helperText={settingsErrors.shop_name?.message} />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="gst_percentage" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="GST Percentage" type="number" error={!!settingsErrors.gst_percentage} helperText={settingsErrors.gst_percentage?.message} />
                } />
              </Grid>
              <Grid item xs={12}>
                <Controller name="shop_address" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Shop Address" multiline rows={3} error={!!settingsErrors.shop_address} helperText={settingsErrors.shop_address?.message} />
                } />
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>Contact Information</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Phone Number" />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Email Address" type="email" />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="website" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Website URL" />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="established_year" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Established Year" type="number" />
                } />
              </Grid>

              {/* Legal Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>Legal & Tax Information</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="gst_number" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="GST Number" />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="pan_number" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="PAN Number" />
                } />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="tax_number" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Tax Registration Number" />
                } />
              </Grid>

              {/* Banking Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>Banking Information</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="bank_name" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Bank Name" />
                } />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="bank_account" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="Account Number" />
                } />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="bank_ifsc" control={settingsControl} render={({ field }) => 
                  <TextField {...field} fullWidth label="IFSC Code" />
                } />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={updateSettingsMutation.isLoading}
                  sx={{ mt: 2 }}
                >
                  {updateSettingsMutation.isLoading ? 'Saving...' : 'Save All Settings'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Current Settings Display */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Current Settings</Typography>
            <Paper sx={{ p: 2 }}>
              {areSettingsLoading ? (
                <CircularProgress />
              ) : settingsData ? (
                <Grid container spacing={2}>
                  {Object.entries(settingsData).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {value || 'Not set'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No settings found. Please save some settings first.
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Logo Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Company Logo</Typography>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                
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
                        e.target.style.display = 'none'; // Hide broken image instead of replacing
                      }}
                    />
                  ) : (
                    // Use a simple text placeholder instead of external image
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
                      No Logo Uploaded
                    </Box>
                  )}
                </Box>
                <Box>
                  <Button variant="contained" component="label" sx={{ mb: 1 }}>
                    Choose New Logo
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
                  {logoFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Selected: {logoFile.name}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={handleLogoUpload} 
                        disabled={uploadLogoMutation.isLoading}
                      >
                        {uploadLogoMutation.isLoading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      Accepted formats: JPG, PNG. Max size: 5MB<br/>
                      The latest uploaded logo will be displayed.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
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
              <CircularProgress />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Full Name</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(usersData?.users) && usersData.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{`${u.firstName} ${u.lastName}`}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{u.role}</TableCell>
                        <TableCell>{u.is_active ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleOpenUserDialog(u)} color="primary" disabled={u.id === user.id}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteUser(u.id)} color="error" disabled={u.id === user.id}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        )}

        {/* Data Management (Admin Only) */}
        {user?.role === 'admin' && (
          <TabPanel value={currentTab} index={4}>
            <Typography variant="h6" gutterBottom>Data Management</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                You can export various reports and data from the system in CSV format.
                Please navigate to the <a href="/reports">Reports</a> section to download sales, inventory, and customer data.
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.href = '/reports'}>
                Go to Reports
              </Button>
            </Box>
          </TabPanel>
        )}
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
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
    </Box>
  );
};

export default Settings;
