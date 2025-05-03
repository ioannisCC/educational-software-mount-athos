import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress, 
  Grid, 
  Card, 
  CardContent, 
  Tooltip, 
  CircularProgress, 
  Avatar, 
  IconButton,
  Chip,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import { 
  CheckCircleOutline, 
  RadioButtonUnchecked, 
  Info as InfoIcon, 
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useProgress } from '../context/ProgressContext';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Module data
const moduleData = [
  {
    id: 'module1',
    title: 'History & Religion',
    color: '#000000',
    icon: <TimelineIcon />,
    sections: [
      { id: 'origins', title: 'Origins & Early History' },
      { id: 'monastic-republic', title: 'Monastic Republic' },
      { id: 'through-ages', title: 'Through the Ages' },
      { id: 'religious-life', title: 'Religious Life' },
    ],
  },
  {
    id: 'module2',
    title: 'Monasteries & Architecture',
    color: '#444444',
    icon: <StarIcon />,
    sections: [
      { id: 'overview', title: 'Overview of Monasteries' },
      { id: 'architecture', title: 'Architectural Styles' },
      { id: 'treasures', title: 'Sacred Treasures' },
      { id: 'preservation', title: 'Preservation Efforts' },
    ],
  },
  {
    id: 'module3',
    title: 'Natural Environment',
    color: '#666666',
    icon: <BarChartIcon />,
    sections: [
      { id: 'geography', title: 'Geography' },
      { id: 'flora-fauna', title: 'Flora and Fauna' },
      { id: 'paths', title: 'Mountain Paths' },
      { id: 'conservation', title: 'Conservation' },
    ],
  },
];

// Main component
const Progress = ({ detailed = false }) => {
  const { currentUser } = useAuth();
  const { progress, loading, fetchProgress } = useProgress();
  const theme = useTheme();
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => {
    if (currentUser && !progress) {
      fetchProgress();
    }
  }, [currentUser, progress, fetchProgress]);

  const toggleModuleExpand = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const getCompletionStatus = (moduleId, sectionId = null) => {
    if (!progress || !progress.modules) return 0;

    if (sectionId) {
      const moduleProgress = progress.modules.find(m => m.id === moduleId);
      if (!moduleProgress) return 0;
      
      const sectionProgress = moduleProgress.sections.find(s => s.id === sectionId);
      return sectionProgress ? sectionProgress.completion : 0;
    } else {
      const moduleProgress = progress.modules.find(m => m.id === moduleId);
      return moduleProgress ? moduleProgress.completion : 0;
    }
  };

  const getAchievementCount = (moduleId) => {
    if (!progress || !progress.achievements) return 0;
    
    return progress.achievements.filter(a => a.moduleId === moduleId).length;
  };

  const getOverallProgress = () => {
    if (!progress || !progress.modules) return 0;
    
    const totalModules = moduleData.length;
    const completionSum = progress.modules.reduce((sum, module) => sum + module.completion, 0);
    
    return Math.round(completionSum / totalModules);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Track Your Learning Journey
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Sign in to track your progress through the Mount Athos Explorer.
        </Typography>
        <Button 
          component={RouterLink} 
          to="/login" 
          variant="contained" 
          color="primary"
          endIcon={<ArrowForwardIcon />}
        >
          Sign In to Continue
        </Button>
      </Paper>
    );
  }

  // If user is logged in but no progress data available
  if (!progress || !progress.modules) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Start Your Journey
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Begin exploring the modules to track your progress.
        </Typography>
        <Button 
          component={RouterLink} 
          to="/module1" 
          variant="contained" 
          color="primary"
          endIcon={<ArrowForwardIcon />}
        >
          Start Learning
        </Button>
      </Paper>
    );
  }

  // Simple progress overview for dashboard
  if (!detailed) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Your Learning Progress
          </Typography>
          <Chip 
            label={`${getOverallProgress()}% Complete`} 
            color="primary" 
            size="small"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={getOverallProgress()} 
          sx={{ 
            height: 8, 
            borderRadius: 4, 
            mb: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }} 
        />

        <Grid container spacing={2}>
          {moduleData.map((module) => (
            <Grid item xs={12} md={4} key={module.id}>
              <Card 
                elevation={0}
                sx={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: module.color, 
                        width: 30, 
                        height: 30,
                        mr: 1
                      }}
                    >
                      {module.icon}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {module.title}
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={getCompletionStatus(module.id)} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      mb: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    }} 
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {getCompletionStatus(module.id)}% complete
                    </Typography>
                    
                    {getAchievementCount(module.id) > 0 && (
                      <Tooltip title={`${getAchievementCount(module.id)} achievements earned`}>
                        <Chip 
                          icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
                          label={getAchievementCount(module.id)} 
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      component={RouterLink}
                      to={`/${module.id}`}
                      variant="text"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ textTransform: 'none' }}
                    >
                      Continue Learning
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  // Detailed progress view
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Detailed Learning Progress
        </Typography>
        <Chip 
          label={`${getOverallProgress()}% Complete`} 
          color="primary"
          sx={{ fontWeight: 500 }}
        />
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Overall Progress
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={getOverallProgress()} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            mb: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }} 
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Progress across all modules
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {getOverallProgress()}%
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Module Progress
      </Typography>
      
      <Grid container spacing={3}>
        {moduleData.map((module) => (
          <Grid item xs={12} key={module.id}>
            <Card 
              elevation={0}
              sx={{
                mb: 2,
                overflow: 'visible',
                background: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: module.color, 
                      width: 36, 
                      height: 36,
                      mr: 2
                    }}
                  >
                    {module.icon}
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {module.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.sections.length} learning sections
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label={`${getCompletionStatus(module.id)}%`} 
                    color={getCompletionStatus(module.id) === 100 ? 'success' : 'primary'}
                    variant={getCompletionStatus(module.id) === 100 ? 'filled' : 'outlined'}
                  />
                  
                  <IconButton 
                    onClick={() => toggleModuleExpand(module.id)}
                    sx={{ ml: 1 }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={getCompletionStatus(module.id)} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    mb: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  }} 
                />
                
                {expandedModule === module.id && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Section Progress
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {module.sections.map((section) => {
                        const sectionProgress = getCompletionStatus(module.id, section.id);
                        const isComplete = sectionProgress === 100;
                        
                        return (
                          <Grid item xs={12} sm={6} key={section.id}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: isComplete ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                                border: '1px solid',
                                borderColor: isComplete ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
                              }}
                            >
                              {isComplete ? (
                                <CheckCircleOutline 
                                  color="success" 
                                  sx={{ mr: 1.5, fontSize: 20 }} 
                                />
                              ) : (
                                <RadioButtonUnchecked 
                                  color="disabled" 
                                  sx={{ mr: 1.5, fontSize: 20 }} 
                                />
                              )}
                              
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2">
                                  {section.title}
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={sectionProgress} 
                                  sx={{ 
                                    height: 4, 
                                    borderRadius: 2, 
                                    mt: 0.5,
                                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                  }} 
                                />
                              </Box>
                              
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 1, 
                                  color: isComplete ? 'success.main' : 'text.secondary',
                                  fontWeight: isComplete ? 500 : 400,
                                }}
                              >
                                {sectionProgress}%
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        component={RouterLink}
                        to={`/${module.id}`}
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                      >
                        Continue Module
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {progress.achievements && progress.achievements.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Your Achievements
          </Typography>
          
          <Grid container spacing={2}>
            {progress.achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 2,
                  }}
                >
                  <Avatar
                    src={achievement.icon}
                    alt={achievement.title}
                    sx={{ 
                      width: 40, 
                      height: 40,
                      mr: 2,
                      bgcolor: 'primary.main',
                    }}
                  >
                    <StarIcon />
                  </Avatar>
                  
                  <Box>
                    <Typography variant="subtitle2">
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default Progress;