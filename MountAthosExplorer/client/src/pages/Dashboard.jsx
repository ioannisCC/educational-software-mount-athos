import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Church as ChurchIcon,
  Landscape as LandscapeIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import Progress from '../components/Progress';
import apiService from '../services/api';
import analyticsService from '../services/analytics';

const Dashboard = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { progress, fetchProgress } = useProgress();
  
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [nextSteps, setNextSteps] = useState(null);
  
  useEffect(() => {
    // Track page view
    if (currentUser) {
      analyticsService.trackPageView();
    }
    
    // Fetch data
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch progress data if not already loaded
        if (!progress) {
          await fetchProgress();
        }
        
        // Fetch recommendations
        const recResponse = await apiService.get('/users/recommendations');
        setRecommendations(recResponse.data || []);
        
        // Fetch next steps
        const stepsResponse = await apiService.get('/users/next-steps');
        setNextSteps(stepsResponse.data || null);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, progress, fetchProgress]);
  
  // Helper function to get module icon
  const getModuleIcon = (moduleId) => {
    switch (moduleId) {
      case 'module1':
        return <HistoryIcon />;
      case 'module2':
        return <ChurchIcon />;
      case 'module3':
        return <LandscapeIcon />;
      default:
        return <SchoolIcon />;
    }
  };
  
  // Helper function to get module name
  const getModuleName = (moduleId) => {
    switch (moduleId) {
      case 'module1':
        return 'History & Religion';
      case 'module2':
        return 'Monasteries & Architecture';
      case 'module3':
        return 'Natural Environment';
      default:
        return 'Unknown Module';
    }
  };
  
  // Helper function to get section name
  const getSectionName = (sectionId) => {
    const sectionMap = {
      'origins': 'Origins and Early History',
      'monastic-republic': 'Monastic Republic',
      'through-ages': 'Through the Ages',
      'religious-life': 'Religious Life',
      'overview': 'Overview of Monasteries',
      'architecture': 'Architectural Styles',
      'treasures': 'Sacred Treasures',
      'preservation': 'Preservation Efforts',
      'geography': 'Geography',
      'flora-fauna': 'Flora and Fauna',
      'paths': 'Mountain Paths',
      'conservation': 'Conservation',
    };
    
    return sectionMap[sectionId] || sectionId;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Welcome section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Welcome{currentUser?.displayName ? `, ${currentUser.displayName}` : ''}!
            </Typography>
            
            <Typography variant="body1" paragraph>
              Continue your journey through Mount Athos, the Holy Mountain. 
              Track your progress, earn achievements, and discover new content 
              tailored to your learning preferences.
            </Typography>
            
            {nextSteps && (
              <Button
                component={RouterLink}
                to={`/${nextSteps.moduleId}/${nextSteps.sectionId}`}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 1 }}
              >
                Continue Learning
              </Button>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgressWithLabel 
                value={progress?.overallCompletion || 0} 
                size={120}
                thickness={5}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Overall Completion
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Progress overview */}
      <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
        Your Learning Progress
      </Typography>
      
      <Progress />
      
      {/* Next Steps */}
      {nextSteps && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
            Continue Your Journey
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={2} md={1}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {getModuleIcon(nextSteps.moduleId)}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={7} md={8}>
                <Typography variant="subtitle1">
                  {getModuleName(nextSteps.moduleId)} - {getSectionName(nextSteps.sectionId)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <LinearProgressWithLabel
                    value={nextSteps.sectionCompletion || 0}
                    sx={{ flexGrow: 1, mr: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {nextSteps.sectionCompletion || 0}%
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3} md={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Button
                  component={RouterLink}
                  to={`/${nextSteps.moduleId}/${nextSteps.sectionId}`}
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                >
                  Continue
                </Button>
              </Grid>
            </Grid>
            
            {nextSteps.quiz && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(0, 0, 0, 0.08)', 
                }}
              >
                <Grid container alignItems="center">
                  <Grid item xs={12} sm={9}>
                    <Typography variant="subtitle2">
                      Quiz: {nextSteps.quiz.title}
                    </Typography>
                    
                    {nextSteps.quiz.status === 'completed' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <CheckCircleOutlineIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          Completed with score: {nextSteps.quiz.score}%
                        </Typography>
                      </Box>
                    ) : nextSteps.quiz.status === 'attempted' ? (
                      <Typography variant="body2" color="text.secondary">
                        Last attempt score: {nextSteps.quiz.score}%
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Test your knowledge of this section
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 } }}>
                    <Button
                      component={RouterLink}
                      to={`/${nextSteps.moduleId}/${nextSteps.sectionId}/quiz`}
                      variant={nextSteps.quiz.status === 'completed' ? "outlined" : "contained"}
                      size="small"
                    >
                      {nextSteps.quiz.status === 'completed' ? "Retry Quiz" : (
                        nextSteps.quiz.status === 'attempted' ? "Continue Quiz" : "Take Quiz"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Recommended content */}
      {recommendations && recommendations.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
            Recommended for You
          </Typography>
          
          <Grid container spacing={3}>
            {recommendations.slice(0, 3).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                  <CardActionArea 
                    component={RouterLink}
                    to={`/${item.content.moduleId}/${item.content.sectionId}`}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {getModuleName(item.content.moduleId)}
                        </Typography>
                        <Typography variant="subtitle1">
                          {item.content.title}
                        </Typography>
                      </Box>
                      
                      {item.reason && (
                        <Chip 
                          icon={<TrendingUpIcon fontSize="small" />}
                          label={item.reason}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

// Custom circular progress with label
function CircularProgressWithLabel(props) {
  const { value, size = 40, thickness = 3.6, ...other } = props;
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress 
        variant="determinate" 
        value={value} 
        size={size}
        thickness={thickness}
        {...other}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{ fontSize: size / 5 }}
        >{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
}

// Custom linear progress with label
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
    </Box>
  );
}

export default Dashboard;