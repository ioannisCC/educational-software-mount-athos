/**
 * Content Routes
 * 
 * API routes for educational content in the Mount Athos Explorer
 * educational application.
 */

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// @route   GET /api/content
// @desc    Get all content with pagination
// @access  Public (with optional authentication for unpublished content)
router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(contentController.getAllContent)
);

// @route   GET /api/content/:id
// @desc    Get content by ID
// @access  Public (with optional authentication for unpublished content)
router.get(
  '/:id',
  optionalAuthenticate,
  validate(schemas.params.objectId, 'params'),
  asyncHandler(contentController.getContentById)
);

// @route   GET /api/content/module/:moduleId/section/:sectionId
// @desc    Get content by module and section
// @access  Public (with optional authentication for unpublished content)
router.get(
  '/module/:moduleId/section/:sectionId',
  optionalAuthenticate,
  validate(schemas.params.moduleSection, 'params'),
  asyncHandler(contentController.getContentBySection)
);

// @route   POST /api/content
// @desc    Create new content
// @access  Private (Admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(schemas.content.create),
  asyncHandler(contentController.createContent)
);

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Private (Admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(schemas.params.objectId, 'params'),
  validate(schemas.content.update),
  asyncHandler(contentController.updateContent)
);

// @route   DELETE /api/content/:id
// @desc    Delete content
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(schemas.params.objectId, 'params'),
  asyncHandler(contentController.deleteContent)
);

// @route   GET /api/content/search
// @desc    Search content
// @access  Public (with optional authentication for unpublished content)
router.get(
  '/search',
  optionalAuthenticate,
  validate(schemas.query.search, 'query'),
  asyncHandler(contentController.searchContent)
);

// @route   GET /api/content/:id/related
// @desc    Get related content
// @access  Public
router.get(
  '/:id/related',
  validate(schemas.params.objectId, 'params'),
  asyncHandler(contentController.getRelatedContent)
);

module.exports = router;