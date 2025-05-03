/**
 * Quiz Routes
 * 
 * API routes for quizzes and assessments in the Mount Athos Explorer
 * educational application.
 */

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/quizzes
// @desc    Get all quizzes with pagination
// @access  Public (with optional authentication for unpublished quizzes)
router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(quizController.getAllQuizzes)
);

// @route   GET /api/quizzes/:id
// @desc    Get quiz by ID
// @access  Public (with optional authentication for unpublished quizzes)
router.get(
  '/:id',
  optionalAuthenticate,
  validate(schemas.params.objectId, 'params'),
  asyncHandler(quizController.getQuizById)
);

// @route   GET /api/quizzes/module/:moduleId/section/:sectionId
// @desc    Get quiz by module and section
// @access  Public (with optional authentication for unpublished quizzes)
router.get(
  '/module/:moduleId/section/:sectionId',
  optionalAuthenticate,
  validate(schemas.params.moduleSection, 'params'),
  asyncHandler(quizController.getQuizBySection)
);

// @route   POST /api/quizzes
// @desc    Create new quiz
// @access  Private (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(schemas.quiz.create),
  asyncHandler(quizController.createQuiz)
);

// @route   PUT /api/quizzes/:id
// @desc    Update quiz
// @access  Private (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(schemas.params.objectId, 'params'),
  validate(schemas.quiz.update),
  asyncHandler(quizController.updateQuiz)
);

// @route   DELETE /api/quizzes/:id
// @desc    Delete quiz
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(schemas.params.objectId, 'params'),
  asyncHandler(quizController.deleteQuiz)
);

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post(
  '/:id/submit',
  authenticate,
  validate(schemas.params.objectId, 'params'),
  validate(schemas.quiz.submitAnswers),
  asyncHandler(quizController.submitQuiz)
);

// @route   GET /api/quizzes/:quizId/progress
// @desc    Get quiz progress for a user
// @access  Private
router.get(
  '/:quizId/progress',
  authenticate,
  validate(schemas.params.objectId, 'params'),
  asyncHandler(quizController.getQuizProgress)
);

module.exports = router;