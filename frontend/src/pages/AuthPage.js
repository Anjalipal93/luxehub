import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function AuthPage() {
  const location = useLocation();
  // Set initial tab based on route: /register -> tab 1, /login or /auth -> tab 0
  const initialTab = location.pathname === '/register' ? 1 : 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    // Signup fields
    name: '',
    signupEmail: '',
    signupPassword: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // Update tab when route changes
  useEffect(() => {
    const newTab = location.pathname === '/register' ? 1 : 0;
    setActiveTab(newTab);
  }, [location.pathname]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    // Update URL when tab changes
    navigate(newValue === 1 ? '/register' : '/login', { replace: true });
    setFormData({
      email: '',
      password: '',
      name: '',
      signupEmail: '',
      signupPassword: '',
      confirmPassword: '',
      phone: '',
    });
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };


  const validateSignupForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.signupEmail || !/\S+@\S+\.\S+/.test(formData.signupEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone || !/^\+?[\d\s-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.signupPassword) {
      setError('Password is required');
      return false;
    }
    if (formData.signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.signupPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (activeTab === 0) {
      // Login
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const result = await login(formData.email, formData.password);
      setLoading(false);

      if (result.success) {
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      } else {
        const errorMsg = result.message || 'Login failed. Please check your credentials and try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } else {
      // Signup
      if (!validateSignupForm()) {
        setLoading(false);
        return;
      }

      try {
        const result = await register({
          name: formData.name,
          email: formData.signupEmail,
          password: formData.signupPassword,
          phone: formData.phone.replace(/\s/g, ''),
          role: 'user',
        });

        if (result.success) {
          toast.success('Registration completed successfully! 🎉');
          navigate('/dashboard');
        } else {
          const errorMsg = result.message || 'Registration failed. Please try again.';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error('Registration error:', error);
        const errorMsg = error.message || 'Registration failed. Please check your connection and try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setForgotLoading(true);
    setForgotSuccess(false);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: forgotEmail.trim(),
      });

      if (response.data.success) {
        setForgotSuccess(true);
        toast.success('Password reset link sent to your email!');
      } else {
        toast.error(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg-secondary)',
          opacity: 0.1,
        },
      }}
    >
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Logo/Brand Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'var(--text-primary)',
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              💎 LuxeHub
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Your Premium Business Automation Platform
            </Typography>
          </Box>

          <Paper
            elevation={12}
            sx={{
              p: 5,
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Tab Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="auth tabs"
                sx={{
                  '& .MuiTab-root': {
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    '&.Mui-selected': {
                      color: 'var(--accent)',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'var(--accent)',
                  },
                }}
              >
                <Tab label="Login" />
                <Tab label="Sign Up" />
              </Tabs>
            </Box>

            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'var(--text-primary)',
                mb: 2,
              }}
            >
              {activeTab === 0 ? '🔐 Welcome Back' : '✨ Create Your Account'}
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                mb: 4,
                color: 'var(--text-secondary)',
              }}
            >
              {activeTab === 0
                ? 'Sign in to your account to continue'
                : 'Join our premium business community'
              }
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #F2C6DE',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {activeTab === 0 ? (
                // Login Form
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'var(--accent)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        margin: '8px 0',
                        '&:hover': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          boxShadow: '0 0 0 2px rgba(16, 163, 127, 0.2)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-secondary)',
                        '&.Mui-focused': {
                          color: 'var(--accent)',
                        },
                      },
                    }}
                    sx={{ mb: 3, mt: 2 }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            sx={{ color: 'var(--accent)' }}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        margin: '8px 0',
                        '&:hover': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          boxShadow: '0 0 0 2px rgba(16, 163, 127, 0.2)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-secondary)',
                        '&.Mui-focused': {
                          color: 'var(--accent)',
                        },
                      },
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Box textAlign="center" sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      onClick={() => setShowForgotPassword(true)}
                      sx={{
                        color: 'var(--accent)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      🔑 Forgot Password?
                    </Typography>
                  </Box>
                </>
              ) : (
                // Signup Form
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    autoFocus
                    value={formData.name}
                    onChange={handleChange('name')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'var(--accent)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 2,
                        padding: '8px 12px',
                        margin: '8px 0',
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-primary)',
                        '&.Mui-focused': { color: 'var(--accent)' },
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="signupEmail"
                    label="Email Address"
                    name="signupEmail"
                    autoComplete="email"
                    type="email"
                    value={formData.signupEmail}
                    onChange={handleChange('signupEmail')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'var(--accent)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 2,
                        padding: '8px 12px',
                        margin: '8px 0',
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-primary)',
                        '&.Mui-focused': { color: 'var(--accent)' },
                      },
                    }}
                    sx={{ mb: 2, mt: 2 }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    autoComplete="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'var(--accent)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 2,
                        padding: '8px 12px',
                        margin: '8px 0',
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-primary)',
                        '&.Mui-focused': { color: 'var(--accent)' },
                      },
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="signupPassword"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="signupPassword"
                    autoComplete="new-password"
                    value={formData.signupPassword}
                    onChange={handleChange('signupPassword')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            sx={{ color: 'var(--accent)' }}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        margin: '8px 0',
                        '&:hover': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          boxShadow: '0 0 0 2px rgba(16, 163, 127, 0.2)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-secondary)',
                        '&.Mui-focused': { color: 'var(--accent)' },
                      },
                    }}
                    sx={{ mb: 2, mt: 2 }}
                  />


                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            sx={{ color: 'var(--accent)' }}
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 2,
                        border: '1px solid var(--border-color)',
                        padding: '8px 12px',
                        margin: '8px 0',
                        '&:hover': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          boxShadow: '0 0 0 2px rgba(16, 163, 127, 0.2)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'var(--text-secondary)',
                        '&.Mui-focused': { color: 'var(--accent)' },
                      },
                    }}
                  />
                </>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.8,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--accent)',
                  color: activeTab === 0 ? 'white' : 'var(--text-primary)',
                  borderRadius: 3,
                  boxShadow: '0 4px 15px rgba(16, 163, 127, 0.3)',
                  '&:hover': {
                    backgroundColor: '#0F8C6A',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(16, 163, 127, 0.4)',
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    opacity: 0.6,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading
                  ? (activeTab === 0 ? '✨ Signing In...' : '✨ Creating Account...')
                  : (activeTab === 0 ? '🚀 Sign In' : '🚀 Create Account')
                }
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Forgot Password Dialog */}
      <Dialog
        open={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotSuccess(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockResetIcon sx={{ color: 'var(--accent)' }} />
          Reset Password
        </DialogTitle>
        <DialogContent>
          {forgotSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Email Sent!
              </Typography>
              <Typography variant="body2">
                If an account with that email exists, a password reset link has been sent to <strong>{forgotEmail}</strong>.
                Please check your email and click the link to reset your password.
              </Typography>
            </Alert>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'var(--accent)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowForgotPassword(false);
              setForgotEmail('');
              setForgotSuccess(false);
            }}
            disabled={forgotLoading}
          >
            {forgotSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!forgotSuccess && (
            <Button
              onClick={handleForgotPassword}
              variant="contained"
              disabled={forgotLoading || !forgotEmail.trim()}
              startIcon={forgotLoading ? <CircularProgress size={20} /> : <LockResetIcon />}
              sx={{
                backgroundColor: 'var(--accent)',
                '&:hover': {
                  backgroundColor: '#0F8C6A',
                },
              }}
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}





