import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  IconButton,
  Button,
} from '@mui/material';
import {
  Person,
  Lightbulb,
  Delete,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL ;

export default function TeamPerformance() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [hiddenUsers, setHiddenUsers] = useState([]);

  useEffect(() => {
    fetchTeamPerformance();
    // Load hidden users from localStorage
    const savedHiddenUsers = localStorage.getItem('hiddenLeaderboardUsers');
    if (savedHiddenUsers) {
      try {
        setHiddenUsers(JSON.parse(savedHiddenUsers));
      } catch (error) {
        console.error('Error parsing hidden users from localStorage:', error);
        setHiddenUsers([]);
      }
    }
  }, []);

  const fetchTeamPerformance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/team-performance`);
      setTeamData(response.data);
      setLeaderboard(response.data.leaderboard || []);
      setWeeklyTrends(response.data.weeklyTrends || []);
      setCurrentUser(response.data.currentUser || null);
    } catch (error) {
      console.error('Fetch team performance error:', error);
      toast.error('Failed to load team performance data');
    } finally {
      setLoading(false);
    }
  };

  const deleteFromLeaderboard = async (userId) => {
    if (!window.confirm('Remove this user from leaderboard?')) return;

    try {
      await axios.delete(`${API_URL}/team-performance/leaderboard/${userId}`);
      toast.success('User removed from leaderboard');
      fetchTeamPerformance();
    } catch (error) {
      console.error('Delete leaderboard error:', error);
      toast.error('Failed to remove user');
    }
  };

  const hideUserLocally = (userId) => {
    const newHiddenUsers = [...hiddenUsers, userId];
    setHiddenUsers(newHiddenUsers);
    localStorage.setItem('hiddenLeaderboardUsers', JSON.stringify(newHiddenUsers));
    toast.info('User hidden from leaderboard');
  };

  const showUserLocally = (userId) => {
    const newHiddenUsers = hiddenUsers.filter(id => id !== userId);
    setHiddenUsers(newHiddenUsers);
    localStorage.setItem('hiddenLeaderboardUsers', JSON.stringify(newHiddenUsers));
    toast.success('User shown in leaderboard');
  };

  const clearHiddenUsers = () => {
    setHiddenUsers([]);
    localStorage.removeItem('hiddenLeaderboardUsers');
    toast.success('All hidden users restored');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Filter out hidden users from leaderboard
  const filteredLeaderboard = leaderboard.filter(member => !hiddenUsers.includes(member._id));

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        📊 Team Performance
      </Typography>

      {/* SUMMARY CARDS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Team Performance Score</Typography>
              <Typography variant="h3" fontWeight={700}>
                {teamData?.performanceScore || 0}/100
              </Typography>
              <Rating value={(teamData?.performanceScore || 0) / 20} readOnly />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Team Sales</Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ₹{(teamData?.totalSales || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Avg Conversion Rate</Typography>
              <Typography variant="h4" fontWeight={700}>
                {teamData?.avgConversionRate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* LEADERBOARD */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                🏆 Leaderboard
              </Typography>
              {hiddenUsers.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearHiddenUsers}
                  startIcon={<Person />}
                >
                  Show Hidden ({hiddenUsers.length})
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Sales</TableCell>
                    <TableCell>Messages</TableCell>
                    <TableCell>Conversion</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredLeaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Alert severity="info">
                          {leaderboard.length === 0 ? 'No leaderboard data' : 'All users are hidden. Click "Show Hidden" to restore.'}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaderboard.map((member, index) => (
                      <TableRow key={member._id}>
                        <TableCell>{getRankIcon(index + 1)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" />
                            {member.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          ₹{(member.sales || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip label={member.messagesSent || 0} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${member.conversionRate || 0}%`}
                            color={member.conversionRate > 25 ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => hideUserLocally(member._id)}
                              title="Hide this user from my leaderboard"
                            >
                              <Person />
                            </IconButton>
                            {currentUser?.role === 'admin' && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteFromLeaderboard(member._id)}
                                title="Permanently remove from leaderboard"
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* WEEKLY TRENDS */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              📈 Weekly Trends
            </Typography>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="sales" stroke="#2563eb" name="Sales ₹" />
                <Line dataKey="messages" stroke="#10b981" name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* SUGGESTIONS */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              💡 Improvement Suggestions
            </Typography>

            <List>
              {(teamData?.suggestions || []).map((s, i) => (
                <React.Fragment key={i}>
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={s} />
                  </ListItem>
                  {i < teamData.suggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
