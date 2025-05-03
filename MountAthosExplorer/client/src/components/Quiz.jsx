import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardMedia,
  Alert,
  AlertTitle,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircleOutline,
  Cancel,
  Help,
  ArrowBack,
  ArrowForward,
  Refresh,
  Flag,
  Info as InfoIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

// Sample quiz data - in a real application, this would come from your API
const sampleQuiz = {
  id: 'quiz-module1-section1',
  title: 'Origins and Early History',
  moduleId: 'module1',
  sectionId: 'origins',
  description: 'Test your knowledge about the early history of Mount Athos.',
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'According to tradition, who blessed the peninsula of Mount Athos?',
      options: [
        { id: 'a', text: 'Saint Paul' },
        { id: 'b', text: 'The Virgin Mary' },
        { id: 'c', text: 'Saint Athanasius' },
        { id: 'd', text: 'Emperor Constantine' },
      ],
      correctAnswer: 'b',
      explanation: 'According to tradition, the Virgin Mary blessed the peninsula during a storm, which is why Mount Athos is also called "The Garden of the Mother of God".',
      points: 10,
      image: '/images/historical/virgin-mary-blessing.jpg',
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      question: 'In which century was the Great Lavra, the first monastery on Mount Athos, founded?',
      options: [
        { id: 'a', text: '7th century' },
        { id: 'b', text: '8th century' },
        { id: 'c', text: '9th century' },
        { id: 'd', text: '10th century' },
      ],
      correctAnswer: 'd',
      explanation: 'The Great Lavra was founded by Saint Athanasius the Athonite in 963 CE, during the 10th century, with the support of Byzantine Emperor Nikephoros Phokas.',
      points: 10,
    },
    {
      id: 'q3',
      type: 'true-false',
      question: 'Women are allowed to visit Mount Athos under special circumstances.',
      options: [
        { id: 'a', text: 'True' },
        { id: 'b', text: 'False' },
      ],
      correctAnswer: 'b',
      explanation: 'Mount Athos maintains a strict avaton (prohibition on entry) for women, which has been in place for more than a thousand years.',
      points: 10,
    },
    {
      id: 'q4',
      type: 'multiple-select',
      question: 'Which of the following were important periods in the history of Mount Athos? (Select all that apply)',
      options: [
        { id: 'a', text: 'Byzantine Era' },
        { id: 'b', text: 'Ottoman Period' },
        { id: 'c', text: 'Mongol Invasion' },
        { id: 'd', text: 'Greek Independence' },
      ],
      correctAnswer: ['a', 'b', 'd'],
      explanation: 'Mount Athos flourished during the Byzantine era, survived through the Ottoman Period, and was recognized as an autonomous region after Greek Independence. The Mongols never reached Mount Athos.',
      points: 15,
    },
    {
      id: 'q5',
      type: 'image-match',
      question: 'Match this historical artifact with its name:',
      image: '/images/historical/codex-artifact.jpg',
      options: [
        { id: 'a', text: 'Codex Athous' },
        { id: 'b', text: 'Crown of Nikephoros' },
        { id: 'c', text: 'Vatopedi Chalice' },
        { id: 'd', text: 'Lavra Crucifix' },
      ],
      correctAnswer: 'a',
      explanation: 'This is the Codex Athous, an important manuscript preserved in the libraries of Mount Athos that contains valuable theological and historical texts.',
      points: 20,
    },
  ],
};

// Main Quiz component
const Quiz = ({ 
  quizId, 
  moduleId,
  sectionId,
  onComplete = () => {},
  embedded = false
}) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { updateProgress, setAchievement } = useProgress();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  
  // Load quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        
        // In a real app, fetch from API
        // For now, use the sample quiz
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        setQuiz(sampleQuiz);
        
        // Calculate max possible score
        const totalPoints = sampleQuiz.questions.reduce((total, q) => total + q.points, 0);
        setMaxScore(totalPoints);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load quiz. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId]);
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (!currentQuestion) return false;
    
    if (currentQuestion.type === 'multiple-select') {
      return answers[currentQuestion.id] && answers[currentQuestion.id].length > 0;
    }
    
    return !!answers[currentQuestion.id];
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Handle multiple select answer change
  const handleMultiSelectChange = (questionId, optionId, checked) => {
    setAnswers(prev => {
      const currentSelections = prev[questionId] || [];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentSelections, optionId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentSelections.filter(id => id !== optionId)
        };
      }
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    setShowExplanation(false);
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  };
  
  // Navigate to previous question
  const handlePreviousQuestion = () => {
    setShowExplanation(false);
    setCurrentQuestionIndex(prevIndex => prevIndex - 1);
  };
  
  // Submit quiz
  const handleSubmitQuiz = async () => {
    // Calculate score
    let totalScore = 0;
    
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      
      if (question.type === 'multiple-select') {
        // For multiple select, check if arrays match (order doesn't matter)
        const correctOptions = question.correctAnswer;
        const userOptions = userAnswer || [];
        
        const isCorrect = 
          correctOptions.length === userOptions.length && 
          correctOptions.every(option => userOptions.includes(option));
        
        if (isCorrect) {
          totalScore += question.points;
        }
      } else {
        // For single answer questions
        if (userAnswer === question.correctAnswer) {
          totalScore += question.points;
        }
      }
    });
    
    setScore(totalScore);
    setSubmitted(true);
    setResultDialogOpen(true);
    
    // Update progress in context/API
    if (currentUser && moduleId && sectionId) {
      const percentageScore = Math.round((totalScore / maxScore) * 100);
      
      // Update section progress
      updateProgress(moduleId, sectionId, 'quiz', percentageScore);
      
      // Award achievement if score is high
      if (percentageScore >= 80) {
        setAchievement({
          id: `${moduleId}-${sectionId}-quiz-master`,
          title: 'Quiz Master',
          description: `Scored over 80% on the ${quiz.title} quiz`,
          moduleId,
        });
      }
    }
    
    // Call the onComplete callback with the results
    onComplete({
      quizId,
      score: totalScore,
      maxScore,
      percentageScore: Math.round((totalScore / maxScore) * 100),
      answers
    });
  };
  
  // Reset quiz
  const handleResetQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    setShowExplanation(false);
    setScore(0);
    setResultDialogOpen(false);
  };
  
  // Close result dialog
  const handleCloseResultDialog = () => {
    setResultDialogOpen(false);
  };
  
  // Check if answer is correct
  const isAnswerCorrect = (questionId) => {
    if (!submitted) return null;
    
    const question = quiz.questions.find(q => q.id === questionId);
    const userAnswer = answers[questionId];
    
    if (!question || !userAnswer) return false;
    
    if (question.type === 'multiple-select') {
      const correctOptions = question.correctAnswer;
      const userOptions = userAnswer;
      
      return (
        correctOptions.length === userOptions.length && 
        correctOptions.every(option => userOptions.includes(option))
      );
    }
    
    return userAnswer === question.correctAnswer;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }
  
  if (!quiz) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <AlertTitle>Quiz Not Found</AlertTitle>
        The requested quiz could not be found.
      </Alert>
    );
  }
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  // Compact embedded mode
  if (embedded) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {quiz.title} Quiz
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {quiz.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sample Question:
          </Typography>
          
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <CardContent>
              <Typography variant="body1" gutterBottom>
                {quiz.questions[0].question}
              </Typography>
              
              {quiz.questions[0].image && (
                <CardMedia
                  component="img"
                  height="140"
                  image={quiz.questions[0].image}
                  alt={quiz.questions[0].question}
                  sx={{ 
                    my: 2, 
                    borderRadius: 1,
                    objectFit: 'cover',
                  }}
                />
              )}
              
              <RadioGroup>
                {quiz.questions[0].options.map(option => (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio disabled />}
                    label={option.text}
                  />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Test your knowledge with {quiz.questions.length} questions
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = `/module${quiz.moduleId.slice(-1)}/section/${quiz.sectionId}/quiz`}
            sx={{ mt: 1 }}
          >
            Start Quiz
          </Button>
        </Box>
      </Paper>
    );
  }
  
  // Full quiz mode
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 2,
      }}
    >
      {/* Quiz header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {quiz.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {quiz.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Progress indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Typography>
          
          <Box sx={{ flexGrow: 1, mx: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(currentQuestionIndex / quiz.questions.length) * 100}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
          
          {submitted ? (
            <Chip 
              label={`Score: ${score}/${maxScore}`}
              color="primary"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Points: {currentQuestion.points}
            </Typography>
          )}
        </Box>
      </Box>
      
      {/* Question */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.6)',
          border: submitted ? 
            `1px solid ${isAnswerCorrect(currentQuestion.id) ? theme.palette.success.light : theme.palette.error.light}` : 
            '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.question}
              </Typography>
              
              {submitted && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {isAnswerCorrect(currentQuestion.id) ? (
                    <Chip 
                      icon={<CheckCircleOutline />} 
                      label="Correct" 
                      color="success" 
                      size="small" 
                      variant="filled"
                      sx={{ mr: 1 }}
                    />
                  ) : (
                    <Chip 
                      icon={<Cancel />} 
                      label="Incorrect" 
                      color="error" 
                      size="small"
                      variant="filled" 
                      sx={{ mr: 1 }}
                    />
                  )}
                  
                  <Button
                    size="small"
                    startIcon={<Help />}
                    onClick={() => setShowExplanation(!showExplanation)}
                    color={isAnswerCorrect(currentQuestion.id) ? "success" : "error"}
                    variant="text"
                  >
                    {showExplanation ? "Hide Explanation" : "Show Explanation"}
                  </Button>
                </Box>
              )}
            </Box>
            
            {submitted && isAnswerCorrect(currentQuestion.id) && (
              <Chip 
                label={`+${currentQuestion.points}`} 
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          
          {currentQuestion.image && (
            <CardMedia
              component="img"
              height="240"
              image={currentQuestion.image}
              alt={currentQuestion.question}
              sx={{ 
                my: 2, 
                borderRadius: 1,
                objectFit: 'cover',
              }}
            />
          )}
          
          {showExplanation && (
            <Alert 
              severity={isAnswerCorrect(currentQuestion.id) ? "success" : "info"} 
              sx={{ mb: 2 }}
            >
              <AlertTitle>Explanation</AlertTitle>
              {currentQuestion.explanation}
            </Alert>
          )}
          
          {/* Question options */}
          <Box sx={{ mt: 2 }}>
            {currentQuestion.type === 'multiple-select' ? (
              // Multiple select question
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select all that apply:
                </Typography>
                
                {currentQuestion.options.map(option => {
                  const isSelected = answers[currentQuestion.id]?.includes(option.id);
                  const isCorrectOption = currentQuestion.correctAnswer.includes(option.id);
                  
                  let optionColor = 'inherit';
                  if (submitted) {
                    if (isSelected && isCorrectOption) {
                      optionColor = 'success.main';
                    } else if (isSelected && !isCorrectOption) {
                      optionColor = 'error.main';
                    } else if (!isSelected && isCorrectOption) {
                      optionColor = 'success.main';
                    }
                  }
                  
                  return (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={isSelected || false}
                          onChange={(e) => handleMultiSelectChange(
                            currentQuestion.id, 
                            option.id, 
                            e.target.checked
                          )}
                          disabled={submitted}
                          color={submitted && isCorrectOption ? "success" : "primary"}
                        />
                      }
                      label={option.text}
                      sx={{ 
                        display: 'block', 
                        my: 1,
                        color: optionColor,
                      }}
                    />
                  );
                })}
              </Box>
            ) : (
              // Single select question (multiple choice or true/false)
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.options.map(option => {
                  const isCorrectOption = option.id === currentQuestion.correctAnswer;
                  
                  let optionColor = 'inherit';
                  if (submitted) {
                    if (isCorrectOption) {
                      optionColor = 'success.main';
                    } else if (answers[currentQuestion.id] === option.id) {
                      optionColor = 'error.main';
                    }
                  }
                  
                  return (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={
                        <Radio 
                          disabled={submitted}
                          color={submitted && isCorrectOption ? "success" : "primary"}
                        />
                      }
                      label={option.text}
                      sx={{ 
                        display: 'block', 
                        my: 1,
                        color: optionColor,
                      }}
                    />
                  );
                })}
              </RadioGroup>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <Box>
          {submitted && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleResetQuiz}
              sx={{ mr: 2 }}
            >
              Retry Quiz
            </Button>
          )}
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleNextQuestion}
              disabled={!isCurrentQuestionAnswered() && !submitted}
            >
              Next
            </Button>
          ) : (
            !submitted ? (
              <Button
                variant="contained"
                color="primary"
                endIcon={<Flag />}
                onClick={handleSubmitQuiz}
                disabled={!isCurrentQuestionAnswered()}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setResultDialogOpen(true)}
              >
                Show Results
              </Button>
            )
          )}
        </Box>
      </Box>
      
      {/* Results dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={handleCloseResultDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            bgcolor: 'background.paper',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogTitle>
          Quiz Results
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h4" gutterBottom>
              {Math.round((score / maxScore) * 100)}%
            </Typography>
            
            <Typography variant="h6">
              Score: {score} out of {maxScore} points
            </Typography>
            
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                borderRadius: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.08)', 
              }}
            >
              <Typography variant="body1" paragraph>
                {score / maxScore >= 0.8 ? (
                  <>Great job! You've demonstrated excellent knowledge about Mount Athos.</>
                ) : score / maxScore >= 0.6 ? (
                  <>Good work! You have a solid understanding of Mount Athos.</>
                ) : (
                  <>Keep learning! Review the module content to improve your knowledge.</>
                )}
              </Typography>
              
              {score / maxScore >= 0.8 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="primary.main">
                    You've earned the "Quiz Master" achievement!
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Question Summary
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {quiz.questions.map((question, index) => {
              const isCorrect = isAnswerCorrect(question.id);
              
              return (
                <Box 
                  key={question.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    mb: 1,
                  }}
                >
                  {isCorrect ? (
                    <CheckCircleOutline color="success" sx={{ mr: 1.5 }} />
                  ) : (
                    <Cancel color="error" sx={{ mr: 1.5 }} />
                  )}
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">
                      Question {index + 1}: {question.question.slice(0, 60)}
                      {question.question.length > 60 ? '...' : ''}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    size="small"
                    label={isCorrect ? `+${question.points}` : '0'}
                    color={isCorrect ? "success" : "default"}
                    variant={isCorrect ? "filled" : "outlined"}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetQuiz} startIcon={<Refresh />}>
            Retry Quiz
          </Button>
          <Button onClick={handleCloseResultDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Quiz;