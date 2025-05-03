/**
 * User Routes
 * 
 * API routes for user management and progress tracking in the Mount Athos Explorer
 * educational application.
 */

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const adaptiveController = require('../controllers/adaptiveController');
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/users/progress
// @desc    Get current user's progress
// @access  Private
router.get(
  '/progress',
  authenticate,
  asyncHandler(progressController.getUserProgress)
);

// @route   GET /api/users/:userId/progress
// @desc    Get a user's progress (admin only, or own progress)
// @access  Private
router.get(
  '/:userId/progress',
  authenticate,
  checkOwnership((req) => req.params.userId),
  asyncHandler(progressController.getUserProgress)
);

// @route   POST /api/users/progress
// @desc    Update user progress
// @access  Private
router.post(
  '/progress',
  authenticate,
  validate(schemas.progress.update),
  asyncHandler(progressController.updateProgress)
);

// @route   GET /api/users/achievements
// @desc    Get current user's achievements
// @access  Private
router.get(
  '/achievements',
  authenticate,
  asyncHandler(progressController.getUserAchievements)
);

// @route   POST /api/users/achievements
// @desc    Award achievement to user
// @access  Private
router.post(
  '/achievements',
  authenticate,
  asyncHandler(progressController.awardAchievement)
);

// @route   GET /api/users/learning-path
// @desc    Get current user's learning path
// @access  Private
router.get(
  '/learning-path',
  authenticate,
  asyncHandler(progressController.getLearningPath)
);

// @route   PUT /api/users/learning-path
// @desc    Update user's learning path
// @access  Private
router.put(
  '/learning-path',
  authenticate,
  asyncHandler(progressController.updateLearningPath)
);

// @route   GET /api/users/recommendations
// @desc    Get personalized content recommendations
// @access  Private
router.get(
  '/recommendations',
  authenticate,
  asyncHandler(adaptiveController.getRecommendations)
);

// @route   PUT /api/users/preferences
// @desc    Update user's learning preferences
// @access  Private
router.put(
  '/preferences',
  authenticate,
  asyncHandler(adaptiveController.updateLearningPreferences)
);

// @route   GET /api/users/content/:moduleId/:sectionId
// @desc    Get content based on learning style
// @access  Private
router.get(
  '/content/:moduleId/:sectionId',
  authenticate,
  validate(schemas.params.moduleSection, 'params'),
  asyncHandler(adaptiveController.getContentByLearningStyle)
);

// @route   GET /api/users/next-steps
// @desc    Get next steps for learning path
// @access  Private
router.get(
  '/next-steps',
  authenticate,
  asyncHandler(adaptiveController.getNextSteps)
);

// @route   GET /api/users/learning-status
// @desc    Get learning path status
// @access  Private
router.get(
  '/learning-status',
  authenticate,
  asyncHandler(adaptiveController.getLearningPathStatus)
);

// @route   POST /api/users/reset-progress
// @desc    Reset user progress
// @access  Private
router.post(
  '/reset-progress',
  authenticate,
  asyncHandler(progressController.resetProgress)
);

// @route   POST /api/users/:userId/reset-progress
// @desc    Reset a user's progress (admin only)
// @access  Private (Admin only)
router.post(
  '/:userId/reset-progress',
  authenticate,
  authorize('admin'),
  asyncHandler(progressController.resetProgress)
);

module.exports = router;