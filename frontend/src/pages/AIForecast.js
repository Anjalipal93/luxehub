import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp,
  Inventory,
  Lightbulb,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL ;

export default function AIForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts();
    fetchSuggestions();
  }, []);

  const fetchForecasts = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/forecast/sales`);
      setForecasts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch forecasts error:', error);
      toast.error('Failed to load forecasts');
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/ai/suggestions`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Fetch suggestions error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🤖 AI Forecasting & Analytics
      </Typography>

      {suggestions.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Suggestions
          </Typography>
          <List>
            {suggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={suggestion.message}
                  secondary={`Priority: ${suggestion.priority}`}
                />
                <Chip
                  label={suggestion.type}
                  color={suggestion.priority === 'high' ? 'error' : 'default'}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      <Grid container spacing={3}>
        {forecasts.map((forecast) => (
          <Grid item xs={12} md={6} lg={4} key={forecast.productId}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {forecast.productName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {forecast.category}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Stock
                      </Typography>
                      <Typography variant="h6">
                        {forecast.currentStock}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Forecasted Sales
                      </Typography>
                      <Typography variant="h6">
                        {forecast.salesForecast?.forecast || 0}
                      </Typography>
                      <Chip
                        label={forecast.salesForecast?.confidence || 'N/A'}
                        color={getConfidenceColor(forecast.salesForecast?.confidence)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {forecast.inventoryForecast && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Inventory Recommendations
                    </Typography>
                    <Typography variant="body2">
                      Recommended Stock: {forecast.inventoryForecast.recommendedStock}
                    </Typography>
                    <Typography variant="body2">
                      Reorder Quantity: {forecast.inventoryForecast.reorderQuantity}
                    </Typography>
                    <Typography variant="body2">
                      Days Until Stockout: {forecast.inventoryForecast.daysUntilStockout}
                    </Typography>
                    <Chip
                      label={`Urgency: ${forecast.inventoryForecast.urgency}`}
                      color={getUrgencyColor(forecast.inventoryForecast.urgency)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {forecasts.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No forecast data available. Add products and sales to generate forecasts.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

