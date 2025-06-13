// backend/controllers/progressController.js

const Progress = require('../models/Progress');
const Content = require('../models/Content');
const Quiz = require('../models/Quiz');

// Get user's progress overview
exports.getProgressOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find or create progress document for user
    let userProgress = await Progress.findOne({ userId });
    
    if (!userProgress) {
      // Create with default structure
      userProgress = await createDefaultProgress(userId);
    }
    
    res.json({
      moduleProgress: userProgress.moduleProgress || [],
      completedContents: userProgress.contentProgress ? userProgress.contentProgress.filter(item => item.completed).length : 0,
      quizzesTaken: userProgress.quizResults ? userProgress.quizResults.length : 0
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ message: 'Server error retrieving progress' });
  }
};

// Mark content as viewed/completed - FIXED with atomic operations
exports.updateContentProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId, completed } = req.body;
    
    // Validate content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Use atomic operations to avoid version conflicts
    const updateResult = await updateContentProgressAtomic(userId, contentId, completed, content.moduleId);
    
    if (updateResult.success) {
      res.json({
        message: 'Progress updated',
        contentProgress: updateResult.contentProgress,
        moduleProgress: updateResult.moduleProgress
      });
    } else {
      res.status(500).json({ message: 'Failed to update progress' });
    }
  } catch (error) {
    console.error('Update content progress error:', error);
    res.status(500).json({ message: 'Server error updating progress' });
  }
};

// Save quiz results - FIXED with atomic operations
exports.saveQuizResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, score, answers } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Use atomic operation to save quiz results
    const quizResult = {
      quizId,
      score,
      answers,
      attemptNumber: 1,
      totalTimeSpent: 0,
      completedAt: new Date()
    };

    // Check if this quiz was already attempted
    const existingProgress = await Progress.findOne({
      userId,
      'quizResults.quizId': quizId
    });

    let updateResult;
    if (existingProgress) {
      // Update existing quiz result
      updateResult = await Progress.findOneAndUpdate(
        { 
          userId,
          'quizResults.quizId': quizId 
        },
        {
          $set: {
            'quizResults.$.score': score,
            'quizResults.$.answers': answers,
            'quizResults.$.completedAt': new Date(),
            updatedAt: new Date()
          },
          $inc: {
            'quizResults.$.attemptNumber': 1
          }
        },
        { new: true }
      );
    } else {
      // Add new quiz result
      updateResult = await Progress.findOneAndUpdate(
        { userId },
        {
          $push: { quizResults: quizResult },
          $set: { updatedAt: new Date() }
        },
        { 
          new: true, 
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      // If document was created, initialize it properly
      if (!updateResult.moduleProgress || updateResult.moduleProgress.length === 0) {
        updateResult = await Progress.findOneAndUpdate(
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
    }

    // Recalculate module progress separately to avoid conflicts
    setTimeout(() => {
      recalculateModuleProgressAsync(userId, quiz.moduleId);
    }, 100);
    
    res.json({
      message: 'Quiz results saved',
      quizResult: {
        quizId,
        score,
        answers
      }
    });
  } catch (error) {
    console.error('Save quiz results error:', error);
    res.status(500).json({ message: 'Server error saving quiz results' });
  }
};

// Get progress for a specific module
exports.getModuleProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;
    
    const userProgress = await Progress.findOne({ userId });
    
    if (!userProgress) {
      return res.json({
        moduleProgress: { moduleId: parseInt(moduleId), progress: 0 },
        contentProgress: [],
        quizResults: []
      });
    }
    
    // Filter progress for specific module
    const moduleProgress = userProgress.moduleProgress.find(
      item => item.moduleId === parseInt(moduleId)
    ) || { moduleId: parseInt(moduleId), progress: 0 };
    
    // Get content for this module to match with progress
    const moduleContent = await Content.find({ moduleId: parseInt(moduleId) });
    const moduleContentIds = moduleContent.map(item => item._id.toString());
    
    // Filter content progress for this module
    const contentProgress = userProgress.contentProgress.filter(
      item => moduleContentIds.includes(item.contentId.toString())
    );
    
    // Get quizzes for this module
    const moduleQuizzes = await Quiz.find({ moduleId: parseInt(moduleId) });
    const moduleQuizIds = moduleQuizzes.map(item => item._id.toString());
    
    // Filter quiz results for this module
    const quizResults = userProgress.quizResults.filter(
      item => moduleQuizIds.includes(item.quizId.toString())
    );
    
    res.json({
      moduleProgress,
      contentProgress,
      quizResults
    });
  } catch (error) {
    console.error('Get module progress error:', error);
    res.status(500).json({ message: 'Server error retrieving module progress' });
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
        difficultyPreference: 'mixed',
        lastAnalysisDate: new Date()
      },
      recommendations: {
        nextContent: [],
        remedialContent: [],
        advancedContent: [],
        lastUpdated: new Date()
      }
    });

    return await defaultProgress.save();
  } catch (error) {
    console.error('Error creating default progress:', error);
    throw error;
  }
}

// Atomic content progress update function
async function updateContentProgressAtomic(userId, contentId, completed, moduleId) {
  try {
    // Check if content progress already exists
    const existing = await Progress.findOne({
      userId,
      'contentProgress.contentId': contentId
    });

    let updateResult;
    if (existing) {
      // Update existing content progress
      updateResult = await Progress.findOneAndUpdate(
        { 
          userId,
          'contentProgress.contentId': contentId 
        },
        {
          $set: {
            'contentProgress.$.completed': completed,
            'contentProgress.$.lastAccessed': new Date(),
            updatedAt: new Date()
          }
        },
        { new: true }
      );
    } else {
      // Add new content progress
      updateResult = await Progress.findOneAndUpdate(
        { userId },
        {
          $push: {
            contentProgress: {
              contentId,
              completed: completed || false,
              lastAccessed: new Date(),
              timeSpent: 0,
              interactions: 0
            }
          },
          $set: { updatedAt: new Date() }
        },
        { 
          new: true, 
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      // If document was created, initialize it properly
      if (!updateResult.moduleProgress || updateResult.moduleProgress.length === 0) {
        updateResult = await Progress.findOneAndUpdate(
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
    }

    // Get the updated content progress item
    const contentProgress = updateResult.contentProgress.find(
      item => item.contentId.toString() === contentId
    );

    // Recalculate module progress separately to avoid conflicts
    setTimeout(() => {
      recalculateModuleProgressAsync(userId, moduleId);
    }, 100);

    // Get current module progress
    const moduleProgress = updateResult.moduleProgress.find(
      item => item.moduleId === moduleId
    );

    return {
      success: true,
      contentProgress,
      moduleProgress
    };
  } catch (error) {
    console.error('Error in updateContentProgressAtomic:', error);
    return { success: false };
  }
}

// Async module progress recalculation (to avoid conflicts)
async function recalculateModuleProgressAsync(userId, moduleId) {
  try {
    // Wait a bit to ensure other operations complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const userProgress = await Progress.findOne({ userId });
    if (!userProgress) return;

    // Get all content for this module
    const moduleContent = await Content.find({ moduleId });
    const moduleContentIds = moduleContent.map(item => item._id.toString());
    
    // Count completed content
    const completedContent = userProgress.contentProgress.filter(
      item => moduleContentIds.includes(item.contentId.toString()) && item.completed
    );
    
    // Get all quizzes for this module
    const moduleQuizzes = await Quiz.find({ moduleId });
    const moduleQuizIds = moduleQuizzes.map(item => item._id.toString());
    
    // Count completed quizzes (score >= 70%)
    const completedQuizzes = userProgress.quizResults.filter(
      item => moduleQuizIds.includes(item.quizId.toString()) && item.score >= 70
    );
    
    // Calculate total progress
    const contentWeight = 0.7; // 70% weight for content
    const quizWeight = 0.3;    // 30% weight for quizzes
    
    let contentProgress = 0;
    if (moduleContent.length > 0) {
      contentProgress = (completedContent.length / moduleContent.length) * contentWeight * 100;
    }
    
    let quizProgress = 0;
    if (moduleQuizzes.length > 0) {
      quizProgress = (completedQuizzes.length / moduleQuizzes.length) * quizWeight * 100;
    }
    
    const totalProgress = Math.round(contentProgress + quizProgress);
    
    // Update module progress atomically
    await Progress.updateOne(
      { 
        userId,
        'moduleProgress.moduleId': moduleId 
      },
      {
        $set: {
          'moduleProgress.$.progress': totalProgress,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Module ${moduleId} progress updated to ${totalProgress}% for user ${userId}`);
  } catch (error) {
    console.error('Error recalculating module progress:', error);
  }
}