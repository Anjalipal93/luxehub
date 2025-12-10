import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Inventory as ProductIcon,
  Business as CompanyIcon,
  Factory as ManufacturingIcon,
  EventBusy as ExpiryIcon,
  Numbers as BatchIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';

const QRScanResult = () => {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(true);

  // Extract data from URL parameters
  const productData = {
    productName: searchParams.get('productName') || 'N/A',
    companyName: searchParams.get('companyName') || 'N/A',
    manufacturingDate: searchParams.get('manufacturingDate'),
    expiryDate: searchParams.get('expiryDate'),
    batchNumber: searchParams.get('batchNumber') || 'N/A',
  };

  const handleClose = () => {
    setOpen(false);
    // Close the window after animation
    setTimeout(() => {
      window.close();
    }, 300);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isExpired = () => {
    if (!productData.expiryDate) return false;
    return new Date(productData.expiryDate) < new Date();
  };

  const isNearExpiry = () => {
    if (!productData.expiryDate) return false;
    const expiryDate = new Date(productData.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: `linear-gradient(135deg, #FAF7F2 0%, rgba(242, 198, 222, 0.1) 50%, rgba(212, 175, 55, 0.1) 100%)`,
          border: '3px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 25px 50px rgba(212, 175, 55, 0.3)',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.5s ease-out',
          '@keyframes slideIn': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.8) translateY(-20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1) translateY(0)',
            },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          background: `linear-gradient(135deg, #D4AF37 0%, #F2C6DE 50%, #5A3E36 100%)`,
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: '1.5rem',
          position: 'relative',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <QrCodeIcon sx={{ fontSize: '2rem' }} />
          Product Verification
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
          Authenticated Product Details
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'var(--text-primary)',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              bgcolor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Status Alert */}
        {isExpired() && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
              border: '1px solid #f87171',
            }}
          >
            ⚠️ This product has expired!
          </Alert>
        )}

        {isNearExpiry() && !isExpired() && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: 2,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '1px solid #f59e0b',
            }}
          >
            ⚠️ This product is nearing expiry!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Product Name */}
          <Grid item xs={12}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(242, 198, 222, 0.3))',
                border: '2px solid rgba(212, 175, 55, 0.2)',
                borderRadius: 3,
                boxShadow: '0 8px 25px rgba(212, 175, 55, 0.1)',
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'var(--accent)',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <ProductIcon sx={{ fontSize: '2rem', color: 'var(--text-primary)' }} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#5A3E36', mb: 1 }}>
                  {productData.productName}
                </Typography>
                <Chip
                  label="Verified Product"
                  sx={{
                    bgcolor: 'var(--accent)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Company Details */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CompanyIcon sx={{ color: 'var(--accent)', fontSize: '1.5rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A3E36' }}>
                Company Information
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                p: 2,
                borderRadius: 2,
                border: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              {productData.companyName}
            </Typography>
          </Grid>

          {/* Manufacturing & Expiry Dates */}
          {(productData.manufacturingDate || productData.expiryDate) && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ManufacturingIcon sx={{ color: 'var(--accent)', fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A3E36' }}>
                  Date Information
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {productData.manufacturingDate && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#16a34a', fontWeight: 600, mb: 1 }}>
                        MANUFACTURED
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#15803d' }}>
                        {formatDate(productData.manufacturingDate)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {productData.expiryDate && (
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        bgcolor: isExpired() ? 'rgba(239, 68, 68, 0.1)' : isNearExpiry() ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${isExpired() ? 'rgba(239, 68, 68, 0.3)' : isNearExpiry() ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                        borderRadius: 2,
                        p: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{
                        color: isExpired() ? '#dc2626' : isNearExpiry() ? '#d97706' : '#2563eb',
                        fontWeight: 600,
                        mb: 1
                      }}>
                        {isExpired() ? 'EXPIRED' : 'EXPIRES'}
                      </Typography>
                      <Typography variant="body1" sx={{
                        fontWeight: 700,
                        color: isExpired() ? '#b91c1c' : isNearExpiry() ? '#92400e' : '#1d4ed8'
                      }}>
                        {formatDate(productData.expiryDate)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          {/* Batch Number */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <BatchIcon sx={{ color: 'var(--accent)', fontSize: '1.5rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A3E36' }}>
                Batch Information
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(139, 69, 19, 0.1)',
                border: '1px solid rgba(139, 69, 19, 0.3)',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600, mb: 1 }}>
                BATCH NUMBER
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#78350f',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                }}
              >
                {productData.batchNumber}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(212, 175, 55, 0.3)' }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500, mb: 1 }}>
            Verified by 💎 LuxeHub
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            This product has been authenticated using our secure QR verification system
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanResult;
