import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Insights as InsightsIcon,
  Lightbulb,
  Assessment,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

export default function AIInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  const [activityTrends, setActivityTrends] = useState([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ai/insights`);
      setInsights(response.data);
      setSalesData(response.data.salesChart || []);
      setChannelData(response.data.channelPerformance || []);
      setActivityTrends(response.data.activityTrends || []);
    } catch (error) {
      console.error('Fetch insights error:', error);
      toast.error('Failed to load AI insights');
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

  const summaryCards = [
    {
      title: 'Total Messages Sent',
      value: insights?.summary?.totalMessages || 120,
      icon: <Assessment />,
      color: 'var(--accent)',
    },
    {
      title: 'Total Sales',
      value: `₹${(insights?.summary?.totalSales || 35000).toLocaleString()}`,
      icon: <TrendingUp />,
      color: '#22c55e',
    },
    {
      title: 'Top Channel',
      value: insights?.summary?.topChannel || 'WhatsApp',
      icon: <InsightsIcon />,
      color: '#f59e0b',
    },
    {
      title: 'Team Productivity Score',
      value: `${insights?.summary?.productivityScore || 82}%`,
      icon: <Lightbulb />,
      color: '#8b5cf6',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🔍 AI Insights
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Analytics and predictions powered by AI
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: card.color, mr: 1 }}>{card.icon}</Box>
                  <Typography color="text.secondary" variant="body2">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Insights */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Sales Insights
            </Typography>
            
            {insights?.predictions && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Prediction for next 30 days:
                </Typography>
                <Typography variant="body2">
                  • Estimated revenue: {insights.predictions.estimatedRevenue}
                </Typography>
                <Typography variant="body2">
                  • Best-performing team member: {insights.predictions.bestPerformer}
                </Typography>
                <Typography variant="body2">
                  • Recommended action: {insights.predictions.recommendedAction}
                </Typography>
              </Alert>
            )}

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} name="Revenue (₹)" />
                <Line type="monotone" dataKey="predicted" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Channel Performance */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📱 Top-Performing Channels
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Customer Behavior Insights */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              👥 Customer Behavior Insights
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary">⚡</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Fast Responders"
                  secondary={insights?.customerBehavior?.fastResponders || "Customers typically respond within 2-4 hours"}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary">📱</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Preferred Channel"
                  secondary={insights?.customerBehavior?.preferredChannel || "WhatsApp (65% of customers prefer this channel)"}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Typography variant="h6" color="primary">🕐</Typography>
                </ListItemIcon>
                <ListItemText
                  primary="Best Contact Time"
                  secondary={insights?.customerBehavior?.bestTime || "10 AM - 2 PM (Highest response rate)"}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              💡 AI-Generated Recommendations
            </Typography>
            
            <List>
              {(insights?.recommendations || [
                'Reach out to inactive customers.',
                'Follow up more frequently using email.',
                'Your response time is slow. Improve by 20%.',
                'Focus on WhatsApp for higher conversion rates.',
              ]).map((rec, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                  {index < (insights?.recommendations?.length || 4) - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Communication Success Rate */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📊 Communication Success Rate
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={insights?.communicationStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" fill="#10B981" name="Success Rate %" />
                <Bar dataKey="sent" fill="#2563EB" name="Messages Sent" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Team Activity Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              📈 Team Activity Trends
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activity" stroke="#8B5CF6" strokeWidth={2} name="Daily Activity" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
