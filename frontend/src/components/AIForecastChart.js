import React, { useState, useEffect } from 'react';
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
import { CircularProgress, Alert, Box } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

export default function AIForecastChart() {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecastData();
  }, []);

  const fetchForecastData = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/forecast/sales`);
      const chartData = response.data
        .filter(item => item.salesForecast && item.salesForecast.forecast > 0)
        .slice(0, 10)
        .map(item => ({
          name: item.productName,
          actual: item.currentStock,
          predicted: item.salesForecast.forecast,
          confidence: item.salesForecast.confidence,
        }));
      setForecastData(chartData);
      setLoading(false);
    } catch (error) {
      console.error('Fetch forecast error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (forecastData.length === 0) {
    return (
      <Alert severity="info">
        No forecast data available. Add products and sales to generate AI predictions.
      </Alert>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={forecastData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          angle={-45}
          textAnchor="end"
          height={100}
        />
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
          dataKey="actual"
          stroke="#10B981"
          strokeWidth={3}
          name="Current Stock"
          dot={{ fill: '#10B981', r: 5 }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="#2563EB"
          strokeWidth={3}
          strokeDasharray="5 5"
          name="AI Predicted Sales"
          dot={{ fill: '#2563EB', r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

