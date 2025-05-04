// backend/routes/progressRoutes.js

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// @route   GET api/progress
// @desc    Get user's progress overview
// @access  Private
router.get('/', auth, progressController.getProgressOverview);

// @route   POST api/progress/content
// @desc    Update content progress
// @access  Private
router.post('/content', auth, progressController.updateContentProgress);

// @route   POST api/progress/quiz
// @desc    Save quiz results
// @access  Private
router.post('/quiz', auth, progressController.saveQuizResults);

// @route   GET api/progress/module/:moduleId
// @desc    Get progress for specific module
// @access  Private
router.get('/module/:moduleId', auth, progressController.getModuleProgress);

module.exports = router;