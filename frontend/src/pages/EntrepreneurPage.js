import React, { useState } from 'react';
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
  CardMedia,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  Launch as LaunchIcon,
  Lightbulb,
  School,
  AutoAwesome,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ENTREPRENEURS = [
  {
    id: 1,
    name: 'Elon Musk',
    title: 'CEO, Tesla & SpaceX',
    bio: 'Innovator in electric vehicles and space exploration. Leading sustainable transportation and space technology.',
    image: 'https://via.placeholder.com/200?text=Elon+Musk',
    linkedin: 'https://linkedin.com/in/elonmusk',
    twitter: 'https://twitter.com/elonmusk',
  },
  {
    id: 2,
    name: 'Tim Cook',
    title: 'CEO, Apple Inc.',
    bio: 'Leading one of the world\'s most valuable companies. Focused on innovation and sustainability.',
    image: 'https://via.placeholder.com/200?text=Tim+Cook',
    linkedin: 'https://linkedin.com/in/tim-cook',
    twitter: 'https://twitter.com/tim_cook',
  },
  {
    id: 3,
    name: 'Indra Nooyi',
    title: 'Former CEO, PepsiCo',
    bio: 'Former CEO of PepsiCo, known for strategic leadership and commitment to sustainable business practices.',
    image: 'https://via.placeholder.com/200?text=Indra+Nooyi',
    linkedin: 'https://linkedin.com/in/indranooyi',
    twitter: 'https://twitter.com/indranooyi',
  },
  {
    id: 4,
    name: 'Sundar Pichai',
    title: 'CEO, Google & Alphabet',
    bio: 'Leading Google and Alphabet. Focused on AI innovation and accessible technology for everyone.',
    image: 'https://via.placeholder.com/200?text=Sundar+Pichai',
    linkedin: 'https://linkedin.com/in/sundarpichai',
    twitter: 'https://twitter.com/sundarpichai',
  },
];

const OUTREACH_TEMPLATES = [
  'Hello {name}, I admire your work in {industry}. I would love to collaborate or learn from your experience.',
  'Hi {name}, Your achievements in {industry} are inspiring. Would you be open to a brief conversation?',
  'Dear {name}, I\'m reaching out to learn more about your journey in {industry}. Could we connect?',
];

const LEARNING_RESOURCES = [
  {
    title: 'TED Talks',
    description: 'Inspiring talks from business leaders and innovators',
    link: 'https://www.ted.com/talks',
  },
  {
    title: 'Startup Founder Interviews',
    description: 'Interviews with successful startup founders',
    link: 'https://www.youtube.com/results?search_query=startup+founder+interview',
  },
  {
    title: 'Business Strategy Blogs',
    description: 'Latest insights on business strategy and growth',
    link: 'https://hbr.org/topic/strategy',
  },
  {
    title: 'Leadership Podcasts',
    description: 'Podcasts on leadership and entrepreneurship',
    link: 'https://www.listennotes.com/podcasts/leadership/',
  },
];

export default function EntrepreneurPage() {
  const [tab, setTab] = useState(0);
  const [outreachForm, setOutreachForm] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    message: OUTREACH_TEMPLATES[0],
  });
  const [sending, setSending] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [aiSuggestion, setAiSuggestion] = useState('');

  const handleGenerateAIMessage = async () => {
    try {
      const response = await axios.post(`${API_URL}/ai/generate-outreach`, {
        name: outreachForm.name,
        industry: outreachForm.industry,
      });
      setAiSuggestion(response.data.message || '');
      if (response.data.message) {
        setOutreachForm(prev => ({ ...prev, message: response.data.message }));
      }
    } catch (error) {
      console.error('Generate AI message error:', error);
      toast.error('Failed to generate AI message');
    }
  };

  const handleSendOutreach = async (channel) => {
    if (!outreachForm.name || !outreachForm.message) {
      toast.error('Please fill in name and message');
      return;
    }

    setSending(true);
    try {
      const message = outreachForm.message
        .replace('{name}', outreachForm.name)
        .replace('{industry}', outreachForm.industry || 'business');

      if (channel === 'email') {
        if (!outreachForm.email) {
          toast.error('Please enter email address');
          setSending(false);
          return;
        }
        await axios.post(`${API_URL}/communication/send-email`, {
          to: outreachForm.email,
          subject: `Outreach: ${outreachForm.name}`,
          content: message,
        });
        toast.success('Email sent successfully!');
      } else if (channel === 'whatsapp') {
        if (!outreachForm.phone) {
          toast.error('Please enter phone number');
          setSending(false);
          return;
        }
        await axios.post(`${API_URL}/communication/send-whatsapp`, {
          to: outreachForm.phone,
          message: message,
        });
        toast.success('WhatsApp message sent successfully!');
      } else if (channel === 'sms') {
        // Placeholder for SMS
        toast.info('SMS feature coming soon');
      }
    } catch (error) {
      console.error('Send outreach error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🎯 Talk With Big Entrepreneurs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Outreach tools and learning resources to connect with industry leaders
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Outreach Builder" />
          <Tab label="Entrepreneur Directory" />
          <Tab label="Learning Resources" />
          <Tab label="AI Insights" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Outreach Builder Tab */}
          {tab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📝 Outreach Message Builder
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                This tool helps you craft personalized outreach messages to connect with potential business leaders.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    placeholder="Enter entrepreneur name"
                    value={outreachForm.name}
                    onChange={(e) => setOutreachForm(prev => ({ ...prev, name: e.target.value }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Industry"
                    placeholder="e.g., Technology, Finance"
                    value={outreachForm.industry}
                    onChange={(e) => setOutreachForm(prev => ({ ...prev, industry: e.target.value }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    placeholder="Enter email address"
                    type="email"
                    value={outreachForm.email}
                    onChange={(e) => setOutreachForm(prev => ({ ...prev, email: e.target.value }))}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    placeholder="Enter phone number"
                    value={outreachForm.phone}
                    onChange={(e) => setOutreachForm(prev => ({ ...prev, phone: e.target.value }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Message Template"
                    multiline
                    rows={6}
                    value={outreachForm.message}
                    onChange={(e) => setOutreachForm(prev => ({ ...prev, message: e.target.value }))}
                    margin="normal"
                    helperText="Use {name} and {industry} as placeholders"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesome />}
                    onClick={handleGenerateAIMessage}
                    sx={{ mb: 2 }}
                  >
                    Generate AI Message
                  </Button>
                </Grid>
              </Grid>

              {aiSuggestion && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">AI Suggestion:</Typography>
                  <Typography variant="body2">{aiSuggestion}</Typography>
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={sending ? <CircularProgress size={20} /> : <EmailIcon />}
                  onClick={() => handleSendOutreach('email')}
                  disabled={sending}
                >
                  Send via Email
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={sending ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                  onClick={() => handleSendOutreach('whatsapp')}
                  disabled={sending}
                >
                  Send via WhatsApp
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SmsIcon />}
                  onClick={() => handleSendOutreach('sms')}
                  disabled={sending}
                >
                  Send via SMS
                </Button>
              </Box>
            </Box>
          )}

          {/* Entrepreneur Directory Tab */}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🌟 Entrepreneur Directory
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Learn about successful entrepreneurs. These are informational profiles, not direct messaging contacts.
              </Alert>
              
              <Grid container spacing={3}>
                {ENTREPRENEURS.map((entrepreneur) => (
                  <Grid item xs={12} sm={6} md={4} key={entrepreneur.id}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={entrepreneur.image}
                        alt={entrepreneur.name}
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {entrepreneur.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {entrepreneur.title}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {entrepreneur.bio}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          href={entrepreneur.linkedin}
                          target="_blank"
                          startIcon={<LaunchIcon />}
                        >
                          LinkedIn
                        </Button>
                        <Button
                          size="small"
                          href={entrepreneur.twitter}
                          target="_blank"
                          startIcon={<LaunchIcon />}
                        >
                          Twitter
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Learning Resources Tab */}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📚 Learning Resources
              </Typography>
              
              <List>
                {LEARNING_RESOURCES.map((resource, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Link href={resource.link} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                            {resource.title}
                          </Link>
                        }
                        secondary={resource.description}
                      />
                    </ListItem>
                    {index < LEARNING_RESOURCES.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {/* AI Insights Tab */}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                💡 Motivational AI Insights
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Daily AI-generated suggestions to improve your professional outreach
              </Alert>

              <Paper sx={{ p: 3 }}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Connect with industry leaders in your niche." />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Improve your personal brand on LinkedIn." />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Build a strong online portfolio before outreach." />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Research thoroughly before reaching out to show genuine interest." />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Lightbulb color="warning" />
                    </ListItemIcon>
                    <ListItemText primary="Follow up consistently but respectfully." />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
