import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

// Test server connection
const testServerConnection = async () => {
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/`, { timeout: 5000 });
    return { connected: true, message: 'Server is reachable' };
  } catch (error) {
    return { 
      connected: false, 
      message: error.code === 'ERR_NETWORK' 
        ? 'Cannot connect to backend server. Please make sure it is running on port 5000.'
        : 'Server connection test failed'
    };
  }
};

export default function InviteCollaborators() {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    // Test server connection on mount
    testServerConnection().then(result => {
      if (!result.connected) {
        console.warn('Server connection test:', result.message);
        setAlert({
          show: true,
          message: result.message,
          severity: 'warning',
        });
      }
    });
    
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      // Ensure auth token is included
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        timeout: 10000, // 10 second timeout
      };

      const response = await axios.get(`${API_URL}/invite-collaborators`, config);
      setCollaborators(response.data.collaborators || response.data || []);
      setAlert({ show: false, message: '', severity: 'success' });
    } catch (error) {
      console.error('Fetch collaborators error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Network error. Please check if the backend server is running.');
        setAlert({
          show: true,
          message: 'Network error. Please check if the backend server is running on port 5000.',
          severity: 'error',
        });
      } else if (error.response?.status === 401) {
        toast.error('Please login to view collaborators');
        setAlert({
          show: true,
          message: 'Please login to view collaborators.',
          severity: 'error',
        });
      } else {
        toast.error('Failed to load collaborators');
        setAlert({
          show: true,
          message: error.response?.data?.message || 'Failed to load collaborators. Please try again.',
          severity: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setAlert({
        show: true,
        message: 'Please enter an email address',
        severity: 'error',
      });
      return;
    }

    if (!validateEmail(email)) {
      setAlert({
        show: true,
        message: 'Please enter a valid email address',
        severity: 'error',
      });
      return;
    }

    setSending(true);
    setAlert({ show: false, message: '', severity: 'success' });

    try {
      // Ensure auth token is included
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        timeout: 30000, // 30 second timeout
      };

      console.log('Sending invite request to:', `${API_URL}/invite-collaborator`);
      console.log('Request config:', { hasToken: !!token, timeout: config.timeout });

      const response = await axios.post(
        `${API_URL}/invite-collaborator`,
        { email: email.trim() },
        config
      );

      if (response.data.success) {
        // Check if email was actually sent
        if (response.data.emailSent) {
          toast.success('Invitation email sent successfully!');
          setAlert({
            show: true,
            message: 'Invitation email sent successfully!',
            severity: 'success',
          });
        } else if (response.data.emailError) {
          // Email failed but invitation was saved
          toast.warning('Invitation saved but email failed to send');
          setAlert({
            show: true,
            message: `Invitation saved but email failed: ${response.data.emailError}`,
            severity: 'warning',
          });
        } else {
          toast.success('Invitation saved successfully!');
          setAlert({
            show: true,
            message: response.data.message || 'Invitation saved successfully!',
            severity: 'success',
          });
        }
        
        setEmail('');
        // Refresh the list after sending invite
        setTimeout(() => {
          fetchCollaborators();
        }, 500);
      } else {
        const errorMsg = response.data.message || 'Failed to send invitation';
        toast.error(errorMsg);
        setAlert({
          show: true,
          message: errorMsg,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Send invite error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to send invitation. Please try again.';
      
      // Network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the backend server is running on port 5000.';
      } else if (error.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running.';
      } 
      // HTTP errors
      else if (error.response?.status === 401) {
        errorMessage = 'Please login to send invitations.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid email address or validation error.';
      } else if (error.response?.status === 404) {
        errorMessage = 'API endpoint not found. Please check the server configuration.';
      } else if (error.response?.status === 500) {
        errorMessage = error.response.data.message || 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setAlert({
        show: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        👥 Invite Collaborators
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Add team members to collaborate with you.
      </Typography>

      {/* Alert Messages */}
      {alert.show && (
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ show: false, message: '', severity: 'success' })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Invite Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Send Invitation
        </Typography>
        <Box component="form" onSubmit={handleSendInvite}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Email"
              placeholder="Enter collaborator email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              disabled={sending}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={sending || !email.trim()}
              sx={{ 
                minWidth: 150, 
                height: '56px',
                background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
                },
              }}
            >
              {sending ? 'Sending Email...' : 'Send Invite'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Collaborators Table */}
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Invited Collaborators</Typography>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={fetchCollaborators}
            disabled={loading}
          >
            Refresh List
          </Button>
        </Box>

        {loading && collaborators.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : collaborators.length === 0 ? (
          <Alert severity="info">No collaborators invited yet.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Invited Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Accepted Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collaborators.map((collaborator, index) => (
                  <TableRow key={collaborator._id || collaborator.email || index}>
                    <TableCell>{collaborator.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={collaborator.status || 'Pending'}
                        color={
                          collaborator.status === 'Accepted'
                            ? 'success'
                            : collaborator.status === 'Pending'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {collaborator.invitedDate
                        ? moment(collaborator.invitedDate).format('MMM DD, YYYY')
                        : collaborator.createdAt
                        ? moment(collaborator.createdAt).format('MMM DD, YYYY')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {collaborator.status === 'Accepted' && collaborator.acceptedAt
                        ? moment(collaborator.acceptedAt).format('MMM DD, YYYY')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

