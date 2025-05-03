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
  Card,
  CardMedia,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Landscape as LandscapeIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon,
  Nature as NatureIcon,
  Route as RouteIcon,
  Park as ParkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import MapViewer from '../../components/MapViewer';
import Quiz from '../../components/Quiz';
import apiService from '../../services/api';
import analyticsService from '../../services/analytics';

// Module sections
const sections = [
  {
    id: 'geography',
    title: 'Geography',
    icon: <LandscapeIcon />,
    description: 'Explore the physical geography and natural features of the Mount Athos peninsula.',
  },
  {
    id: 'flora-fauna',
    title: 'Flora and Fauna',
    icon: <NatureIcon />,
    description: 'Discover the diverse plant and animal species that inhabit the Holy Mountain.',
  },
  {
    id: 'paths',
    title: 'Mountain Paths',
    icon: <RouteIcon />,
    description: 'Learn about the network of historic pathways connecting monasteries and settlements.',
  },
  {
    id: 'conservation',
    title: 'Conservation',
    icon: <ParkIcon />,
    description: 'Understand the environmental protection efforts and conservation challenges.',
  },
];

// Main Module component
const Module3 = () => {
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
      analyticsService.trackModule('module3', 'view');
    }
  }, [currentUser]);
  
  // Get section completion status
  const getSectionCompletion = (sectionId) => {
    if (!progress || !progress.modules) return 0;
    
    const module = progress.modules.find(m => m.id === 'module3');
    if (!module) return 0;
    
    const section = module.sections.find(s => s.id === sectionId);
    return section ? section.completion : 0;
  };
  
  // Handle section selection
  const handleSectionSelect = (sectionId) => {
    navigate(`/module3/${sectionId}`);
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
          <LandscapeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Natural Environment
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
              Natural Environment
            </Typography>
            
            <Typography variant="body1" paragraph color="text.secondary">
              Explore the remarkable natural landscape of Mount Athos, from its diverse
              ecosystems and rare species to its historic pathways and conservation
              efforts that preserve this unique natural sanctuary.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleSectionSelect('geography')}
              >
                Begin Module
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={progress?.modules?.find(m => m.id === 'module3')?.completion || 0}
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
              The Natural Environment module explores the physical geography, biodiversity,
              and ecological aspects of the Mount Athos peninsula, a unique natural sanctuary 
              that has been protected by its monastic status for centuries.
            </Typography>
            
            <Typography variant="body2" paragraph>
              You will learn about the diverse ecosystems, from Mediterranean coastal areas 
              to alpine zones, the rare plant and animal species that thrive here, the historic 
              footpaths connecting monasteries, and the conservation efforts that balance 
              human activity with environmental protection.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Module Features:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LandscapeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Topographical maps and terrain models
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <NatureIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Illustrated guides to endemic species
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RouteIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Interactive trails and pathways maps
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
      
      {/* Environmental highlights preview */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Environmental Highlights
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image="/images/environment/terrain.jpg"
                alt="Mount Athos Terrain"
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Diverse Terrain
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The peninsula rises to 2,033 meters (6,670 ft) at Mount Athos summit,
                  with varied landscapes from Mediterranean coast to alpine elevations.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image="/images/environment/biodiversity.jpg"
                alt="Biodiversity"
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rich Biodiversity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Home to over 1,400 plant species, including 170 that are considered rare
                  or endangered, and numerous wildlife species protected from hunting.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                background: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image="/images/environment/paths.jpg"
                alt="Historic Paths"
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Historic Pathways
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Network of stone-paved kalderimi paths dating back centuries,
                  connecting monasteries and offering spectacular views of the landscape.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
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
      analyticsService.trackSection('module3', sectionId, 'view');
    }
    
    // Fetch section content
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.get(`/content/module/module3/section/${sectionId}`);
        setContent(response.data);
        
        // Update progress (viewed)
        if (currentUser) {
          updateProgress('module3', sectionId, 'content', 50, {
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
        await updateProgress('module3', sectionId, 'content', 100, {
          contentId: content[0]?._id,
          completed: true,
        });
        setProgress(100);
      }
      
      // Navigate to quiz or next section
      navigate(`/module3/${sectionId}/quiz`);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
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
          to="/module3"
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
        <Link component={RouterLink} to="/module3" color="inherit" display="flex" alignItems="center">
          <LandscapeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Natural Environment
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
        
        {/* Interactive map element */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Environmental Map
          </Typography>
          <MapViewer />
        </Box>
        
        {/* Feature photos for this section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Environmental Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  overflow: 'hidden',
                  borderRadius: 2,
                  height: 300,
                  position: 'relative',
                }}
              >
                <Box
                  component="img"
                  src={`/images/environment/${sectionId}-main.jpg`}
                  alt={section.title}
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
                    p: 2,
                  }}
                >
                  <Typography variant="subtitle1">{section.title}</Typography>
                  <Typography variant="body2">{section.description}</Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={2} height="100%">
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      overflow: 'hidden',
                      borderRadius: 2,
                      height: 142,
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src={`/images/environment/${sectionId}-detail1.jpg`}
                      alt="Detail 1"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      overflow: 'hidden',
                      borderRadius: 2,
                      height: 142,
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src={`/images/environment/${sectionId}-detail2.jpg`}
                      alt="Detail 2"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      overflow: 'hidden',
                      borderRadius: 2,
                      height: 142,
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src={`/images/environment/${sectionId}-detail3.jpg`}
                      alt="Detail 3"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 4 }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/module3"
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
      analyticsService.trackQuiz('module3-' + sectionId, 'view');
    }
  }, [currentUser, sectionId]);
  
  // Handle quiz completion
  const handleQuizComplete = (result) => {
    // Update progress
    if (currentUser) {
      updateProgress('module3', sectionId, 'quiz', result.percentageScore, {
        quizId: result.quizId,
        completed: result.percentageScore >= 60, // Consider complete if score >= 60%
      });
      
      // If score is high, mark section as fully completed
      if (result.percentageScore >= 80) {
        updateProgress('module3', sectionId, 'content', 100, {
          completed: true,
        });
      }
    }
    
    // Wait a moment before navigating
    setTimeout(() => {
      // Find next section
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      if (currentIndex < sections.length - 1) {
        navigate(`/module3/${sections[currentIndex + 1].id}`);
      } else {
        // If this is the last section, go to module overview
        navigate('/module3');
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
        <Link component={RouterLink} to="/module3" color="inherit" display="flex" alignItems="center">
          <LandscapeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Natural Environment
        </Link>
        <Link 
          component={RouterLink} 
          to={`/module3/${sectionId}`} 
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
        quizId={`quiz-module3-${sectionId}`}
        moduleId="module3"
        sectionId={sectionId}
        onComplete={handleQuizComplete}
      />
    </Box>
  );
};

export default Module3;