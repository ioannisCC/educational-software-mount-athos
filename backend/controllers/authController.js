// backend/controllers/authController.js
const User = require('../models/User');
const Progress = require('../models/Progress');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT secret (move to env)
const JWT_SECRET = 'mountathossecret';

// Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password, preferences } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      preferences
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: {
          id: user.id,
          username: user.username,
          email: user.email,
          preferences: user.preferences
        }});
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: {
          id: user.id,
          username: user.username,
          email: user.email,
          preferences: user.preferences
        }});
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user
exports.getCurrentUser = async (req, res) => {
    try {
      // req.user.id comes from auth middleware
      const user = await User.findById(req.user.id).select('-password');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { learningStyle } = req.body;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 'preferences.learningStyle': learningStyle },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      
      // Get user progress summary
      const progress = await Progress.findOne({ userId: req.user.id });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        user,
        progress: progress ? {
          completedContents: progress.contentProgress.filter(item => item.completed).length,
          quizzesTaken: progress.quizResults.length,
          overallProgress: progress.moduleProgress.reduce((acc, curr) => acc + curr.progress, 0) / 
                            progress.moduleProgress.length
        } : null
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };

// Delete user account
exports.deleteAccount = async (req, res) => {
    try {
      // Find user
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Delete user progress data
      await Progress.deleteMany({ userId: req.user.id });
      
      // Delete user
      await User.findByIdAndDelete(req.user.id);
      
      res.json({ message: 'User account and all associated data deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };