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
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Person,
  Star,
  Lightbulb,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TeamPerformance() {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);

  useEffect(() => {
    fetchTeamPerformance();
  }, []);

  const fetchTeamPerformance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/team-performance`);
      setTeamData(response.data);
      setLeaderboard(response.data.leaderboard || []);
      setWeeklyTrends(response.data.weeklyTrends || []);
    } catch (error) {
      console.error('Fetch team performance error:', error);
      toast.error('Failed to load team performance data');
    } finally {
      setLoading(false);
    }
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        📊 Team Performance
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track and analyze your team's performance metrics
      </Typography>

      {/* Performance Score Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Team Performance Score
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'var(--accent)' }}>
                {teamData?.performanceScore || 84}/100
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Rating value={Math.round((teamData?.performanceScore || 84) / 20)} readOnly />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Team Sales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e' }}>
                ₹{(teamData?.totalSales || 160000).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Average Conversion Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                {teamData?.avgConversionRate || 24}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Leaderboard */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🏆 Leaderboard
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Sales Generated</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Messages Sent</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Conversion Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Alert severity="info">No team data available yet.</Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard.map((member, index) => (
                      <TableRow key={member._id || member.id || index}>
                        <TableCell>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {getRankIcon(index + 1)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person color="primary" />
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {member.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#22c55e' }}>
                            ₹{parseFloat(member.sales || member.totalSales || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={member.messagesSent || member.totalMessages || 0} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${member.conversionRate || 0}%`}
                            color={member.conversionRate > 25 ? 'success' : member.conversionRate > 15 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Weekly Trends */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Weekly Sales Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} name="Sales (₹)" />
                <Line type="monotone" dataKey="messages" stroke="#10B981" strokeWidth={2} name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Individual Performance Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              👤 Individual Performance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(teamData?.individualPerformance || []).map((member, index) => (
                <Card key={member._id || member.id || index} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {member.name}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sales: ₹{parseFloat(member.sales || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Messages Sent: {member.messagesSent || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Conversion Rate: {member.conversionRate || 0}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Rating:
                      </Typography>
                      <Rating value={member.rating || 4} readOnly size="small" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* Improvement Suggestions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              💡 Improvement Suggestions
            </Typography>
            <List>
              {(teamData?.suggestions || [
                'Follow up within 24 hours to improve conversions.',
                'Use WhatsApp more — your response rate is higher there.',
                'Improve outreach quantity on Mondays.',
              ]).map((suggestion, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                  {index < (teamData?.suggestions?.length || 3) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
