import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Fade,
  Slide,
  InputAdornment,
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Mic as MicIcon,
} from '@mui/icons-material';

const AI_RESPONSES = {
  greeting: [
    "Hello! I'm your AI assistant. How can I help you today?",
    "Hi there! I can help you with sales, forecasts, and inventory insights.",
    "Welcome! Ask me about your dashboard, sales trends, or AI predictions.",
  ],
  sales: [
    "Your total sales today are looking great! Check the dashboard for detailed breakdowns.",
    "I can see your sales performance. Would you like to see forecasts or trends?",
    "Sales data is updated in real-time. View the Sales page for complete details.",
  ],
  forecast: [
    "AI forecasts show promising trends. Check the AI Forecast section for predictions.",
    "Based on historical data, I predict strong performance next month.",
    "Your inventory forecasts are available in the Dashboard and AI Forecast pages.",
  ],
  inventory: [
    "Check the Products page to see current inventory levels and low stock alerts.",
    "I've identified some products that may need restocking soon.",
    "Your inventory status is updated in real-time. View alerts in the Dashboard.",
  ],
  default: [
    "I can help you with sales, forecasts, inventory, and more. What would you like to know?",
    "Try asking about sales, forecasts, or inventory. I'm here to help!",
    "I'm your AI assistant. Ask me about your business metrics or insights.",
  ],
};

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
      };
    }
  }, []);

  const getAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return AI_RESPONSES.greeting[Math.floor(Math.random() * AI_RESPONSES.greeting.length)];
    }
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      return AI_RESPONSES.sales[Math.floor(Math.random() * AI_RESPONSES.sales.length)];
    }
    if (lowerMessage.includes('forecast') || lowerMessage.includes('predict') || lowerMessage.includes('ai')) {
      return AI_RESPONSES.forecast[Math.floor(Math.random() * AI_RESPONSES.forecast.length)];
    }
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('product')) {
      return AI_RESPONSES.inventory[Math.floor(Math.random() * AI_RESPONSES.inventory.length)];
    }
    
    return AI_RESPONSES.default[Math.floor(Math.random() * AI_RESPONSES.default.length)];
  };

  const handleSend = (message = input) => {
    if (!message.trim()) return;

    const userMessage = {
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate AI thinking delay
    setTimeout(() => {
      const botResponse = {
        text: getAIResponse(message),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in your browser');
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Fade in={!open}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={() => setOpen(true)}
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
              color: 'var(--text-primary)',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 24px rgba(37, 99, 235, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <BotIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
      </Fade>

      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(241, 245, 249, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid rgba(241, 245, 249, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'var(--accent)',
                background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
              }}
            >
              <BotIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Always here to help
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: '#F1F5F9' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    p: 1.5,
                    borderRadius: '12px',
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)'
                      : 'rgba(241, 245, 249, 0.1)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid rgba(241, 245, 249, 0.1)',
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(241, 245, 249, 0.05)',
                  color: 'var(--text-primary)',
                  '& fieldset': {
                    borderColor: 'rgba(241, 245, 249, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#38BDF8',
                  },
                },
                '& input': {
                  color: 'var(--text-primary)',
                },
                '& input::placeholder': {
                  color: 'var(--text-muted)',
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleVoiceInput}
                      sx={{
                        color: listening ? '#ef4444' : 'var(--accent)',
                        animation: listening ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                      }}
                    >
                      <MicIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      sx={{
                        color: 'var(--accent)',
                        '&:hover': {
                          color: 'var(--accent)',
                        },
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>
      </Slide>
    </>
  );
}

