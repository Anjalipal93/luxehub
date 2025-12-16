import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Send as SendIcon,
  VolumeUp as VolumeUpIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

// Local rule-based chatbot responses (fallback when backend is unavailable)
const getLocalBotResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
    return "Hello! I'm your AI project assistant for the Business Automation System. I can help you with any questions about your project, including code structure, features, setup, deployment, and technical implementation. What would you like to know?";
  }

  // Project Overview
  if (lowerMessage.match(/\b(project|system|application|business automation)\b/) && lowerMessage.match(/\b(what is|overview|about|tell me)\b/)) {
    return "This is a comprehensive Business Automation System built with React (frontend) and Node.js/Express (backend) with MongoDB. It includes product & inventory management, sales tracking, AI-powered forecasting, multi-channel customer communication, team performance monitoring, and real-time notifications.";
  }

  // Technology Stack
  if (lowerMessage.match(/\b(tech|technology|stack|framework|built with|uses)\b/)) {
    return "Technology Stack: Frontend - React.js with Material-UI, Axios, Socket.io; Backend - Node.js with Express.js, MongoDB with Mongoose, JWT authentication; Deployment - Vercel and Railway/Heroku.";
  }

  // Setup/Installation
  if (lowerMessage.match(/\b(setup|install|run|start|deploy|get started)\b/)) {
    return "To set up: 1. Clone repository, 2. Run 'npm install' in both frontend and backend, 3. Set up environment variables, 4. Start MongoDB, 5. Run backend with 'npm start', 6. Run frontend with 'npm start'. Check SETUP_EMAIL_WHATSAPP.md for details.";
  }

  // Features
  if (lowerMessage.match(/\b(feature|features|functionality|what can|capabilities)\b/)) {
    return "Key Features: 📊 Dashboard, 📦 Product Management, 💰 Sales Tracking, 🤖 AI Forecasting, 📧 Communication (Email/WhatsApp), 👥 Team Performance, 🔐 Authentication, 🔔 Notifications. All with voice support!";
  }

  // Help
  if (lowerMessage.match(/\b(help|how|what can you do|assist|support)\b/)) {
    return "I can help with: 🛠️ Technical questions, 📋 Feature explanations, ⚙️ Setup guidance, 🐛 Troubleshooting, 💡 Architecture, 🎯 Best practices. Ask me anything about your business automation project!";
  }

  // Thank you
  if (lowerMessage.match(/\b(thank|thanks|appreciate)\b/)) {
    return "You're welcome! I'm here to help with any questions about your business automation project. Feel free to ask about code, features, setup, or anything else!";
  }

  // Default response
  return "I understand you're asking about your business automation project. I can help with technical questions, feature explanations, setup guidance, and project architecture. Could you be more specific? For example: 'How do I set up the project?', 'What technologies are used?', or 'How does the AI forecasting work?'";
};

export default function VoiceChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI project assistant. I can help you with questions about your business automation system, including products, sales, inventory, AI forecasting, customer communication, and any technical aspects of your project. You can ask me anything by typing or using voice - just click the microphone button!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    // Initialize Web Speech API
    const initSpeechRecognition = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognitionInstance = new SpeechRecognition();

          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = false;
          recognitionInstance.lang = 'en-US';

          recognitionInstance.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
          };

          recognitionInstance.onresult = (event) => {
            console.log('Speech recognition result:', event);
            const transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            setInput(transcript);
            setIsListening(false);
            handleSendMessage(transcript);
          };

          recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
              toast.info('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
              toast.error('Microphone permission denied. Please allow microphone access.');
            } else {
              toast.error(`Speech recognition error: ${event.error}. Please try typing instead.`);
            }
          };

          recognitionInstance.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
          };

          setRecognition(recognitionInstance);
          console.log('Speech recognition initialized');
        } catch (error) {
          console.error('Error initializing speech recognition:', error);
          toast.error('Speech recognition not available. Please try typing messages.');
        }
      } else {
        console.warn('Speech recognition not supported in this browser');
        toast.warning('Speech recognition not supported in your browser. You can still type messages.');
      }
    };

    // Initialize speech recognition on component mount
    initSpeechRecognition();

    // Initialize speech synthesis voices
    const initSpeechSynthesis = () => {
      if ('speechSynthesis' in window) {
        const loadVoices = () => {
          const voices = synthRef.current.getVoices();
          console.log('Available voices:', voices.length);
          if (voices.length > 0) {
            console.log('Speech synthesis voices loaded');
          }
        };

        // Voices might load asynchronously
        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
    };

    initSpeechSynthesis();

    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []); // Remove messages dependency to avoid re-initialization

  const startListening = () => {
    if (recognition) {
      try {
        // Check if already listening
        if (isListening) {
          console.log('Already listening, stopping first');
          recognition.stop();
          setIsListening(false);
          return;
        }

        console.log('Starting speech recognition...');
        recognition.start();
        // Don't set isListening here - let the onstart event handle it
        toast.info('Listening... Speak now!');
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);

        if (error.name === 'InvalidStateError') {
          toast.error('Speech recognition is already active. Please wait or try again.');
        } else if (error.name === 'NotAllowedError') {
          toast.error('Microphone permission denied. Please allow microphone access and try again.');
        } else {
          toast.error('Could not start voice recognition. Please try typing instead.');
        }
      }
    } else {
      toast.warning('Voice recognition not available. Please type your message.');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending message to chatbot:', text);
      console.log('API URL:', `${API_URL}/communication/chatbot`);

      // Try to send to backend chatbot first
      let backendResponse = null;
      try {
        // Get conversation history (exclude the current message being sent)
        const conversationHistory = messages.slice(0, -1).slice(-5).map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const response = await axios.post(`${API_URL}/communication/chatbot`, {
          message: text,
          conversationHistory, // Send last 5 messages with only role and content
        });
        backendResponse = response.data;
      } catch (apiError) {
        console.log('Backend API not available, using local responses');
        // Fall back to local rule-based responses
        backendResponse = { response: getLocalBotResponse(text), source: 'local' };
      }

      console.log('Chatbot response:', backendResponse);
      console.log('Response source:', backendResponse.source);

      const botMessage = {
        role: 'assistant',
        content: backendResponse.response,
        timestamp: new Date(),
        source: backendResponse.source, // Track whether response is from backend API or local
      };

      setMessages((prev) => [...prev, botMessage]);

      // Speak the response (only if it's not too short)
      if (backendResponse.response && backendResponse.response.length > 5) {
        speakText(backendResponse.response);
      } else {
        console.log('Response too short to speak:', backendResponse.response);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      console.log('Error details:', error.response?.data);
      console.log('Error status:', error.response?.status);

      // Fallback response for now
      let fallbackMessage = 'Sorry, I encountered an error. Please try again.';

      // Provide helpful fallback responses
      if (error.response?.status === 500) {
        fallbackMessage = 'Server error. The chatbot service is temporarily unavailable.';
      } else if (!navigator.onLine) {
        fallbackMessage = 'No internet connection. Please check your connection and try again.';
      } else {
        // Simple rule-based fallback
        const lowerText = text.toLowerCase();
        if (lowerText.includes('hello') || lowerText.includes('hi')) {
          fallbackMessage = 'Hello! How can I help you today?';
        } else if (lowerText.includes('help')) {
          fallbackMessage = 'I can help you with products, sales, inventory, and general business questions. What would you like to know?';
        } else if (lowerText.includes('product')) {
          fallbackMessage = 'You can manage products in the Products section. Add new items, check inventory, and monitor stock levels.';
        } else if (lowerText.includes('sale')) {
          fallbackMessage = 'Track your sales in the Sales section. Record transactions and view revenue analytics.';
        }
      }

      const errorMessage = {
        role: 'assistant',
        content: fallbackMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Only show toast for network errors, not auth errors
      if (!error.response || error.response.status !== 401) {
        toast.error('Failed to get response from chatbot');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window && text) {
      try {
        console.log('Attempting to speak:', text);

        // Cancel any ongoing speech
        if (synthRef.current.speaking) {
          synthRef.current.cancel();
        }

        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure speech settings
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1;
        utterance.volume = 0.8; // Slightly lower volume
        utterance.lang = 'en-US';

        utterance.onstart = () => {
          console.log('Speech synthesis started');
        };

        utterance.onend = () => {
          console.log('Speech synthesis ended');
          setIsSpeaking(false);
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
          toast.error('Speech synthesis failed. The response will be displayed as text.');
        };

        // Get available voices and use a good English voice if available
        const voices = synthRef.current.getVoices();
        console.log('Available voices for speech:', voices.length);

        if (voices.length > 0) {
          const englishVoice = voices.find(voice =>
            voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
          ) || voices.find(voice => voice.lang.startsWith('en'));

          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('Using voice:', englishVoice.name);
          }
        } else {
          console.warn('No voices available yet, using default');
        }

        synthRef.current.speak(utterance);
      } catch (error) {
        console.error('Error in speakText:', error);
        setIsSpeaking(false);
        toast.error('Speech synthesis failed. The response will be displayed as text.');
      }
    } else {
      console.warn('Speech synthesis not supported or no text to speak');
      toast.info('Speech synthesis not supported. The response will be displayed as text.');
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      try {
        if (synthRef.current.speaking || synthRef.current.pending) {
          synthRef.current.cancel();
          console.log('Speech cancelled');
        }
        setIsSpeaking(false);
      } catch (error) {
        console.error('Error stopping speech:', error);
        setIsSpeaking(false);
      }
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, mb: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
            <BotIcon />
          </Avatar>
          <Typography variant="h6">AI Voice Assistant</Typography>
          {isSpeaking && (
            <Chip
              icon={<VolumeUpIcon />}
              label="Speaking..."
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body1">{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                  {msg.source && (
                    <span style={{ marginLeft: '8px', fontSize: '0.7em' }}>
                      ({msg.source})
                    </span>
                  )}
                </Typography>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" component="span">Thinking...</Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 Tip: Click the microphone to speak, or type your message. The AI will respond with voice and text.
            <br />
            <strong>Note:</strong> Allow microphone access when prompted for voice input.
          </Typography>
        </Alert>


        {/* Debug buttons for testing speech features */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => speakText('Hello! This is a test of the speech synthesis.')}
            disabled={isSpeaking}
          >
            Test Speech
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => console.log('Speech recognition available:', !!recognition)}
            color="secondary"
          >
            Check Speech Recognition
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => console.log('Available voices:', synthRef.current?.getVoices().length || 0)}
            color="secondary"
          >
            Check Voices
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type your message or use voice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isListening}
          />
          <IconButton
            color={isListening ? 'error' : 'primary'}
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            sx={{ mb: 0.5 }}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          {isSpeaking && (
            <IconButton
              color="error"
              onClick={stopSpeaking}
              title="Stop speaking"
            >
              <VolumeUpIcon />
            </IconButton>
          )}
          <IconButton
            color="primary"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading || isListening}
            sx={{ mb: 0.5 }}
            title="Send message"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}

