import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Android as AndroidIcon,
  Apple as AppleIcon,
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        py: 4,
        mt: 'auto',
        zIndex: 1000,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo and Addresses */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'var(--accent)' }}>
              geeksforgeeks-footer-logo
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Corporate & Communications Address:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              A-143, 7th Floor, Sovereign Corporate Tower, Sector- 136, Noida, Uttar Pradesh (201305)
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Registered Address:
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              K 061, Tower K, Gulshan Vivante Apartment, Sector 137, Noida, Gautam Buddh Nagar, Uttar Pradesh, 201305
            </Typography>

            {/* App Store Links */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <IconButton
                sx={{
                  backgroundColor: '#000',
                  color: 'white',
                  '&:hover': { backgroundColor: '#333' },
                  borderRadius: 1,
                  px: 2,
                }}
              >
                <AndroidIcon sx={{ mr: 1 }} />
                <Typography variant="caption">GFG App on Play Store</Typography>
              </IconButton>
              <IconButton
                sx={{
                  backgroundColor: '#000',
                  color: 'white',
                  '&:hover': { backgroundColor: '#333' },
                  borderRadius: 1,
                  px: 2,
                }}
              >
                <AppleIcon sx={{ mr: 1 }} />
                <Typography variant="caption">GFG App on App Store</Typography>
              </IconButton>
            </Box>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" underline="hover">About Us</Link>
              <Link href="#" color="inherit" underline="hover">Legal</Link>
              <Link href="#" color="inherit" underline="hover">Privacy Policy</Link>
              <Link href="#" color="inherit" underline="hover">Careers</Link>
              <Link href="#" color="inherit" underline="hover">Contact Us</Link>
            </Box>
          </Grid>

          {/* Corporate Solution */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Corporate Solution
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" underline="hover">Campus Training Program</Link>
            </Box>
          </Grid>

          {/* Explore */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Explore
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" underline="hover">POTD</Link>
              <Link href="#" color="inherit" underline="hover">Job-A-Thon</Link>
            </Box>
          </Grid>

          {/* Connect */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Connect
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="inherit" underline="hover">Blogs</Link>
              <Link href="#" color="inherit" underline="hover">Nation Skill Up</Link>
            </Box>
          </Grid>
        </Grid>

        {/* Tutorials Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Tutorials
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Programming Languages
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Python</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Java</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">C++</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">JavaScript</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                DSA
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Data Structures</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Algorithms</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Interview Prep</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Web Technology
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">HTML</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">CSS</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">React</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Node.js</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                AI, ML & Data Science
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Machine Learning</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Deep Learning</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Data Science</Link>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Courses Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Courses
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                ML and Data Science
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Data Science</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Machine Learning</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                DSA and Placements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">DSA Course</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Interview Prep</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Web Development
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Full Stack</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Frontend</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Backend</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Programming Languages
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Link href="#" variant="body2" color="inherit" underline="hover">Python</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">Java</Link>
                <Link href="#" variant="body2" color="inherit" underline="hover">C++</Link>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Offline Centers */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Offline Centers
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Link href="#" variant="body2" color="inherit" underline="hover">Noida</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Bengaluru</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Pune</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Hyderabad</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Patna</Link>
          </Box>
        </Box>

        {/* Preparation Corner */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Preparation Corner
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Link href="#" variant="body2" color="inherit" underline="hover">Interview Corner</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Aptitude</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">Puzzles</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">GfG 160</Link>
            <Link href="#" variant="body2" color="inherit" underline="hover">System Design</Link>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Copyright */}
        <Typography variant="body2" color="text.secondary" align="center">
          @GeeksforGeeks, Sanchhaya Education Private Limited, All rights reserved
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
