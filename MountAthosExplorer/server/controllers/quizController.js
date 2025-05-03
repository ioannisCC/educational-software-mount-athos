/**
 * Quiz Controller
 * 
 * Handles quiz functionality for the Mount Athos Explorer
 * educational software.
 */

const Quiz = require('../models/Quiz');
const Progress = require('../models/Progress');
const { APIError } = require('../middleware/errorHandler');
const analyticsService = require('../services/analyticsService');
const { withTransaction } = require('../utils/database');
const { logger } = require('../middleware/logger');

/**
 * Get all quizzes (with pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, moduleId, published = true } = req.query;
    
    // Build query
    let query = {};
    
    // Apply filters
    if (moduleId) query.moduleId = moduleId;
    
    // Only admins can see unpublished quizzes
    if (req.user?.role !== 'admin') {
      query.isPublished = true;
    } else if (published !== undefined) {
      query.isPublished = published === 'true';
    }
    
    // Execute query with pagination
    const totalQuizzes = await Quiz.countDocuments(query);
    const totalPages = Math.ceil(totalQuizzes / limit);
    const skip = (page - 1) * limit;
    
    const quizzes = await Quiz.find(query)
      .select('-questions.correctAnswer -questions.explanation') // Hide answers for security
      .sort({ moduleId: 1, sectionId: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: quizzes.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalQuizzes,
        pageSize: parseInt(limit),
      },
      data: quizzes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { withAnswers } = req.query;
    
    let quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return next(new APIError('Quiz not found', 404));
    }
    
    // Check if quiz is published or user is admin
    if (!quiz.isPublished && req.user?.role !== 'admin') {
      return next(new APIError('Quiz not found', 404));
    }
    
    // Remove correct answers and explanations for regular users
    // unless withAnswers is true and user is admin
    if (!(withAnswers === 'true' && req.user?.role === 'admin')) {
      // Convert to object to modify
      quiz = quiz.toObject();
      
      quiz.questions = quiz.questions.map(question => {
        // Remove correctAnswer and explanation from response
        const { correctAnswer, explanation, ...rest } = question;
        return rest;
      });
    }
    
    // Track quiz view for authenticated users
    if (req.user) {
      analyticsService.trackUserActivity(req.user._id, 'quiz_view', {
        quizId: quiz._id,
        moduleId: quiz.moduleId,
        sectionId: quiz.sectionId,
      });
    }
    
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz by module and section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getQuizBySection = async (req, res, next) => {
  try {
    const { moduleId, sectionId } = req.params;
    
    // Find quiz for the specified module and section
    const query = {
      moduleId,
      sectionId,
    };
    
    // Only admins can see unpublished quizzes
    if (req.user?.role !== 'admin') {
      query.isPublished = true;
    }
    
    let quiz = await Quiz.findOne(query);
    
    if (!quiz) {
      return next(new APIError('No quiz found for this section', 404));
    }
    
    // Remove correct answers and explanations for regular users
    if (req.user?.role !== 'admin') {
      // Convert to object to modify
      quiz = quiz.toObject();
      
      quiz.questions = quiz.questions.map(question => {
        // Remove correctAnswer and explanation from response
        const { correctAnswer, explanation, ...rest } = question;
        return rest;
      });
    }
    
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createQuiz = async (req, res, next) => {
  try {
    // Only admins can create quizzes
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to create quizzes', 403));
    }
    
    const {
      moduleId,
      sectionId,
      title,
      description,
      questions,
      isPublished,
    } = req.body;
    
    // Check if quiz already exists for this module/section
    const existingQuiz = await Quiz.findOne({ moduleId, sectionId });
    
    if (existingQuiz) {
      return next(new APIError('A quiz already exists for this module and section', 400));
    }
    
    // Ensure questions have unique IDs
    const processedQuestions = questions.map((question, index) => {
      // If no question ID provided, generate one
      if (!question.id) {
        return {
          ...question,
          id: `${moduleId}-${sectionId}-q${index + 1}`,
        };
      }
      return question;
    });
    
    const newQuiz = new Quiz({
      moduleId,
      sectionId,
      title,
      description,
      questions: processedQuestions,
      isPublished: isPublished || false,
      createdBy: req.user._id,
    });
    
    await newQuiz.save();
    
    res.status(201).json({
      success: true,
      data: newQuiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateQuiz = async (req, res, next) => {
  try {
    // Only admins can update quizzes
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to update quizzes', 403));
    }
    
    const { id } = req.params;
    
    // Find quiz
    let quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return next(new APIError('Quiz not found', 404));
    }
    
    // Update quiz
    quiz = await Quiz.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...req.body,
          lastUpdated: Date.now(),
          updatedBy: req.user._id,
        } 
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteQuiz = async (req, res, next) => {
  try {
    // Only admins can delete quizzes
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to delete quizzes', 403));
    }
    
    const { id } = req.params;
    
    // Find quiz
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return next(new APIError('Quiz not found', 404));
    }
    
    await quiz.remove();
    
    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.submitQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    
    // Validate that user is authenticated
    if (!req.user) {
      return next(new APIError('Authentication required to submit quiz', 401));
    }
    
    // Find quiz
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return next(new APIError('Quiz not found', 404));
    }
    
    if (!quiz.isPublished) {
      return next(new APIError('Quiz is not available', 404));
    }
    
    // Calculate score and provide feedback
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionFeedback = [];
    
    quiz.questions.forEach(question => {
      // Add points to total
      totalPoints += question.points;
      
      // Get user's answer for this question
      const userAnswer = answers[question.id];
      
      // Skip if user didn't answer
      if (userAnswer === undefined) {
        questionFeedback.push({
          questionId: question.id,
          correct: false,
          points: 0,
          explanation: "No answer provided",
        });
        return;
      }
      
      let isCorrect = false;
      
      // Check correctness based on question type
      if (question.type === 'multiple-select') {
        // Multiple select: Arrays must match exactly
        const correctAnswerSet = new Set(question.correctAnswer);
        const userAnswerSet = new Set(userAnswer);
        
        if (correctAnswerSet.size === userAnswerSet.size) {
          isCorrect = Array.from(correctAnswerSet).every(option => 
            userAnswerSet.has(option)
          );
        }
      } else {
        // Single-answer question types
        isCorrect = userAnswer === question.correctAnswer;
      }
      
      // Award points for correct answers
      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      // Add feedback for this question
      questionFeedback.push({
        questionId: question.id,
        correct: isCorrect,
        points: isCorrect ? question.points : 0,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    });
    
    // Calculate percentage score
    const percentageScore = totalPoints > 0 
      ? Math.round((earnedPoints / totalPoints) * 100) 
      : 0;
    
    // Update user progress
    await withTransaction(async (session) => {
      // Find or create progress document for this user
      let progress = await Progress.findOne({ userId: req.user._id }).session(session);
      
      if (!progress) {
        progress = new Progress({
          userId: req.user._id,
          modules: [],
          contentProgress: [],
          quizProgress: [],
          achievements: [],
        });
      }
      
      // Find or create module progress
      let moduleProgress = progress.modules.find(m => m.id === quiz.moduleId);
      
      if (!moduleProgress) {
        moduleProgress = {
          id: quiz.moduleId,
          completion: 0,
          lastAccessed: new Date(),
          sections: [],
        };
        progress.modules.push(moduleProgress);
      }
      
      // Find or create section progress
      let sectionProgress = moduleProgress.sections.find(s => s.id === quiz.sectionId);
      
      if (!sectionProgress) {
        sectionProgress = {
          id: quiz.sectionId,
          completion: 0,
          lastAccessed: new Date(),
        };
        moduleProgress.sections.push(sectionProgress);
      }
      
      // Update section last accessed
      sectionProgress.lastAccessed = new Date();
      
      // Find existing quiz progress
      const existingQuizProgress = progress.quizProgress.find(
        q => q.quizId.toString() === id
      );
      
      if (existingQuizProgress) {
        // Update existing quiz progress
        existingQuizProgress.attempts += 1;
        existingQuizProgress.lastAttempt = new Date();
        
        // Update score if better than previous
        if (percentageScore > existingQuizProgress.score) {
          existingQuizProgress.score = percentageScore;
          existingQuizProgress.completed = percentageScore >= 60; // Consider completed if score >= 60%
        }
      } else {
        // Add new quiz progress
        progress.quizProgress.push({
          quizId: id,
          score: percentageScore,
          attempts: 1,
          lastAttempt: new Date(),
          completed: percentageScore >= 60, // Consider completed if score >= 60%
        });
      }
      
      // Save progress
      await progress.save({ session });
      
      // Recalculate module and section completion
      await recalculateProgress(req.user._id, quiz.moduleId, quiz.sectionId, session);
    });
    
    // Track quiz submission for analytics
    analyticsService.trackUserActivity(req.user._id, 'quiz_submit', {
      quizId: quiz._id,
      moduleId: quiz.moduleId,
      sectionId: quiz.sectionId,
      score: percentageScore,
      earnedPoints,
      totalPoints,
    });
    
    res.status(200).json({
      success: true,
      data: {
        quizId: quiz._id,
        moduleId: quiz.moduleId,
        sectionId: quiz.sectionId,
        title: quiz.title,
        earnedPoints,
        totalPoints,
        percentageScore,
        questionFeedback,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz progress for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getQuizProgress = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;
    
    // Find user progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }
    
    // Find quiz progress
    const quizProgress = progress.quizProgress.find(
      qp => qp.quizId.toString() === quizId
    );
    
    if (!quizProgress) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }
    
    res.status(200).json({
      success: true,
      data: quizProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to recalculate progress for a module and section
 * @param {string} userId - User ID
 * @param {string} moduleId - Module ID
 * @param {string} sectionId - Section ID
 * @param {mongoose.ClientSession} session - MongoDB session for transactions
 */
async function recalculateProgress(userId, moduleId, sectionId, session) {
  try {
    // Get all quizzes for this module/section
    const quizzes = await Quiz.find({ 
      moduleId, 
      isPublished: true,
    }).session(session);
    
    // Get user progress
    const progress = await Progress.findOne({ userId }).session(session);
    
    if (!progress) return;
    
    const moduleProgress = progress.modules.find(m => m.id === moduleId);
    if (!moduleProgress) return;
    
    // If section specified, only update that section
    if (sectionId) {
      const sectionProgress = moduleProgress.sections.find(s => s.id === sectionId);
      if (!sectionProgress) return;
      
      // Get quizzes for this section
      const sectionQuizzes = quizzes.filter(q => q.sectionId === sectionId);
      
      // Calculate section quiz completion
      let totalSectionCompletion = 0;
      
      // Count completed quizzes
      const completedQuizzes = sectionQuizzes.filter(quiz => {
        const quizProgress = progress.quizProgress.find(
          qp => qp.quizId.toString() === quiz._id.toString() && qp.completed
        );
        return !!quizProgress;
      }).length;
      
      // Calculate section completion (quizzes are 50% of section completion)
      if (sectionQuizzes.length > 0) {
        totalSectionCompletion = 50 * (completedQuizzes / sectionQuizzes.length);
      }
      
      // The other 50% is based on content completion (not calculated here)
      // For now, use existing content completion + quiz completion
      const existingSectionCompletion = sectionProgress.completion || 0;
      const contentCompletion = Math.min(existingSectionCompletion, 50); // Cap content at 50%
      
      sectionProgress.completion = Math.round(contentCompletion + totalSectionCompletion);
    }
    
    // Recalculate overall module completion based on sections
    const sectionsCount = moduleProgress.sections.length;
    let totalModuleCompletion = 0;
    
    if (sectionsCount > 0) {
      moduleProgress.sections.forEach(section => {
        totalModuleCompletion += section.completion || 0;
      });
      
      moduleProgress.completion = Math.round(totalModuleCompletion / sectionsCount);
    }
    
    // Save updates
    await progress.save({ session });
  } catch (error) {
    logger.error(`Error recalculating progress: ${error.message}`);
    throw error;
  }
}