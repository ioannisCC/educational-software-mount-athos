// backend/routes/contentRoutes.js

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');

// @route   GET api/content/modules
// @desc    Get all modules
// @access  Private
router.get('/modules', auth, contentController.getModules);

// @route   GET api/content/module/:moduleId
// @desc    Get content by module id
// @access  Private
router.get('/module/:moduleId', auth, contentController.getContentByModule);

// @route   GET api/content/:contentId
// @desc    Get specific content by id
// @access  Private
router.get('/:contentId', auth, contentController.getContentById);

// @route   POST api/content
// @desc    Create new content (admin only)
// @access  Private/Admin
router.post('/', auth, contentController.createContent);

// @route   GET api/content/search
// @desc    Search content by keyword
// @access  Private
router.get('/search', auth, contentController.searchContent);

module.exports = router;