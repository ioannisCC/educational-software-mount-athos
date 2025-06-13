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

// Get adaptive content for a specific module
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
    
    // Apply adaptive filtering
    const adaptiveContent = await applyAdaptiveFiltering(
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

// Track detailed user behavior - FIXED with atomic operations
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
    
    // Use atomic operation to avoid version conflicts
    const behaviorEntry = {
      contentId,
      timeSpent: timeSpent || 0,
      interactions: interactions || 0,
      difficulty,
      actionType: actionType || 'view',
      metadata: metadata || {},
      timestamp: new Date()
    };

    // First, try to add behavior data atomically
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

    // If document was created (upserted), initialize it properly
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

// Helper function to create default progress
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
        difficultyPreference: 'mixed'
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

// Helper function to update content progress atomically
async function updateContentProgressAtomic(userId, contentId, completed, timeSpent, interactions) {
  try {
    // Check if content progress already exists
    const existing = await Progress.findOne({
      userId,
      'contentProgress.contentId': contentId
    });

    if (existing) {
      // Update existing content progress
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
      // Add new content progress
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
    // Analyze performance for each module
    for (let moduleId = 1; moduleId <= 3; moduleId++) {
      const moduleAnalysis = await analyzeModulePerformance(userId, userProgress, moduleId);
      
      // Generate content recommendations based on performance
      if (moduleAnalysis.averageScore < 60) {
        // Poor performance - recommend remedial content
        const remedialContent = await Content.find({ 
          moduleId, 
          difficulty: 'basic' 
        }).limit(3);
        recommendations.remedialContent.push(...remedialContent);
        
      } else if (moduleAnalysis.averageScore > 85) {
        // Excellent performance - recommend advanced content
        const advancedContent = await Content.find({ 
          moduleId, 
          difficulty: 'advanced' 
        }).limit(3);
        recommendations.advancedContent.push(...advancedContent);
      }

      // Recommend next content based on completion and difficulty
      const nextContent = await getNextRecommendedContent(userProgress, moduleId, user);
      if (nextContent.length > 0) {
        recommendations.nextContent.push(...nextContent);
      }

      recommendations.performanceInsights[`module${moduleId}`] = moduleAnalysis;
    }

    // Generate learning path
    recommendations.learningPath = await generateLearningPath(userProgress, user);

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return recommendations; // Return empty recommendations on error
  }
}

// Analyze performance for a specific module
async function analyzeModulePerformance(userId, userProgress, moduleId) {
  try {
    // Get quiz results for this module
    const moduleQuizzes = await Quiz.find({ moduleId });
    const moduleQuizIds = moduleQuizzes.map(quiz => quiz._id.toString());
    
    const moduleQuizResults = userProgress.quizResults.filter(
      result => moduleQuizIds.includes(result.quizId.toString())
    );

    // Get content progress for this module
    const moduleContent = await Content.find({ moduleId });
    const moduleContentIds = moduleContent.map(content => content._id.toString());
    
    const moduleContentProgress = userProgress.contentProgress.filter(
      progress => moduleContentIds.includes(progress.contentId.toString())
    );

    // Calculate metrics
    const totalQuizzes = moduleQuizzes.length;
    const completedQuizzes = moduleQuizResults.length;
    const averageScore = moduleQuizResults.length > 0 
      ? moduleQuizResults.reduce((sum, result) => sum + result.score, 0) / moduleQuizResults.length 
      : 0;
    
    const totalContent = moduleContent.length;
    const completedContent = moduleContentProgress.filter(p => p.completed).length;
    
    // Identify struggle areas
    const struggleAreas = [];
    const strengthAreas = [];
    
    moduleQuizResults.forEach(result => {
      if (result.score < 60) {
        struggleAreas.push(result.quizId);
      } else if (result.score > 85) {
        strengthAreas.push(result.quizId);
      }
    });

    // Calculate time analysis
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

// Apply adaptive filtering to content
async function applyAdaptiveFiltering(allContent, userProgress, user, moduleId) {
  try {
    const moduleAnalysis = await analyzeModulePerformance(user._id, userProgress, moduleId);
    
    let filteredContent = [...allContent];

    // Filter by learning style preference
    const visualContent = filteredContent.filter(c => c.type !== 'text');
    const textualContent = filteredContent.filter(c => c.type === 'text');
    
    if (user.preferences?.learningStyle === 'visual') {
      filteredContent = [...visualContent, ...textualContent];
    } else {
      filteredContent = [...textualContent, ...visualContent];
    }

    // Adapt based on performance
    if (moduleAnalysis.needsRemediation) {
      // Prioritize basic content for struggling students
      const basicContent = filteredContent.filter(c => c.difficulty === 'basic');
      const advancedContent = filteredContent.filter(c => c.difficulty === 'advanced');
      filteredContent = [...basicContent, ...advancedContent];
    } else if (moduleAnalysis.readyForAdvanced) {
      // Prioritize advanced content for high performers
      const advancedContent = filteredContent.filter(c => c.difficulty === 'advanced');
      const basicContent = filteredContent.filter(c => c.difficulty === 'basic');
      filteredContent = [...advancedContent, ...basicContent];
    }

    // Add adaptive metadata
    return filteredContent.map(content => ({
      ...content.toObject(),
      adaptiveMetadata: {
        recommended: isContentRecommended(content, moduleAnalysis, userProgress),
        reason: getRecommendationReason(content, moduleAnalysis, userProgress),
        priority: getContentPriority(content, moduleAnalysis, userProgress)
      }
    }));
  } catch (error) {
    console.error('Error applying adaptive filtering:', error);
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

// Apply adaptive filtering to quizzes
async function applyAdaptiveQuizFiltering(allQuizzes, userProgress, moduleId) {
  try {
    const moduleAnalysis = await analyzeModulePerformance(userProgress.userId, userProgress, moduleId);
    
    return allQuizzes.map(quiz => {
      // Check if quiz was already attempted
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

    // Find uncompleted content
    const uncompletedContent = moduleContent.filter(
      content => !completedContentIds.includes(content._id.toString())
    );

    // Sort by difficulty and user preference
    const sortedContent = uncompletedContent.sort((a, b) => {
      // Prioritize by learning style
      if (user.preferences?.learningStyle === 'visual') {
        if (a.type !== 'text' && b.type === 'text') return -1;
        if (a.type === 'text' && b.type !== 'text') return 1;
      } else {
        if (a.type === 'text' && b.type !== 'text') return -1;
        if (a.type !== 'text' && b.type === 'text') return 1;
      }
      
      // Then by difficulty (basic first for struggling students)
      const aValue = a.difficulty === 'basic' ? 0 : 1;
      const bValue = b.difficulty === 'basic' ? 0 : 1;
      return aValue - bValue;
    });

    return sortedContent.slice(0, 3); // Return top 3 recommendations
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

// Helper functions
function isContentRecommended(content, moduleAnalysis, userProgress) {
  try {
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    if (!contentProgress || !contentProgress.completed) {
      return true; // Uncompleted content is recommended
    }

    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      return true; // Basic content for struggling students
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      return true; // Advanced content for high performers
    }

    return false;
  } catch (error) {
    return false;
  }
}

function getRecommendationReason(content, moduleAnalysis, userProgress) {
  try {
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    if (!contentProgress || !contentProgress.completed) {
      return 'Not completed yet';
    }

    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      return 'Recommended for review - strengthen basics';
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      return 'Advanced content - you\'re ready for the challenge';
    }

    return 'Optional review';
  } catch (error) {
    return 'Error determining reason';
  }
}

function getContentPriority(content, moduleAnalysis, userProgress) {
  try {
    const contentProgress = userProgress.contentProgress.find(
      p => p.contentId.toString() === content._id.toString()
    );

    if (!contentProgress || !contentProgress.completed) {
      return content.difficulty === 'basic' ? 'high' : 'medium';
    }

    if (moduleAnalysis.needsRemediation && content.difficulty === 'basic') {
      return 'high';
    }

    if (moduleAnalysis.readyForAdvanced && content.difficulty === 'advanced') {
      return 'high';
    }

    return 'low';
  } catch (error) {
    return 'medium';
  }
}