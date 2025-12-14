import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Divider,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import axios from 'axios';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

const Messages = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState({}); // userId -> messages[]
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({}); // userId -> username
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const response = await axios.get(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Users fetched:', response.data);
        
        // Get current user ID (handle both formats)
        const currentUserId = String(user?.id || user?._id || '');
        
        // Filter out current user
        const otherUsers = response.data.filter(u => {
          const userId = String(u._id || u.id || '');
          return userId !== currentUserId && userId !== '';
        });
        
        console.log('Other users (filtered):', otherUsers);
        setAllUsers(otherUsers);
        
        if (otherUsers.length === 0) {
          toast.info('No other users found. You need at least one other user to send messages.');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users: ' + (error.response?.data?.message || error.message));
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Socket setup
  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping socket setup');
      return;
    }

    const userId = String(user.id || user._id || '');
    const username = user.name || 'Unknown';

    if (!userId || userId === '') {
      console.log('Invalid user ID, skipping socket setup');
      return;
    }

    console.log('Setting up socket connection...', { userId, username, SOCKET_URL });

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected!', socket.id);
      socket.emit('join', {
        userId: userId,
        username: username,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat server. Please refresh the page.');
    });

    socket.on('joined', (data) => {
      console.log('Joined chat:', data);
    });

    socket.on('users', (onlineUsers) => {
      console.log('Online users received:', onlineUsers);
      // Update online status
      setAllUsers(prev => prev.map(u => {
        const userIdStr = String(u._id || u.id || '');
        const isOnline = onlineUsers.some(ou => String(ou.userId) === userIdStr);
        return {
          ...u,
          isOnline,
        };
      }));
    });

    socket.on('privateMessage', (msg) => {
      console.log('Received private message:', msg);
      const currentUserId = String(user.id || user._id);
      const msgFromId = String(msg.fromUserId || '');
      const msgToId = String(msg.toUserId || '');
      
      // Determine the other user's ID (the one we're chatting with)
      const otherUserId = msgFromId === currentUserId ? msgToId : msgFromId;
      
      console.log('Message details:', {
        currentUserId,
        msgFromId,
        msgToId,
        otherUserId,
        isMe: msgFromId === currentUserId,
      });

      setConversations(prev => {
        const existingMessages = prev[otherUserId] || [];
        // Check if message already exists (avoid duplicates)
        const messageExists = existingMessages.some(m => m.id === msg.id || (m.text === msg.text && Math.abs(new Date(m.timestamp) - new Date(msg.ts)) < 1000));
        if (messageExists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        
        return {
          ...prev,
          [otherUserId]: [
            ...existingMessages,
            {
              id: msg.id,
              text: msg.text,
              fromUserId: msgFromId,
              fromUsername: msg.fromUsername,
              timestamp: new Date(msg.ts),
              isMe: msgFromId === currentUserId,
              isPending: false,
            },
          ],
        };
      });
    });

    socket.on('typing', ({ fromUserId, fromUsername, typing }) => {
      if (fromUserId !== (user.id || user._id)) {
        setTypingUsers(prev => ({
          ...prev,
          [fromUserId]: typing ? fromUsername : null,
        }));
      }
    });

    return () => socket.disconnect();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedUser]);

  // Focus input when user is selected
  useEffect(() => {
    if (selectedUser) {
      inputRef.current?.focus();
    }
  }, [selectedUser]);

  const handleUserSelect = (selectedUserData) => {
    console.log('User selected:', selectedUserData);
    if (!selectedUserData) {
      toast.error('Invalid user selected');
      return;
    }
    
    const userId = String(selectedUserData._id || selectedUserData.id);
    console.log('Selected user ID:', userId);
    
    setSelectedUser(selectedUserData);
    setMessage('');
    
    // Clear typing indicator for this user
    setTypingUsers(prev => ({
      ...prev,
      [userId]: null,
    }));
    
    toast.success(`Chatting with ${selectedUserData.name}`);
  };

  const handleTyping = () => {
    if (!socketRef.current || !socketRef.current.connected || !selectedUser) return;

    try {
      socketRef.current.emit('typing', {
        toUserId: selectedUser._id || selectedUser.id,
        typing: true,
      });

      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('typing', {
            toUserId: selectedUser._id || selectedUser.id,
            typing: false,
          });
        }
      }, 1000);
    } catch (error) {
      console.error('Error emitting typing event:', error);
    }
  };

  const sendMessage = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedUser) {
      toast.error('Please select a contact from the left sidebar to send a message');
      return;
    }

    if (!socketRef.current) {
      toast.error('Not connected to chat server. Please refresh the page.');
      return;
    }

    if (!socketRef.current.connected) {
      toast.error('Connecting to server... Please wait a moment and try again.');
      return;
    }

    try {
      const messageText = message.trim();
      const recipientId = String(selectedUser._id || selectedUser.id);
      const senderId = String(user.id || user._id);

      if (!recipientId || recipientId === '') {
        toast.error('Invalid recipient. Please select a contact again.');
        return;
      }

      console.log('Sending message:', { 
        recipientId, 
        senderId, 
        messageText,
        socketConnected: socketRef.current.connected,
        socketId: socketRef.current.id 
      });

      // Add message to local state immediately for instant feedback
      const tempMessageId = `temp-${Date.now()}`;
      setConversations(prev => ({
        ...prev,
        [recipientId]: [
          ...(prev[recipientId] || []),
          {
            id: tempMessageId,
            text: messageText,
            fromUserId: senderId,
            fromUsername: user.name,
            timestamp: new Date(),
            isMe: true,
            isPending: true,
          },
        ],
      }));

      // Send via socket
      socketRef.current.emit('privateMessage', {
        toUserId: recipientId,
        text: messageText,
      });

      console.log('Message emitted to socket');
      setMessage('');
      toast.success('Message sent!');
      
      // Remove pending status after message is confirmed (or timeout)
      setTimeout(() => {
        setConversations(prev => ({
          ...prev,
          [recipientId]: (prev[recipientId] || []).map(msg => 
            msg.id === tempMessageId && msg.isPending
              ? { ...msg, isPending: false }
              : msg
          ),
        }));
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const getLastMessage = (userId) => {
    const messages = conversations[userId] || [];
    if (messages.length === 0) return 'No messages yet';
    const lastMsg = messages[messages.length - 1];
    return lastMsg.text;
  };

  const getLastMessageTime = (userId) => {
    const messages = conversations[userId] || [];
    if (messages.length === 0) return null;
    const lastMsg = messages[messages.length - 1];
    return moment(lastMsg.timestamp).format('HH:mm');
  };

  const filteredUsers = allUsers.filter(u => {
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const currentMessages = selectedUser ? (conversations[selectedUser._id || selectedUser.id] || []) : [];

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Please login to use messages</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5' }}>
      {/* Left Sidebar - Contact List */}
      <Box
        sx={{
          width: '35%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          borderRight: '1px solid #e9edef',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: '#f0f2f5',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e9edef',
          }}
        >
          <Avatar sx={{ bgcolor: '#54656f', width: 40, height: 40 }}>
            {user.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, ml: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#667781' }}>
              {user.email}
            </Typography>
          </Box>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 1.5, bgcolor: '#fff' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#667781' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#f0f2f5',
                borderRadius: '20px',
                '& fieldset': { border: 'none' },
              },
            }}
          />
        </Box>

        {/* Contact List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#667781', mb: 1 }}>
                {searchQuery ? 'No users found matching your search' : allUsers.length === 0 ? 'No other users available. Register another account to start chatting!' : 'No users match your search'}
              </Typography>
              {allUsers.length === 0 && (
                <Typography variant="caption" sx={{ color: '#667781' }}>
                  You need at least one other registered user to send messages.
                </Typography>
              )}
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredUsers.map((contact) => {
              const isSelected = selectedUser?._id === contact._id || selectedUser?.id === contact.id;
              const lastMsg = getLastMessage(contact._id || contact.id);
              const lastTime = getLastMessageTime(contact._id || contact.id);

              return (
                <React.Fragment key={contact._id || contact.id}>
                  <ListItem
                    button
                    onClick={() => {
                      console.log('Contact clicked:', contact);
                      handleUserSelect(contact);
                    }}
                    sx={{
                      bgcolor: isSelected ? '#f0f2f5' : '#fff',
                      borderLeft: isSelected ? '3px solid #25d366' : '3px solid transparent',
                      '&:hover': { bgcolor: '#f5f6f6' },
                      py: 1.5,
                      px: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          contact.isOnline ? (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: '#25d366',
                                border: '2px solid #fff',
                              }}
                            />
                          ) : null
                        }
                      >
                        <Avatar
                          sx={{
                            bgcolor: contact.isOnline ? '#25d366' : '#54656f',
                            width: 49,
                            height: 49,
                          }}
                        >
                          {contact.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: isSelected ? 600 : 400,
                              color: '#111b21',
                            }}
                          >
                            {contact.name}
                          </Typography>
                          {lastTime && (
                            <Typography variant="caption" sx={{ color: '#667781' }}>
                              {lastTime}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#667781',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                            }}
                          >
                            {lastMsg}
                          </Typography>
                          {!contact.isOnline && (
                            <Chip
                              label="Offline"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.65rem',
                                bgcolor: '#e9edef',
                                color: '#667781',
                                ml: 1,
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ ml: 9 }} />
                </React.Fragment>
              );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Right Side - Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box
              sx={{
                bgcolor: '#f0f2f5',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #e9edef',
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  selectedUser.isOnline ? (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: '#25d366',
                        border: '2px solid #fff',
                      }}
                    />
                  ) : null
                }
              >
                <Avatar
                  sx={{
                    bgcolor: selectedUser.isOnline ? '#25d366' : '#54656f',
                    width: 40,
                    height: 40,
                    mr: 2,
                  }}
                >
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#111b21' }}>
                  {selectedUser.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#667781' }}>
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                bgcolor: '#efeae2',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 100 0 L 0 0 0 100\' fill=\'none\' stroke=\'%23e9edef\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
                p: 2,
              }}
            >
              {currentMessages.map((msg, index) => {
                const showAvatar = index === 0 || currentMessages[index - 1].fromUserId !== msg.fromUserId;
                const showTime =
                  index === currentMessages.length - 1 ||
                  moment(msg.timestamp).diff(moment(currentMessages[index + 1].timestamp), 'minutes') > 5;

                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
                      mb: 0.5,
                      px: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '65%',
                        display: 'flex',
                        flexDirection: msg.isMe ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 1,
                      }}
                    >
                      {!msg.isMe && showAvatar && (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: '#54656f',
                            fontSize: '0.875rem',
                          }}
                        >
                          {msg.fromUsername?.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      <Box
                        sx={{
                          bgcolor: msg.isMe ? '#d9fdd3' : '#fff',
                          borderRadius: '7.5px',
                          p: 1.5,
                          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                          position: 'relative',
                          opacity: msg.isPending ? 0.7 : 1,
                        }}
                      >
                        {!msg.isMe && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: '#667781',
                              fontWeight: 600,
                              mb: 0.5,
                              fontSize: '0.75rem',
                            }}
                          >
                            {msg.fromUsername}
                          </Typography>
                        )}
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#111b21',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.text}
                        </Typography>
                        {showTime && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              mt: 0.5,
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#667781',
                                fontSize: '0.6875rem',
                              }}
                            >
                              {moment(msg.timestamp).format('HH:mm')}
                            </Typography>
                            {msg.isMe && (
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: '4px solid #667781',
                                    borderTop: '3px solid transparent',
                                    borderBottom: '3px solid transparent',
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
              {typingUsers[selectedUser._id || selectedUser.id] && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1, mb: 0.5 }}>
                  <Box
                    sx={{
                      bgcolor: '#fff',
                      borderRadius: '7.5px',
                      p: 1.5,
                      boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#667781',
                            animation: 'typing 1.4s infinite',
                            animationDelay: `${i * 0.2}s`,
                            '@keyframes typing': {
                              '0%, 60%, 100%': { transform: 'translateY(0)' },
                              '30%': { transform: 'translateY(-10px)' },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                bgcolor: '#f0f2f5',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderTop: '1px solid #e9edef',
              }}
            >
              <IconButton>
                <EmojiIcon sx={{ color: '#54656f' }} />
              </IconButton>
              <IconButton>
                <AttachFileIcon sx={{ color: '#54656f' }} />
              </IconButton>
              <TextField
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#fff',
                    borderRadius: '20px',
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                }}
              />
              <IconButton
                onClick={sendMessage}
                disabled={!message.trim()}
                sx={{
                  bgcolor: message.trim() ? '#25d366' : 'transparent',
                  color: message.trim() ? '#fff' : '#54656f',
                  '&:hover': {
                    bgcolor: message.trim() ? '#20ba5a' : 'transparent',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f0f2f5',
            }}
          >
            <Box
              sx={{
                width: 250,
                height: 250,
                borderRadius: '50%',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h4" sx={{ color: '#54656f' }}>
                💬
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ color: '#41525d', mb: 1 }}>
              Select a contact to start chatting
            </Typography>
            <Typography variant="body2" sx={{ color: '#667781' }}>
              Choose someone from your contact list to begin a conversation
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Messages;
