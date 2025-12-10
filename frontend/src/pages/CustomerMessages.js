import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  MarkEmailRead as ReadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function CustomerMessages() {
  const location = useLocation();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    fetchThreads();
    fetchStats();
    setupSocket();

    // Check if customer data was passed from navigation
    if (location.state?.customer) {
      const customer = location.state.customer;
      setNewCustomerForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        message: '',
      });
      setShowNewMessageForm(true);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [location]);

  useEffect(() => {
    if (selectedThread) {
      fetchThreadMessages(selectedThread._id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocket = () => {
    const newSocket = io(SOCKET_URL);
    newSocket.on('new-customer-message', (data) => {
      if (selectedThread && data.threadId === selectedThread._id) {
        fetchThreadMessages(selectedThread._id);
      }
      fetchThreads();
      fetchStats();
    });
    setSocket(newSocket);
  };

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${API_URL}/customer-messages/threads`);
      setThreads(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch threads error:', error);
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const fetchThreadMessages = async (threadId) => {
    try {
      const response = await axios.get(`${API_URL}/customer-messages/thread/${threadId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/customer-messages/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      await axios.post(`${API_URL}/customer-messages/send`, {
        customer: selectedThread.customer,
        content: newMessage,
        threadId: selectedThread._id,
      });

      setNewMessage('');
      fetchThreadMessages(selectedThread._id);
      fetchThreads();
      fetchStats();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.message.trim()) {
      toast.error('Please fill in customer name and message');
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API_URL}/customer-messages/send`, {
        customer: {
          name: newCustomerForm.name,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
        },
        content: newCustomerForm.message,
      });

      toast.success('Message sent successfully');
      setNewCustomerForm({ name: '', email: '', phone: '', message: '' });
      setShowNewMessageForm(false);
      fetchThreads();
      fetchStats();
    } catch (error) {
      console.error('Send new message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          💬 Customer Messages
        </Typography>
        <Button
          variant="contained"
          onClick={() => setShowNewMessageForm(!showNewMessageForm)}
          sx={{
            background: showNewMessageForm 
              ? 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)'
              : 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
            color: 'var(--text-primary)',
            '&:hover': {
              background: showNewMessageForm
                ? 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)'
                : 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
              transform: 'translateY(-2px)',
              boxShadow: showNewMessageForm
                ? '0 10px 20px rgba(244, 63, 94, 0.3)'
                : '0 10px 20px rgba(37, 99, 235, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {showNewMessageForm ? '❌ Cancel' : '✉️ New Message'}
        </Button>
      </Box>

      {showNewMessageForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Send New Message to Customer
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Customer Name *"
                value={newCustomerForm.name}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message *"
                value={newCustomerForm.message}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, message: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSendNewMessage}
                disabled={sending}
                startIcon={<SendIcon />}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Conversations
                </Typography>
                <Typography variant="h5">{stats.totalThreads || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Messages
                </Typography>
                <Typography variant="h5">{stats.totalMessages || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unread Messages
                </Typography>
                <Typography variant="h5" color="error">
                  {stats.unreadMessages || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Inbound Messages
                </Typography>
                <Typography variant="h5">{stats.inboundMessages || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Threads List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '600px', overflow: 'auto' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Conversations</Typography>
            </Box>
            <List>
              {threads.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No conversations yet"
                    secondary="Start a conversation by sending a message to a customer"
                  />
                </ListItem>
              ) : (
                threads.map((thread) => (
                  <ListItem
                    key={thread._id}
                    button
                    selected={selectedThread?._id === thread._id}
                    onClick={() => setSelectedThread(thread)}
                    sx={{
                      bgcolor: selectedThread?._id === thread._id ? 'action.selected' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={thread.unreadCount}
                        color="error"
                        invisible={thread.unreadCount === 0}
                      >
                        <Avatar>
                          {getInitials(thread.customer.name)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={thread.customer.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" noWrap>
                            {thread.lastMessageContent}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {moment(thread.lastMessage).fromNow()}
                          </Typography>
                        </Box>
                      }
                    />
                    {thread.unreadCount > 0 && (
                      <Chip
                        label={thread.unreadCount}
                        color="error"
                        size="small"
                      />
                    )}
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Messages View */}
        <Grid item xs={12} md={8}>
          {selectedThread ? (
            <Paper sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">{selectedThread.customer.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedThread.customer.email && `${selectedThread.customer.email} • `}
                      {selectedThread.customer.phone && `${selectedThread.customer.phone}`}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<BusinessIcon />}
                    label="Customer"
                    size="small"
                  />
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor:
                          message.direction === 'outbound'
                            ? 'primary.main'
                            : 'grey.200',
                        color:
                          message.direction === 'outbound'
                            ? 'white'
                            : 'text.primary',
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8 }}
                        >
                          {moment(message.createdAt).format('MMM DD, HH:mm')}
                        </Typography>
                        {message.direction === 'outbound' && message.status === 'read' && (
                          <ReadIcon sx={{ fontSize: 14, opacity: 0.8 }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a conversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a conversation from the list to view and send messages
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

