// backend/routes/adaptiveLearningRoutes.js

const express = require('express');
const router = express.Router();
const adaptiveLearningController = require('../controllers/adaptiveLearningController');
const auth = require('../middleware/auth');

// @route   GET api/adaptive/recommendations
// @desc    Get personalized learning recommendations
// @access  Private
router.get('/recommendations', auth, adaptiveLearningController.getPersonalizedRecommendations);

// @route   GET api/adaptive/content/:moduleId
// @desc    Get adaptive content for specific module
// @access  Private
router.get('/content/:moduleId', auth, adaptiveLearningController.getAdaptiveContent);

// @route   GET api/adaptive/quizzes/:moduleId
// @desc    Get adaptive quiz recommendations for specific module
// @access  Private
router.get('/quizzes/:moduleId', auth, adaptiveLearningController.getAdaptiveQuizzes);

// @route   POST api/adaptive/track-behavior
// @desc    Track detailed user behavior for adaptive learning
// @access  Private
router.post('/track-behavior', auth, adaptiveLearningController.trackUserBehavior);

// @route   GET api/adaptive/learning-path
// @desc    Get personalized learning path
// @access  Private
router.get('/learning-path', auth, adaptiveLearningController.getPersonalizedRecommendations);

module.exports = router;