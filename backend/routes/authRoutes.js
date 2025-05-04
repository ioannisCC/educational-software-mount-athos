// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', auth, authController.getCurrentUser);

// @route   PUT api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, authController.updatePreferences);

module.exports = router;