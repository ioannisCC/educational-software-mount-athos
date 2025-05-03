/**
 * Progress Model
 * 
 * Schema for tracking user progress through the Mount Athos Explorer
 * educational application.
 */

const mongoose = require('mongoose');

// Section progress schema
const SectionProgressSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  completion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
});

// Module progress schema
const ModuleProgressSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  completion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  sections: [SectionProgressSchema],
});

// Content progress schema
const ContentProgressSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  moduleId: {
    type: String,
    required: true,
  },
  sectionId: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
  },
  activityType: {
    type: String,
    enum: ['content', 'interactive', 'video'],
    default: 'content',
  },
});

// Quiz progress schema
const QuizProgressSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  moduleId: {
    type: String,
    required: true,
  },
  sectionId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  answers: {
    type: mongoose.Schema.Types.Mixed, // Stores user's last answers
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
  },
});

// Achievement schema
const AchievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  moduleId: String,
  earnedAt: {
    type: Date,
    default: Date.now,
  },
  icon: String,
});

// Progress schema
const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  modules: [ModuleProgressSchema],
  contentProgress: [ContentProgressSchema],
  quizProgress: [QuizProgressSchema],
  achievements: [AchievementSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0,
  },
});

// Create indexes
ProgressSchema.index({ userId: 1 });
ProgressSchema.index({ 'modules.id': 1 });
ProgressSchema.index({ 'contentProgress.contentId': 1 });
ProgressSchema.index({ 'quizProgress.quizId': 1 });
ProgressSchema.index({ 'achievements.id': 1 });

// Update lastUpdated timestamp on save
ProgressSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  
  // Calculate total time spent
  let totalTime = 0;
  
  this.contentProgress.forEach(content => {
    totalTime += content.timeSpent || 0;
  });
  
  this.quizProgress.forEach(quiz => {
    totalTime += quiz.timeSpent || 0;
  });
  
  this.totalTimeSpent = totalTime;
  
  next();
});

// Virtual for overall completion percentage
ProgressSchema.virtual('overallCompletion').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  
  const totalModuleCompletion = this.modules.reduce(
    (sum, module) => sum + (module.completion || 0), 
    0
  );
  
  return Math.round(totalModuleCompletion / this.modules.length);
});

module.exports = mongoose.model('Progress', ProgressSchema);