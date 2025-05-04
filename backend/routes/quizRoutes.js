// backend/routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// @route   GET api/quiz/module/:moduleId
// @desc    Get all quizzes for a module
// @access  Private
router.get('/module/:moduleId', auth, quizController.getQuizzesByModule);

// @route   GET api/quiz/:id
// @desc    Get quiz by id
// @access  Private
router.get('/:id', auth, quizController.getQuizById);

// @route   POST api/quiz
// @desc    Create new quiz
// @access  Private/Admin
router.post('/', auth, quizController.createQuiz);

// @route   PUT api/quiz/:id
// @desc    Update quiz
// @access  Private/Admin
router.put('/:id', auth, quizController.updateQuiz);

// @route   DELETE api/quiz/:id
// @desc    Delete quiz
// @access  Private/Admin
router.delete('/:id', auth, quizController.deleteQuiz);

// @route   POST api/quiz/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post('/:id/submit', auth, quizController.submitQuiz);

module.exports = router;