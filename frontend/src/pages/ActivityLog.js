import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Message as MessageIcon,
  ShoppingCart as CartIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SAMPLE_ACTIVITIES = [
  {
    id: 1,
    user: 'John Doe',
    action: 'Login',
    description: 'User logged into the system',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    type: 'auth',
    ip: '192.168.1.100',
    device: 'Chrome on Windows',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'Sent Message',
    description: 'Sent WhatsApp message to customer',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    type: 'communication',
    recipient: '+1234567890',
  },
  {
    id: 3,
    user: 'Admin',
    action: 'Added Product',
    description: 'Added new product: Wireless Headphones',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'inventory',
    productId: 'PROD-001',
  },
  {
    id: 4,
    user: 'Mike Johnson',
    action: 'Created Sale',
    description: 'Created sale worth ₹2,500',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    type: 'sales',
    amount: 2500,
  },
  {
    id: 5,
    user: 'John Doe',
    action: 'Updated Profile',
    description: 'Updated profile information',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    type: 'profile',
  },
  {
    id: 6,
    user: 'Sarah Wilson',
    action: 'Generated Report',
    description: 'Generated monthly sales report',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    type: 'reports',
  },
  {
    id: 7,
    user: 'John Doe',
    action: 'Logout',
    description: 'User logged out of the system',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    type: 'auth',
  },
];

export default function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/activity-log`);
      setActivities(response.data.activities);
    } catch (error) {
      console.error('Fetch activities error:', error);
      // Fallback to sample data if API fails
      toast.warning('Using sample data. Backend may not be available.');
      setActivities(SAMPLE_ACTIVITIES);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user':
        return <LoginIcon />;
      case 'message':
        return <MessageIcon />;
      case 'product':
        return <CartIcon />;
      case 'sale':
        return <CartIcon />;
      case 'profile':
        return <EditIcon />;
      case 'report':
        return <ReportIcon />;
      case 'notification':
        return <MessageIcon />;
      case 'dashboard':
        return <AssessmentIcon />;
      default:
        return <AssessmentIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user':
        return '#10B981';
      case 'message':
        return '#2563EB';
      case 'product':
        return '#F59E0B';
      case 'sale':
        return '#10B981';
      case 'profile':
        return '#8B5CF6';
      case 'report':
        return '#EF4444';
      case 'notification':
        return '#F97316';
      case 'dashboard':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const isRealData = activity.hasOwnProperty('action') && activity.hasOwnProperty('resource');
    const displayUser = isRealData ? (activity.user?.name || activity.userName) : activity.user;
    const displayAction = isRealData ? activity.action : activity.action;
    const displayResource = isRealData ? activity.resource : activity.type;

    const matchesSearch = displayUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         displayAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || displayResource === filterType;

    return matchesSearch && matchesFilter;
  });

  const activityStats = activities.length > 0 && activities[0].hasOwnProperty('action')
    ? {
        total: activities.length,
        today: activities.filter(a => moment(a.timestamp).isSame(moment(), 'day')).length,
        thisWeek: activities.filter(a => moment(a.timestamp).isSame(moment(), 'week')).length,
        auth: activities.filter(a => a.action === 'login' || a.action === 'logout').length,
        communication: activities.filter(a => a.resource === 'message').length,
        sales: activities.filter(a => a.resource === 'sale').length,
      }
    : {
        total: activities.length,
        today: activities.filter(a => moment(a.timestamp).isSame(moment(), 'day')).length,
        thisWeek: activities.filter(a => moment(a.timestamp).isSame(moment(), 'week')).length,
        auth: activities.filter(a => a.type === 'auth').length,
        communication: activities.filter(a => a.type === 'communication').length,
        sales: activities.filter(a => a.type === 'sales').length,
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        📋 User Activity Log
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'var(--text-secondary)' }}>
        Track and monitor all user activities and system events
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #F2C6DE 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
          }}>
            <CardContent>
              <Typography sx={{ color: '#5A3E36', opacity: 0.8 }} gutterBottom>
                Total Activities
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#5A3E36' }}>
                {activityStats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #F2C6DE 0%, #D4AF37 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 25px rgba(242, 198, 222, 0.3)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
          }}>
            <CardContent>
              <Typography sx={{ color: '#5A3E36', opacity: 0.8 }} gutterBottom>
                Today's Activities
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#5A3E36' }}>
                {activityStats.today}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #5A3E36 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
          }}>
            <CardContent>
              <Typography sx={{ color: '#FAF7F2', opacity: 0.8 }} gutterBottom>
                This Week
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FAF7F2' }}>
                {activityStats.thisWeek}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #5A3E36 0%, #D4AF37 100%)',
            color: 'var(--text-primary)',
            boxShadow: '0 8px 25px rgba(90, 62, 54, 0.3)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
          }}>
            <CardContent>
              <Typography sx={{ color: '#FAF7F2', opacity: 0.8 }} gutterBottom>
                Auth Activities
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FAF7F2' }}>
                {activityStats.auth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'rgba(250, 247, 242, 0.9)',
        border: '2px solid rgba(212, 175, 55, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'user', label: 'Users' },
                { value: 'product', label: 'Products' },
                { value: 'sale', label: 'Sales' },
                { value: 'message', label: 'Messages' },
                { value: 'report', label: 'Reports' },
              ].map((filter) => (
                <Chip
                  key={filter.value}
                  label={filter.label}
                  onClick={() => setFilterType(filter.value)}
                  variant={filterType === filter.value ? 'filled' : 'outlined'}
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchActivities}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Activity Table */}
      <Paper sx={{
        p: 3,
        background: 'rgba(250, 247, 242, 0.9)',
        border: '2px solid rgba(212, 175, 55, 0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
      }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent Activities
            </Typography>

        {filteredActivities.length === 0 ? (
          <Alert severity="info">No activities found matching your criteria.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.map((activity) => {
                  const isRealData = activity.hasOwnProperty('action') && activity.hasOwnProperty('resource');
                  const displayUser = isRealData ? (activity.user?.name || activity.userName) : activity.user;
                  const displayAction = isRealData ? activity.action : activity.action;
                  const displayResource = isRealData ? activity.resource : activity.type;
                  const displayType = isRealData ? activity.resource : activity.type;

                  return (
                    <TableRow key={activity._id || activity.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {displayUser.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {displayUser}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {displayAction.charAt(0).toUpperCase() + displayAction.slice(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {displayResource.charAt(0).toUpperCase() + displayResource.slice(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {activity.description}
                        </Typography>
                        {activity.details?.amount && (
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            ₹{activity.details.amount.toLocaleString()}
                          </Typography>
                        )}
                        {activity.ipAddress && (
                          <Typography variant="caption" color="text.secondary">
                            IP: {activity.ipAddress}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {moment(activity.timestamp).fromNow()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(activity.timestamp).format('MMM DD, YYYY HH:mm')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

