import React, { useState, useEffect, useRef } from 'react';
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
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  GroupAdd as GroupAddIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Tab as TabIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TeamSales() {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [mySales, setMySales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Team Chat state
  const [activeTab, setActiveTab] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [teamMessages, setTeamMessages] = useState([]);
  const [onlineTeamMembers, setOnlineTeamMembers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMySales();
    fetchTeamData();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [teamMessages]);

  // Team Chat Socket.IO functionality
  useEffect(() => {
    if (!teamData?.hasTeam || !user) return;

    // Connect to socket server (socket.io connects to base server URL, not /api endpoint)
    let socketBaseURL = API_URL;
    if (socketBaseURL.includes('/api')) {
      socketBaseURL = socketBaseURL.replace('/api', '');
    }
    // Also handle cases where API_URL might be just the base
    if (!socketBaseURL.startsWith('http')) {
      socketBaseURL = window.location.origin;
    }
    
    console.log('Connecting to socket server:', socketBaseURL);
    const socket = io(socketBaseURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    const teamRoom = `team_${teamData.team._id}`;
    socketRef.current = socket;

    // Connection status handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocketConnected(true);
      // Join team room
      socket.emit('join-room', teamRoom);
      socket.emit('join', { username: user.name });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      toast.error('Failed to connect to chat server');
    });

    // Handle private messages only
    socket.on('privateMessage', (msg) => {
      setTeamMessages(prev => {
        const now = Date.now();
        
        // Check if message with same id exists
        const existsById = prev.some(m => m.id === msg.id);
        if (existsById) return prev;
        
        // Check if this is a duplicate of a pending message we just sent (optimistic update)
        // Match by: same sender, same recipient, same text, within 5 seconds
        const pendingIndex = prev.findIndex(m => {
          // Only check pending messages (ones we added optimistically)
          if (!m.isPending || !m.id.startsWith('temp-')) return false;
          
          const mTime = m.timestamp instanceof Date ? m.timestamp.getTime() : new Date(m.timestamp).getTime();
          const timeDiff = Math.abs(now - mTime);
          
          // Match if same content, sender, recipient, and within 5 seconds
          return m.from === msg.from && 
                 m.to === msg.to && 
                 m.text === msg.text &&
                 m.isMe === (msg.from === user.name) &&
                 timeDiff < 5000; // Within 5 seconds
        });
        
        if (pendingIndex !== -1) {
          // Replace the pending message with the confirmed server message
          const updated = [...prev];
          updated[pendingIndex] = {
            ...updated[pendingIndex],
            id: msg.id, // Update with server id
            timestamp: new Date(msg.ts),
            isPending: false // Mark as confirmed
          };
          return updated;
        }
        
        // New message from server (not a duplicate of our pending message)
        return [...prev, {
          id: msg.id,
          from: msg.from,
          to: msg.to,
          text: msg.text,
          timestamp: new Date(msg.ts),
          isMe: msg.from === user.name,
          isPrivate: true,
          isPending: false
        }];
      });
    });

    // Handle system messages
    socket.on('systemMessage', (text) => {
      setTeamMessages(prev => [...prev, {
        id: Date.now(),
        from: 'System',
        text,
        timestamp: new Date(),
        isSystem: true
      }]);
    });

    // Handle typing indicator
    socket.on('typing', ({ from, typing }) => {
      if (from !== user.name) {
        setIsTyping(typing);
        setTypingUser(typing ? from : '');
      }
    });

    // Handle online users in team
    socket.on('users', (users) => {
      // Filter to show only team members who are online
      if (teamData?.team?.members) {
        const onlineTeamUsers = users.filter(username =>
          teamData.team.members.some(member => member.name === username) ||
          username === user.name
        );
        setOnlineTeamMembers(onlineTeamUsers);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [teamData, user]);

  const fetchMySales = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/sales/my`);
      const sales = response.data.sales || response.data || [];
      setMySales(sales);
    } catch (error) {
      console.error('Fetch my sales error:', error);
      toast.error('Failed to load your sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      const [teamResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/teams/my`),
        axios.get(`${API_URL}/teams/stats`)
      ]);

      if (teamResponse.data.success) {
        setTeamData(teamResponse.data);
      }

      if (statsResponse.data.success) {
        setTeamStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Fetch team data error:', error);
      // Team data might not exist yet, which is fine
    }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }

    if (!saleAmount || parseFloat(saleAmount) <= 0) {
      toast.error('Please enter a valid sale amount');
      return;
    }

    setAdding(true);
    try {
      const response = await axios.post(`${API_URL}/sales/add`, {
        customerName: customerName.trim(),
        amount: parseFloat(saleAmount),
      });

      if (response.data.success) {
        toast.success('Sale added successfully!');
        setCustomerName('');
        setSaleAmount('');
        fetchMySales();
        fetchTeamData(); // Refresh team stats
      } else {
        toast.error(response.data.message || 'Failed to add sale');
      }
    } catch (error) {
      console.error('Add sale error:', error);
      toast.error(error.response?.data?.message || 'Failed to add sale');
    } finally {
      setAdding(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    setCreatingTeam(true);
    try {
      const response = await axios.post(`${API_URL}/teams`, {
        teamName: teamName.trim(),
      });

      if (response.data.success) {
        toast.success('Team created successfully!');
        setTeamName('');
        setShowCreateTeam(false);
        fetchTeamData();
      } else {
        toast.error(response.data.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Create team error:', error);
      toast.error(error.response?.data?.message || 'Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();

    if (!memberName.trim()) {
      toast.error('Please enter member name');
      return;
    }

    if (!memberEmail.trim()) {
      toast.error('Please enter member email');
      return;
    }

    setAddingMember(true);
    try {
      const response = await axios.post(`${API_URL}/teams/members`, {
        name: memberName.trim(),
        email: memberEmail.trim(),
      });

      if (response.data.success) {
        toast.success('Team member added successfully!');
        setMemberName('');
        setMemberEmail('');
        setShowAddMember(false);
        fetchTeamData();
      } else {
        toast.error(response.data.message || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Add team member error:', error);
      toast.error(error.response?.data?.message || 'Failed to add team member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/teams/members/${memberId}`);
      toast.success('Team member removed successfully!');
      fetchTeamData();
    } catch (error) {
      console.error('Remove team member error:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleSendTeamMessage = () => {
    if (!chatMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedRecipient) {
      toast.error('Please select a team member to send a message');
      return;
    }

    if (!socketRef.current) {
      toast.error('Connection not established. Please refresh the page.');
      return;
    }

    if (!socketConnected) {
      toast.error('Not connected to server. Please wait a moment and try again.');
      return;
    }

    const messageText = chatMessage.trim();
    
    // Create temporary message ID for optimistic update (outside try-catch so it's accessible in catch)
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2,8);

    try {
      // Add message to local state immediately for better UX (optimistic update)
      setTeamMessages(prev => [...prev, {
        id: tempId,
        from: user.name,
        to: selectedRecipient,
        text: messageText,
        timestamp: new Date(),
        isMe: true,
        isPrivate: true,
        isPending: true // Mark as pending
      }]);
      
      // Send private message
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('privateMessage', {
          to: selectedRecipient,
          text: messageText
        });
      } else {
        throw new Error('Socket not connected');
      }
      
      // Clear input immediately
      setChatMessage('');
      handleTeamTyping(false);
      
      // Note: Success notification will come when server confirms via socket
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the pending message on error
      setTeamMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleTeamTyping = (typing) => {
    if (!teamData?.team?._id || !socketRef.current || !socketRef.current.connected || !selectedRecipient) return;

    try {
      socketRef.current.emit('typing', {
        to: selectedRecipient,
        typing
      });
    } catch (error) {
      console.error('Error emitting typing event:', error);
    }
  };

  const handleTeamMessageKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTeamMessage();
    }
  };

  const handleRefresh = () => {
    fetchMySales();
    fetchTeamData();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        💼 Team Sales Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track sales from you and your team members.
      </Typography>

      {/* Team Status */}
      {!teamData?.hasTeam && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You haven't created a team yet. Create a team to start collaborating with others and track team performance.
          </Typography>
        </Alert>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                My Sales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {teamStats?.stats?.mySales || mySales.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                My Products
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {teamStats?.stats?.myProducts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {teamData?.hasTeam && (
          <>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Team Sales
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {teamStats?.stats?.totalSales || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Team Members
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {teamStats?.stats?.activeMembers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Team Management Actions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Create Team */}
        {!teamData?.hasTeam && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Create Your Team
              </Typography>
              {showCreateTeam ? (
                <Box component="form" onSubmit={handleCreateTeam}>
                  <TextField
                    fullWidth
                    label="Team Name"
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    disabled={creatingTeam}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={creatingTeam ? <CircularProgress size={20} /> : <GroupAddIcon />}
                      disabled={creatingTeam || !teamName.trim()}
                    >
                      {creatingTeam ? 'Creating...' : 'Create Team'}
                    </Button>
                    <Button
                      onClick={() => setShowCreateTeam(false)}
                      disabled={creatingTeam}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<GroupAddIcon />}
                  onClick={() => setShowCreateTeam(true)}
                  fullWidth
                >
                  Create Team
                </Button>
              )}
            </Paper>
          </Grid>
        )}

        {/* Add Team Member */}
        {teamData?.hasTeam && teamData?.isOwner && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add Team Member
              </Typography>
              {showAddMember ? (
                <Box component="form" onSubmit={handleAddTeamMember}>
                  <TextField
                    fullWidth
                    label="Member Name"
                    placeholder="Enter member name"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                    disabled={addingMember}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Member Email"
                    placeholder="Enter member email"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    disabled={addingMember}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={addingMember ? <CircularProgress size={20} /> : <PersonAddIcon />}
                      disabled={addingMember || !memberName.trim() || !memberEmail.trim()}
                    >
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </Button>
                    <Button
                      onClick={() => setShowAddMember(false)}
                      disabled={addingMember}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setShowAddMember(true)}
                  fullWidth
                >
                  Add Team Member
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Sale Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add Sale
        </Typography>
        <Box component="form" onSubmit={handleAddSale}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Customer Name"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={adding}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              label="Sale Amount"
              placeholder="0.00"
              type="number"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              required
              disabled={adding}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={adding ? <CircularProgress size={20} /> : <AddIcon />}
              disabled={adding || !customerName.trim() || !saleAmount}
              sx={{ minWidth: 150, height: '56px' }}
            >
              {adding ? 'Adding...' : 'Add Sale'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Team Tabs */}
      {teamData?.hasTeam && (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 48,
                }
              }}
            >
              <Tab
                label="Team Overview"
                icon={<GroupsIcon />}
                iconPosition="start"
              />
              <Tab
                label="Team Chat"
                icon={<ChatIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* My Sales Table */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">My Sales</Typography>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>

            {loading && mySales.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : mySales.length === 0 ? (
              <Alert severity="info">No sales entries yet.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mySales.map((sale, index) => (
                      <TableRow key={sale._id || sale.id || index}>
                        <TableCell>{sale.customerName || sale.customer || '-'}</TableCell>
                        <TableCell>${parseFloat(sale.amount || sale.totalAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {sale.date
                            ? moment(sale.date).format('MMM DD, YYYY')
                            : sale.createdAt
                            ? moment(sale.createdAt).format('MMM DD, YYYY')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

        {/* Team Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 48,
              }
            }}
          >
            <Tab
              label="Team Overview"
              icon={<GroupsIcon />}
              iconPosition="start"
            />
            <Tab
              label="Team Chat"
              icon={<ChatIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Content */}
          {activeTab === 0 && (
            /* Team Overview Tab */
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {teamData.team.teamName} - Team Members
              </Typography>

              {teamData.team.members.length === 0 ? (
                <Alert severity="info">No team members yet.</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'rgba(42, 42, 42, 0.5)' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Sales</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Products</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Status</TableCell>
                        {teamData.isOwner && (
                          <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Actions</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamData.team.members.map((member, index) => (
                        <TableRow
                          key={member._id || index}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(212, 175, 55, 0.05)',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            {member.name}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={member.role}
                              size="small"
                              color={member.role === 'manager' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'var(--accent)' }}>
                            {member.salesCount || 0}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'var(--accent)' }}>
                            {member.productsCount || 0}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={member.status}
                              size="small"
                              color={member.status === 'active' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          {teamData.isOwner && member.role !== 'manager' && (
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveTeamMember(member._id)}
                                title="Remove member"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            /* Team Chat Tab */
            <Box sx={{ height: '500px', display: 'flex' }}>
              {/* Online Team Members Sidebar */}
              <Box sx={{ width: 250, borderRight: 1, borderColor: 'divider', p: 2, overflow: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Team Members ({teamData?.team?.members?.length || 0})
                </Typography>
                {teamData?.team?.members && teamData.team.members.length > 0 ? (
                  <List>
                    {teamData.team.members
                      .filter(member => member.name && member.name !== user?.name)
                      .map((member) => (
                        <ListItem 
                          key={member._id || member.name}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: selectedRecipient === member.name ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            borderRadius: 1,
                            mb: 0.5,
                            '&:hover': {
                              bgcolor: 'rgba(212, 175, 55, 0.05)'
                            }
                          }}
                          onClick={() => setSelectedRecipient(member.name)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'var(--accent)' }}>
                              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.name || 'Unknown'}
                            secondary={
                              onlineTeamMembers.includes(member.name) ? (
                                <Chip
                                  label="Online"
                                  size="small"
                                  color="success"
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Offline
                                </Typography>
                              )
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No team members found
                  </Alert>
                )}
              </Box>

              {/* Chat Area */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatIcon fontSize="small" />
                      Direct Messages
                    </Typography>
                    <Chip
                      label={socketConnected ? 'Connected' : 'Disconnected'}
                      size="small"
                      color={socketConnected ? 'success' : 'error'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  {selectedRecipient && (
                    <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(212, 175, 55, 0.1)', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatIcon fontSize="small" />
                        Conversation with: <strong>{selectedRecipient}</strong>
                        {onlineTeamMembers.includes(selectedRecipient) && (
                          <Chip
                            label="Online"
                            size="small"
                            color="success"
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Messages */}
                <Box 
                  id="messages-container"
                  sx={{ flex: 1, overflow: 'auto', p: 2 }}
                >
                  {(() => {
                    // Filter messages - show only private messages with selected recipient
                    const filteredMessages = teamMessages.filter((msg) => {
                      if (!msg.isPrivate) return false;
                      
                      // If a recipient is selected, show only messages with that recipient
                      if (selectedRecipient) {
                        return (msg.isMe && msg.to === selectedRecipient) || 
                               (!msg.isMe && msg.from === selectedRecipient && msg.to === user.name);
                      }
                      // Otherwise show all private messages where user is involved
                      return msg.isMe || (msg.to === user.name && msg.from !== user.name);
                    });

                    if (filteredMessages.length === 0) {
                      return (
                        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                          <Typography variant="body2">
                            {selectedRecipient 
                              ? `No messages with ${selectedRecipient} yet. Start the conversation!`
                              : 'Select a team member to start a conversation.'}
                          </Typography>
                        </Box>
                      );
                    }

                    return filteredMessages.map((msg) => {
                      // Get member info for avatar
                      const memberInfo = teamData?.team?.members?.find(m => m.name === msg.from);
                      
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            mb: 2,
                            alignItems: 'flex-end',
                            flexDirection: msg.isMe ? 'row-reverse' : 'row',
                            gap: 1,
                          }}
                        >
                          {/* Avatar */}
                          {!msg.isSystem && !msg.isMe && (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: 'var(--accent)',
                                fontSize: '0.875rem'
                              }}
                            >
                              {msg.from ? msg.from.charAt(0).toUpperCase() : '?'}
                            </Avatar>
                          )}
                          
                          {/* Message Bubble */}
                          <Box
                            sx={{
                              maxWidth: '70%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: msg.isMe ? 'flex-end' : 'flex-start',
                            }}
                          >
                            {/* Sender Name - Always visible */}
                            {!msg.isSystem && !msg.isMe && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  mb: 0.5,
                                  fontWeight: 600,
                                  color: 'text.secondary',
                                  px: 1
                                }}
                              >
                                {msg.from}
                              </Typography>
                            )}
                            
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: msg.isSystem
                                  ? 'rgba(212, 175, 55, 0.1)'
                                  : msg.isMe
                                  ? 'var(--accent)'
                                  : 'var(--bg-tertiary)',
                                color: msg.isMe ? 'white' : 'var(--text-primary)',
                                boxShadow: 1,
                                border: msg.isPrivate ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
                              }}
                            >
                              {msg.isSystem ? (
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  {msg.text}
                                </Typography>
                              ) : (
                                <>
                                  {msg.isPrivate && (
                                    <Box sx={{ mb: 0.5 }}>
                                      <Chip
                                        label={msg.isMe ? `To: ${msg.to}` : 'Private Message'}
                                        size="small"
                                        sx={{ 
                                          height: 18, 
                                          fontSize: '0.65rem',
                                          backgroundColor: msg.isMe 
                                            ? 'rgba(255, 255, 255, 0.2)' 
                                            : 'rgba(212, 175, 55, 0.2)',
                                          color: msg.isMe ? 'white' : 'var(--text-primary)'
                                        }}
                                      />
                                    </Box>
                                  )}
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {msg.text}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      opacity: 0.7, 
                                      mt: 0.5, 
                                      display: 'block',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Box>
                          
                          {/* Avatar for my messages */}
                          {!msg.isSystem && msg.isMe && (
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: 'var(--accent)',
                                fontSize: '0.875rem'
                              }}
                            >
                              {user.name ? user.name.charAt(0).toUpperCase() : 'You'}
                            </Avatar>
                          )}
                        </Box>
                      );
                    });
                  })()}
                  {isTyping && (
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {typingUser} is typing...
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  {/* Sender Info */}
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'var(--accent)', fontSize: '0.75rem' }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'You'}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      Sending as: <strong>{user.name}</strong>
                    </Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 1 }} size="small" required>
                    <InputLabel id="recipient-select-label">Select Team Member to Message</InputLabel>
                    <Select
                      labelId="recipient-select-label"
                      value={selectedRecipient}
                      label="Select Team Member to Message"
                      onChange={(e) => {
                        setSelectedRecipient(e.target.value);
                        setChatMessage(''); // Clear message when changing recipient
                      }}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <em>Choose a team member...</em>
                      </MenuItem>
                      {teamData?.team?.members && teamData.team.members.length > 0 ? (
                        teamData.team.members
                          .filter(member => member.name && member.name !== user?.name)
                          .map((member) => (
                            <MenuItem key={member._id || member.name} value={member.name}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Avatar sx={{ width: 24, height: 24, bgcolor: 'var(--accent)', fontSize: '0.75rem' }}>
                                  {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                </Avatar>
                                <Typography variant="body2">{member.name || 'Unknown'}</Typography>
                                {onlineTeamMembers.includes(member.name) && (
                                  <Chip
                                    label="Online"
                                    size="small"
                                    color="success"
                                    sx={{ ml: 'auto', height: 18, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                          ))
                      ) : (
                        <MenuItem value="" disabled>
                          <Typography variant="body2" color="text.secondary">
                            No team members available
                          </Typography>
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder={
                        selectedRecipient
                          ? `Type your message to ${selectedRecipient}...`
                          : 'First select a team member above, then type your message here...'
                      }
                      value={chatMessage}
                      onChange={(e) => {
                        setChatMessage(e.target.value);
                        if (selectedRecipient) {
                          handleTeamTyping(e.target.value.length > 0);
                        }
                      }}
                      onKeyPress={handleTeamMessageKeyPress}
                      onBlur={() => handleTeamTyping(false)}
                      size="small"
                      disabled={!selectedRecipient || !socketConnected}
                      helperText={
                        !socketConnected
                          ? 'Waiting for connection...'
                          : !selectedRecipient
                          ? '⚠️ Please select a team member above first'
                          : `✓ Ready to send message to ${selectedRecipient}`
                      }
                      error={!selectedRecipient}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendTeamMessage}
                      disabled={!chatMessage.trim() || !selectedRecipient || !socketConnected}
                      sx={{
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        minWidth: 48,
                        height: 48,
                        '&:hover': {
                          backgroundColor: '#0F8C6A',
                        },
                        '&:disabled': {
                          backgroundColor: 'grey.300',
                          color: 'grey.500',
                        },
                      }}
                      title={!selectedRecipient ? 'Select a team member first' : !socketConnected ? 'Not connected' : 'Send message'}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
        </>
      )}

    </Box>
  );
}


