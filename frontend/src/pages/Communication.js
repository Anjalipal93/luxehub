import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  Chat as ChatIcon,
  WhatsApp as WhatsAppIcon,
  People as PeopleIcon,
  Send as SendIcon,
  RecordVoiceOver as VoiceIcon,
} from '@mui/icons-material';
import VoiceChatbot from '../components/VoiceChatbot';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function Communication() {
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: [],
    subject: '',
    content: '',
    useCustomers: false,
  });
  const [whatsappForm, setWhatsappForm] = useState({
    to: [],
    content: '',
    useCustomers: false,
  });
  const [webChat, setWebChat] = useState({
    message: '',
    messages: [],
  });
  const [sending, setSending] = useState(false);

  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [whatsappTabHidden, setWhatsappTabHidden] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchCustomers();
    fetchWhatsAppStatus();
    setupSocket();
  }, []);

  // Check WhatsApp status when WhatsApp tab is opened
  useEffect(() => {
    if (tab === 3 && !whatsappTabHidden) {
      fetchWhatsAppStatus();
    }
  }, [tab]);

  const fetchWhatsAppStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/communication/whatsapp-status`);
      setWhatsappStatus(response.data);
    } catch (error) {
      console.error('Fetch WhatsApp status error:', error);
      // On network error, show error state
      setWhatsappStatus({
        configured: false,
        details: {
          code: 'NETWORK_ERROR',
          message: 'Unable to contact server',
          missing: []
        }
      });
    }
  };

  const setupSocket = () => {
    const socket = io(SOCKET_URL);
    socket.on('receive-message', (data) => {
      setWebChat((prev) => ({
        ...prev,
        messages: [...prev.messages, data],
      }));
    });
    return () => socket.disconnect();
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/communication/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${API_URL}/communication/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Fetch customers error:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      let recipients = [];
      
      if (emailForm.useCustomers && emailForm.to.length > 0) {
        // Get emails from selected customers
        recipients = emailForm.to
          .map(customer => customer?.email)
          .filter(email => email && email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      } else {
        // Manual input - handle both array and string
        if (Array.isArray(emailForm.to)) {
          recipients = emailForm.to
            .map(email => typeof email === 'string' ? email.trim() : '')
            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        } else if (typeof emailForm.to === 'string') {
          recipients = emailForm.to
            .split(/[,\n]/)
            .map(email => email.trim())
            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
        }
      }

      if (!recipients || recipients.length === 0) {
        toast.error('Please select customers or enter at least one valid email address');
        setSending(false);
        return;
      }

      if (!emailForm.subject || !emailForm.subject.trim()) {
        toast.error('Please enter an email subject');
        setSending(false);
        return;
      }

      if (!emailForm.content || !emailForm.content.trim()) {
        toast.error('Please enter email content');
        setSending(false);
        return;
      }

      const response = await axios.post(`${API_URL}/communication/send-email`, {
        to: recipients,
        subject: emailForm.subject,
        content: emailForm.content,
      });

      if (response.data.success) {
        toast.success(`✅ Email sent successfully to ${response.data.successCount} of ${response.data.totalSent} recipient(s)`);
        setEmailForm({ to: [], subject: '', content: '', useCustomers: false });
        fetchMessages();
      } else {
        const successCount = response.data.successCount || 0;
        const failedCount = response.data.failedCount || response.data.totalSent - successCount;
        
        if (successCount > 0) {
          toast.warning(`⚠️ Email sent to ${successCount} of ${response.data.totalSent} recipient(s). ${failedCount} failed.`);
          setEmailForm({ to: [], subject: '', content: '', useCustomers: false });
          fetchMessages();
        } else {
          // All failed - show detailed error
          const firstError = response.data.results?.find(r => !r.success);
          if (firstError) {
            toast.error(
              `❌ Failed to send email: ${firstError.error || 'Unknown error'}. ${firstError.message || ''}`,
              { autoClose: 6000 }
            );
          } else {
            toast.error('❌ Failed to send email. Please check SMTP configuration in backend/.env file.', { autoClose: 6000 });
          }
        }
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    
    // Check if WhatsApp is configured
    if (!whatsappStatus || !whatsappStatus.configured) {
      toast.error('WhatsApp is not configured. Please set up Twilio credentials first.');
      return;
    }

    setSending(true);
    try {
      let recipients = [];
      
      if (whatsappForm.useCustomers && whatsappForm.to.length > 0) {
        // Get phone numbers from selected customers
        recipients = whatsappForm.to
          .map(customer => customer?.phone)
          .filter(phone => phone && phone.trim() !== '');
      } else {
        // Manual input - handle both array and string
        if (Array.isArray(whatsappForm.to)) {
          recipients = whatsappForm.to
            .map(phone => typeof phone === 'string' ? phone.trim() : '')
            .filter(phone => phone && phone.trim() !== '');
        } else if (typeof whatsappForm.to === 'string') {
          recipients = whatsappForm.to
            .split(/[,\n]/)
            .map(phone => phone.trim())
            .filter(phone => phone && phone.trim() !== '');
        }
      }

      if (!recipients || recipients.length === 0) {
        toast.error('Please select customers or enter at least one valid phone number');
        setSending(false);
        return;
      }

      if (!whatsappForm.content || !whatsappForm.content.trim()) {
        toast.error('Please enter message content');
        setSending(false);
        return;
      }

      const response = await axios.post(`${API_URL}/communication/send-whatsapp`, {
        to: recipients.length === 1 ? recipients[0] : recipients,
        message: whatsappForm.content,
      });

      // Check for WHATSAPP_NOT_CONFIGURED error
      if (response.data.code === 'WHATSAPP_NOT_CONFIGURED') {
        toast.error(response.data.message || 'WhatsApp is not configured.');
        setWhatsappStatus({
          configured: false,
          details: {
            code: 'WHATSAPP_NOT_CONFIGURED',
            missing: response.data.missing || [],
            setupUrl: response.data.setupUrl
          }
        });
        setSending(false);
        return;
      }

      if (response.data.success) {
        if (response.data.successCount !== undefined) {
          // Multiple recipients
          toast.success(`✅ WhatsApp message sent to ${response.data.successCount} of ${response.data.totalSent} recipients`);
        } else {
          // Single recipient
          toast.success('✅ WhatsApp message sent');
        }
        setWhatsappForm({ to: [], content: '', useCustomers: false });
        fetchMessages();
      } else {
        // Error response
        const errorMsg = response.data.message || response.data.error || 'Failed to send WhatsApp message';
        toast.error(`❌ ${errorMsg}`, { autoClose: 6000 });
      }
    } catch (error) {
      console.error('Send WhatsApp error:', error);
      
      // Handle network errors
      if (!error.response) {
        toast.error('Unable to contact server. Please check your connection.');
        return;
      }
      
      // Handle WHATSAPP_NOT_CONFIGURED error from response
      if (error.response?.data?.code === 'WHATSAPP_NOT_CONFIGURED') {
        toast.error(error.response.data.message || 'WhatsApp is not configured.');
        setWhatsappStatus({
          configured: false,
          details: {
            code: 'WHATSAPP_NOT_CONFIGURED',
            missing: error.response.data.missing || [],
            setupUrl: error.response.data.setupUrl
          }
        });
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to send WhatsApp message';
        toast.error(`❌ ${errorMsg}`, { autoClose: 6000 });
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendWebChat = () => {
    if (!webChat.message.trim()) return;

    const newMessage = {
      from: 'You',
      content: webChat.message,
      timestamp: new Date(),
    };

    setWebChat((prev) => ({
      message: '',
      messages: [...prev.messages, newMessage],
    }));
  };

  const getCustomerLabel = (customer) => {
    const parts = [];
    if (customer.name) parts.push(customer.name);
    if (customer.email) parts.push(`(${customer.email})`);
    if (customer.phone) parts.push(`- ${customer.phone}`);
    return parts.join(' ') || 'Unknown Customer';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        📧 Multichannel Communication
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab icon={<VoiceIcon />} label="AI Voice Chatbot" />
          <Tab icon={<ChatIcon />} label="Web Chat" />
          <Tab icon={<EmailIcon />} label="Email (Group)" />
          {!whatsappTabHidden && (
            <Tab icon={<WhatsAppIcon />} label="WhatsApp (Group)" />
          )}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box sx={{ height: '600px' }}>
              <VoiceChatbot />
            </Box>
          )}

          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                  <List>
                    {webChat.messages.map((msg, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={msg.from}
                          secondary={msg.content}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                <Box sx={{ display: 'flex', mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Type a message"
                    value={webChat.message}
                    onChange={(e) =>
                      setWebChat({ ...webChat, message: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSendWebChat();
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendWebChat}
                    sx={{ ml: 2 }}
                  >
                    Send
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Messages
                    </Typography>
                    <List>
                      {messages.slice(0, 5).map((msg) => (
                        <ListItem key={msg._id}>
                          <ListItemText
                            primary={msg.subject || msg.content.substring(0, 50)}
                            secondary={`${msg.channel} - ${new Date(
                              msg.createdAt
                            ).toLocaleString()}`}
                          />
                          <Chip
                            label={msg.channel}
                            size="small"
                            color={
                              msg.channel === 'email'
                                ? 'primary'
                                : msg.channel === 'whatsapp'
                                ? 'success'
                                : 'default'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <form onSubmit={handleSendEmail}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📧 Email Configuration
                </Typography>
                <Typography variant="body2">
                  To send emails, configure SMTP settings in <code>backend/.env</code>:
                </Typography>
                <Typography component="ul" variant="body2" sx={{ mt: 1, pl: 2 }}>
                  <li><code>SMTP_HOST</code> (e.g., smtp.gmail.com)</li>
                  <li><code>SMTP_PORT</code> (e.g., 587 for Gmail)</li>
                  <li><code>SMTP_USER</code> (your email address)</li>
                  <li><code>SMTP_PASS</code> (your email password or app password)</li>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  For Gmail: Use an App Password instead of your regular password.
                </Typography>
              </Alert>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailForm.useCustomers}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, useCustomers: e.target.checked, to: [] })
                      }
                    />
                  }
                  label="Select from customers (from sales data)"
                />
              </Box>

              {emailForm.useCustomers ? (
                <Autocomplete
                  multiple
                  options={customers.filter(c => c.email)}
                  getOptionLabel={(option) => getCustomerLabel(option)}
                  value={emailForm.to}
                  onChange={(e, newValue) =>
                    setEmailForm({ ...emailForm, to: newValue })
                  }
                  loading={loadingCustomers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customers"
                      placeholder="Choose customers..."
                      margin="normal"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email} | Purchases: {option.totalPurchases} | Spent: ${option.totalSpent?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  margin="normal"
                  label="To (Email addresses - separate multiple with comma)"
                  placeholder="email1@example.com, email2@example.com"
                  value={Array.isArray(emailForm.to) ? emailForm.to.join(', ') : (emailForm.to || '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Split by comma and filter out empty strings
                    const emails = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
                    setEmailForm({ ...emailForm, to: emails });
                  }}
                  helperText="Enter email addresses separated by commas"
                  required
                />
              )}

              <TextField
                fullWidth
                margin="normal"
                label="Subject"
                required
                value={emailForm.subject}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, subject: e.target.value })
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Message"
                multiline
                rows={6}
                required
                value={emailForm.content}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, content: e.target.value })
                }
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : `Send Email${emailForm.useCustomers && emailForm.to.length > 0 ? ` (${emailForm.to.length} recipients)` : ''}`}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={fetchCustomers}
                >
                  Refresh Customers
                </Button>
              </Box>
              {emailForm.useCustomers && emailForm.to.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Selected {emailForm.to.length} customer(s) for group email
                </Alert>
              )}
            </form>
          )}

          {tab === 3 && !whatsappTabHidden && (
            <form onSubmit={handleSendWhatsApp}>
              {whatsappStatus && !whatsappStatus.configured && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={() => setWhatsappTabHidden(true)}
                  action={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {whatsappStatus.details?.setupUrl && (
                        <Button
                          color="inherit"
                          size="small"
                          href={whatsappStatus.details.setupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none' }}
                        >
                          Set up WhatsApp
                        </Button>
                      )}
                    </Box>
                  }
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    WhatsApp is not configured.
                  </Typography>
                  <Typography variant="body2">
                    WhatsApp service is not configured. Missing: {whatsappStatus.details?.missing?.join(', ') || 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER'}
                  </Typography>
                </Alert>
              )}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={whatsappForm.useCustomers}
                      onChange={(e) =>
                        setWhatsappForm({ ...whatsappForm, useCustomers: e.target.checked, to: [] })
                      }
                    />
                  }
                  label="Select from customers (from sales data)"
                />
              </Box>

              {whatsappForm.useCustomers ? (
                <Autocomplete
                  multiple
                  options={customers.filter(c => c.phone)}
                  getOptionLabel={(option) => getCustomerLabel(option)}
                  value={whatsappForm.to}
                  onChange={(e, newValue) =>
                    setWhatsappForm({ ...whatsappForm, to: newValue })
                  }
                  loading={loadingCustomers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customers"
                      placeholder="Choose customers..."
                      margin="normal"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.phone} | Purchases: {option.totalPurchases} | Spent: ${option.totalSpent?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              ) : (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Phone Numbers (with country code - separate multiple with comma)"
                  placeholder="+1234567890, +9876543210"
                  value={Array.isArray(whatsappForm.to) ? whatsappForm.to.join(', ') : whatsappForm.to}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWhatsappForm({ ...whatsappForm, to: value.split(',').map(v => v.trim()) });
                  }}
                  helperText="Enter phone numbers with country code, separated by commas"
                />
              )}

              <TextField
                fullWidth
                margin="normal"
                label="Message"
                multiline
                rows={6}
                required
                value={whatsappForm.content}
                onChange={(e) =>
                  setWhatsappForm({ ...whatsappForm, content: e.target.value })
                }
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                  color="success"
                  disabled={sending || !whatsappStatus || !whatsappStatus.configured}
                  id="send-whatsapp-btn"
                >
                  {sending ? 'Sending...' : `Send WhatsApp${whatsappForm.useCustomers && whatsappForm.to.length > 0 ? ` (${whatsappForm.to.length} recipients)` : ''}`}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={fetchCustomers}
                >
                  Refresh Customers
                </Button>
              </Box>
              {whatsappForm.useCustomers && whatsappForm.to.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Selected {whatsappForm.to.length} customer(s) for group WhatsApp message
                </Alert>
              )}
            </form>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
