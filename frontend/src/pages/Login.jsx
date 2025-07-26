import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const registerSchema = yup.object({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  role: yup.string().required('Role is required'),
});

const Login = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, register, user, isAuthenticated } = useAuth();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const onLogin = async (data) => {
    setError('');
    setLoading(true);
    
    console.log('🔐 Login attempt:', { username: data.username, rememberMe });
    
    try {
      const result = await login({ ...data, rememberMe });
      console.log('✅ Login successful:', result);
      
      // Check if token is stored
      const token = localStorage.getItem('token');
      console.log('💾 Token in localStorage:', token ? 'Present' : 'Missing');
      
      // Check auth state
      console.log('🔍 Auth state after login:', { user, isAuthenticated });
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      }, 100);
      
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data) => {
    setError('');
    setLoading(true);
    try {
      await register(data);
      setTab(0);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      {/* Logo Section - Outside the Paper */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: 3,
          }}
        >
          <Typography variant="h2" color="white" sx={{ fontWeight: 'bold' }}>
            J
          </Typography>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Jewellery Management
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
          Sign in to your account
        </Typography>

        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3, width: '100%' }} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
            Auth State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            {user && ` | User: ${user.username}`}
          </Alert>
        )}

        {tab === 0 ? (
          <Box component="form" onSubmit={handleLoginSubmit(onLogin)} sx={{ width: '100%' }}>
            <TextField
              {...registerLogin('username')}
              label="Username"
              fullWidth
              margin="normal"
              error={!!loginErrors.username}
              helperText={loginErrors.username?.message}
            />
            <TextField
              {...registerLogin('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!loginErrors.password}
              helperText={loginErrors.password?.message}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Remember Me"
              sx={{ mt: 1, mb: 1, alignSelf: 'flex-start' }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegisterSubmit(onRegister)} sx={{ width: '100%' }}>
            <TextField
              {...registerForm('username')}
              label="Username"
              fullWidth
              margin="normal"
              error={!!registerErrors.username}
              helperText={registerErrors.username?.message}
            />
            <TextField
              {...registerForm('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!registerErrors.email}
              helperText={registerErrors.email?.message}
            />
            <TextField
              {...registerForm('firstName')}
              label="First Name"
              fullWidth
              margin="normal"
              error={!!registerErrors.firstName}
              helperText={registerErrors.firstName?.message}
            />
            <TextField
              {...registerForm('lastName')}
              label="Last Name"
              fullWidth
              margin="normal"
              error={!!registerErrors.lastName}
              helperText={registerErrors.lastName?.message}
            />
            <TextField
              {...registerForm('password')}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!registerErrors.password}
              helperText={registerErrors.password?.message}
            />
            <TextField
              {...registerForm('role')}
              label="Role"
              select
              fullWidth
              margin="normal"
              error={!!registerErrors.role}
              helperText={registerErrors.role?.message}
              defaultValue=""
            >
              <option value="sales">Sales</option>
              <option value="inventory">Inventory</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </TextField>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Login;