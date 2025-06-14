// backend/controllers/adaptiveLearningController.js
const Progress = require('../models/Progress');
const Content = require('../models/Content');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Get personalized learning recommendations
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user progress and preferences
    const userProgress = await Progress.findOne({ userId });
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create default progress if none exists
    let progressToUse = userProgress;
    if (!progressToUse) {
      progressToUse = await createDefaultProgress(userId);
    }

    // Analyze performance for each module
    const recommendations = await generateRecommendations(userId, progressToUse, user);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error generating recommendations' });
  }
};

// Get adaptive content for a specific module - ENHANCED WITH VISUAL PRIORITIZATION
exports.getAdaptiveContent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;
    
    const userProgress = await Progress.findOne({ userId });
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create default progress if none exists
    let progressToUse = userProgress;
    if (!progressToUse) {
      progressToUse = await createDefaultProgress(userId);
    }

    // Get all content for the module
    const allContent = await Content.find({ moduleId: parseInt(moduleId) });
    
    // Apply enhanced adaptive filtering with visual content prioritization
    const adaptiveContent = await applyEnhancedAdaptiveFiltering(
      allContent, 
      progressToUse, 
      user, 
      parseInt(moduleId)
    );
    
    res.json(adaptiveContent);
  } catch (error) {
    console.error('Get adaptive content error:', error);
    res.status(500).json({ message: 'Server error getting adaptive content' });
  }
};

// Get adaptive quiz recommendations
exports.getAdaptiveQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;
    
    let userProgress = await Progress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = await createDefaultProgress(userId);
    }

    // Get all quizzes for the module
    const allQuizzes = await Quiz.find({ moduleId: parseInt(moduleId) });
    
    // Apply adaptive quiz filtering
    const adaptiveQuizzes = await applyAdaptiveQuizFiltering(
      allQuizzes, 
      userProgress, 
      parseInt(moduleId)
    );
    
    res.json(adaptiveQuizzes);
  } catch (error) {
    console.error('Get adaptive quizzes error:', error);
    res.status(500).json({ message: 'Server error getting adaptive quizzes' });
  }
};

// Track detailed user behavior - ENHANCED with content type tracking
exports.trackUserBehavior = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      contentId, 
      timeSpent, 
      interactions, 
      completed,
      difficulty,
      actionType,
      metadata 
    } = req.body;
    
    // Enhanced behavior entry with content type detection
    let contentType = 'text'; // default
    if (contentId) {
      const content = await Content.findById(contentId);
      if (content) {
        contentType = content.type;
      }
    }
    
    const behaviorEntry = {
      contentId,
      timeSpent: timeSpent || 0,
      interactions: interactions || 0,
      difficulty,
      actionType: actionType || 'view',
      metadata: {
        ...metadata,
        contentType, // Add content type to metadata
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    // Use atomic operation to avoid version conflicts
    let result = await Progress.findOneAndUpdate(
      { userId },
      { 
        $push: { behaviorData: behaviorEntry },
        $set: { updatedAt: new Date() }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // Initialize progress structure if needed
    if (!result.moduleProgress || result.moduleProgress.length === 0) {
      result = await Progress.findOneAndUpdate(
        { userId },
        {
          $set: {
            moduleProgress: [
              { moduleId: 1, progress: 0 },
              { moduleId: 2, progress: 0 },
              { moduleId: 3, progress: 0 }
            ]
          }
        },
        { new: true }
      );
    }

    // Update derived preferences based on behavior
    if (result.behaviorData && result.behaviorData.length % 5 === 0) {
      await updateDerivedPreferences(userId, result.behaviorData);
    }

    // Handle content progress update if provided
    if (contentId && (completed !== undefined || timeSpent > 0)) {
      await updateContentProgressAtomic(userId, contentId, completed, timeSpent, interactions);
    }

    res.json({ message: 'Behavior tracked successfully' });
  } catch (error) {
    console.error('Track behavior error:', error);
    res.status(500).json({ message: 'Server error tracking behavior' });
  }
};

// Enhanced function to update derived preferences based on behavior patterns
async function updateDerivedPreferences(userId, behaviorData) {
  try {
    const recentBehavior = behaviorData.slice(-20); // Last 20 interactions
    
    // Analyze content type preferences
    const contentTypeInteractions = {};
    const contentTypeTime = {};
    
    recentBehavior.forEach(behavior => {
      const contentType = behavior.metadata?.contentType || 'text';
      contentTypeInteractions[contentType] = (contentTypeInteractions[contentType] || 0) + behavior.interactions;
      contentTypeTime[contentType] = (contentTypeTime[contentType] || 0) + behavior.timeSpent;
    });

    // Calculate engagement scores for each content type
    const engagementScores = {};
    Object.keys(contentTypeInteractions).forEach(type => {
      const avgInteractions = contentTypeInteractions[type] / recentBehavior.filter(b => 
        (b.metadata?.contentType || 'text') === type
      ).length;
      const avgTime = contentTypeTime[type] / recentBehavior.filter(b => 
        (b.metadata?.contentType || 'text') === type
      ).length;
      
      // Engagement score based on interactions and time
      engagementScores[type] = (avgInteractions * 0.4) + (avgTime / 100 * 0.6);
    });

    // Determine preferred content type
    let preferredContentType = 'text';
    let maxEngagement = 0;
    
    Object.keys(engagementScores).forEach(type => {
      if (engagementScores[type] > maxEngagement) {
        maxEngagement = engagementScores[type];
        preferredContentType = type;
      }
    });

    // Analyze learning pace
    const avgTimePerContent = recentBehavior.reduce((sum, b) => sum + b.timeSpent, 0) / recentBehavior.length;
    let learningPace = 'medium';
    if (avgTimePerContent < 90) learningPace = 'fast';      // Less than 1.5 minutes
    else if (avgTimePerContent > 240) learningPace = 'slow'; // More than 4 minutes

    // Analyze difficulty preference
    const struggleCount = recentBehavior.filter(b => b.actionType === 'struggle').length;
    const quickExitCount = recentBehavior.filter(b => b.actionType === 'quick_exit').length;
    
    let difficultyPreference = 'mixed';
    if (struggleCount > recentBehavior.length * 0.3) {
      difficultyPreference = 'basic'; // Struggling too much
    } else if (quickExitCount < recentBehavior.length * 0.1 && avgTimePerContent > 150) {
      difficultyPreference = 'advanced'; // Finding content engaging and not quick-exiting
    }

    // Update derived preferences
    await Progress.updateOne(
      { userId },
      {
        $set: {
          'derivedPreferences.preferredContentType': preferredContentType,
          'derivedPreferences.averageTimePerContent': avgTimePerContent,
          'derivedPreferences.learningPace': learningPace,
          'derivedPreferences.difficultyPreference': difficultyPreference,
          'derivedPreferences.lastAnalysisDate': new Date(),
          'derivedPreferences.engagementScores': engagementScores
        }
      }
    );

    console.log(`Updated preferences for user ${userId}:`, {
      preferredContentType,
      learningPace,
      difficultyPreference,
      engagementScores
    });

  } catch (error) {
    console.error('Error updating derived preferences:', error);
  }
}

// ENHANCED adaptive filtering with sophisticated visual content prioritization
async function applyEnhancedAdaptiveFiltering(allContent, userProgress, user, moduleId) {
  try {
    const moduleAnalysis = await analyzeModulePerformance(user._id, userProgress, moduleId);
    
    let filteredContent = [...allContent];

    // Get user's explicit learning style preference
    const userLearningStyle = user.preferences?.learningStyle || 'visual';
    
    // Get derived preferences from behavior analysis
    const derivedPreferences = userProgress.derivedPreferences || {};
    const behaviorBasedContentType = derivedPreferences.preferredContentType || userLearningStyle;

    // Create content type priority based on both explicit preference and behavior
    const contentTypePriority = determineContentTypePriority(
      userLearningStyle, 
      behaviorBasedContentType,
      derivedPreferences.engagementScores || {}
    );

    // Sort content by type preference
    filteredContent.sort((a, b) => {
      const aPriority = contentTypePriority[a.type] || 0;
      const bPriority = contentTypePriority[b.type] || 0;
      
      // Higher priority values come first
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // If same priority, consider difficulty based on performance
      if (moduleAnalysis.needsRemediation) {
        // Prioritize basic content for struggling students
        if (a.difficulty === 'basic' && b.difficulty === 'advanced') return -1;
        if (a.difficulty === 'advanced' && b.difficulty === 'basic') return 1;
      } else if (moduleAnalysis.readyForAdvanced) {
        // Prioritize advanced content for high performers
        if (a.difficulty === 'advanced' && b.difficulty === 'basic') return -1;
        if (a.difficulty === 'basic' && b.difficulty === 'advanced') return 1;
      }
      
      return 0;
    });

    // Add enhanced adaptive metadata with visual learning insights
    return filteredContent.map(content => ({
      ...content.toObject(),
      adaptiveMetadata: {
        recommended: isContentRecommendedEnhanced(content, moduleAnalysis, userProgress, userLearningStyle),
        reason: getEnhancedRecommendationReason(content, moduleAnalysis, userProgress, userLearningStyle, behaviorBasedContentType),
        priority: getEnhancedContentPriority(content, moduleAnalysis, userProgress, contentTypePriority),
        learningStyleMatch: contentTypePriority[content.type] || 0,
        visualLearnerBoost: userLearningStyle === 'visual' && content.type !== 'text',
        behaviorMatch: content.type === behaviorBasedContentType
      }
    }));
  } catch (error) {
    console.error('Error applying enhanced adaptive filtering:', error);
    return allContent.map(content => ({
      ...content.toObject(),
      adaptiveMetadata: {
        recommended: false,
        reason: 'Error in adaptive filtering',
        priority: 'medium'
      }
    }));
  }
}

// Determine content type priority based on learning style and behavior
function determineContentTypePriority(userLearningStyle, behaviorBasedContentType, engagementScores) {
  const basePriority = {
    text: 1,
    image: 2,
    video: 3
  };

  // Adjust based on user's explicit learning style
  if (userLearningStyle === 'visual') {
    basePriority.image += 3;
    basePriority.video += 3;
    basePriority.text += 0;
  } else if (userLearningStyle === 'textual') {
    basePriority.text += 3;
    basePriority.image += 1;
    basePriority.video += 1;
  }

  // Further adjust based on derived behavior preferences
  if (behaviorBasedContentType && behaviorBasedContentType !== userLearningStyle) {
    basePriority[behaviorBasedContentType] += 2; // Boost based on actual behavior
  }

  // Apply engagement score boosts
  Object.keys(engagementScores).forEach(type => {
    const score = engagementScores[type] || 0;
    basePriority[type] = (basePriority[type] || 0) + Math.round(score / 2);
  });

  return basePriority;
}

// Enhanced content recommendation logic
function isContentRecommendedEnhanced(content, moduleAnalysis, userProgress, userLearningStyle) {
  try {
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    // Always recommend uncompleted content
    if (!contentProgress || !contentProgress.completed) {
      return true;
    }

    // Recommend visual content for visual learners even if completed
    if (userLearningStyle === 'visual' && content.type !== 'text') {
      return true;
    }

    // Recommend based on performance needs
    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      return true;
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Enhanced recommendation reasoning
function getEnhancedRecommendationReason(content, moduleAnalysis, userProgress, userLearningStyle, behaviorBasedContentType) {
  try {
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    if (!contentProgress || !contentProgress.completed) {
      if (userLearningStyle === 'visual' && content.type !== 'text') {
        return `Perfect for visual learners - ${content.type} content matches your preference`;
      } else if (userLearningStyle === 'textual' && content.type === 'text') {
        return `Ideal for text-based learning - matches your reading preference`;
      } else {
        return 'New content ready to explore';
      }
    }

    if (behaviorBasedContentType === content.type) {
      return `You've shown strong engagement with ${content.type} content`;
    }

    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      return 'Recommended for review - strengthen your foundation';
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      return 'Advanced challenge - you\'re ready for complex material';
    }

    if (userLearningStyle === 'visual' && content.type !== 'text') {
      return `Visual content - great for ${content.type}-based learning`;
    }

    return 'Additional learning opportunity';
  } catch (error) {
    return 'Recommended content';
  }
}

// Enhanced priority calculation
function getEnhancedContentPriority(content, moduleAnalysis, userProgress, contentTypePriority) {
  try {
    let priority = 'medium';
    
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    // High priority for uncompleted content
    if (!contentProgress || !contentProgress.completed) {
      priority = 'high';
    }

    // Adjust based on content type preference
    const typeScore = contentTypePriority[content.type] || 0;
    if (typeScore >= 5) {
      priority = 'high';
    } else if (typeScore >= 3) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Override for performance-based needs
    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      priority = 'high';
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      priority = 'high';
    }

    return priority;
  } catch (error) {
    return 'medium';
  }
}

// Helper function to create default progress (unchanged)
async function createDefaultProgress(userId) {
  try {
    const defaultProgress = new Progress({
      userId,
      contentProgress: [],
      quizResults: [],
      moduleProgress: [
        { moduleId: 1, progress: 0 },
        { moduleId: 2, progress: 0 },
        { moduleId: 3, progress: 0 }
      ],
      behaviorData: [],
      derivedPreferences: {
        preferredContentType: 'text',
        averageTimePerContent: 0,
        learningPace: 'medium',
        difficultyPreference: 'mixed',
        engagementScores: {}
      },
      recommendations: {
        nextContent: [],
        remedialContent: [],
        advancedContent: []
      }
    });

    return await defaultProgress.save();
  } catch (error) {
    console.error('Error creating default progress:', error);
    throw error;
  }
}

// Helper function to update content progress atomically (unchanged)
async function updateContentProgressAtomic(userId, contentId, completed, timeSpent, interactions) {
  try {
    const existing = await Progress.findOne({
      userId,
      'contentProgress.contentId': contentId
    });

    if (existing) {
      await Progress.updateOne(
        { 
          userId,
          'contentProgress.contentId': contentId 
        },
        {
          $set: {
            'contentProgress.$.completed': completed,
            'contentProgress.$.lastAccessed': new Date(),
            'contentProgress.$.timeSpent': timeSpent || 0,
            'contentProgress.$.interactions': interactions || 0,
            updatedAt: new Date()
          }
        }
      );
    } else {
      await Progress.updateOne(
        { userId },
        {
          $push: {
            contentProgress: {
              contentId,
              completed: completed || false,
              lastAccessed: new Date(),
              timeSpent: timeSpent || 0,
              interactions: interactions || 0
            }
          },
          $set: { updatedAt: new Date() }
        }
      );
    }
  } catch (error) {
    console.error('Error updating content progress atomically:', error);
    throw error;
  }
}

// [Include all other existing functions from the original controller...]
// (analyzeModulePerformance, generateRecommendations, applyAdaptiveQuizFiltering, etc.)
// These remain unchanged from the original implementation

// Analyze performance for a specific module
async function analyzeModulePerformance(userId, userProgress, moduleId) {
  try {
    const moduleQuizzes = await Quiz.find({ moduleId });
    const moduleQuizIds = moduleQuizzes.map(quiz => quiz._id.toString());
    
    const moduleQuizResults = userProgress.quizResults.filter(
      result => moduleQuizIds.includes(result.quizId.toString())
    );

    const moduleContent = await Content.find({ moduleId });
    const moduleContentIds = moduleContent.map(content => content._id.toString());
    
    const moduleContentProgress = userProgress.contentProgress.filter(
      progress => moduleContentIds.includes(progress.contentId.toString())
    );

    const totalQuizzes = moduleQuizzes.length;
    const completedQuizzes = moduleQuizResults.length;
    const averageScore = moduleQuizResults.length > 0 
      ? moduleQuizResults.reduce((sum, result) => sum + result.score, 0) / moduleQuizResults.length 
      : 0;
    
    const totalContent = moduleContent.length;
    const completedContent = moduleContentProgress.filter(p => p.completed).length;
    
    const struggleAreas = [];
    const strengthAreas = [];
    
    moduleQuizResults.forEach(result => {
      if (result.score < 60) {
        struggleAreas.push(result.quizId);
      } else if (result.score > 85) {
        strengthAreas.push(result.quizId);
      }
    });

    const avgTimePerContent = moduleContentProgress.length > 0
      ? moduleContentProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / moduleContentProgress.length
      : 0;

    return {
      moduleId,
      totalQuizzes,
      completedQuizzes,
      averageScore: Math.round(averageScore),
      totalContent,
      completedContent,
      completionRate: totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0,
      struggleAreas,
      strengthAreas,
      avgTimePerContent,
      needsRemediation: averageScore < 60,
      readyForAdvanced: averageScore > 85 && completedContent >= totalContent * 0.8
    };
  } catch (error) {
    console.error('Error analyzing module performance:', error);
    return {
      moduleId,
      totalQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      totalContent: 0,
      completedContent: 0,
      completionRate: 0,
      struggleAreas: [],
      strengthAreas: [],
      avgTimePerContent: 0,
      needsRemediation: false,
      readyForAdvanced: false
    };
  }
}

// Generate personalized recommendations based on performance
async function generateRecommendations(userId, userProgress, user) {
  const recommendations = {
    nextContent: [],
    remedialContent: [],
    advancedContent: [],
    suggestedQuizzes: [],
    learningPath: [],
    performanceInsights: {}
  };

  try {
    for (let moduleId = 1; moduleId <= 3; moduleId++) {
      const moduleAnalysis = await analyzeModulePerformance(userId, userProgress, moduleId);
      
      if (moduleAnalysis.averageScore < 60) {
        const remedialContent = await Content.find({ 
          moduleId, 
          difficulty: 'basic' 
        }).limit(3);
        recommendations.remedialContent.push(...remedialContent);
        
      } else if (moduleAnalysis.averageScore > 85) {
        const advancedContent = await Content.find({ 
          moduleId, 
          difficulty: 'advanced' 
        }).limit(3);
        recommendations.advancedContent.push(...advancedContent);
      }

      const nextContent = await getNextRecommendedContent(userProgress, moduleId, user);
      if (nextContent.length > 0) {
        recommendations.nextContent.push(...nextContent);
      }

      recommendations.performanceInsights[`module${moduleId}`] = moduleAnalysis;
    }

    recommendations.learningPath = await generateLearningPath(userProgress, user);

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return recommendations;
  }
}

// Apply adaptive filtering to quizzes
async function applyAdaptiveQuizFiltering(allQuizzes, userProgress, moduleId) {
  try {
    const moduleAnalysis = await analyzeModulePerformance(userProgress.userId, userProgress, moduleId);
    
    return allQuizzes.map(quiz => {
      const attemptedQuiz = userProgress.quizResults.find(
        result => result.quizId.toString() === quiz._id.toString()
      );

      let adaptiveMetadata = {
        recommended: false,
        reason: '',
        lastScore: attemptedQuiz ? attemptedQuiz.score : null,
        shouldRetake: false
      };

      if (!attemptedQuiz) {
        adaptiveMetadata.recommended = true;
        adaptiveMetadata.reason = 'Not attempted yet';
      } else if (attemptedQuiz.score < 70) {
        adaptiveMetadata.recommended = true;
        adaptiveMetadata.shouldRetake = true;
        adaptiveMetadata.reason = 'Retake recommended - previous score below 70%';
      } else if (attemptedQuiz.score > 85 && moduleAnalysis.readyForAdvanced) {
        adaptiveMetadata.recommended = false;
        adaptiveMetadata.reason = 'Excellent performance - consider advanced content';
      }

      return {
        ...quiz.toObject(),
        adaptiveMetadata
      };
    });
  } catch (error) {
    console.error('Error applying adaptive quiz filtering:', error);
    return allQuizzes.map(quiz => ({
      ...quiz.toObject(),
      adaptiveMetadata: {
        recommended: false,
        reason: 'Error in adaptive filtering',
        lastScore: null,
        shouldRetake: false
      }
    }));
  }
}

// Get next recommended content
async function getNextRecommendedContent(userProgress, moduleId, user) {
  try {
    const moduleContent = await Content.find({ moduleId });
    const completedContentIds = userProgress.contentProgress
      .filter(p => p.completed)
      .map(p => p.contentId.toString());

    const uncompletedContent = moduleContent.filter(
      content => !completedContentIds.includes(content._id.toString())
    );

    const userLearningStyle = user.preferences?.learningStyle || 'visual';
    
    const sortedContent = uncompletedContent.sort((a, b) => {
      // Prioritize by learning style
      if (userLearningStyle === 'visual') {
        if (a.type !== 'text' && b.type === 'text') return -1;
        if (a.type === 'text' && b.type !== 'text') return 1;
      } else {
        if (a.type === 'text' && b.type !== 'text') return -1;
        if (a.type !== 'text' && b.type === 'text') return 1;
      }
      
      const aValue = a.difficulty === 'basic' ? 0 : 1;
      const bValue = b.difficulty === 'basic' ? 0 : 1;
      return aValue - bValue;
    });

    return sortedContent.slice(0, 3);
  } catch (error) {
    console.error('Error getting next recommended content:', error);
    return [];
  }
}

// Generate learning path
async function generateLearningPath(userProgress, user) {
  const learningPath = [];

  try {
    for (let moduleId = 1; moduleId <= 3; moduleId++) {
      const moduleAnalysis = await analyzeModulePerformance(user._id, userProgress, moduleId);
      
      let pathStep = {
        moduleId,
        status: 'not_started',
        recommendation: '',
        nextActions: []
      };

      if (moduleAnalysis.completedContent === 0) {
        pathStep.status = 'not_started';
        pathStep.recommendation = 'Start with basic content in this module';
        pathStep.nextActions = ['Begin with introductory content', 'Complete basic exercises'];
      } else if (moduleAnalysis.completionRate < 50) {
        pathStep.status = 'in_progress';
        pathStep.recommendation = 'Continue completing content';
        pathStep.nextActions = ['Complete remaining content', 'Focus on understanding'];
      } else if (moduleAnalysis.averageScore < 60) {
        pathStep.status = 'needs_review';
        pathStep.recommendation = 'Review material and retake quizzes';
        pathStep.nextActions = ['Review weak areas', 'Retake failed quizzes', 'Study remedial content'];
      } else if (moduleAnalysis.averageScore > 85) {
        pathStep.status = 'advanced_ready';
        pathStep.recommendation = 'Ready for advanced content';
        pathStep.nextActions = ['Explore advanced topics', 'Try challenging exercises'];
      } else {
        pathStep.status = 'completed';
        pathStep.recommendation = 'Module completed successfully';
        pathStep.nextActions = ['Move to next module', 'Review occasionally'];
      }

      learningPath.push(pathStep);
    }

    return learningPath;
  } catch (error) {
    console.error('Error generating learning path:', error);
    return [];
  }
}