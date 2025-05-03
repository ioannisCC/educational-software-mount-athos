/**
 * Recommendation Service
 * 
 * Provides content recommendation functionality for the Mount Athos Explorer
 * educational application.
 */

const Content = require('../models/Content');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const config = require('../config/config');
const { logger } = require('../middleware/logger');
const adaptiveService = require('./adaptiveService');

/**
 * Generate content recommendations based on user preferences and progress
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Array>} - Recommended content
 */
exports.generateContentRecommendations = async (userId, preferences = {}) => {
  try {
    const { learningStyle = 'balanced', difficulty = 'beginner' } = preferences;
    
    // Get user progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return await getInitialRecommendations(learningStyle, difficulty);
    }
    
    // Get completed content IDs
    const completedContentIds = progress.contentProgress
      .filter(cp => cp.completed)
      .map(cp => cp.contentId);
    
    // Get weights for different recommendation factors
    const weights = config.ADAPTIVE_LEARNING.weights;
    
    // Determine current module and section
    let currentModule = 'module1';
    let currentSection = 'origins';
    
    // Find most recently accessed module and section
    if (progress.modules.length > 0) {
      // Sort modules by last accessed time
      const sortedModules = [...progress.modules].sort((a, b) => {
        return new Date(b.lastAccessed) - new Date(a.lastAccessed);
      });
      
      currentModule = sortedModules[0].id;
      
      // Find most recently accessed section in this module
      if (sortedModules[0].sections && sortedModules[0].sections.length > 0) {
        const sortedSections = [...sortedModules[0].sections].sort((a, b) => {
          return new Date(b.lastAccessed) - new Date(a.lastAccessed);
        });
        
        currentSection = sortedSections[0].id;
      }
    }
    
    // Combine different recommendation strategies
    const [
      currentSectionContent,
      nextSectionContent,
      learningStyleContent,
      quizPerformanceContent,
      popularContent,
    ] = await Promise.all([
      // 1. Current section incomplete content
      Content.find({
        moduleId: currentModule,
        sectionId: currentSection,
        _id: { $nin: completedContentIds },
        isPublished: true,
      }).limit(5),
      
      // 2. Next section content
      getNextSectionContent(currentModule, currentSection, completedContentIds),
      
      // 3. Content matching learning style
      Content.find({
        'metadata.learningStyles': learningStyle,
        'metadata.difficulty': difficulty,
        _id: { $nin: completedContentIds },
        isPublished: true,
      }).limit(5),
      
      // 4. Content based on quiz performance
      getContentBasedOnQuizPerformance(userId, progress),
      
      // 5. Popular content
      Content.find({
        _id: { $nin: completedContentIds },
        isPublished: true,
      }).sort({ views: -1 }).limit(5),
    ]);
    
    // Score and combine recommendations
    const scoredRecommendations = [];
    
    // Process current section content (highest priority)
    currentSectionContent.forEach(content => {
      scoredRecommendations.push({
        content,
        score: 10 * weights.contentInteraction,
        reason: 'Continue your current section',
      });
    });
    
    // Process next section content
    nextSectionContent.forEach(content => {
      scoredRecommendations.push({
        content,
        score: 8 * weights.contentInteraction,
        reason: 'Next section content',
      });
    });
    
    // Process learning style content
    learningStyleContent.forEach(content => {
      scoredRecommendations.push({
        content,
        score: 7 * weights.learningStyle,
        reason: `Matches your ${learningStyle} learning style`,
      });
    });
    
    // Process quiz performance content
    quizPerformanceContent.forEach(content => {
      scoredRecommendations.push({
        content,
        score: 9 * weights.quizPerformance,
        reason: 'Based on your quiz performance',
      });
    });
    
    // Process popular content
    popularContent.forEach(content => {
      scoredRecommendations.push({
        content,
        score: 5 * weights.popularity,
        reason: 'Popular among other learners',
      });
    });
    
    // Remove duplicates (keep highest score)
    const uniqueRecommendations = [];
    const seenContentIds = new Set();
    
    for (const recommendation of scoredRecommendations) {
      const contentId = recommendation.content._id.toString();
      
      if (!seenContentIds.has(contentId)) {
        seenContentIds.add(contentId);
        uniqueRecommendations.push(recommendation);
      } else {
        // Update existing recommendation if score is higher
        const existingIndex = uniqueRecommendations.findIndex(
          r => r.content._id.toString() === contentId
        );
        
        if (existingIndex !== -1 && recommendation.score > uniqueRecommendations[existingIndex].score) {
          uniqueRecommendations[existingIndex] = recommendation;
        }
      }
    }
    
    // Sort by score and return
    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch (error) {
    logger.error(`Error generating content recommendations: ${error.message}`);
    return [];
  }
};

/**
 * Get initial recommendations for new users
 * @param {string} learningStyle - Learning style preference
 * @param {string} difficulty - Difficulty preference
 * @returns {Promise<Array>} - Initial recommendations
 */
async function getInitialRecommendations(learningStyle, difficulty) {
  try {
    // Start with module1/origins content
    const startingContent = await Content.find({
      moduleId: 'module1',
      sectionId: 'origins',
      isPublished: true,
    }).sort({ order: 1 }).limit(3);
    
    // Get content matching learning style
    const styleContent = await Content.find({
      'metadata.learningStyles': learningStyle,
      'metadata.difficulty': difficulty,
      isPublished: true,
    }).limit(3);
    
    // Get popular content
    const popularContent = await Content.find({
      isPublished: true,
    }).sort({ views: -1 }).limit(4);
    
    // Combine and score recommendations
    const recommendations = [
      ...startingContent.map(content => ({
        content,
        score: 10,
        reason: 'Recommended for beginners',
      })),
      ...styleContent.map(content => ({
        content,
        score: 8,
        reason: `Matches your ${learningStyle} learning style`,
      })),
      ...popularContent.map(content => ({
        content,
        score: 6,
        reason: 'Popular among other learners',
      })),
    ];
    
    // Remove duplicates (keep highest score)
    const uniqueRecommendations = [];
    const seenContentIds = new Set();
    
    for (const recommendation of recommendations) {
      const contentId = recommendation.content._id.toString();
      
      if (!seenContentIds.has(contentId)) {
        seenContentIds.add(contentId);
        uniqueRecommendations.push(recommendation);
      } else {
        // Update existing recommendation if score is higher
        const existingIndex = uniqueRecommendations.findIndex(
          r => r.content._id.toString() === contentId
        );
        
        if (existingIndex !== -1 && recommendation.score > uniqueRecommendations[existingIndex].score) {
          uniqueRecommendations[existingIndex] = recommendation;
        }
      }
    }
    
    // Sort by score and return
    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch (error) {
    logger.error(`Error getting initial recommendations: ${error.message}`);
    return [];
  }
}

/**
 * Get content from the next logical section
 * @param {string} currentModule - Current module
 * @param {string} currentSection - Current section
 * @param {Array} completedContentIds - IDs of already completed content
 * @returns {Promise<Array>} - Next section content
 */
async function getNextSectionContent(currentModule, currentSection, completedContentIds) {
  try {
    // Get next section
    const nextSection = await adaptiveService.determineNextSection(currentModule, currentSection);
    
    if (!nextSection) {
      return [];
    }
    
    // Get content from next section
    return await Content.find({
      moduleId: nextSection.moduleId,
      sectionId: nextSection.sectionId,
      _id: { $nin: completedContentIds },
      isPublished: true,
    }).sort({ order: 1 }).limit(3);
  } catch (error) {
    logger.error(`Error getting next section content: ${error.message}`);
    return [];
  }
}

/**
 * Get content recommendations based on quiz performance
 * @param {string} userId - User ID
 * @param {Object} progress - User progress data
 * @returns {Promise<Array>} - Recommended content
 */
async function getContentBasedOnQuizPerformance(userId, progress) {
  try {
    // Check if user has any quiz progress
    if (!progress.quizProgress || progress.quizProgress.length === 0) {
      return [];
    }
    
    // Find quizzes with low scores
    const lowPerformanceQuizzes = progress.quizProgress.filter(
      qp => qp.score < config.ADAPTIVE_LEARNING.thresholds.lowPerformanceThreshold && qp.attempts > 0
    );
    
    if (lowPerformanceQuizzes.length === 0) {
      return [];
    }
    
    // Get content for sections with low quiz performance
    const contentPromises = lowPerformanceQuizzes.map(async quizProgress => {
      // Get content for this section with appropriate difficulty
      return Content.find({
        moduleId: quizProgress.moduleId,
        sectionId: quizProgress.sectionId,
        'metadata.difficulty': 'beginner',
        isPublished: true,
      }).limit(2);
    });
    
    const contentResults = await Promise.all(contentPromises);
    
    // Flatten and return unique content
    return Array.from(
      new Set(contentResults.flat().map(c => c._id.toString()))
    ).map(id => contentResults.flat().find(c => c._id.toString() === id));
  } catch (error) {
    logger.error(`Error getting quiz performance content: ${error.message}`);
    return [];
  }
}

/**
 * Determine next steps for a user's learning path
 * @param {string} userId - User ID
 * @param {Object} progress - User progress data
 * @param {string} currentModule - Current module
 * @param {string} currentSection - Current section
 * @returns {Promise<Object>} - Next steps
 */
exports.determineNextSteps = async (userId, progress, currentModule, currentSection) => {
  try {
    // If no progress, start with module1/origins
    if (!progress) {
      const firstContent = await Content.findOne({
        moduleId: 'module1',
        sectionId: 'origins',
        isPublished: true,
      }).sort({ order: 1 });
      
      return {
        moduleId: 'module1',
        sectionId: 'origins',
        completionStatus: 'not_started',
        nextContent: firstContent ? [firstContent] : [],
        quizStatus: 'not_started',
      };
    }
    
    // Get module and section progress
    const moduleProgress = progress.modules.find(m => m.id === currentModule);
    const sectionProgress = moduleProgress?.sections.find(s => s.id === currentSection);
    
    // Get completion status
    const moduleCompletion = moduleProgress ? moduleProgress.completion || 0 : 0;
    const sectionCompletion = sectionProgress ? sectionProgress.completion || 0 : 0;
    
    let completionStatus = 'not_started';
    
    if (sectionCompletion >= 100) {
      completionStatus = 'completed';
    } else if (sectionCompletion > 0) {
      completionStatus = 'in_progress';
    }
    
    // Get completed content IDs for this section
    const completedContentIds = progress.contentProgress
      .filter(cp => cp.moduleId === currentModule && cp.sectionId === currentSection && cp.completed)
      .map(cp => cp.contentId.toString());
    
    // Get incomplete content
    const incompleteContent = await Content.find({
      moduleId: currentModule,
      sectionId: currentSection,
      _id: { $nin: completedContentIds.map(id => mongoose.Types.ObjectId(id)) },
      isPublished: true,
    }).sort({ order: 1 });
    
    // Get quiz status
    const quiz = await Quiz.findOne({
      moduleId: currentModule,
      sectionId: currentSection,
      isPublished: true,
    });
    
    let quizStatus = 'not_started';
    let quizProgress = null;
    
    if (quiz) {
      quizProgress = progress.quizProgress.find(
        qp => qp.quizId.toString() === quiz._id.toString()
      );
      
      if (quizProgress) {
        if (quizProgress.completed) {
          quizStatus = 'completed';
        } else if (quizProgress.attempts > 0) {
          quizStatus = 'attempted';
        }
      }
    }
    
    // Determine next section when current is complete
    let nextSection = null;
    
    if (completionStatus === 'completed') {
      nextSection = await adaptiveService.determineNextSection(currentModule, currentSection);
    }
    
    return {
      moduleId: currentModule,
      sectionId: currentSection,
      completionStatus,
      moduleCompletion,
      sectionCompletion,
      nextContent: incompleteContent,
      quiz: quiz ? {
        id: quiz._id,
        title: quiz.title,
        status: quizStatus,
        attempts: quizProgress?.attempts || 0,
        score: quizProgress?.score || 0,
      } : null,
      nextSection: nextSection ? {
        moduleId: nextSection.moduleId,
        sectionId: nextSection.sectionId,
      } : null,
    };
  } catch (error) {
    logger.error(`Error determining next steps: ${error.message}`);
    return {
      moduleId: currentModule,
      sectionId: currentSection,
      completionStatus: 'unknown',
      nextContent: [],
      quizStatus: 'unknown',
    };
  }
};

/**
 * Get learning path overview
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Learning path overview
 */
exports.getLearningPathOverview = async (userId) => {
  try {
    // Get user progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return {
        overallCompletion: 0,
        moduleCompletion: {
          module1: 0,
          module2: 0,
          module3: 0,
        },
        completedSections: [],
        inProgressSections: [],
      };
    }
    
    // Calculate overall completion
    let totalCompletion = 0;
    const moduleCompletion = {};
    const completedSections = [];
    const inProgressSections = [];
    
    // Process modules
    progress.modules.forEach(module => {
      moduleCompletion[module.id] = module.completion || 0;
      totalCompletion += module.completion || 0;
      
      // Process sections
      module.sections.forEach(section => {
        const sectionInfo = {
          moduleId: module.id,
          sectionId: section.id,
          completion: section.completion || 0,
          lastAccessed: section.lastAccessed,
        };
        
        if (section.completion >= 100) {
          completedSections.push(sectionInfo);
        } else if (section.completion > 0) {
          inProgressSections.push(sectionInfo);
        }
      });
    });
    
    // Calculate overall completion percentage
    const overallCompletion = progress.modules.length > 0
      ? Math.round(totalCompletion / progress.modules.length)
      : 0;
    
    // Get current location
    let currentLocation = { moduleId: 'module1', sectionId: 'origins' };
    
    if (inProgressSections.length > 0) {
      // Find most recently accessed in-progress section
      const mostRecent = inProgressSections.reduce((most, section) => {
        return !most.lastAccessed || new Date(section.lastAccessed) > new Date(most.lastAccessed)
          ? section
          : most;
      }, { lastAccessed: null });
      
      currentLocation = {
        moduleId: mostRecent.moduleId,
        sectionId: mostRecent.sectionId,
      };
    } else if (completedSections.length > 0) {
      // Find most recently accessed completed section
      const mostRecent = completedSections.reduce((most, section) => {
        return !most.lastAccessed || new Date(section.lastAccessed) > new Date(most.lastAccessed)
          ? section
          : most;
      }, { lastAccessed: null });
      
      // Get next section after this one
      const nextSection = await adaptiveService.determineNextSection(
        mostRecent.moduleId,
        mostRecent.sectionId
      );
      
      if (nextSection) {
        currentLocation = nextSection;
      }
    }
    
    return {
      overallCompletion,
      moduleCompletion,
      completedSections,
      inProgressSections,
      currentLocation,
    };
  } catch (error) {
    logger.error(`Error getting learning path overview: ${error.message}`);
    return {
      overallCompletion: 0,
      moduleCompletion: {
        module1: 0,
        module2: 0,
        module3: 0,
      },
      completedSections: [],
      inProgressSections: [],
      currentLocation: { moduleId: 'module1', sectionId: 'origins' },
    };
  }
};