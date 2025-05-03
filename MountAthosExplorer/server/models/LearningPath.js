/**
 * Learning Path Model
 * 
 * Schema for adaptive learning paths in the Mount Athos Explorer
 * educational application.
 */

const mongoose = require('mongoose');

// Adaptive suggestion schema
const AdaptiveSuggestionSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5,
  },
  suggestedAt: {
    type: Date,
    default: Date.now,
  },
  clickedAt: Date,
  completed: {
    type: Boolean,
    default: false,
  },
});

// Learning path schema
const LearningPathSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  currentModule: {
    type: String,
    required: true,
    default: 'module1',
  },
  currentSection: {
    type: String,
    required: true,
    default: 'origins',
  },
  recommendedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
  }],
  adaptiveSuggestions: [AdaptiveSuggestionSchema],
  learningStyle: {
    type: String,
    enum: ['visual', 'textual', 'interactive', 'balanced'],
    default: 'balanced',
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  lastGenerated: {
    type: Date,
    default: Date.now,
  },
  completedModules: [{
    type: String,
  }],
  completedSections: [{
    moduleId: String,
    sectionId: String,
    completedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  nextMilestones: [{
    moduleId: String,
    sectionId: String,
    type: {
      type: String,
      enum: ['content', 'quiz'],
    },
    itemId: mongoose.Schema.Types.ObjectId,
    title: String,
    priority: {
      type: Number,
      default: 1,
    },
  }],
});

// Create indexes
LearningPathSchema.index({ userId: 1 });
LearningPathSchema.index({ learningStyle: 1, difficulty: 1 });
LearningPathSchema.index({ currentModule: 1, currentSection: 1 });

// Update lastUpdated timestamp on save
LearningPathSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to mark suggestion as clicked
LearningPathSchema.methods.markSuggestionClicked = function(suggestionId) {
  const suggestion = this.adaptiveSuggestions.id(suggestionId);
  
  if (suggestion) {
    suggestion.clickedAt = Date.now();
    return true;
  }
  
  return false;
};

// Method to mark suggestion as completed
LearningPathSchema.methods.markSuggestionCompleted = function(suggestionId) {
  const suggestion = this.adaptiveSuggestions.id(suggestionId);
  
  if (suggestion) {
    suggestion.completed = true;
    return true;
  }
  
  return false;
};

// Method to clean up old suggestions
LearningPathSchema.methods.cleanupOldSuggestions = function(maxDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  
  // Keep only suggestions that are recent or clicked/completed
  this.adaptiveSuggestions = this.adaptiveSuggestions.filter(suggestion => {
    return suggestion.suggestedAt >= cutoffDate || 
           suggestion.clickedAt || 
           suggestion.completed;
  });
};

// Virtual for module completion (calculated from Progress model)
LearningPathSchema.virtual('moduleCompletion').get(function() {
  // This is a placeholder - actual implementation would require
  // fetching data from the Progress model
  return {
    module1: 0,
    module2: 0,
    module3: 0,
  };
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);