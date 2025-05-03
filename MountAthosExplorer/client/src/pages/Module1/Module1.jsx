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
  useTheme,
} from '@mui/material';
import {
  History as HistoryIcon,
  Book as BookIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon,
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
    id: 'origins',
    title: 'Origins and Early History',
    icon: <BookIcon />,
    description: 'Discover the foundations of Mount Athos and its early monastic settlements.',
  },
  {
    id: 'monastic-republic',
    title: 'Monastic Republic',
    icon: <BookIcon />,
    description: 'Learn about the unique governance and organization of the Holy Mountain.',
  },
  {
    id: 'through-ages',
    title: 'Through the Ages',
    icon: <BookIcon />,
    description: 'Explore the history of Mount Athos from Byzantine era to modern times.',
  },
  {
    id: 'religious-life',
    title: 'Religious Life',
    icon: <BookIcon />,
    description: 'Understand the spiritual practices and daily life of Athonite monks.',
  },
];

// Main Module component
const Module1 = () => {
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
      analyticsService.trackModule('module1', 'view');
    }
  }, [currentUser]);
  
  // Get section completion status
  const getSectionCompletion = (sectionId) => {
    if (!progress || !progress.modules) return 0;
    
    const module = progress.modules.find(m => m.id === 'module1');
    if (!module) return 0;
    
    const section = module.sections.find(s => s.id === sectionId);
    return section ? section.completion : 0;
  };
  
  // Handle section selection
  const handleSectionSelect = (sectionId) => {
    navigate(`/module1/${sectionId}`);
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
          <HistoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          History & Religion
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
              History & Religious Significance
            </Typography>
            
            <Typography variant="body1" paragraph color="text.secondary">
              Explore the rich heritage of Mount Athos, its origins as a monastic center, 
              development through Byzantine and post-Byzantine periods, and its enduring 
              importance as a spiritual haven for Orthodox Christianity.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => handleSectionSelect('origins')}
              >
                Begin Module
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress
                variant="determinate"
                value={progress?.modules?.find(m => m.id === 'module1')?.completion || 0}
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
              The History & Religious Significance module explores the spiritual and 
              historical foundations of Mount Athos, often referred to as the Holy Mountain.
            </Typography>
            
            <Typography variant="body2" paragraph>
              You will learn about the peninsula's transformation from ancient times to 
              becoming an important center of Orthodox monasticism, its unique governance 
              as a self-ruled monastic republic, and the evolution of its religious 
              traditions through the centuries.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Module Features:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Historical timelines and events
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Interactive maps of early settlements
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Religious traditions and practices
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
      analyticsService.trackSection('module1', sectionId, 'view');
    }
    
    // Fetch section content
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.get(`/content/module/module1/section/${sectionId}`);
        setContent(response.data);
        
        // Update progress (viewed)
        if (currentUser) {
          updateProgress('module1', sectionId, 'content', 50, {
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
        await updateProgress('module1', sectionId, 'content', 100, {
          contentId: content[0]?._id,
          completed: true,
        });
        setProgress(100);
      }
      
      // Navigate to quiz or next section
      navigate(`/module1/${sectionId}/quiz`);
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
          to="/module1"
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
        <Link component={RouterLink} to="/module1" color="inherit" display="flex" alignItems="center">
          <HistoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          History & Religion
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
        
        {/* Sample interactive element - Map */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Historical Locations
          </Typography>
          <MapViewer />
        </Box>
      </Paper>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 4 }}>
        <Button
          variant="outlined"
          component={RouterLink}
          to="/module1"
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
      analyticsService.trackQuiz('module1-' + sectionId, 'view');
    }
  }, [currentUser, sectionId]);
  
  // Handle quiz completion
  const handleQuizComplete = (result) => {
    // Update progress
    if (currentUser) {
      updateProgress('module1', sectionId, 'quiz', result.percentageScore, {
        quizId: result.quizId,
        completed: result.percentageScore >= 60, // Consider complete if score >= 60%
      });
      
      // If score is high, mark section as fully completed
      if (result.percentageScore >= 80) {
        updateProgress('module1', sectionId, 'content', 100, {
          completed: true,
        });
      }
    }
    
    // Wait a moment before navigating
    setTimeout(() => {
      // Find next section
      const currentIndex = sections.findIndex(s => s.id === sectionId);
      if (currentIndex < sections.length - 1) {
        navigate(`/module1/${sections[currentIndex + 1].id}`);
      } else {
        // If this is the last section, go to module overview
        navigate('/module1');
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
        <Link component={RouterLink} to="/module1" color="inherit" display="flex" alignItems="center">
          <HistoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          History & Religion
        </Link>
        <Link 
          component={RouterLink} 
          to={`/module1/${sectionId}`} 
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
        quizId={`quiz-module1-${sectionId}`}
        moduleId="module1"
        sectionId={sectionId}
        onComplete={handleQuizComplete}
      />
    </Box>
  );
};

export default Module1;