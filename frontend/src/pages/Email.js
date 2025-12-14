import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Email() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setResponseMsg('');

    try {
      const response = await axios.post(`${API_URL}/send-email`, formData);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Email sent successfully!');
        setResponseMsg(response.data.message || 'Email sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error(response.data.error || 'Failed to send email');
        setResponseMsg(response.data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      let errorMsg = 'Error sending email. Please try again.';
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
      setResponseMsg(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
      }}
    >
      <Paper
        sx={{
          width: '100%',
          maxWidth: 450,
          padding: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
          animation: 'fadeIn 0.8s ease',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <EmailIcon sx={{ fontSize: 48, color: 'white', mb: 1 }} />
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            Send a Message
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            name="name"
            label="Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          />

          <TextField
            fullWidth
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          />

          <TextField
            fullWidth
            name="message"
            label="Message"
            placeholder="Write your message..."
            value={formData.message}
            onChange={handleChange}
            required
            multiline
            rows={5}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 2,
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(0, 0, 0, 0.6)',
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={sending}
            startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{
              mt: 3,
              py: 1.5,
              backgroundColor: 'white',
              color: '#2575fc',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#2575fc',
                color: 'white',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </form>

        {responseMsg && (
          <Alert
            severity={responseMsg.includes('success') || responseMsg.includes('sent') ? 'success' : 'error'}
            sx={{
              mt: 2,
              backgroundColor: responseMsg.includes('success') || responseMsg.includes('sent')
                ? 'rgba(76, 175, 80, 0.2)'
                : 'rgba(244, 67, 54, 0.2)',
              color: 'white',
              border: `1px solid ${responseMsg.includes('success') || responseMsg.includes('sent') ? '#4caf50' : '#f44336'}`,
            }}
          >
            {responseMsg}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

