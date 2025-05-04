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

// @route   GET api/content/:id
// @desc    Get specific content by id
// @access  Private
router.get('/:id', auth, contentController.getContentById);

// @route   POST api/content
// @desc    Create new content (admin only)
// @access  Private/Admin
router.post('/', auth, contentController.createContent);

// @route   PUT api/content/:id
// @desc    Update content by id
// @access  Private/Admin
router.put('/:id', auth, contentController.updateContent);

// @route   DELETE api/content/:id
// @desc    Delete content by id
// @access  Private/Admin
router.delete('/:id', auth, contentController.deleteContent);

// @route   DELETE api/content/module/:moduleId
// @desc    Delete all content for a module
// @access  Private/Admin
router.delete('/module/:moduleId', auth, contentController.deleteModule);

// @route   GET api/content/search
// @desc    Search content by keyword
// @access  Private
router.get('/search', auth, contentController.searchContent);

module.exports = router;