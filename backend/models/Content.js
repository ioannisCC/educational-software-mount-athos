// backend/models/Content.js

const mongoose = require('mongoose');

// Create content schema
const contentSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['basic', 'advanced'],
    default: 'basic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export model
const Content = mongoose.model('Content', contentSchema);
module.exports = Content;