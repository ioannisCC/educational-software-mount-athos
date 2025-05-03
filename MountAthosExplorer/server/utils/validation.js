/**
 * Validation Utility Functions
 * 
 * Provides validation utilities for request data
 * in the Mount Athos Explorer educational software.
 */

const Joi = require('joi');
const mongoose = require('mongoose');
const { APIError } = require('../middleware/errorHandler');

/**
 * Validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware function
 */
exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      context: { // Pass context to custom validators
        user: req.user,
        isAdmin: req.user && req.user.role === 'admin',
      },
    });
    
    if (error) {
      // Extract validation errors
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return next(new APIError('Validation failed', 400, errors));
    }
    
    // Replace the request data with the validated and sanitized version
    req[source] = value;
    
    next();
  };
};

/**
 * Common Joi validation schemas
 */
exports.schemas = {
  // User schemas
  user: {
    register: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
      }),
      displayName: Joi.string().min(2).max(50).messages({
        'string.min': 'Display name must be at least 2 characters long',
        'string.max': 'Display name cannot exceed 50 characters',
      }),
      profile: Joi.object({
        firstName: Joi.string().min(2).max(30),
        lastName: Joi.string().min(2).max(30),
        learningPreferences: Joi.object({
          style: Joi.string().valid('visual', 'textual', 'interactive', 'balanced'),
          difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        }),
      }),
    }),
    
    login: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required',
      }),
    }),
    
    updateProfile: Joi.object({
      displayName: Joi.string().min(2).max(50),
      profile: Joi.object({
        firstName: Joi.string().min(2).max(30),
        lastName: Joi.string().min(2).max(30),
        bio: Joi.string().max(500),
        location: Joi.string().max(100),
        learningPreferences: Joi.object({
          style: Joi.string().valid('visual', 'textual', 'interactive', 'balanced'),
          difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        }),
      }),
    }),
    
    changePassword: Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required',
      }),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required',
      }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
      }),
    }),
    
    resetPassword: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    }),
    
    confirmResetPassword: Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Reset token is required',
      }),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required',
      }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
      }),
    }),
  },
  
  // Content schemas
  content: {
    create: Joi.object({
      moduleId: Joi.string().required().messages({
        'any.required': 'Module ID is required',
      }),
      sectionId: Joi.string().required().messages({
        'any.required': 'Section ID is required',
      }),
      title: Joi.string().min(3).max(200).required().messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required',
      }),
      content: Joi.string().required().messages({
        'any.required': 'Content is required',
      }),
      type: Joi.string().valid('lesson', 'article', 'video', 'interactive', '3d').required().messages({
        'any.only': 'Type must be one of: lesson, article, video, interactive, 3d',
        'any.required': 'Content type is required',
      }),
      order: Joi.number().integer().min(0).default(0),
      metadata: Joi.object({
        keywords: Joi.array().items(Joi.string()),
        learningStyles: Joi.array().items(Joi.string().valid('visual', 'textual', 'interactive')),
        duration: Joi.number().integer().min(1), // in minutes
        difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      }),
      resources: Joi.array().items(Joi.object({
        type: Joi.string().valid('link', 'file', 'image', 'video', 'audio', '3d'),
        url: Joi.string().uri(),
        title: Joi.string(),
        description: Joi.string(),
      })),
      isPublished: Joi.boolean().default(false),
    }),
    
    update: Joi.object({
      title: Joi.string().min(3).max(200),
      content: Joi.string(),
      type: Joi.string().valid('lesson', 'article', 'video', 'interactive', '3d'),
      order: Joi.number().integer().min(0),
      metadata: Joi.object({
        keywords: Joi.array().items(Joi.string()),
        learningStyles: Joi.array().items(Joi.string().valid('visual', 'textual', 'interactive')),
        duration: Joi.number().integer().min(1), // in minutes
        difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
      }),
      resources: Joi.array().items(Joi.object({
        type: Joi.string().valid('link', 'file', 'image', 'video', 'audio', '3d'),
        url: Joi.string().uri(),
        title: Joi.string(),
        description: Joi.string(),
      })),
      isPublished: Joi.boolean(),
    }),
    
    getByModule: Joi.object({
      moduleId: Joi.string().required(),
      type: Joi.string().valid('lesson', 'article', 'video', 'interactive', '3d'),
      published: Joi.boolean(),
    }),
  },
  
  // Quiz schemas
  quiz: {
    create: Joi.object({
      moduleId: Joi.string().required().messages({
        'any.required': 'Module ID is required',
      }),
      sectionId: Joi.string().required().messages({
        'any.required': 'Section ID is required',
      }),
      title: Joi.string().min(3).max(200).required().messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required',
      }),
      description: Joi.string().max(500),
      questions: Joi.array().items(Joi.object({
        id: Joi.string(),
        type: Joi.string().valid('multiple-choice', 'true-false', 'multiple-select', 'image-match').required(),
        question: Joi.string().required(),
        options: Joi.array().items(Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          isCorrect: Joi.boolean(), // Only used for multiple-select
        })).min(2).required(),
        correctAnswer: Joi.alternatives().conditional('type', {
          is: 'multiple-select',
          then: Joi.array().items(Joi.string()).required(),
          otherwise: Joi.string().required(),
        }),
        explanation: Joi.string(),
        points: Joi.number().integer().min(1).default(10),
        image: Joi.string().uri().optional(),
      })).min(1).required().messages({
        'array.min': 'At least one question is required',
        'any.required': 'Questions are required',
      }),
      isPublished: Joi.boolean().default(false),
    }),
    
    update: Joi.object({
      title: Joi.string().min(3).max(200),
      description: Joi.string().max(500),
      questions: Joi.array().items(Joi.object({
        id: Joi.string(),
        type: Joi.string().valid('multiple-choice', 'true-false', 'multiple-select', 'image-match'),
        question: Joi.string(),
        options: Joi.array().items(Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          isCorrect: Joi.boolean(), // Only used for multiple-select
        })).min(2),
        correctAnswer: Joi.alternatives().conditional('type', {
          is: 'multiple-select',
          then: Joi.array().items(Joi.string()),
          otherwise: Joi.string(),
        }),
        explanation: Joi.string(),
        points: Joi.number().integer().min(1),
        image: Joi.string().uri().optional(),
      })).min(1),
      isPublished: Joi.boolean(),
    }),
    
    submitAnswers: Joi.object({
      answers: Joi.object().pattern(
        Joi.string(), // Question ID
        Joi.alternatives().try(
          Joi.string(), // Single answer
          Joi.array().items(Joi.string()) // Multiple answers for multiple-select
        )
      ).required().messages({
        'any.required': 'Answers are required',
      }),
    }),
  },
  
  // Progress schemas
  progress: {
    update: Joi.object({
      moduleId: Joi.string().required().messages({
        'any.required': 'Module ID is required',
      }),
      sectionId: Joi.string().required().messages({
        'any.required': 'Section ID is required',
      }),
      activityType: Joi.string().valid('content', 'quiz', 'interactive', 'video').required().messages({
        'any.required': 'Activity type is required',
        'any.only': 'Activity type must be one of: content, quiz, interactive, video',
      }),
      progress: Joi.number().integer().min(0).max(100).required().messages({
        'number.min': 'Progress must be at least 0',
        'number.max': 'Progress cannot exceed 100',
        'any.required': 'Progress value is required',
      }),
      contentId: Joi.string().when('activityType', {
        is: 'content',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      quizId: Joi.string().when('activityType', {
        is: 'quiz',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      completed: Joi.boolean().default(false),
      timeSpent: Joi.number().integer().min(0), // in seconds
    }),
  },
  
  // Common parameters
  params: {
    objectId: Joi.object({
      id: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('string.objectId', { value });
        }
        return value;
      }, 'MongoDB ObjectId validation').required().messages({
        'string.objectId': 'Invalid ID format',
        'any.required': 'ID is required',
      }),
    }),
    
    moduleSection: Joi.object({
      moduleId: Joi.string().required().messages({
        'any.required': 'Module ID is required',
      }),
      sectionId: Joi.string().required().messages({
        'any.required': 'Section ID is required',
      }),
    }),
  },
  
  // Query parameters
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1',
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc').default('asc'),
    }),
    
    search: Joi.object({
      q: Joi.string().min(2).required().messages({
        'string.min': 'Search query must be at least 2 characters long',
        'any.required': 'Search query is required',
      }),
      type: Joi.string().valid('content', 'quiz', 'user', 'all').default('all'),
      module: Joi.string(),
      section: Joi.string(),
    }),
  },
};

/**
 * Custom Joi validation extensions
 */
exports.customValidators = {
  objectId: (joi) => ({
    type: 'objectId',
    base: joi.string(),
    validate(value, helpers) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return { value, errors: helpers.error('objectId.invalid') };
      }
      return { value };
    },
    messages: {
      'objectId.invalid': '{{#label}} must be a valid MongoDB ObjectId',
    },
  }),
  
  password: (joi) => ({
    type: 'password',
    base: joi.string(),
    validate(value, helpers) {
      // Password must have at least one uppercase letter, one lowercase letter,
      // one number, and one special character
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(value)) {
        return { value, errors: helpers.error('password.complexity') };
      }
      return { value };
    },
    messages: {
      'password.complexity': '{{#label}} must have at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  }),
};

/**
 * Utility functions for data validation
 */

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
exports.sanitizeHtml = (html) => {
  const createDOMPurify = require('dompurify');
  const { JSDOM } = require('jsdom');
  
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  
  // Configure DOMPurify to allow certain tags/attributes for educational content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
      'b', 'i', 'strong', 'em', 'strike', 'code', 'pre', 'hr', 'br',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'figure', 'figcaption', 'cite', 'dl', 'dt', 'dd',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'name', 'target',
      'width', 'height', 'style', 'data-*',
    ],
    ALLOW_DATA_ATTR: true,
  });
};

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate a date string against a specific format
 * @param {string} dateStr - Date string to validate
 * @param {string} format - Date format (e.g., 'YYYY-MM-DD')
 * @returns {boolean} - True if valid, false otherwise
 */
exports.isValidDate = (dateStr, format = 'YYYY-MM-DD') => {
  const moment = require('moment');
  return moment(dateStr, format, true).isValid();
};

/**
 * Normalize a string (lowercase, trim, remove extra spaces)
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
exports.normalizeString = (str) => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Generate a slug from a string
 * @param {string} str - String to convert to slug
 * @returns {string} - Slug
 */
exports.generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};