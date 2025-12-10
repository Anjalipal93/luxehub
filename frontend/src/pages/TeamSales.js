import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TeamSales() {
  const { user, isAdmin } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [mySales, setMySales] = useState([]);
  const [teamSales, setTeamSales] = useState([]);
  const [teamSalesSummary, setTeamSalesSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    mySalesCount: 0,
    teamSalesCount: 0,
  });

  useEffect(() => {
    fetchMySales();
    if (isAdmin) {
      fetchTeamSalesSummary();
    }
  }, [isAdmin]);

  const fetchMySales = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/sales/my`);
      const sales = response.data.sales || response.data || [];
      setMySales(sales);

      // Calculate analytics
      const total = sales.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0);
      setAnalytics(prev => ({
        ...prev,
        totalRevenue: total,
        mySalesCount: sales.length,
      }));
    } catch (error) {
      console.error('Fetch my sales error:', error);
      toast.error('Failed to load your sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamSalesSummary = async () => {
    if (!isAdmin) return;

    try {
      const response = await axios.get(`${API_URL}/sales/team`);
      const teamData = response.data.teamSales || [];
      setTeamSalesSummary(teamData);

      // Team member count is stored in teamSalesSummary.length
    } catch (error) {
      console.error('Fetch team sales summary error:', error);
      toast.error('Failed to load team sales summary');
    }
  };

  const fetchTeamSales = async () => {
    if (!isAdmin) return;

    try {
      const response = await axios.get(`${API_URL}/sales/team`);
      const sales = response.data.sales || response.data || [];
      setTeamSales(sales);

      // Update team sales count
      setAnalytics(prev => ({
        ...prev,
        teamSalesCount: sales.length,
      }));
    } catch (error) {
      console.error('Fetch team sales error:', error);
      toast.error('Failed to load team sales');
    }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }

    if (!saleAmount || parseFloat(saleAmount) <= 0) {
      toast.error('Please enter a valid sale amount');
      return;
    }

    setAdding(true);
    try {
      const response = await axios.post(`${API_URL}/sales/add`, {
        customerName: customerName.trim(),
        amount: parseFloat(saleAmount),
      });

      if (response.data.success) {
        toast.success('Sale added successfully!');
        setCustomerName('');
        setSaleAmount('');
        // Refresh data
        fetchMySales();
        if (isAdmin) {
          fetchTeamSales();
        }
      } else {
        toast.error(response.data.message || 'Failed to add sale');
      }
    } catch (error) {
      console.error('Add sale error:', error);
      toast.error(error.response?.data?.message || 'Failed to add sale');
    } finally {
      setAdding(false);
    }
  };

  const handleRefresh = () => {
    fetchMySales();
    if (isAdmin) {
      fetchTeamSalesSummary();
    }
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        💼 Team Sales Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track sales from you and your team members.
      </Typography>

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${analytics.totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                My Sales Count
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {analytics.mySalesCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {isAdmin && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Team Members
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {teamSalesSummary.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Add Sale Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add Sale
        </Typography>
        <Box component="form" onSubmit={handleAddSale}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Customer Name"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={adding}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              label="Sale Amount"
              placeholder="0.00"
              type="number"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              required
              disabled={adding}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={adding ? <CircularProgress size={20} /> : <AddIcon />}
              disabled={adding || !customerName.trim() || !saleAmount}
              sx={{ minWidth: 150, height: '56px' }}
            >
              {adding ? 'Adding...' : 'Add Sale'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* My Sales Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">My Sales</Typography>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading && mySales.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : mySales.length === 0 ? (
          <Alert severity="info">No sales entries yet.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mySales.map((sale, index) => (
                  <TableRow key={sale._id || sale.id || index}>
                    <TableCell>{sale.customerName || sale.customer || '-'}</TableCell>
                    <TableCell>${parseFloat(sale.amount || sale.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {sale.date
                        ? moment(sale.date).format('MMM DD, YYYY')
                        : sale.createdAt
                        ? moment(sale.createdAt).format('MMM DD, YYYY')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Team Sales Summary Table (Admin Only) */}
      {isAdmin && (
        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Team Sales Summary</Typography>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh Sales
            </Button>
          </Box>

          {loading && teamSalesSummary.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : teamSalesSummary.length === 0 ? (
            <Alert severity="info">No team sales data available.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(42, 42, 42, 0.5)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Team Member Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Total Sales Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamSalesSummary.map((member, index) => (
                    <TableRow
                      key={member.userId || index}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(212, 175, 55, 0.05)',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>
                        {member.userName || 'Unknown'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--accent)' }}>
                        ${member.totalSales.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(member)}
                          sx={{
                            borderColor: 'var(--accent)',
                            color: 'var(--accent)',
                            '&:hover': {
                              borderColor: 'var(--accent)',
                              backgroundColor: 'rgba(16, 163, 127, 0.1)',
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Sales Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            fontWeight: 700,
            position: 'relative',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {selectedMember?.userName}'s Sales Details
          <IconButton
            onClick={handleCloseDetailsModal}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'var(--text-primary)',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedMember && (
            <Box>
              <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(42, 42, 42, 0.5)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: 'var(--accent)', mb: 1 }}>
                  Total Sales: ${selectedMember.totalSales.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-main)' }}>
                  Number of Sales: {selectedMember.sales.length}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-main)', fontWeight: 600 }}>
                Individual Sales
              </Typography>

              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(42, 42, 42, 0.5)' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedMember.sales.map((sale, index) => (
                      <TableRow key={sale._id || index}>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--accent)' }}>
                          ${parseFloat(sale.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{sale.customerName || 'N/A'}</TableCell>
                        <TableCell>
                          {sale.date ? moment(sale.date).format('MMM DD, YYYY') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCloseDetailsModal}
            variant="contained"
          sx={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#0F8C6A',
            },
          }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

