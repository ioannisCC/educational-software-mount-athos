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
      // Initialize with empty progress if not exists
      userProgress = new Progress({
        userId,
        contentProgress: [],
        quizResults: [],
        moduleProgress: [
          { moduleId: 1, progress: 0 },
          { moduleId: 2, progress: 0 },
          { moduleId: 3, progress: 0 }
        ]
      });
      await userProgress.save();
    }
    
    res.json({
      moduleProgress: userProgress.moduleProgress,
      completedContents: userProgress.contentProgress.filter(item => item.completed).length,
      quizzesTaken: userProgress.quizResults.length
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ message: 'Server error retrieving progress' });
  }
};

// Mark content as viewed/completed
exports.updateContentProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId, completed } = req.body;
    
    // Validate content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Find or create progress document
    let userProgress = await Progress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new Progress({
        userId,
        contentProgress: [],
        quizResults: [],
        moduleProgress: [
          { moduleId: 1, progress: 0 },
          { moduleId: 2, progress: 0 },
          { moduleId: 3, progress: 0 }
        ]
      });
    }
    
    // Update content progress
    const existingProgress = userProgress.contentProgress.find(
      item => item.contentId.toString() === contentId
    );
    
    if (existingProgress) {
      existingProgress.completed = completed;
      existingProgress.lastAccessed = Date.now();
    } else {
      userProgress.contentProgress.push({
        contentId,
        completed,
        lastAccessed: Date.now()
      });
    }
    
    // Recalculate module progress
    await recalculateModuleProgress(userProgress, content.moduleId);
    
    await userProgress.save();
    
    res.json({
      message: 'Progress updated',
      contentProgress: userProgress.contentProgress.find(
        item => item.contentId.toString() === contentId
      ),
      moduleProgress: userProgress.moduleProgress.find(
        item => item.moduleId === content.moduleId
      )
    });
  } catch (error) {
    console.error('Update content progress error:', error);
    res.status(500).json({ message: 'Server error updating progress' });
  }
};

// Save quiz results
exports.saveQuizResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId, score, answers } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Find or create progress document
    let userProgress = await Progress.findOne({ userId });
    
    if (!userProgress) {
      userProgress = new Progress({
        userId,
        contentProgress: [],
        quizResults: [],
        moduleProgress: [
          { moduleId: 1, progress: 0 },
          { moduleId: 2, progress: 0 },
          { moduleId: 3, progress: 0 }
        ]
      });
    }
    
    // Add or update quiz result
    const existingQuizResult = userProgress.quizResults.findIndex(
      result => result.quizId.toString() === quizId
    );
    
    if (existingQuizResult > -1) {
      userProgress.quizResults[existingQuizResult] = {
        quizId,
        score,
        answers
      };
    } else {
      userProgress.quizResults.push({
        quizId,
        score,
        answers
      });
    }
    
    // Recalculate module progress
    await recalculateModuleProgress(userProgress, quiz.moduleId);
    
    await userProgress.save();
    
    res.json({
      message: 'Quiz results saved',
      quizResult: {
        quizId,
        score,
        answers
      },
      moduleProgress: userProgress.moduleProgress.find(
        item => item.moduleId === quiz.moduleId
      )
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

// Helper function to recalculate module progress
async function recalculateModuleProgress(userProgress, moduleId) {
  try {
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
    
    // Update module progress
    const moduleProgressIndex = userProgress.moduleProgress.findIndex(
      item => item.moduleId === moduleId
    );
    
    if (moduleProgressIndex > -1) {
      userProgress.moduleProgress[moduleProgressIndex].progress = totalProgress;
    } else {
      userProgress.moduleProgress.push({
        moduleId,
        progress: totalProgress
      });
    }
  } catch (error) {
    console.error('Recalculate module progress error:', error);
    throw error;
  }
}