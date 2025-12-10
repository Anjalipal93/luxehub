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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function InviteCollaborators() {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/invite-collaborators`);
      setCollaborators(response.data.collaborators || response.data || []);
      setAlert({ show: false, message: '', severity: 'success' });
    } catch (error) {
      console.error('Fetch collaborators error:', error);
      toast.error('Failed to load collaborators');
      setAlert({
        show: true,
        message: 'Failed to load collaborators. Please try again.',
        severity: 'error',
      });
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
      const response = await axios.post(`${API_URL}/invite-collaborator`, {
        email: email.trim(),
      });

      if (response.data.success) {
        setAlert({
          show: true,
          message: 'Invitation sent!',
          severity: 'success',
        });
        setEmail('');
        // Refresh the list after sending invite
        setTimeout(() => {
          fetchCollaborators();
        }, 500);
      } else {
        setAlert({
          show: true,
          message: response.data.message || 'Failed to send invitation',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Send invite error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to send invitation. Please try again.';
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
              startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={sending || !email.trim()}
              sx={{ minWidth: 150, height: '56px' }}
            >
              {sending ? 'Sending...' : 'Send Invite'}
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

