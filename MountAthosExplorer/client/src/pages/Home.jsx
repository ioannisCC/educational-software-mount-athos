import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Divider,
  useTheme,
} from '@mui/material';
import { 
  ChevronRight as ChevronRightIcon,
  History as HistoryIcon,
  Church as ChurchIcon,
  Landscape as LandscapeIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analytics';

const Home = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Track page view
    if (currentUser) {
      analyticsService.trackPageView();
    }
  }, [currentUser]);

  return (
    <Box>
      {/* Hero section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          mb: 6,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          Sacred Journey Through the Holy Mountain
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
          Explore Mount Athos, a UNESCO World Heritage site and autonomous monastic state 
          through an immersive educational experience spanning history, architecture, and natural beauty.
        </Typography>
        
        <Button
          component={RouterLink}
          to={currentUser ? "/dashboard" : "/register"}
          variant="contained"
          color="primary"
          size="large"
          endIcon={<ChevronRightIcon />}
          sx={{ px: 4, py: 1.5, borderRadius: 8 }}
        >
          {currentUser ? "Continue Journey" : "Begin Exploration"}
        </Button>
      </Paper>

      {/* Learning modules */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 300, textAlign: 'center', mb: 4 }}>
        Learning Modules
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              background: 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image="/images/modules/history.jpg"
              alt="History and Religion"
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  History & Religion
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Discover the rich spiritual heritage of Mount Athos, from its origins 
                to its enduring significance as a center of Orthodox Christianity.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/module1" 
                endIcon={<ChevronRightIcon />}
              >
                Explore Module
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              background: 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image="/images/modules/monasteries.jpg"
              alt="Monasteries and Architecture"
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ChurchIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Monasteries & Architecture
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Explore the twenty monasteries of Mount Athos, their unique 
                architectural styles, and the priceless treasures they house.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/module2" 
                endIcon={<ChevronRightIcon />}
              >
                Explore Module
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              background: 'rgba(255, 255, 255, 0.7)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image="/images/modules/environment.jpg"
              alt="Natural Environment"
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LandscapeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Natural Environment
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Discover the exceptional biodiversity and untouched landscapes 
                of the Holy Mountain, from coastal areas to the peak of Mount Athos.
              </Typography>
              <Button 
                component={RouterLink} 
                to="/module3" 
                endIcon={<ChevronRightIcon />}
              >
                Explore Module
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 6,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Educational Features
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ height: 60, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/icons/adaptive.svg" alt="Adaptive Learning" height="50" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Adaptive Learning
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Content tailored to your learning style and pace, with personalized recommendations.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ height: 60, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/icons/interactive.svg" alt="Interactive Media" height="50" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Interactive Media
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore 3D models of monasteries, interactive maps, and immersive content.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Box sx={{ height: 60, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/icons/progress.svg" alt="Progress Tracking" height="50" />
              </Box>
              <Typography variant="h6" gutterBottom>
                Progress Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor your learning journey with comprehensive statistics and achievements.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Call to action */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h5" gutterBottom>
          Begin Your Journey Today
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}>
          Experience the timeless spirituality and beauty of the Holy Mountain through
          our immersive educational platform.
        </Typography>
        <Button
          component={RouterLink}
          to={currentUser ? "/dashboard" : "/register"}
          variant="contained"
          color="primary"
          size="large"
          endIcon={<ChevronRightIcon />}
        >
          {currentUser ? "View Dashboard" : "Sign Up Now"}
        </Button>
      </Box>
    </Box>
  );
};

export default Home;