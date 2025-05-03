/**
 * Quiz Model
 * 
 * Schema for quizzes and assessments in the Mount Athos Explorer
 * educational application.
 */

const mongoose = require('mongoose');

// Option schema for quiz questions
const OptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

// Question schema
const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'multiple-select', 'image-match'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [OptionSchema],
    validate: {
      validator: function(options) {
        return options.length >= 2; // At least two options required
      },
      message: 'At least two options are required',
    },
    required: true,
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // String for single-answer, Array for multiple-select
    required: true,
  },
  explanation: String,
  points: {
    type: Number,
    default: 10,
    min: [1, 'Points must be at least 1'],
  },
  image: String, // URL to image (for image-match or illustrated questions)
});

// Quiz schema
const QuizSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: [true, 'Module ID is required'],
    index: true,
  },
  sectionId: {
    type: String,
    required: [true, 'Section ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  questions: {
    type: [QuestionSchema],
    validate: {
      validator: function(questions) {
        return questions.length >= 1; // At least one question required
      },
      message: 'At least one question is required',
    },
    required: true,
  },
  passingScore: {
    type: Number,
    default: 60, // 60% to pass
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100'],
  },
  timeLimit: {
    type: Number, // in minutes, 0 = no time limit
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  attemptsAllowed: {
    type: Number,
    default: 0, // 0 = unlimited
    min: [0, 'Attempts allowed cannot be negative'],
  },
  randomizeQuestions: {
    type: Boolean,
    default: false,
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true,
  },
});

// Create indexes
QuizSchema.index({ moduleId: 1, sectionId: 1 }, { unique: true });
QuizSchema.index({ title: 'text' });
QuizSchema.index({ isPublished: 1 });

// Update lastUpdated timestamp on save
QuizSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Virtual for total points
QuizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for total questions
QuizSchema.virtual('totalQuestions').get(function() {
  return this.questions.length;
});

module.exports = mongoose.model('Quiz', QuizSchema);