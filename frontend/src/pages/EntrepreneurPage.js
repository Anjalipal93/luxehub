import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Lightbulb,
  School,
} from '@mui/icons-material';

const ENTREPRENEURS = [
  {
    id: 1,
    name: 'Elon Musk',
    title: 'CEO, Tesla & SpaceX',
    bio: 'Innovator in electric vehicles and space exploration. Leading sustainable transportation and space technology.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoW8Hwq7_US6t0v3ppB7H7WK8PDY9Ds5CRKX6nDqFKAc42G8D3P8RWO8lJxkxi5CChaPj7QYszO6bGrbRmVXCatmo2PbGM9qnyzTeIblk&s=10',
    linkedin: 'https://linkedin.com/in/elonmusk',
    twitter: 'https://twitter.com/elonmusk',
  },
  {
    id: 2,
    name: 'Tim Cook',
    title: 'CEO, Apple Inc.',
    bio: 'Leading one of the world\'s most valuable companies. Focused on innovation and sustainability.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgbg-vHwlWfoSXz_1dx7Lwhu5UngGugbCcrXaZFiqDpTkscMjScnZKkMon7PJee7rpovKE0QGb_r10uZOZO2AWwTeZUzGOsvq3i35LXw&s=10',
    linkedin: 'https://linkedin.com/in/tim-cook',
    twitter: 'https://twitter.com/tim_cook',
  },
  {
    id: 3,
    name: 'Indra Nooyi',
    title: 'Former CEO, PepsiCo',
    bio: 'Former CEO of PepsiCo, known for strategic leadership and commitment to sustainable business practices.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1edc42GOnduq_xVkvACH9TcJ26Pie2DfBXjP1g9GLSROENzIggCH48RRv2BLS6gr71zWjJbeb5xU7bFtam4uzXQoLjDWvR-yeXQYOxmTH&s=10',
    linkedin: 'https://linkedin.com/in/indranooyi',
    twitter: 'https://twitter.com/indranooyi',
  },
  {
    id: 4,
    name: 'Sundar Pichai',
    title: 'CEO, Google & Alphabet',
    bio: 'Leading Google and Alphabet. Focused on AI innovation and accessible technology for everyone.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9WIH6UcyN2Jp8k7DtCwHbjYfiDyrPj1avaG46-7uxYVPPqEHPK7WsfKF-ZNHUDR20d03L3WZfOF6Vinu1y-q2VUD0aqinNvaCmNJYOmSp&s=10',
    linkedin: 'https://linkedin.com/in/sundarpichai',
    twitter: 'https://twitter.com/sundarpichai',
  },
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        🎯 Talk With Big Entrepreneurs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Learning resources to connect with industry leaders
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Entrepreneur Directory" />
          <Tab label="Learning Resources" />
          <Tab label="AI Insights" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Entrepreneur Directory Tab */}
          {tab === 0 && (
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
          {tab === 1 && (
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
          {tab === 2 && (
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
