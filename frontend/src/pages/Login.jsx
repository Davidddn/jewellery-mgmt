// src/components/Login.jsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, PersonOutline, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import api from '../api/config';

const loginSchema = yup.object().shape({
  username: yup.string().trim().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const registerSchema = yup.object().shape({
  username: yup.string().trim().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  firstName: yup.string().trim().min(2, 'First name must be at least 2 characters').required('First name is required'),
  lastName: yup.string().trim().min(2, 'Last name must be at least 2 characters').required('Last name is required'),
  password: yup.string().required('Password is required'),
  role: yup.string().oneOf(['sales', 'inventory', 'manager', 'admin'], 'Please select a valid role').required('Role is required'),
});

const Login = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const navigate = useNavigate();
  const { login, register, isAuthenticated, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use ref to prevent multiple navigation attempts
  const hasNavigated = useRef(false);

  // Memoize form default values to prevent unnecessary re-renders
  const loginDefaultValues = useMemo(() => ({ username: '', password: '' }), []);
  const registerDefaultValues = useMemo(() => ({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: '',
  }), []);

  // Form handling
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    // reset: resetLoginForm, // removed because unused
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaultValues,
  });

  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    reset: resetRegisterForm,
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: registerDefaultValues,
  });

  // Handle authentication redirect - only run when auth state changes
  useEffect(() => {
    console.log('Login.jsx useEffect: isAuthenticated=', isAuthenticated, 'loading=', loading, 'hasNavigated=', hasNavigated.current);
    
    if (isAuthenticated && !loading && !hasNavigated.current) {
      console.log('Login.jsx useEffect: Navigating to dashboard');
      hasNavigated.current = true;
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]); // <-- Add navigate here

  // Event handlers
  // const handleTabChange = (event, newValue) => {
  //   setTab(newValue);
  //   setError('');
  //   setSuccess('');
  //   if (newValue === 0) {
  //     resetRegisterForm();
  //   } else {
  //     resetLoginForm();
  //   }
  // };

  const onLogin = async (data) => {
    console.log('Login.jsx: onLogin called');
    
    // Prevent multiple submissions
    if (isLoginSubmitting) {
      console.log('Login.jsx: Already submitting, ignoring');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      console.log('Login.jsx: Attempting login with data:', { username: data.username });
      console.log('Login.jsx: API base URL:', api.defaults.baseURL);
      console.log('Login.jsx: Full URL will be:', api.defaults.baseURL + '/auth/login');
      
      const response = await api.post('/auth/login', {
        username: data.username.trim(),
        password: data.password,
      });
      
      console.log('Login.jsx: API response received:', response);
      console.log('Login.jsx: Response data:', response.data);

      if (response.data.success && response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token); // <-- Add this line
        console.log('Login.jsx: Login successful, calling AuthProvider login');
        await login(response.data.token, response.data.user);
      } else {
        console.log('Login.jsx: Login failed, API response indicates failure');
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login.jsx: Error during login API call:', err);
      console.error('Login.jsx: Error response:', err.response);
      console.error('Login.jsx: Error message:', err.message);
      console.error('Login.jsx: Error config:', err.config);
      
      if (err.response) {
        // Server responded with error status
        console.error('Login.jsx: Server error:', err.response.status, err.response.data);
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received
        console.error('Login.jsx: Network error - no response received:', err.request);
        setError('Network error. Could not connect to the server. Please check if the backend is running.');
      } else {
        // Something else happened
        console.error('Login.jsx: Request setup error:', err.message);
        setError(`Request error: ${err.message}`);
      }
    }
  };

  const onRegister = async (data) => {
    console.log('Login.jsx: onRegister called');
    
    // Prevent multiple submissions
    if (isRegisterSubmitting) {
      console.log('Login.jsx: Already submitting, ignoring');
      return;
    }
    
    setError('');
    setSuccess('');

    try {
      console.log('Login.jsx: Attempting registration');
      await register(data);
      resetRegisterForm();
      setSuccess('Registration successful! Please log in.');
      setTab(0); // Switch to login tab
    } catch (err) {
      console.error('Login.jsx: Registration error:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };

  const isSubmitting = isLoginSubmitting || isRegisterSubmitting;

  // If authenticated and not loading, don't render the login form
  if (isAuthenticated && !loading) {
    return null; // or a loading spinner while redirecting
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 4 }
      }}
    >
      <Container 
        maxWidth="sm"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={isMobile ? 1 : 3} 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            width: '100%',
            maxWidth: 400,
            borderRadius: { xs: 2, sm: 3 }
          }}
        >
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h1" 
          gutterBottom 
          align="center"
          sx={{ 
            fontWeight: 'bold',
            mb: { xs: 1, sm: 2 }
          }}
        >
          Jewellery Management
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: { xs: 2, sm: 3 } }}
        >
          {tab === 0 ? 'Sign in to your account' : 'Create a new account'}
        </Typography>
        {error && (
          <Alert
            severity="error"
            sx={{ 
              mb: 2, 
              width: '100%',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ 
              mb: 2, 
              width: '100%',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}
        {/* Login and Register forms are handled below, this block was duplicate and misplaced */}
        {tab === 0 ? (
          <Box component="form" onSubmit={handleLoginSubmit(onLogin)} noValidate>
            <Controller
              name="username"
              control={loginControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Username"
                  fullWidth
                  margin="normal"
                  error={!!loginErrors.username}
                  helperText={loginErrors.username?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={loginControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  error={!!loginErrors.password}
                  helperText={loginErrors.password?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  size={isMobile ? 'medium' : 'medium'}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Remember Me
                </Typography>
              }
              sx={{ 
                mt: 1,
                mb: { xs: 1, sm: 0 }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size={isMobile ? "large" : "large"}
              sx={{
                mt: { xs: 2, sm: 2 },
                py: { xs: 1.5, sm: 1.5 },
                fontSize: {
                  xs: '1rem',
                  sm: '1.1rem',
                },
                fontWeight: 'bold',
                textTransform: 'none'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Link 
                component={RouterLink} 
                to="/register" 
                variant="body2"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        ) : (
          /* Register Form */
          <Box component="form" onSubmit={handleRegisterSubmit(onRegister)} noValidate>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: {
                  xs: 'column',
                  sm: 'row',
                },
              }}
            >
              <Controller
                name="firstName"
                control={registerControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    margin="normal"
                    error={!!registerErrors.firstName}
                    helperText={registerErrors.firstName?.message}
                    disabled={isSubmitting}
                    size={isMobile ? 'small' : 'medium'}
                  />
                )}
              />
              <Controller
                name="lastName"
                control={registerControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    margin="normal"
                    error={!!registerErrors.lastName}
                    helperText={registerErrors.lastName?.message}
                    disabled={isSubmitting}
                    size={isMobile ? 'small' : 'medium'}
                  />
                )}
              />
            </Box>

            <Controller
              name="username"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Username"
                  fullWidth
                  margin="normal"
                  error={!!registerErrors.username}
                  helperText={registerErrors.username?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="email"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  error={!!registerErrors.email}
                  helperText={registerErrors.email?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  error={!!registerErrors.password}
                  helperText={registerErrors.password?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          edge="end"
                        >
                          {showRegisterPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="role"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Role"
                  margin="normal"
                  error={!!registerErrors.role}
                  helperText={registerErrors.role?.message}
                  disabled={isSubmitting}
                  size={isMobile ? 'small' : 'medium'}
                  SelectProps={{ native: true }}
                >
                  <option value=""></option>
                  <option value="sales">Sales</option>
                  <option value="inventory">Inventory</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </TextField>
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size={isMobile ? "large" : "large"}
              sx={{
                mt: { xs: 2, sm: 2 },
                py: { xs: 1.5, sm: 1.5 },
                fontSize: {
                  xs: '1rem',
                  sm: '1.1rem',
                },
                fontWeight: 'bold',
                textTransform: 'none'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>
          </Box>
        )}
      </Paper>
      
      </Container>
    </Box>
  );
};

export default Login;