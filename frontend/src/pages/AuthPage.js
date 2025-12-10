import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState(0); // 0 for login, 1 for signup
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
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

    // Calculate password strength for signup
    if (field === 'signupPassword') {
      calculatePasswordStrength(event.target.value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#F2C6DE';
    if (passwordStrength < 50) return '#F2C6DE';
    if (passwordStrength < 75) return '#D4AF37';
    return '#D4AF37';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
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
    if (passwordStrength < 50) {
      setError('Please choose a stronger password');
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
        setError(result.message);
        toast.error(result.message);
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
          setError(result.message);
        }
      } catch (error) {
        console.error('Registration error:', error);
        setError('Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
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

                  {formData.signupPassword && (
                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#5A3E36', mb: 0.5 }}>
                        Password Strength: {getPasswordStrengthText()}
                      </Typography>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#F2C6DE',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor(),
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#5A3E36', mt: 0.5 }}>
                        Use 8+ characters with uppercase, lowercase, numbers, and symbols
                      </Typography>
                    </Box>
                  )}

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
    </Box>
  );
}
