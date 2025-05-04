// backend/models/Quiz.js

const mongoose = require('mongoose');

// Create quiz schema
const quizSchema = new mongoose.Schema({
  moduleId: {
    type: Number,
    required: true,
    min: 1,
    max: 3 // We have 3 modules
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    text: {
      type: String,
      required: true
    },
    options: [{
      text: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true,
        default: false
      }
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'hard'],
      default: 'easy'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export model
const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;