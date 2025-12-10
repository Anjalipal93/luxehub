import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Message as MessageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Sales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [saleItems, setSaleItems] = useState([{ product: '', quantity: 1, price: 0 }]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [filters.startDate, filters.endDate]);

  const fetchSales = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await axios.get(`${API_URL}/sales`, { params });
      setSales(response.data);
    } catch (error) {
      console.error('Fetch sales error:', error);
      toast.error('Failed to load sales');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      const uniqueCategories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/sales/stats/revenue?period=month`);
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleAddItem = () => {
    setSaleItems([...saleItems, { product: '', quantity: 1, price: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...saleItems];
    updated[index][field] = value;

    if (field === 'product') {
      const product = products.find((p) => p._id === value);
      if (product) {
        updated[index].price = product.price;
      }
    }

    setSaleItems(updated);
  };

  const handleRemoveItem = (index) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const items = saleItems
        .filter((item) => item.product)
        .map((item) => ({
          product: item.product,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
        }));

      if (items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      await axios.post(`${API_URL}/sales`, {
        items,
        ...formData,
      });

      toast.success('Sale recorded successfully');
      fetchSales();
      fetchStats();
      handleClose();
    } catch (error) {
      console.error('Create sale error:', error);
      toast.error(error.response?.data?.message || 'Failed to record sale');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSaleItems([{ product: '', quantity: 1, price: 0 }]);
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      paymentMethod: 'cash',
      notes: '',
    });
  };

  const totalAmount = saleItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const filteredSales = sales.filter((sale) => {
    if (filters.category === 'all') return true;
    return sale.items?.some((it) => it.product?.category === filters.category);
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          💰 Sales
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: 'var(--text-primary)',
            '&:hover': {
              background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 20px rgba(34, 197, 94, 0.3)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          ➕ New Sale
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <MenuItem value="all">All</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h5">
                  ${stats.totalRevenue?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h5">{stats.totalSales || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Sale
                </Typography>
                <Typography variant="h5">
                  ${stats.averageSale?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale._id}>
                <TableCell>
                  {moment(sale.createdAt).format('MMM DD, YYYY HH:mm')}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {sale.customerName || 'Walk-in'}
                    {(sale.customerEmail || sale.customerPhone) && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigate('/customer-messages', {
                            state: {
                              customer: {
                                name: sale.customerName,
                                email: sale.customerEmail,
                                phone: sale.customerPhone,
                              },
                            },
                          });
                        }}
                        title="Message customer"
                      >
                        <MessageIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{sale.items.length}</TableCell>
                <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip label={sale.paymentMethod} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={sale.status}
                    color={sale.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>New Sale</DialogTitle>
          <DialogContent>
            {saleItems.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      select
                      label="Product"
                      value={item.product}
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                      required
                    >
                      {products.map((product) => (
                        <MenuItem key={product._id} value={product._id}>
                          {product.name} (Stock: {product.quantity})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', e.target.value)
                      }
                      required
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Price"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(index, 'price', e.target.value)
                      }
                      required
                      inputProps={{ step: 0.01, min: 0 }}
                    />
                  </Grid>
                  {saleItems.length > 1 && (
                    <Grid item xs={12}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remove Item
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
            <Button onClick={handleAddItem} sx={{ mb: 2 }}>
              Add Item
            </Button>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Total: ${totalAmount.toFixed(2)}
            </Typography>
            <TextField
              margin="normal"
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
            />
            <TextField
              margin="normal"
              fullWidth
              label="Customer Email"
              name="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
            />
            <TextField
              margin="normal"
              fullWidth
              label="Customer Phone"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={(e) =>
                setFormData({ ...formData, customerPhone: e.target.value })
              }
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Payment Method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              margin="normal"
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Record Sale
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

