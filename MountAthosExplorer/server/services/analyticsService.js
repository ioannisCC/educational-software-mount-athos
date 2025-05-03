/**
 * Analytics Service
 * 
 * Provides learning analytics functionality for the Mount Athos Explorer
 * educational application.
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { logger } = require('../middleware/logger');

// Define analytics event model if not exists
let AnalyticsEvent;

try {
  AnalyticsEvent = mongoose.model('AnalyticsEvent');
} catch (error) {
  // Define model if not already defined
  const AnalyticsEventSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    moduleId: String,
    sectionId: String,
    contentId: mongoose.Schema.Types.ObjectId,
    quizId: mongoose.Schema.Types.ObjectId,
    data: mongoose.Schema.Types.Mixed,
    sessionId: String,
    clientInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
      browser: String,
      os: String,
    },
  });
  
  // Create indexes
  AnalyticsEventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
  AnalyticsEventSchema.index({ moduleId: 1, sectionId: 1 });
  AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
  
  AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
}

// Analytics event types
const EVENT_TYPES = {
  CONTENT_VIEW: 'content_view',
  CONTENT_COMPLETE: 'content_complete',
  SECTION_VIEW: 'section_view',
  SECTION_COMPLETE: 'section_complete',
  QUIZ_START: 'quiz_start',
  QUIZ_SUBMIT: 'quiz_submit',
  QUIZ_COMPLETE: 'quiz_complete',
  SEARCH: 'search',
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTRATION: 'registration',
  ACHIEVEMENT_EARNED: 'achievement_earned',
  RECOMMENDATION_CLICK: 'recommendation_click',
  USER_FEEDBACK: 'user_feedback',
  ERROR: 'error',
  LEARNING_PATH_UPDATE: 'learning_path_update',
  PROGRESS_UPDATE: 'progress_update',
};

/**
 * Track user activity
 * @param {string} userId - User ID
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 * @param {Object} clientInfo - Client information
 * @returns {Promise<Object>} - Created event
 */
exports.trackUserActivity = async (userId, eventType, data = {}, clientInfo = {}) => {
  try {
    // Check if analytics is enabled
    if (!config.ANALYTICS.enabled) {
      return null;
    }
    
    // Extract common fields from data
    const {
      moduleId,
      sectionId,
      contentId,
      quizId,
      sessionId,
      ...otherData
    } = data;
    
    // Create event
    const event = new AnalyticsEvent({
      userId,
      eventType,
      timestamp: new Date(),
      moduleId,
      sectionId,
      contentId,
      quizId,
      sessionId,
      data: otherData,
      clientInfo,
    });
    
    // Save event
    await event.save();
    
    return event;
  } catch (error) {
    logger.error(`Error tracking user activity: ${error.message}`);
    return null;
  }
};

/**
 * Get user activity
 * @param {string} userId - User ID
 * @param {Object} filters - Additional filters
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} - Activity events
 */
exports.getUserActivity = async (userId, filters = {}, limit = 100) => {
  try {
    const query = { userId, ...filters };
    
    const events = await AnalyticsEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return events;
  } catch (error) {
    logger.error(`Error getting user activity: ${error.message}`);
    return [];
  }
};

/**
 * Get module analytics
 * @param {string} moduleId - Module ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} - Module analytics
 */
exports.getModuleAnalytics = async (moduleId, startDate, endDate) => {
  try {
    const query = { moduleId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Get total views
    const viewsCount = await AnalyticsEvent.countDocuments({
      ...query,
      eventType: EVENT_TYPES.SECTION_VIEW,
    });
    
    // Get completions
    const completionsCount = await AnalyticsEvent.countDocuments({
      ...query,
      eventType: EVENT_TYPES.SECTION_COMPLETE,
    });
    
    // Get unique users
    const uniqueUsers = await AnalyticsEvent.distinct('userId', query);
    
    // Get section analytics
    const sectionAnalytics = await AnalyticsEvent.aggregate([
      { $match: { ...query, sectionId: { $exists: true, $ne: null } } },
      { $group: {
        _id: { sectionId: '$sectionId', eventType: '$eventType' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id.sectionId': 1 } },
    ]);
    
    // Process section analytics
    const sectionStats = {};
    
    sectionAnalytics.forEach(stat => {
      const sectionId = stat._id.sectionId;
      const eventType = stat._id.eventType;
      
      if (!sectionStats[sectionId]) {
        sectionStats[sectionId] = {
          views: 0,
          completions: 0,
        };
      }
      
      if (eventType === EVENT_TYPES.SECTION_VIEW) {
        sectionStats[sectionId].views = stat.count;
      } else if (eventType === EVENT_TYPES.SECTION_COMPLETE) {
        sectionStats[sectionId].completions = stat.count;
      }
    });
    
    // Calculate completion rate
    const completionRate = viewsCount > 0 ? Math.round((completionsCount / viewsCount) * 100) : 0;
    
    return {
      moduleId,
      views: viewsCount,
      completions: completionsCount,
      completionRate,
      uniqueUsers: uniqueUsers.length,
      sections: sectionStats,
    };
  } catch (error) {
    logger.error(`Error getting module analytics: ${error.message}`);
    return {
      moduleId,
      views: 0,
      completions: 0,
      completionRate: 0,
      uniqueUsers: 0,
      sections: {},
    };
  }
};

/**
 * Get content popularity
 * @param {string} moduleId - Module ID (optional)
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} - Popular content
 */
exports.getContentPopularity = async (moduleId = null, limit = 10) => {
  try {
    const match = { eventType: EVENT_TYPES.CONTENT_VIEW };
    
    if (moduleId) {
      match.moduleId = moduleId;
    }
    
    const contentViews = await AnalyticsEvent.aggregate([
      { $match: match },
      { $group: {
        _id: '$contentId',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
      }},
      { $lookup: {
        from: 'contents',
        localField: '_id',
        foreignField: '_id',
        as: 'contentDetails',
      }},
      { $unwind: '$contentDetails' },
      { $project: {
        contentId: '$_id',
        title: '$contentDetails.title',
        moduleId: '$contentDetails.moduleId',
        sectionId: '$contentDetails.sectionId',
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      }},
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);
    
    return contentViews;
  } catch (error) {
    logger.error(`Error getting content popularity: ${error.message}`);
    return [];
  }
};

/**
 * Get quiz performance statistics
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object>} - Quiz statistics
 */
exports.getQuizPerformance = async (quizId) => {
  try {
    // Get all quiz submissions
    const submissions = await AnalyticsEvent.find({
      quizId,
      eventType: EVENT_TYPES.QUIZ_SUBMIT,
    });
    
    if (submissions.length === 0) {
      return {
        quizId,
        attempts: 0,
        averageScore: 0,
        passRate: 0,
        questionStats: [],
      };
    }
    
    // Calculate overall statistics
    let totalScore = 0;
    let passCount = 0;
    
    submissions.forEach(submission => {
      const score = submission.data?.percentageScore || 0;
      totalScore += score;
      
      if (score >= 60) { // Assuming 60% is passing score
        passCount++;
      }
    });
    
    const averageScore = Math.round(totalScore / submissions.length);
    const passRate = Math.round((passCount / submissions.length) * 100);
    
    // Calculate per-question statistics
    const questionStats = [];
    
    // Group submissions by question
    const questionData = {};
    
    submissions.forEach(submission => {
      const feedback = submission.data?.questionFeedback || [];
      
      feedback.forEach(question => {
        const questionId = question.questionId;
        
        if (!questionData[questionId]) {
          questionData[questionId] = {
            correct: 0,
            total: 0,
          };
        }
        
        questionData[questionId].total++;
        
        if (question.correct) {
          questionData[questionId].correct++;
        }
      });
    });
    
    // Calculate success rate per question
    Object.entries(questionData).forEach(([questionId, data]) => {
      const successRate = Math.round((data.correct / data.total) * 100);
      
      questionStats.push({
        questionId,
        attempts: data.total,
        correctCount: data.correct,
        successRate,
      });
    });
    
    return {
      quizId,
      attempts: submissions.length,
      averageScore,
      passRate,
      questionStats,
    };
  } catch (error) {
    logger.error(`Error getting quiz performance: ${error.message}`);
    return {
      quizId,
      attempts: 0,
      averageScore: 0,
      passRate: 0,
      questionStats: [],
    };
  }
};

/**
 * Get user engagement statistics
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} - Engagement statistics
 */
exports.getUserEngagement = async (days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily active users
    const dailyUsers = await AnalyticsEvent.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: {
        _id: {
          userId: '$userId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        },
      }},
      { $group: {
        _id: '$_id.date',
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    
    // Get new user registrations
    const newUsers = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: EVENT_TYPES.REGISTRATION,
          timestamp: { $gte: startDate },
        },
      },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    
    // Get content completion events
    const contentCompletions = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: EVENT_TYPES.CONTENT_COMPLETE,
          timestamp: { $gte: startDate },
        },
      },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    
    // Process into daily statistics
    const dailyStats = {};
    
    // Create date range for all days
    const dateRange = [];
    const endDate = new Date();
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateRange.push(dateStr);
      
      dailyStats[dateStr] = {
        date: dateStr,
        activeUsers: 0,
        newUsers: 0,
        contentCompletions: 0,
      };
    }
    
    // Fill in stats
    dailyUsers.forEach(day => {
      if (dailyStats[day._id]) {
        dailyStats[day._id].activeUsers = day.count;
      }
    });
    
    newUsers.forEach(day => {
      if (dailyStats[day._id]) {
        dailyStats[day._id].newUsers = day.count;
      }
    });
    
    contentCompletions.forEach(day => {
      if (dailyStats[day._id]) {
        dailyStats[day._id].contentCompletions = day.count;
      }
    });
    
    // Convert to array
    const dailyStatsArray = dateRange.map(date => dailyStats[date]);
    
    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days,
      },
      dailyStats: dailyStatsArray,
      totals: {
        activeUsers: dailyUsers.reduce((total, day) => total + day.count, 0),
        newUsers: newUsers.reduce((total, day) => total + day.count, 0),
        contentCompletions: contentCompletions.reduce((total, day) => total + day.count, 0),
      },
    };
  } catch (error) {
    logger.error(`Error getting user engagement: ${error.message}`);
    return {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
      dailyStats: [],
      totals: {
        activeUsers: 0,
        newUsers: 0,
        contentCompletions: 0,
      },
    };
  }
};

// Export event types
exports.EVENT_TYPES = EVENT_TYPES;