/**
 * Progress Controller
 * 
 * Handles user progress tracking for the Mount Athos Explorer
 * educational software.
 */

const Progress = require('../models/Progress');
const User = require('../models/User');
const Content = require('../models/Content');
const Quiz = require('../models/Quiz');
const LearningPath = require('../models/LearningPath');
const { APIError } = require('../middleware/errorHandler');
const { withTransaction } = require('../utils/database');
const analyticsService = require('../services/analyticsService');
const adaptiveService = require('../services/adaptiveService');
const { logger } = require('../middleware/logger');

/**
 * Get user progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserProgress = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check authorization: users can only access their own progress
    // unless they are admins
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new APIError('Not authorized to access this user\'s progress', 403));
    }
    
    // Find user progress
    let progress = await Progress.findOne({ userId });
    
    // If no progress record exists, create an empty one
    if (!progress) {
      progress = new Progress({
        userId,
        modules: [
          { id: 'module1', completion: 0, sections: [] },
          { id: 'module2', completion: 0, sections: [] },
          { id: 'module3', completion: 0, sections: [] },
        ],
        contentProgress: [],
        quizProgress: [],
        achievements: [],
      });
      
      // Don't save yet - we'll return the empty progress
      // and it will be saved when the user makes progress
    }
    
    // Calculate overall progress across all modules
    let overallCompletion = 0;
    if (progress.modules.length > 0) {
      const totalModuleCompletion = progress.modules.reduce(
        (sum, module) => sum + (module.completion || 0), 
        0
      );
      overallCompletion = Math.round(totalModuleCompletion / progress.modules.length);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...progress.toObject(),
        overallCompletion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProgress = async (req, res, next) => {
  try {
    const {
      moduleId,
      sectionId,
      activityType,
      progress: progressValue,
      contentId,
      quizId,
      timeSpent,
      completed,
    } = req.body;
    
    // Validate input
    if (!moduleId || !sectionId || !activityType) {
      return next(new APIError('Missing required fields', 400));
    }
    
    if (progressValue < 0 || progressValue > 100) {
      return next(new APIError('Progress value must be between 0 and 100', 400));
    }
    
    // Additional validation based on activity type
    if (activityType === 'content' && !contentId) {
      return next(new APIError('Content ID is required for content activity', 400));
    }
    
    if (activityType === 'quiz' && !quizId) {
      return next(new APIError('Quiz ID is required for quiz activity', 400));
    }
    
    // Use transaction to ensure data consistency
    const result = await withTransaction(async (session) => {
      // Find or create progress document
      let userProgress = await Progress.findOne({ userId: req.user._id }).session(session);
      
      if (!userProgress) {
        userProgress = new Progress({
          userId: req.user._id,
          modules: [],
          contentProgress: [],
          quizProgress: [],
          achievements: [],
        });
      }
      
      // Find or create module progress
      let moduleProgress = userProgress.modules.find(m => m.id === moduleId);
      
      if (!moduleProgress) {
        moduleProgress = {
          id: moduleId,
          completion: 0,
          lastAccessed: new Date(),
          sections: [],
        };
        userProgress.modules.push(moduleProgress);
      }
      
      // Update module last accessed
      moduleProgress.lastAccessed = new Date();
      
      // Find or create section progress
      let sectionProgress = moduleProgress.sections.find(s => s.id === sectionId);
      
      if (!sectionProgress) {
        sectionProgress = {
          id: sectionId,
          completion: 0,
          lastAccessed: new Date(),
        };
        moduleProgress.sections.push(sectionProgress);
      }
      
      // Update section last accessed
      sectionProgress.lastAccessed = new Date();
      
      // Update activity-specific progress
      if (activityType === 'content') {
        // Handle content progress
        const existingContentProgress = userProgress.contentProgress.find(
          cp => cp.contentId.toString() === contentId
        );
        
        if (existingContentProgress) {
          // Update existing content progress
          existingContentProgress.progress = Math.max(existingContentProgress.progress, progressValue);
          existingContentProgress.completed = completed || existingContentProgress.completed || progressValue === 100;
          existingContentProgress.lastAccessed = new Date();
          
          if (timeSpent) {
            existingContentProgress.timeSpent = (existingContentProgress.timeSpent || 0) + timeSpent;
          }
        } else {
          // Add new content progress
          userProgress.contentProgress.push({
            contentId,
            moduleId,
            sectionId,
            progress: progressValue,
            completed: completed || progressValue === 100,
            lastAccessed: new Date(),
            timeSpent: timeSpent || 0,
          });
        }
        
        // Recalculate section completion based on content progress
        await updateSectionContentCompletion(userProgress, moduleId, sectionId, session);
      } else if (activityType === 'quiz') {
        // Quiz progress is mainly handled by quizController.submitQuiz
        // but this can be used for tracking quiz starts, etc.
        // Update section completion is not needed here as it's done in submitQuiz
        
        // Track quiz activity
        if (!userProgress.quizProgress.find(qp => qp.quizId.toString() === quizId)) {
          userProgress.quizProgress.push({
            quizId,
            moduleId,
            sectionId,
            score: 0,
            attempts: 0,
            lastAttempt: new Date(),
            completed: false,
          });
        }
      } else if (activityType === 'interactive' || activityType === 'video') {
        // Handle other activity types
        // These are typically associated with content
        if (contentId) {
          const existingContentProgress = userProgress.contentProgress.find(
            cp => cp.contentId.toString() === contentId
          );
          
          if (existingContentProgress) {
            // Update existing content progress
            existingContentProgress.progress = Math.max(existingContentProgress.progress, progressValue);
            existingContentProgress.completed = completed || existingContentProgress.completed || progressValue === 100;
            existingContentProgress.lastAccessed = new Date();
            
            if (timeSpent) {
              existingContentProgress.timeSpent = (existingContentProgress.timeSpent || 0) + timeSpent;
            }
          } else {
            // Add new content progress
            userProgress.contentProgress.push({
              contentId,
              moduleId,
              sectionId,
              progress: progressValue,
              completed: completed || progressValue === 100,
              lastAccessed: new Date(),
              timeSpent: timeSpent || 0,
              activityType,
            });
          }
          
          // Recalculate section completion based on content progress
          await updateSectionContentCompletion(userProgress, moduleId, sectionId, session);
        }
      }
      
      // Save progress
      await userProgress.save({ session });
      
      // Update learning path with latest progress
      await updateLearningPath(req.user._id, moduleId, sectionId, session);
      
      return userProgress;
    });
    
    // Track progress update for analytics
    analyticsService.trackUserActivity(req.user._id, 'progress_update', {
      moduleId,
      sectionId,
      activityType,
      progress: progressValue,
      contentId,
      quizId,
      timeSpent,
      completed,
    });
    
    // Calculate overall progress across all modules
    let overallCompletion = 0;
    if (result.modules.length > 0) {
      const totalModuleCompletion = result.modules.reduce(
        (sum, module) => sum + (module.completion || 0), 
        0
      );
      overallCompletion = Math.round(totalModuleCompletion / result.modules.length);
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...result.toObject(),
        overallCompletion,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user achievements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check authorization: users can only access their own achievements
    // unless they are admins
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new APIError('Not authorized to access this user\'s achievements', 403));
    }
    
    // Find user progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
    
    res.status(200).json({
      success: true,
      data: progress.achievements || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Award achievement to user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.awardAchievement = async (req, res, next) => {
  try {
    const { achievementId, title, description, moduleId } = req.body;
    
    if (!achievementId || !title) {
      return next(new APIError('Achievement ID and title are required', 400));
    }
    
    // Use transaction to ensure data consistency
    const result = await withTransaction(async (session) => {
      // Find or create progress document
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
      
      // Check if achievement already awarded
      if (progress.achievements.find(a => a.id === achievementId)) {
        return {
          progress,
          newAchievement: false,
        };
      }
      
      // Add achievement
      const achievement = {
        id: achievementId,
        title,
        description,
        moduleId,
        earnedAt: new Date(),
      };
      
      progress.achievements.push(achievement);
      
      // Save progress
      await progress.save({ session });
      
      return {
        progress,
        newAchievement: true,
        achievement,
      };
    });
    
    // Track achievement for analytics
    if (result.newAchievement) {
      analyticsService.trackUserActivity(req.user._id, 'achievement_earned', {
        achievementId,
        title,
        moduleId,
      });
    }
    
    res.status(result.newAchievement ? 201 : 200).json({
      success: true,
      data: result.achievement,
      newAchievement: result.newAchievement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user learning path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLearningPath = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Check authorization: users can only access their own learning path
    // unless they are admins
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new APIError('Not authorized to access this user\'s learning path', 403));
    }
    
    // Find user learning path
    let learningPath = await LearningPath.findOne({ userId })
      .populate('recommendedContent', 'title moduleId sectionId type')
      .populate('adaptiveSuggestions.contentId', 'title moduleId sectionId type');
    
    // If no learning path exists, create a default one
    if (!learningPath) {
      const user = await User.findById(userId);
      
      if (!user) {
        return next(new APIError('User not found', 404));
      }
      
      // Create default learning path
      learningPath = new LearningPath({
        userId,
        currentModule: 'module1',
        currentSection: 'origins',
        recommendedContent: [],
        adaptiveSuggestions: [],
        learningStyle: user.profile?.learningPreferences?.style || 'balanced',
        difficulty: user.profile?.learningPreferences?.difficulty || 'beginner',
      });
      
      // Generate recommendations
      await generateRecommendations(learningPath);
      
      // Save learning path
      await learningPath.save();
      
      // Reload with populated fields
      learningPath = await LearningPath.findOne({ userId })
        .populate('recommendedContent', 'title moduleId sectionId type')
        .populate('adaptiveSuggestions.contentId', 'title moduleId sectionId type');
    }
    
    res.status(200).json({
      success: true,
      data: learningPath,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user learning path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLearningPath = async (req, res, next) => {
  try {
    const { currentModule, currentSection, learningStyle, difficulty } = req.body;
    
    // Find user learning path
    let learningPath = await LearningPath.findOne({ userId: req.user._id });
    
    // If no learning path exists, create a new one
    if (!learningPath) {
      learningPath = new LearningPath({
        userId: req.user._id,
        recommendedContent: [],
        adaptiveSuggestions: [],
      });
    }
    
    // Update fields if provided
    if (currentModule) learningPath.currentModule = currentModule;
    if (currentSection) learningPath.currentSection = currentSection;
    if (learningStyle) learningPath.learningStyle = learningStyle;
    if (difficulty) learningPath.difficulty = difficulty;
    
    // Update user preferences if learning style or difficulty changed
    if (learningStyle || difficulty) {
      const user = await User.findById(req.user._id);
      
      if (!user.profile) {
        user.profile = {};
      }
      
      if (!user.profile.learningPreferences) {
        user.profile.learningPreferences = {};
      }
      
      if (learningStyle) {
        user.profile.learningPreferences.style = learningStyle;
      }
      
      if (difficulty) {
        user.profile.learningPreferences.difficulty = difficulty;
      }
      
      await user.save();
    }
    
    // Generate new recommendations based on updated preferences
    await generateRecommendations(learningPath);
    
    // Save learning path
    await learningPath.save();
    
    // Get populated learning path
    const populatedPath = await LearningPath.findOne({ userId: req.user._id })
      .populate('recommendedContent', 'title moduleId sectionId type')
      .populate('adaptiveSuggestions.contentId', 'title moduleId sectionId type');
    
    res.status(200).json({
      success: true,
      data: populatedPath,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetProgress = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    
    // Users can only reset their own progress, unless they are admins
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new APIError('Not authorized to reset this user\'s progress', 403));
    }
    
    // Delete progress and learning path
    await Progress.deleteOne({ userId });
    await LearningPath.deleteOne({ userId });
    
    // Create new empty progress
    const newProgress = new Progress({
      userId,
      modules: [
        { id: 'module1', completion: 0, sections: [] },
        { id: 'module2', completion: 0, sections: [] },
        { id: 'module3', completion: 0, sections: [] },
      ],
      contentProgress: [],
      quizProgress: [],
      achievements: [],
    });
    
    await newProgress.save();
    
    // Create new learning path
    const user = await User.findById(userId);
    
    if (!user) {
      return next(new APIError('User not found', 404));
    }
    
    const newLearningPath = new LearningPath({
      userId,
      currentModule: 'module1',
      currentSection: 'origins',
      recommendedContent: [],
      adaptiveSuggestions: [],
      learningStyle: user.profile?.learningPreferences?.style || 'balanced',
      difficulty: user.profile?.learningPreferences?.difficulty || 'beginner',
    });
    
    // Generate recommendations
    await generateRecommendations(newLearningPath);
    
    // Save learning path
    await newLearningPath.save();
    
    // Track progress reset for analytics
    analyticsService.trackUserActivity(userId, 'progress_reset', {});
    
    res.status(200).json({
      success: true,
      message: 'Progress reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update section content completion
 * @param {Object} progress - Progress document
 * @param {string} moduleId - Module ID
 * @param {string} sectionId - Section ID
 * @param {mongoose.ClientSession} session - MongoDB session for transactions
 */
async function updateSectionContentCompletion(progress, moduleId, sectionId, session) {
  try {
    // Find all content items for this section
    const contentItems = await Content.find({
      moduleId,
      sectionId,
      isPublished: true,
    }).session(session);
    
    if (contentItems.length === 0) return;
    
    // Find module and section in progress
    const moduleProgress = progress.modules.find(m => m.id === moduleId);
    if (!moduleProgress) return;
    
    const sectionProgress = moduleProgress.sections.find(s => s.id === sectionId);
    if (!sectionProgress) return;
    
    // Calculate content completion percentage
    let totalContentItems = contentItems.length;
    let completedContentItems = 0;
    
    contentItems.forEach(item => {
      const contentProgress = progress.contentProgress.find(
        cp => cp.contentId.toString() === item._id.toString()
      );
      
      if (contentProgress && contentProgress.completed) {
        completedContentItems++;
      }
    });
    
    // Content completion is 50% of section completion
    const contentCompletion = totalContentItems > 0
      ? Math.round(50 * (completedContentItems / totalContentItems))
      : 0;
    
    // Find quiz for this section
    const quiz = await Quiz.findOne({
      moduleId,
      sectionId,
      isPublished: true,
    }).session(session);
    
    // Quiz completion is the other 50% of section completion
    let quizCompletion = 0;
    
    if (quiz) {
      const quizProgress = progress.quizProgress.find(
        qp => qp.quizId.toString() === quiz._id.toString()
      );
      
      if (quizProgress && quizProgress.completed) {
        quizCompletion = 50;
      } else if (quizProgress) {
        // Partial quiz completion based on score
        quizCompletion = Math.round(quizProgress.score * 0.5);
      }
    } else {
      // If no quiz, content is 100% of section completion
      quizCompletion = contentCompletion;
    }
    
    // Update section completion
    sectionProgress.completion = contentCompletion + quizCompletion;
    
    // Recalculate module completion
    let totalSectionCompletion = 0;
    let sectionsCount = 0;
    
    moduleProgress.sections.forEach(section => {
      if (section.completion !== undefined) {
        totalSectionCompletion += section.completion;
        sectionsCount++;
      }
    });
    
    if (sectionsCount > 0) {
      moduleProgress.completion = Math.round(totalSectionCompletion / sectionsCount);
    }
  } catch (error) {
    logger.error(`Error updating section content completion: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to update learning path
 * @param {string} userId - User ID
 * @param {string} moduleId - Module ID
 * @param {string} sectionId - Section ID
 * @param {mongoose.ClientSession} session - MongoDB session for transactions
 */
async function updateLearningPath(userId, moduleId, sectionId, session) {
  try {
    // Find user learning path
    let learningPath = await LearningPath.findOne({ userId }).session(session);
    
    if (!learningPath) {
      // Create new learning path
      const user = await User.findById(userId).session(session);
      
      if (!user) {
        logger.error(`User not found for learning path creation: ${userId}`);
        return;
      }
      
      learningPath = new LearningPath({
        userId,
        currentModule: moduleId,
        currentSection: sectionId,
        recommendedContent: [],
        adaptiveSuggestions: [],
        learningStyle: user.profile?.learningPreferences?.style || 'balanced',
        difficulty: user.profile?.learningPreferences?.difficulty || 'beginner',
      });
    } else {
      // Update current module and section
      learningPath.currentModule = moduleId;
      learningPath.currentSection = sectionId;
    }
    
    // Generate recommendations
    await generateRecommendations(learningPath, session);
    
    // Save learning path
    await learningPath.save({ session });
  } catch (error) {
    logger.error(`Error updating learning path: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to generate recommendations for learning path
 * @param {Object} learningPath - Learning path document
 * @param {mongoose.ClientSession} session - MongoDB session for transactions (optional)
 */
async function generateRecommendations(learningPath, session = null) {
  try {
    // Get progress for this user
    const progress = await Progress.findOne({ userId: learningPath.userId });
    
    // Use adaptive service to generate recommendations
    const recommendations = await adaptiveService.generateRecommendations(
      learningPath.userId,
      progress,
      learningPath.learningStyle,
      learningPath.difficulty,
      learningPath.currentModule,
      learningPath.currentSection,
      session
    );
    
    // Update learning path with recommendations
    learningPath.recommendedContent = recommendations.recommendedContent;
    learningPath.adaptiveSuggestions = recommendations.adaptiveSuggestions;
    learningPath.lastUpdated = new Date();
  } catch (error) {
    logger.error(`Error generating recommendations: ${error.message}`);
    // Don't throw - we can still save the learning path without recommendations
  }
}