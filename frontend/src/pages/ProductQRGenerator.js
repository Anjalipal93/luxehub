import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL ;

export default function ProductQRGenerator() {
  const [formData, setFormData] = useState({
    productName: '',
    companyName: '',
    manufacturingDate: '',
    expiryDate: '',
    batchNumber: '',
  });

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const qrImageRef = useRef(null);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const validateForm = () => {
    const requiredFields = ['productName', 'companyName', 'batchNumber'];
    const missingFields = requiredFields.filter(field => !formData[field].trim());

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate dates if provided
    if (formData.manufacturingDate && formData.expiryDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);

      if (mfgDate >= expDate) {
        toast.error('Expiry date must be after manufacturing date');
        return false;
      }
    }

    return true;
  };

  const handleGenerateQR = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create URL with product data as parameters
      const baseUrl = window.location.origin;
      const scanUrl = new URL(`${baseUrl}/qr-scan-result`);

      // Add product data as URL parameters
      scanUrl.searchParams.set('productName', formData.productName.trim());
      scanUrl.searchParams.set('companyName', formData.companyName.trim());
      scanUrl.searchParams.set('batchNumber', formData.batchNumber.trim());

      if (formData.manufacturingDate) {
        scanUrl.searchParams.set('manufacturingDate', formData.manufacturingDate);
      }
      if (formData.expiryDate) {
        scanUrl.searchParams.set('expiryDate', formData.expiryDate);
      }

      // Generate QR code for the URL
      const response = await axios.post(`${API_URL}/generate-product-qr`, {
        productName: formData.productName.trim(),
        companyName: formData.companyName.trim(),
        manufacturingDate: formData.manufacturingDate || null,
        expiryDate: formData.expiryDate || null,
        batchNumber: formData.batchNumber.trim(),
        scanUrl: scanUrl.toString(), // Send the URL to backend for QR generation
      });

      if (response.data.success) {
        setQrCode(response.data.qrCodeData);
        toast.success('QR Code generated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Generate QR error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `product-qr-${formData.productName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('QR Code downloaded successfully!');
  };

  const handleReset = () => {
    setFormData({
      productName: '',
      companyName: '',
      manufacturingDate: '',
      expiryDate: '',
      batchNumber: '',
    });
    setQrCode(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'var(--text-main)' }}>
        📱 Product QR Generator
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'var(--text-muted)' }}>
        Generate QR codes for product tracking and authentication
      </Typography>

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 3,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon />
              Product Information
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Fill in the product details to generate a QR code containing all the information.
            </Alert>

            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Product Name"
                placeholder="Enter product name"
                value={formData.productName}
                onChange={handleInputChange('productName')}
                required
                fullWidth
              />

              <TextField
                label="Company Name"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                required
                fullWidth
              />

              <TextField
                label="Manufacturing Date"
                type="date"
                value={formData.manufacturingDate}
                onChange={handleInputChange('manufacturingDate')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Optional: When was this product manufactured?"
              />

              <TextField
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange('expiryDate')}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Optional: When does this product expire?"
              />

              <TextField
                label="Batch Number"
                placeholder="Enter batch/lot number"
                value={formData.batchNumber}
                onChange={handleInputChange('batchNumber')}
                required
                fullWidth
                helperText="Unique identifier for this batch of products"
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateQR}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                  fullWidth
                  size="large"
                >
                  {loading ? 'Generating...' : 'Generate QR Code'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* QR Code Display Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{
            p: 3,
            height: 'fit-content',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
          }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Generated QR Code
            </Typography>

            {!qrCode ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                }}
              >
                <QrCodeIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" align="center">
                  QR Code will appear here after generation
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Card sx={{ maxWidth: 300, mx: 'auto', mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <img
                      ref={qrImageRef}
                      src={qrCode}
                      alt="Product QR Code"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: 250,
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadQR}
                      size="small"
                    >
                      Download QR
                    </Button>
                  </CardActions>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  QR Code contains:
                </Typography>

                <Box sx={{ textAlign: 'left', maxWidth: 300, mx: 'auto' }}>
                  <Typography variant="caption" display="block">
                    • Product: {formData.productName}
                  </Typography>
                  <Typography variant="caption" display="block">
                    • Company: {formData.companyName}
                  </Typography>
                  {formData.manufacturingDate && (
                    <Typography variant="caption" display="block">
                      • Manufactured: {new Date(formData.manufacturingDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {formData.expiryDate && (
                    <Typography variant="caption" display="block">
                      • Expiry: {new Date(formData.expiryDate).toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block">
                    • Batch No: {formData.batchNumber}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Usage Instructions */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          📋 How to Use
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              1. Fill Product Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter all required information about your product including name, company, and batch details.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              2. Generate QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "Generate QR Code" to create a scannable QR code containing all product information.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              3. Download & Print
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download the QR code as PNG and print it on product packaging or labels for easy scanning.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
