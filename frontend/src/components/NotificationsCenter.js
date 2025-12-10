import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function NotificationsCenter() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      fetchNotifications();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return <WarningIcon sx={{ color: '#ef4444' }} />;
      case 'sale':
        return <TrendingIcon sx={{ color: '#22c55e' }} />;
      case 'forecast':
        return <InfoIcon sx={{ color: 'var(--accent)' }} />;
      default:
        return <InfoIcon sx={{ color: '#2563EB' }} />;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'var(--text-primary)',
          position: 'relative',
          '&:hover': {
            bgcolor: 'rgba(56, 189, 248, 0.1)',
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              animation: unreadCount > 0 ? 'bounce 1s infinite' : 'none',
              '@keyframes bounce': {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-4px)' },
              },
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1,
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(241, 245, 249, 0.1)',
            borderRadius: '12px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{
                  color: 'var(--accent)',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                }}
              >
                Mark all read
              </Button>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(241, 245, 249, 0.1)', mb: 1 }} />

          <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                      No notifications
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <ListItem
                  key={notification._id}
                  onClick={() => markAsRead(notification._id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: notification.isRead ? 'transparent' : 'rgba(37, 99, 235, 0.1)',
                    borderRadius: '8px',
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'rgba(56, 189, 248, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: notification.isRead ? 400 : 600 }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                          {moment(notification.createdAt).fromNow()}
                        </Typography>
                      </Box>
                    }
                  />
                  {!notification.isRead && (
                    <Chip
                      size="small"
                      sx={{
                        bgcolor: 'var(--accent)',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        minWidth: 8,
                        p: 0,
                      }}
                    />
                  )}
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Popover>
    </>
  );
}

