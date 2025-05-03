/**
 * Authentication Routes
 * 
 * API routes for user authentication in the Mount Athos Explorer
 * educational application.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../utils/validation');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  validate(schemas.user.register),
  asyncHandler(authController.register)
);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post(
  '/login',
  validate(schemas.user.login),
  asyncHandler(authController.login)
);

// @route   GET /api/auth/logout
// @desc    Logout user and clear cookies
// @access  Public
router.get('/logout', authController.logout);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser)
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  validate(schemas.user.updateProfile),
  asyncHandler(authController.updateProfile)
);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put(
  '/password',
  authenticate,
  validate(schemas.user.changePassword),
  asyncHandler(authController.changePassword)
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  validate(schemas.user.resetPassword),
  asyncHandler(authController.forgotPassword)
);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post(
  '/reset-password/:token',
  validate(schemas.user.confirmResetPassword),
  asyncHandler(authController.resetPassword)
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh authentication token
// @access  Public (with refresh token)
router.post('/refresh-token', asyncHandler(require('../middleware/auth').refreshToken));

module.exports = router;