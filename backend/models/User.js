// backend/models/User.js

const mongoose = require('mongoose');

// Create a simple user schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  preferences: {
    learningStyle: {
      type: String,
      enum: ['visual', 'textual'],
      default: 'visual'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
const User = mongoose.model('User', userSchema);
module.exports = User;