import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  PointOfSale as SalesIcon,
  Psychology as AIIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  PersonAdd as PersonAddIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  Insights as InsightsIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  QrCode as QrCodeIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationsCenter from './NotificationsCenter';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', emoji: '' },
  { text: 'Products', icon: <InventoryIcon />, path: '/products', emoji: '' },
  { text: 'Sales', icon: <SalesIcon />, path: '/sales', emoji: '' },
  { text: 'Team Sales', icon: <GroupsIcon />, path: '/team-sales', emoji: '' },
  { text: 'Messages', icon: <MessageIcon />, path: '/messages', emoji: '' },
  { text: 'AI Forecast', icon: <AIIcon />, path: '/ai-forecast', emoji: '' },
  { text: 'AI Insights', icon: <InsightsIcon />, path: '/ai-insights', emoji: '' },
  { text: 'Chatbot', icon: <ChatIcon />, path: '/communication', emoji: '' },
  { text: 'Email', icon: <EmailIcon />, path: '/email', emoji: '' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users', emoji: '' },
  { text: 'Invite Collaborators', icon: <PersonAddIcon />, path: '/invite-collaborators', emoji: '' },
  { text: 'Team Performance', icon: <TrendingUpIcon />, path: '/team-performance', emoji: '' },
  { text: 'Activity Log', icon: <HistoryIcon />, path: '/activity-log', emoji: '' },
  { text: 'Talk With Big Entrepreneurs', icon: <BusinessIcon />, path: '/entrepreneurs', emoji: '' },
  { text: 'Whatsapp', icon: <MessageIcon />, path: '/chatting-messages', emoji: '' },
  { text: 'Product QR Generator', icon: <QrCodeIcon />, path: '/product-qr', emoji: '' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header with LuxeHub */}
      <Box sx={{ flexShrink: 0 }}>
      <Toolbar
        sx={{
          backgroundColor: 'var(--bg-secondary)',
          minHeight: '64px !important',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.25rem' }}>
          💎 LuxeHub
        </Typography>
      </Toolbar>
      <Divider sx={{
        borderColor: 'var(--border-color)',
        marginX: 2,
      }} />
      </Box>

      {/* Scrollable Menu Items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'transparent' }}>
        <List sx={{ bgcolor: 'transparent' }}>
          {menuItems
            .filter((item) => item.path !== '/users' || isAdmin)
            .map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    mx: 1,
                    my: 0.5,
                    borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#0F8C6A',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    '& .MuiListItemIcon-root': {
                      color: 'var(--text-primary)',
                    },
                  },
                  '&:focus': {
                    outline: 'none',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box component="span" sx={{ fontSize: '1.2rem', mr: 1 }}>
                      {item.emoji}
                    </Box>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: 'none',
          }}
        >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)' }}>
              {menuItems.find((item) => item.path === location.pathname)?.emoji || '📊'} {' '}
              {menuItems.find((item) => item.path === location.pathname)?.text ||
                'Dashboard'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsCenter />
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: 'var(--text-main)',
                bgcolor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                '&:hover': {
                  bgcolor: 'rgba(42, 42, 42, 0.5)',
                  borderColor: 'var(--accent)',
                },
                '&:focus': {
                  outline: 'none',
                  bgcolor: 'rgba(42, 42, 42, 0.7)',
                  borderColor: 'var(--accent)',
                },
                transition: 'all 0.3s ease',
              }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <Chip
              label={user?.role || 'User'}
              size="small"
              sx={{
                bgcolor: 'var(--accent)',
                color: 'white',
                fontWeight: 600,
                height: 28,
                boxShadow: '0 2px 8px rgba(16, 163, 127, 0.3)',
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--text-main)' }}>
              👋 {user?.name}
            </Typography>
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{
                '&:focus': {
                  outline: 'none',
                  boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.4)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'var(--accent)',
                  color: 'white',
                  fontWeight: 700,
                  border: '2px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(16, 163, 127, 0.3)',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 180,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 2,
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              },
            }}
          >
            <MenuItem
              onClick={() => {
                navigate('/profile');
                handleMenuClose();
              }}
              sx={{
                color: 'var(--text-main)',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(42, 42, 42, 0.5)',
                  color: 'var(--text-main)',
                },
                borderRadius: 1,
                mx: 0.5,
                my: 0.25,
              }}
            >
              <AccountIcon sx={{ mr: 1.5, color: '#D4AF37' }} />
              Profile
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(212, 175, 55, 0.3)' }} />
            <MenuItem
              onClick={handleLogout}
              sx={{
                color: '#ef4444',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                },
                borderRadius: 1,
                mx: 0.5,
                my: 0.25,
              }}
            >
              <LogoutIcon sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
              },
            }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            mt: 8,
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          width: '100%',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          py: 3,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'var(--text-secondary)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          © 2025 Anjali Solutions. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

