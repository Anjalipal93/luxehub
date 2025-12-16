import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  PointOfSale,
  Warning,
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
import AIForecastChart from '../components/AIForecastChart';
import MonthlySalesForecastChart from '../components/MonthlySalesForecastChart';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [productsChart, setProductsChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, salesRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/charts/sales?period=month`),
        axios.get(`${API_URL}/dashboard/charts/products`),
      ]);

      setStats(statsRes.data);
      setSalesChart(salesRes.data);
      setProductsChart(productsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      toast.error('Failed to load dashboard data');
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

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.revenue?.total?.toFixed(2) || '0.00'}`,
      icon: <TrendingUp />,
      color: 'var(--accent)',
      textColor: '#5A3E36',
      emoji: '💵',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats?.revenue?.monthly?.toFixed(2) || '0.00'}`,
      icon: <TrendingUp />,
      color: 'var(--accent)',
      textColor: '#5A3E36',
      emoji: '📈',
    },
    {
      title: 'Total Products',
      value: stats?.products?.total || 0,
      icon: <Inventory />,
      color: 'var(--accent)',
      textColor: '#FAF7F2',
      emoji: '📦',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.products?.lowStock || 0,
      icon: <Warning />,
      color: '#ef4444',
      textColor: '#5A3E36',
      emoji: '⚠️',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
        📊 Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                backgroundColor: 'var(--bg-secondary)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(241, 245, 249, 0.1)',
                borderRadius: '15px',
                color: card.textColor || 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: card.color,
                  opacity: 0.3,
                  zIndex: -1,
                },
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  border: '1px solid rgba(241, 245, 249, 0.2)',
                  boxShadow: index === 0
                    ? '0 12px 24px rgba(37, 99, 235, 0.4)'
                    : index === 1
                    ? '0 12px 24px rgba(16, 185, 129, 0.4)'
                    : index === 2
                    ? '0 12px 24px rgba(56, 189, 248, 0.4)'
                    : '0 12px 24px rgba(244, 63, 94, 0.4)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography
                      sx={{ opacity: 0.9, mb: 0.5 }}
                      gutterBottom
                      variant="body2"
                    >
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '2rem' }}>{card.emoji}</Typography>
                    <Box sx={{ color: 'white', opacity: 0.9 }}>{card.icon}</Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(250, 247, 242, 0.9)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>
              📈 Sales Trend (Last Month)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  name="Revenue ($)" 
                  dot={{ fill: '#2563EB', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F2C6DE"
                  strokeWidth={3}
                  name="Sales Count"
                  dot={{ fill: '#F2C6DE', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(250, 247, 242, 0.9)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, color: '#5A3E36' }}>
              📊 Products by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#F2C6DE" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Forecast Chart */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(250, 247, 242, 0.9)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🤖 AI Forecast: Predicted Sales for Next Month
            </Typography>
            <AIForecastChart />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(250, 247, 242, 0.9)',
            border: '2px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📅 Monthly Sales: Actuals & Forecast
            </Typography>
            <MonthlySalesForecastChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

