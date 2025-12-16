import React, { useEffect, useState } from 'react';
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
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

export default function MonthlySalesForecastChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/ai/forecast/sales/monthly`);
      const merged = [
        ...res.data.history.map((x) => ({
          name: x.label,
          revenue: x.revenue,
          count: x.count,
          type: 'Actual',
        })),
        ...res.data.forecast.map((x) => ({
          name: x.label,
          revenue: x.revenue,
          count: x.count,
          type: 'Forecast',
        })),
      ];
      setData(merged);
    } catch (e) {
      console.error('Error fetching monthly forecast', e);
      toast.error('Failed to load monthly sales forecast');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return <Alert severity="info">No monthly sales data available.</Alert>;
  }

  return (
    <Box>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563EB"
            strokeWidth={3}
            name="Revenue ($)"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#10B981"
            strokeWidth={3}
            name="Sales Count"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Solid lines indicate actuals; last points represent forecasted values.
      </Typography>
    </Box>
  );
}


