import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Fade,
  Slide,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ChatLogin.css';

// Optional: Play sound when bot message appears
const playMessageSound = () => {
  try {
    // Uncomment to enable sound (requires message.mp3 in public folder)
    // const audio = new Audio('/message.mp3');
    // audio.volume = 0.3;
    // audio.play().catch(() => {}); // Ignore errors if audio fails
  } catch (error) {
    // Ignore audio errors
  }
};

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

const BOT_MESSAGES = {
  welcome: "Hello! Welcome to SmartBiz AI. 👋",
  askName: "What's your name?",
  askChoice: (name) => `Nice to meet you, ${name}! Do you want to Login or Signup?`,
  askEmail: "Please enter your email address:",
  askPassword: "Enter your password:",
  askConfirmPassword: "Please confirm your password:",
  processing: "Processing your request...",
  success: "✅ Logged in successfully! Redirecting...",
  signupSuccess: "✅ Account created successfully! Redirecting...",
};

export default function ChatLogin() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState('welcome');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    choice: '', // 'login' or 'signup'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Start conversation
    setTimeout(() => {
      addBotMessage(BOT_MESSAGES.welcome);
      setTimeout(() => {
        addBotMessage(BOT_MESSAGES.askName);
        setStep('name');
      }, 1500);
    }, 500);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (step !== 'welcome' && step !== 'choice') {
      inputRef.current?.focus();
    }
  }, [step]);

  const addBotMessage = (text, delay = 0) => {
    if (delay > 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { text, sender: 'bot', timestamp: new Date() },
        ]);
        playMessageSound();
      }, delay);
    } else {
      setMessages((prev) => [
        ...prev,
        { text, sender: 'bot', timestamp: new Date() },
      ]);
      playMessageSound();
    }
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { text, sender: 'user', timestamp: new Date() },
    ]);
  };

  const handleSend = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const input = currentInput.trim();
    addUserMessage(input);

    if (step === 'name') {
      setUserData({ ...userData, name: input });
      setCurrentInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(BOT_MESSAGES.askChoice(input));
        setStep('choice');
      }, 1000);
    } else if (step === 'email') {
      // Basic email validation
      if (!input.includes('@')) {
        addBotMessage('Please enter a valid email address.');
        return;
      }
      setUserData({ ...userData, email: input });
      setCurrentInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(BOT_MESSAGES.askPassword);
        setStep('password');
      }, 1000);
    } else if (step === 'password') {
      if (input.length < 6) {
        addBotMessage('Password must be at least 6 characters long.');
        return;
      }
      setUserData({ ...userData, password: input });
      setCurrentInput('');
      
      if (userData.choice === 'signup') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addBotMessage(BOT_MESSAGES.askConfirmPassword);
          setStep('confirmPassword');
        }, 1000);
      } else {
        // Login - proceed to API call
        handleLogin();
      }
    } else if (step === 'confirmPassword') {
      if (input !== userData.password) {
        addBotMessage('Passwords do not match. Please try again.');
        setCurrentInput('');
        return;
      }
      setUserData({ ...userData, confirmPassword: input });
      setCurrentInput('');
      // Signup - proceed to API call
      handleSignup();
    }
  };

  const handleChoice = (choice) => {
    setUserData({ ...userData, choice });
    addUserMessage(choice === 'login' ? 'Login' : 'Signup');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(BOT_MESSAGES.askEmail);
      setStep('email');
    }, 1000);
  };

  const handleLogin = async () => {
    setIsProcessing(true);
    addBotMessage(BOT_MESSAGES.processing);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Remove processing message and add success
        setMessages((prev) => prev.slice(0, -1));
        addBotMessage(BOT_MESSAGES.success);
        
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload(); // Refresh to update auth context
        }, 2000);
      }
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => prev.slice(0, -1));
      const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
      addBotMessage(`❌ ${errorMsg}`);
      setStep('password');
      setCurrentInput('');
    }
  };

  const handleSignup = async () => {
    setIsProcessing(true);
    addBotMessage(BOT_MESSAGES.processing);
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: 'user',
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Remove processing message and add success
        setMessages((prev) => prev.slice(0, -1));
        addBotMessage(BOT_MESSAGES.signupSuccess);
        
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload(); // Refresh to update auth context
        }, 2000);
      }
    } catch (error) {
      setIsProcessing(false);
      setMessages((prev) => prev.slice(0, -1));
      const errorMsg = error.response?.data?.message || 'Signup failed. Please try again.';
      addBotMessage(`❌ ${errorMsg}`);
      setStep('confirmPassword');
      setCurrentInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step !== 'choice') {
        handleSend();
      }
    }
  };

  return (
    <Box className="chat-login-container">
      {/* Animated AI Avatar */}
      <Box className="ai-avatar">
        <BotIcon sx={{ fontSize: 48, color: 'var(--accent)' }} />
        <Box className="avatar-glow" />
      </Box>

      {/* Chat Window */}
      <Box className="chat-window">
        {/* Chat Header */}
        <Box className="chat-header">
          <Box className="bot-info">
            <BotIcon sx={{ fontSize: 24, color: 'var(--accent)' }} />
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600, ml: 1 }}>
              BizBot
            </Typography>
            <Box className="status-indicator" />
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', ml: 2 }}>
              AI Assistant
            </Typography>
          </Box>
        </Box>

        {/* Messages Container */}
        <Box className="messages-container">
          {messages.map((msg, index) => (
            <Fade in={true} key={index} timeout={500}>
              <Box
                className={`message-bubble ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}
              >
                <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                  {msg.text}
                </Typography>
              </Box>
            </Fade>
          ))}

          {/* Choice Buttons */}
          {step === 'choice' && (
            <Slide direction="up" in={true} timeout={300}>
              <Box className="choice-buttons">
                <Button
                  variant="contained"
                  onClick={() => handleChoice('login')}
                  className="choice-btn login-btn"
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleChoice('signup')}
                  className="choice-btn signup-btn"
                >
                  Signup
                </Button>
              </Box>
            </Slide>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <Box className="typing-indicator">
              <Box className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        {step !== 'choice' && (
          <Box className="input-area">
            <TextField
              inputRef={inputRef}
              fullWidth
              placeholder={
                step === 'name'
                  ? 'Type your name...'
                  : step === 'email'
                  ? 'Enter your email...'
                  : step === 'password'
                  ? 'Enter your password...'
                  : 'Confirm your password...'
              }
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing || isTyping}
              className="chat-input"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleSend}
                    disabled={!currentInput.trim() || isProcessing || isTyping}
                    className="send-button"
                  >
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

