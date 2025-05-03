import React, { useState, useEffect } from 'react';
import { Routes, Route, Link as RouterLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Church as ChurchIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon,
  Image as ImageIcon,
  ThreeDRotation as ThreeDRotationIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import MapViewer from '../../components/MapViewer';
import ModelViewer from '../../components/ModelViewer';
import Quiz from '../../components/Quiz';
import apiService from '../../services/api';
import analyticsService from '../../services/analytics';

// Module sections
const sections = [
  {
    id: 'overview',
    title: 'Overview of Monasteries',
    icon: <ChurchIcon />,
    description: 'Explore the twenty monasteries of Mount Athos and their historical significance.',
  },
  {
    id: 'architecture',
    title: 'Architectural Styles',
    icon: <BookIcon />,
    description: 'Learn about the distinctive Byzantine and post-Byzantine architecture.',
  },
  {
    id: 'treasures',
    title: 'Sacred Treasures',
    icon: <BookIcon />,
    description: 'Discover the invaluable religious artifacts, icons, and manuscripts.',
  },
  {
    id: 'preservation',
    title: 'Preservation Efforts',
    icon: <BookIcon />,
    description: 'Understand the challenges and initiatives to preserve this cultural heritage.',
  },
];

// Main Module component
const Module2 = () => {
  return (
    <Routes>
      <Route path="/" element={<ModuleOverview />} />
      <Route path="/:sectionId" element={<SectionContent />} />
      <Route path="/:sectionId/quiz" element={<SectionQuiz />} />
    </Routes>
  );
};

// Module Overview component
const ModuleOverview = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { progress } = useProgress();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Track page view
    if (currentUser) {
      analyticsService.trackPageView();
      analyticsService.trackModule('module2', 'view');
    }
  }, [currentUser]);
  
  // Get section completion status
  const getSectionCompletion = (sectionId) => {
    if (!progress || !progress.modules) return 0;
    
    const module = progress.modules.find(m => m.id === 'module2');
    if (!module) return 0;
    
    const section = module.sections.find(s => s.id === sectionId);
    return section ? section.completion : 0;
  };
  
  // Handle section selection
  const handleSectionSelect = (sectionId) => {
    navigate(`/module2/${sectionId}`);
  };
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit" display="flex" alignItems="center">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" display="flex" alignItems="center">
          <ChurchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Monasteries & Architecture
        </Typography>
      </Breadcrumbs>
      
      {/* Module header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              Monasteries & Architecture
            </Typography>
            
            <Typography variant="body1" paragraph color="text.secondary">
              Explore the architectural marvels of Mount Athos, from its twenty historic 
              monasteries to the unique Byzantine and post-Byzantine building styles that 
              have shaped this sacred landscape over centuries.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleSectionSelect('overview')}
              >
                Begin Module
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={progress?.modules?.find(m => m.id === 'module2')?.completion || 0}
                size={120}
                thickness={5}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Module Completion
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Module sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Module Sections
            </Typography>
            
            <List>
              {sections.map((section, index) => {
                const completion = getSectionCompletion(section.id);
                const isComplete = completion >= 100;
                
                return (
                  <React.Fragment key={section.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      button
                      onClick={() => handleSectionSelect(section.id)}
                      sx={{
                        py: 2,
                        borderLeft: '4px solid',
                        borderLeftColor: isComplete ? 
                          'success.main' : 
                          (completion > 0 ? 'warning.main' : 'transparent'),
                        bgcolor: isComplete ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                      }}
                    >
                      <ListItemIcon>
                        {isComplete ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <RadioButtonUncheckedIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={section.title}
                        secondary={section.description}
                        primaryTypographyProps={{
                          fontWeight: isComplete ? 500 : 400,
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                          {completion}%
                        </Typography>
                        <ArrowForwardIcon fontSize="small" color="action" />
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              About This Module
            </Typography>
            
            <Typography variant="body2" paragraph>
              The Monasteries & Architecture module explores the twenty sovereign 
              monasteries of Mount Athos and their architectural significance in 
              the Byzantine and Orthodox world.
            </Typography>
            
            <Typography variant="body2" paragraph>
              You will learn about the distinctive architectural styles, sacred 
              treasures housed within the monasteries, and the ongoing preservation 
              efforts to protect this UNESCO World Heritage site.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Module Features:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ThreeDRotationIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  3D models of monasteries
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MapIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Interactive map of monastery locations
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ImageIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  High-resolution imagery of religious artifacts
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Knowledge assessments and quizzes
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Monastery Map Preview */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Monasteries of Mount Athos
        </Typography>
        <MapViewer />
      </Box>
    </Box>
  );
};

// Section Content component
const SectionContent = () => {
  const { sectionId } = useParams();
  const { currentUser } = useAuth();
  const { updateProgress } = useProgress();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  
  // Find section info
  const section = sections.find(s => s.id === sectionId) || {
    id: sectionId,
    title: 'Unknown Section',
    icon: <BookIcon />,
  };
  
  useEffect(() => {
    // Track page view
    if (currentUser) {
      analyticsService.trackPageView();
      analyticsService.trackSection('module2', sectionId, 'view');
    }
    
    // Fetch section content
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.get(`/content/module/module2/section/${sectionId}`);
        setContent(response.data);
        
        // Update progress (viewed)
        if (currentUser) {
          updateProgress('module2', sectionId, 'content', 50, {
            contentId: response.data[0]?._id,
          });
          setProgress(50);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [currentUser, sectionId, updateProgress]);
  
  // Mark section as completed
  const handleComplete = async () => {
    try {
      if (currentUser) {
        await updateProgress('module2', sectionId, 'content', 100, {
          contentId: content[0]?._id,
          completed: true,
        });
        setProgress(100);
      }
      
      // Navigate to quiz or next section
      navigate(`/module2/${sectionId}/quiz`);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Find next section
  const getNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      return sections[currentIndex + 1].id;
    }
    return null;
  };
  
  const nextSection = getNextSection();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography color="error" paragraph>
          {error}
        </Typography>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/module2"
        >
          Return to Module Overview
        </Button>
      </Paper>
    );
  }
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit" display="flex" alignItems="center">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link component={RouterLink} to="/module2" color="inherit" display="flex" alignItems="center">
          <ChurchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Monasteries & Architecture
        </Link>
        <Typography color="text.primary">
          {section.title}
        </Typography>
      </Breadcrumbs>
      
      {/* Content */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {section.title}
        </Typography>
        
        {/* Display content from API or fallback content */}
        {content && content.length > 0 ? (
          <Box 
            sx={{ mt: 3 }}
            dangerouslySetInnerHTML={{ __html: content[0].content }}
          />
        ) : (
            <Box sx={{ mt: 3 }}>
            <Typography variant="body1" paragraph>
              This section explores {section.title.toLowerCase()} of Mount Athos.
            </Typography>
            
            <Typography variant="body1" paragraph>
              More detailed content will be available soon. In the meantime, 
              you can explore the interactive elements below.
            </Typography>
          </Box>
        )}
        
        {/* Interactive content tabs */}
        <Box sx={{ mt: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab 
              icon={<MapIcon />} 
              label="Map" 
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab 
              icon={<ThreeDRotationIcon />} 
              label="3D Model" 
              id="tab-1"
              aria-controls="tabpanel-1"
            />
            <Tab 
              icon={<ImageIcon />} 
              label="Gallery" 
              id="tab-2"
              aria-controls="tabpanel-2"
            />
          </Tabs>
          
          {/* Map View */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Monastery Locations
            </Typography>
            <MapViewer />
          </TabPanel>
          
          {/* 3D Model View */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              3D Monastery Model
            </Typography>
            <ModelViewer 
              modelPath="/models/monasteries/great-lavra.glb"
              title="Great Lavra Monastery"
              description="Explore this detailed 3D model of the monastery. Use mouse to rotate, scroll to zoom."
            />
          </TabPanel>
          
          {/* Gallery View */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Architectural Features Gallery
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    height: 200,
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src="/images/architecture/feature1.jpg"
                    alt="Dome Architecture"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      p: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Dome Architecture</Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    height: 200,
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src="/images/architecture/feature2.jpg"
                    alt="Fresco Detail"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      p: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Fresco Detail</Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    height: 200,
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src="/images/architecture/feature3.jpg"
                    alt="Monastic Courtyard"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      width: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      p: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Monastic Courtyard</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 4 }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/module2"
        >
          Back to Module
        </Button>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={handleComplete}
            sx={{ ml: 2 }}
          >
            {progress >= 100 ? 'Revisit Quiz' : 'Complete & Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

// Section Quiz component
const SectionQuiz = () => {
  const { sectionId } = useParams();
  const { currentUser } = useAuth();
  const { updateProgress } = useProgress();
  const navigate = useNavigate();
  
  const section = sections.find(s => s.id === sectionId) || {
    id: sectionId,
    title: 'Unknown Section',
  };
  
  useEffect(() => {
    // Track page view
    if (currentUser) {
      analyticsService.trackPageView();
      analyticsService.trackQuiz('module2-' + sectionId, 'view');
    }
  }, [currentUser, sectionId]);
  
  // Handle quiz completion
  const handleQuizComplete = (result) => {
    // Update progress
    if (currentUser) {
      updateProgress('module2', sectionId, 'quiz', result.percentageScore, {
        quizId: result.quizId,
        completed: result.percentageScore >= 60, // Consider complete if score >= 60%
      });
      
      // If score is high, mark section as fully completed
      if (result.percentageScore >= 80) {
        updateProgress('module2', sectionId, 'content', 100, {
          completed: true,
        });
      }
    }
    
    // Wait a moment before navigating
    setTimeout(() => {
      // Find next section
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      if (currentIndex < sections.length - 1) {
        navigate(`/module2/${sections[currentIndex + 1].id}`);
      } else {
        // If this is the last section, go to module overview
        navigate('/module2');
      }
    }, 3000);
  };
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit" display="flex" alignItems="center">
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Link component={RouterLink} to="/module2" color="inherit" display="flex" alignItems="center">
          <ChurchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Monasteries & Architecture
        </Link>
        <Link 
          component={RouterLink} 
          to={`/module2/${sectionId}`} 
          color="inherit" 
          display="flex" 
          alignItems="center"
        >
          {section.title}
        </Link>
        <Typography color="text.primary">
          Quiz
        </Typography>
      </Breadcrumbs>
      
      {/* Quiz */}
      <Quiz
        quizId={`quiz-module2-${sectionId}`}
        moduleId="module2"
        sectionId={sectionId}
        onComplete={handleQuizComplete}
      />
    </Box>
  );
};

export default Module2;