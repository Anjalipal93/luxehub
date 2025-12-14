import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';

export default function ChattingMessages() {
  const handleWhatsAppClick = () => {
    const whatsappUrl = 'https://wa.me/919368502764?text=Hello!%20I%20want%20to%20contact%20you';
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center' }}>
        💬 Chatting & Messages
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
        Start a conversation on WhatsApp
      </Typography>

      {/* WhatsApp */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsAppIcon sx={{ color: '#25d366' }} />
          WhatsApp
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click below to start a conversation on WhatsApp
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleWhatsAppClick}
          startIcon={<WhatsAppIcon />}
          sx={{
            py: 1.5,
            fontSize: '16px',
            borderRadius: 2,
            backgroundColor: '#25D366',
            '&:hover': {
              backgroundColor: '#1ebe5d',
            },
          }}
        >
          Chat on WhatsApp
        </Button>
      </Paper>
    </Box>
  );
}

