import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import {
  RecordVoiceOver as VoiceIcon,
} from '@mui/icons-material';
import VoiceChatbot from '../components/VoiceChatbot';

export default function Communication() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <VoiceIcon />
        AI Voice Chatbot
      </Typography>

      <Paper sx={{ mt: 3, p: 3 }}>
        <VoiceChatbot />
      </Paper>
    </Box>
  );
}
