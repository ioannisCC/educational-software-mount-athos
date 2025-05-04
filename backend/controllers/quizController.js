// backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const Content = require('../models/Content');

// Get quizzes by module ID
exports.getQuizzesByModule = async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const quizzes = await Quiz.find({ moduleId }).select('-questions.options.isCorrect');
    
    if (quizzes.length === 0) {
      return res.status(404).json({ message: 'No quizzes found for this module' });
    }
    
    res.json(quizzes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Remove correct answers before sending to frontend
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map(q => {
      q.options = q.options.map(opt => ({
        text: opt.text,
        _id: opt._id
      }));
      return q;
    });
    
    res.json(quizData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create quiz
exports.createQuiz = async (req, res) => {
  try {
    const { moduleId, title, questions } = req.body;
    
    const newQuiz = new Quiz({
      moduleId,
      title,
      questions
    });
    
    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { moduleId, title, questions } = req.body;
    
    // Find and update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { moduleId, title, questions },
      { new: true }
    );
    
    if (!updatedQuiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(updatedQuiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      
      // Use deleteOne instead of remove
      await Quiz.deleteOne({ _id: req.params.id });
      res.json({ message: 'Quiz removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };

// Submit quiz answers
exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;
    const { answers } = req.body;
    
    // Find quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const results = answers.map(answer => {
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return null;
      
      const isCorrect = question.options[answer.selectedOption].isCorrect;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: answer.questionId,
        isCorrect
      };
    }).filter(result => result !== null);
    
    const score = (correctAnswers / quiz.questions.length) * 100;
    
    // Save to progress
    await Progress.findOneAndUpdate(
      { userId },
      { 
        $push: { 
          quizResults: {
            quizId,
            score,
            answers: results
          } 
        } 
      },
      { upsert: true }
    );
    
    // Recalculate module progress
    await recalculateModuleProgress(userId, quiz.moduleId);
    
    res.json({
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      results
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Helper function to recalculate module progress
async function recalculateModuleProgress(userId, moduleId) {
    try {
      // Get progress document
      const progress = await Progress.findOne({ userId });
      if (!progress) return;
      
      // Get all content for this module
      const moduleContent = await Content.find({ moduleId });
      const moduleContentIds = moduleContent.map(item => item._id.toString());
      
      // Count completed content
      const completedContent = progress.contentProgress.filter(
        item => moduleContentIds.includes(item.contentId.toString()) && item.completed
      );
      
      // Get all quizzes for this module
      const moduleQuizzes = await Quiz.find({ moduleId });
      const moduleQuizIds = moduleQuizzes.map(item => item._id.toString());
      
      // Calculate quiz scores (average of best attempts)
      let quizScores = 0;
      let quizCount = 0;
      
      moduleQuizIds.forEach(quizId => {
        const quizResults = progress.quizResults.filter(
          result => result.quizId.toString() === quizId
        );
        
        if (quizResults.length > 0) {
          const bestScore = Math.max(...quizResults.map(result => result.score));
          quizScores += bestScore;
          quizCount++;
        }
      });
      
      // Calculate progress percentages
      const contentProgressPercentage = moduleContent.length > 0 
        ? (completedContent.length / moduleContent.length) * 70 // 70% weight
        : 0;
        
      const quizProgressPercentage = quizCount > 0
        ? (quizScores / quizCount) * 0.3 // 30% weight
        : 0;
      
      const calculatedProgress = Math.round(contentProgressPercentage + quizProgressPercentage);
      
      // Update module progress
      const moduleProgressIndex = progress.moduleProgress.findIndex(
        item => item.moduleId === moduleId
      );
      
      if (moduleProgressIndex >= 0) {
        progress.moduleProgress[moduleProgressIndex].progress = calculatedProgress;
      } else {
        progress.moduleProgress.push({
          moduleId,
          progress: calculatedProgress
        });
      }
      
      await progress.save();
    } catch (err) {
      console.error('Error calculating module progress:', err.message);
    }
  }