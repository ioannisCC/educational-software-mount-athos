/**
 * Adaptive Controller
 * 
 * Handles adaptive learning functionality for the Mount Athos Explorer
 * educational software.
 */

const LearningPath = require('../models/LearningPath');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Content = require('../models/Content');
const adaptiveService = require('../services/adaptiveService');
const recommendationService = require('../services/recommendationService');
const { APIError } = require('../middleware/errorHandler');

/**
 * Get personalized recommendations for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get user progress and learning path
    const [progress, learningPath, user] = await Promise.all([
      Progress.findOne({ userId }),
      LearningPath.findOne({ userId }),
      User.findById(userId),
    ]);
    
    if (!user) {
      return next(new APIError('User not found', 404));
    }
    
    // Get user preferences
    const learningStyle = req.query.learningStyle || 
                          learningPath?.learningStyle || 
                          user.profile?.learningPreferences?.style || 
                          'balanced';
    
    const difficulty = req.query.difficulty || 
                      learningPath?.difficulty || 
                      user.profile?.learningPreferences?.difficulty || 
                      'beginner';
    
    // Get current module and section
    const currentModule = req.query.moduleId || 
                          learningPath?.currentModule || 
                          'module1';
    
    const currentSection = req.query.sectionId || 
                           learningPath?.currentSection || 
                           'origins';
    
    // Generate recommendations
    const recommendations = await adaptiveService.generateRecommendations(
      userId,
      progress,
      learningStyle,
      difficulty,
      currentModule,
      currentSection
    );
    
    // Populate content details
    const recommendedContent = await Content.find({
      _id: { $in: recommendations.recommendedContent },
    }).select('title moduleId sectionId type');
    
    // Get content details for adaptive suggestions
    const adaptiveSuggestions = [];
    
    for (const suggestion of recommendations.adaptiveSuggestions) {
      const content = await Content.findById(suggestion.contentId)
        .select('title moduleId sectionId type');
      
      if (content) {
        adaptiveSuggestions.push({
          content,
          reason: suggestion.reason,
          priority: suggestion.priority,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        recommendedContent,
        adaptiveSuggestions,
        learningStyle,
        difficulty,
        currentModule,
        currentSection,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user's learning preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateLearningPreferences = async (req, res, next) => {
  try {
    const { learningStyle, difficulty } = req.body;
    
    // Validate input
    if (!learningStyle && !difficulty) {
      return next(new APIError('No preferences provided to update', 400));
    }
    
    if (learningStyle && !['visual', 'textual', 'interactive', 'balanced'].includes(learningStyle)) {
      return next(new APIError('Invalid learning style', 400));
    }
    
    if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return next(new APIError('Invalid difficulty level', 400));
    }
    
    // Update user preferences
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return next(new APIError('User not found', 404));
    }
    
    // Ensure profile and preferences objects exist
    if (!user.profile) {
      user.profile = {};
    }
    
    if (!user.profile.learningPreferences) {
      user.profile.learningPreferences = {};
    }
    
    // Update preferences
    if (learningStyle) {
      user.profile.learningPreferences.style = learningStyle;
    }
    
    if (difficulty) {
      user.profile.learningPreferences.difficulty = difficulty;
    }
    
    await user.save();
    
    // Update learning path
    let learningPath = await LearningPath.findOne({ userId: req.user._id });
    
    if (!learningPath) {
      learningPath = new LearningPath({
        userId: req.user._id,
        currentModule: 'module1',
        currentSection: 'origins',
        recommendedContent: [],
        adaptiveSuggestions: [],
        learningStyle: user.profile.learningPreferences.style,
        difficulty: user.profile.learningPreferences.difficulty,
      });
    } else {
      if (learningStyle) {
        learningPath.learningStyle = learningStyle;
      }
      
      if (difficulty) {
        learningPath.difficulty = difficulty;
      }
    }
    
    // Generate new recommendations based on updated preferences
    const progress = await Progress.findOne({ userId: req.user._id });
    
    // Generate recommendations
    const recommendations = await adaptiveService.generateRecommendations(
      req.user._id,
      progress,
      learningPath.learningStyle,
      learningPath.difficulty,
      learningPath.currentModule,
      learningPath.currentSection
    );
    
    // Update learning path with recommendations
    learningPath.recommendedContent = recommendations.recommendedContent;
    learningPath.adaptiveSuggestions = recommendations.adaptiveSuggestions;
    learningPath.lastUpdated = new Date();
    
    await learningPath.save();
    
    res.status(200).json({
      success: true,
      data: {
        learningPreferences: user.profile.learningPreferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get content based on learning style
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getContentByLearningStyle = async (req, res, next) => {
  try {
    const { moduleId, sectionId } = req.params;
    const { learningStyle } = req.query;
    
    // Default to user's learning style if not specified
    let style = learningStyle;
    
    if (!style && req.user) {
      // Get user's preferred learning style
      const user = await User.findById(req.user._id);
      style = user?.profile?.learningPreferences?.style || 'balanced';
    }
    
    // Find content for the section
    const query = {
      moduleId,
      sectionId,
      isPublished: true,
    };
    
    // Add learning style filter if specified
    if (style && style !== 'balanced') {
      query['metadata.learningStyles'] = style;
    }
    
    // Find content
    let content = await Content.find(query).sort({ order: 1 });
    
    // If no content found for specific learning style, fallback to all content
    if (content.length === 0 && style !== 'balanced') {
      content = await Content.find({
        moduleId,
        sectionId,
        isPublished: true,
      }).sort({ order: 1 });
    }
    
    res.status(200).json({
      success: true,
      count: content.length,
      learningStyle: style,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get next steps for learning path
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getNextSteps = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get progress and learning path
    const [progress, learningPath] = await Promise.all([
      Progress.findOne({ userId }),
      LearningPath.findOne({ userId }),
    ]);
    
    if (!learningPath) {
      return next(new APIError('Learning path not found', 404));
    }
    
    // Get current module and section
    const currentModule = learningPath.currentModule;
    const currentSection = learningPath.currentSection;
    
    // Determine next steps
    const nextSteps = await recommendationService.determineNextSteps(
      userId,
      progress,
      currentModule,
      currentSection
    );
    
    res.status(200).json({
      success: true,
      data: nextSteps,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get learning path status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getLearningPathStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return res.status(200).json({
        success: true,
        data: {
          totalCompletion: 0,
          moduleCompletion: {
            module1: 0,
            module2: 0,
            module3: 0,
          },
          completedSections: [],
          inProgressSections: [],
          notStartedSections: [],
        },
      });
    }
    
    // Calculate total completion
    let totalCompletion = 0;
    const moduleCompletion = {};
    const completedSections = [];
    const inProgressSections = [];
    const notStartedSections = [];
    
    // Get all sections structure
    const moduleStructure = {
      module1: ['origins', 'monastic-republic', 'through-ages', 'religious-life'],
      module2: ['overview', 'architecture', 'treasures', 'preservation'],
      module3: ['geography', 'flora-fauna', 'paths', 'conservation'],
    };
    
    // Process each module
    progress.modules.forEach(module => {
      moduleCompletion[module.id] = module.completion || 0;
      totalCompletion += module.completion || 0;
      
      // Get all sections for this module
      const allSections = moduleStructure[module.id] || [];
      
      // Track completed and in-progress sections
      module.sections.forEach(section => {
        const sectionInfo = {
          moduleId: module.id,
          sectionId: section.id,
          completion: section.completion || 0,
        };
        
        if (section.completion >= 100) {
          completedSections.push(sectionInfo);
        } else if (section.completion > 0) {
          inProgressSections.push(sectionInfo);
        }
      });
      
      // Find not started sections
      allSections.forEach(sectionId => {
        if (!module.sections.find(s => s.id === sectionId)) {
          notStartedSections.push({
            moduleId: module.id,
            sectionId,
            completion: 0,
          });
        }
      });
    });
    
    // Calculate average completion across modules
    totalCompletion = progress.modules.length > 0 
      ? Math.round(totalCompletion / progress.modules.length) 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalCompletion,
        moduleCompletion,
        completedSections,
        inProgressSections,
        notStartedSections,
      },
    });
  } catch (error) {
    next(error);
  }
};