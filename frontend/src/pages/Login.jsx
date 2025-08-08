// src/components/Login.jsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonOutline,
  EmailOutlined,
  LockOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../api/config';

// Validation schemas
const loginSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .required('Username is required'),
  password: yup.string().required('Password is required'),
});

const registerSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .required('Username is required'),
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  firstName: yup
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: yup
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  role: yup
    .string()
    .oneOf(['sales', 'inventory', 'manager', 'admin'], 'Please select a valid role')
    .required('Role is required'),
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
    reset: resetLoginForm,
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
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setSuccess('');
    if (newValue === 0) {
      resetRegisterForm();
    } else {
      resetLoginForm();
    }
  };

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
      const response = await api.post('/auth/login', {
        username: data.username.trim(),
        password: data.password,
      });
      
      console.log('Login.jsx: API response received:', { success: response.data.success });

      if (response.data.success && response.data.token && response.data.user) {
        console.log('Login.jsx: Login successful, calling AuthProvider login');
        await login(response.data.token, response.data.user);
      } else {
        console.log('Login.jsx: Login failed, API response indicates failure');
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login.jsx: Error during login API call:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred during login');
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
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Jewellery Management
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{
            mb: 3,
            fontSize: {
              xs: '0.9rem',
              sm: '1rem',
            },
          }}
        >
          {tab === 0 ? 'Sign in to your account' : 'Create a new account'}
        </Typography>

        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          centered
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, width: '100%' }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, width: '100%' }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {tab === 0 ? (
          /* Login Form */
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
                  size={isMobile ? 'small' : 'medium'}
                />
              }
              label="Remember Me"
              sx={{ mt: 1 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: {
                  xs: '0.9rem',
                  sm: '1rem',
                },
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/register" variant="body2">
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
              size="large"
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: {
                  xs: '0.9rem',
                  sm: '1rem',
                },
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Register'
              )}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Login;