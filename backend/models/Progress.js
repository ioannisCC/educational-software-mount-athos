// backend/models/Progress.js

const mongoose = require('mongoose');

// progress schema 
const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentProgress: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number,
      default: 0, // in seconds
    },
    interactions: {
      type: Number,
      default: 0 // number of clicks, scrolls, etc.
    },
    attemptsCount: {
      type: Number,
      default: 1
    },
    strugglingIndicators: {
      type: Number,
      default: 0 // number of times user seemed to struggle
    }
  }],
  quizResults: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz.questions',
        required: true
      },
      isCorrect: Boolean,
      timeSpent: {
        type: Number,
        default: 0 // time spent on this question in seconds
      }
    }],
    attemptNumber: {
      type: Number,
      default: 1
    },
    totalTimeSpent: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  moduleProgress: [{
    moduleId: {
      type: Number,
      required: true,
      min: 1,
      max: 3
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number,
      default: 0
    }
  }],
  // New: Detailed behavior tracking
  behaviorData: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    actionType: {
      type: String,
      enum: ['view', 'complete', 'struggle', 'quick_exit', 'deep_engagement', 'quiz_attempt', 'navigation'],
      required: true
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    interactions: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: String,
      enum: ['basic', 'advanced']
    },
    metadata: {
      scrollPercentage: Number,
      clickCount: Number,
      pauseTime: Number,
      exitReason: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Learning preferences derived from behavior
  derivedPreferences: {
    preferredContentType: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text'
    },
    averageTimePerContent: {
      type: Number,
      default: 0
    },
    learningPace: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium'
    },
    difficultyPreference: {
      type: String,
      enum: ['basic', 'mixed', 'advanced'],
      default: 'mixed'
    },
    lastAnalysisDate: {
      type: Date,
      default: Date.now
    }
  },
  // Adaptive recommendations
  recommendations: {
    nextContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      reason: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      generatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    remedialContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      reason: String,
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    advancedContent: [{
      contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      reason: String,
      unlock_criteria: String
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamps and analyze behavior
progressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-analyze behavior patterns every 10 interactions
  if (this.behaviorData && this.behaviorData.length % 10 === 0) {
    this.analyzeBehaviorPatterns();
  }
  
  next();
});

// Method to analyze user behavior patterns
progressSchema.methods.analyzeBehaviorPatterns = function() {
  if (!this.behaviorData || this.behaviorData.length === 0) return;

  const recentBehavior = this.behaviorData.slice(-20); // Last 20 interactions
  
  // Analyze preferred content type
  const contentTypeCount = {};
  const totalTimeByType = {};
  
  recentBehavior.forEach(behavior => {
    if (behavior.actionType === 'view' || behavior.actionType === 'complete') {
      // This would need to be enhanced to get actual content type
      // For now, we'll use metadata or make assumptions
      const contentType = behavior.metadata?.contentType || 'text';
      contentTypeCount[contentType] = (contentTypeCount[contentType] || 0) + 1;
      totalTimeByType[contentType] = (totalTimeByType[contentType] || 0) + behavior.timeSpent;
    }
  });

  // Determine preferred content type (most engaged with)
  let preferredType = 'text';
  let maxEngagement = 0;
  
  Object.keys(totalTimeByType).forEach(type => {
    const avgTime = totalTimeByType[type] / (contentTypeCount[type] || 1);
    if (avgTime > maxEngagement) {
      maxEngagement = avgTime;
      preferredType = type;
    }
  });

  // Analyze learning pace
  const avgTimePerItem = recentBehavior.reduce((sum, b) => sum + b.timeSpent, 0) / recentBehavior.length;
  let pace = 'medium';
  if (avgTimePerItem < 120) pace = 'fast';      // Less than 2 minutes
  else if (avgTimePerItem > 300) pace = 'slow'; // More than 5 minutes

  // Analyze difficulty preference
  const struggleCount = recentBehavior.filter(b => b.actionType === 'struggle').length;
  const quickExitCount = recentBehavior.filter(b => b.actionType === 'quick_exit').length;
  
  let difficultyPref = 'mixed';
  if (struggleCount > recentBehavior.length * 0.3) {
    difficultyPref = 'basic'; // Struggling too much
  } else if (quickExitCount < recentBehavior.length * 0.1) {
    difficultyPref = 'advanced'; // Not finding content challenging enough
  }

  // Update derived preferences
  this.derivedPreferences = {
    preferredContentType: preferredType,
    averageTimePerContent: avgTimePerItem,
    learningPace: pace,
    difficultyPreference: difficultyPref,
    lastAnalysisDate: new Date()
  };
};

// Create and export model
const Progress = mongoose.model('Progress', progressSchema);
module.exports = Progress;