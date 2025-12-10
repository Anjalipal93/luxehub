import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ChattingMessages() {
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [smsForm, setSmsForm] = useState({
    phone: '',
    message: '',
  });

  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!emailForm.name || !emailForm.email || !emailForm.message) {
      toast.error('Please fill in all email fields');
      return;
    }

    setSendingEmail(true);
    try {
      // Using Formspree or your backend email endpoint
      const response = await axios.post('https://formspree.io/f/mnnebyap', {
        name: emailForm.name,
        email: emailForm.email,
        message: emailForm.message,
      });

      toast.success('Email sent successfully!');
      setEmailForm({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();

    if (!smsForm.phone || !smsForm.message) {
      toast.error('Please fill in all SMS fields');
      return;
    }

    setSendingSms(true);
    try {
      const response = await axios.post(`${API_URL}/sendsms`, {
        phone: smsForm.phone,
        message: smsForm.message,
      });

      toast.success('SMS sent successfully!');
      setSmsForm({ phone: '', message: '' });
    } catch (error) {
      console.error('SMS send error:', error);
      toast.error(error.response?.data || 'Failed to send SMS. Please try again.');
    } finally {
      setSendingSms(false);
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappUrl = 'https://wa.me/919368502764?text=Hello!%20I%20want%20to%20contact%20you';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
        💬 Chatting & Messages
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Select any channel to send your message
      </Typography>

      {/* Email Form */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          Email Us
        </Typography>

        <Box component="form" onSubmit={handleEmailSubmit}>
          <TextField
            fullWidth
            label="Your Name"
            placeholder="Enter your name"
            value={emailForm.name}
            onChange={(e) => setEmailForm(prev => ({ ...prev, name: e.target.value }))}
            required
            margin="normal"
            disabled={sendingEmail}
          />

          <TextField
            fullWidth
            label="Your Email"
            placeholder="Enter your email"
            type="email"
            value={emailForm.email}
            onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
            required
            margin="normal"
            disabled={sendingEmail}
          />

          <TextField
            fullWidth
            label="Your Message"
            placeholder="Type your message here..."
            multiline
            rows={4}
            value={emailForm.message}
            onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
            required
            margin="normal"
            disabled={sendingEmail}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={sendingEmail || !emailForm.name || !emailForm.email || !emailForm.message}
            startIcon={sendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
            sx={{
              mt: 2,
              py: 1.5,
              fontSize: '16px',
              borderRadius: 2,
              backgroundColor: '#0078ff',
              '&:hover': {
                backgroundColor: '#005ccc',
              },
            }}
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
        </Box>
      </Paper>

      {/* WhatsApp */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon sx={{ color: '#25d366' }} />
          WhatsApp
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click below to start a conversation on WhatsApp
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleWhatsAppClick}
          startIcon={<WhatsAppIcon />}
          sx={{
            py: 1.5,
            fontSize: '16px',
            borderRadius: 2,
            backgroundColor: '#25D366',
            '&:hover': {
              backgroundColor: '#1ebe5d',
            },
          }}
        >
          Chat on WhatsApp
        </Button>
      </Paper>

      {/* SMS Form */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmsIcon color="secondary" />
          Send SMS
        </Typography>

        <Box component="form" onSubmit={handleSmsSubmit}>
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="Enter your phone number"
            value={smsForm.phone}
            onChange={(e) => setSmsForm(prev => ({ ...prev, phone: e.target.value }))}
            required
            margin="normal"
            disabled={sendingSms}
            helperText="Include country code (e.g., +1234567890)"
          />

          <TextField
            fullWidth
            label="SMS Message"
            placeholder="Type SMS message..."
            multiline
            rows={3}
            value={smsForm.message}
            onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
            required
            margin="normal"
            disabled={sendingSms}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={sendingSms || !smsForm.phone || !smsForm.message}
            startIcon={sendingSms ? <CircularProgress size={20} /> : <SmsIcon />}
            sx={{
              mt: 2,
              py: 1.5,
              fontSize: '16px',
              borderRadius: 2,
              backgroundColor: '#0078ff',
              '&:hover': {
                backgroundColor: '#005ccc',
              },
            }}
          >
            {sendingSms ? 'Sending...' : 'Send SMS'}
          </Button>
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Email goes through Formspree, WhatsApp opens a new tab, and SMS uses Twilio (requires backend setup).
        </Typography>
      </Alert>
    </Box>
  );
}

