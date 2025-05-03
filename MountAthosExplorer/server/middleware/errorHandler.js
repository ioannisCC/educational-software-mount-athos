/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the Mount Athos Explorer API
 */

const config = require('../config/config');
const mongoose = require('mongoose');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // Flag to indicate expected operational error
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error for server-side debugging
  console.error('Error:', {
    message: err.message,
    stack: config.isDev ? err.stack : 'Hidden in production',
    path: req.path,
    method: req.method,
    body: config.isDev ? req.body : 'Hidden in production',
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    const errors = Object.values(err.errors).map(val => val.message);
    
    return res.status(400).json({
      success: false,
      message,
      errors,
      errorType: 'ValidationError',
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value`;
    
    return res.status(400).json({
      success: false,
      message,
      errorType: 'DuplicateKeyError',
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    
    return res.status(400).json({
      success: false,
      message,
      errorType: 'CastError',
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errorType: 'JsonWebTokenError',
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      errorType: 'TokenExpiredError',
    });
  }
  
  // Handle custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors.length > 0 ? err.errors : undefined,
      errorType: 'APIError',
    });
  }
  
  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && !config.isDev ? 'Server Error' : message,
    errorType: err.name,
    // Only include stack trace in development
    ...(config.isDev && { stack: err.stack }),
  });
};

/**
 * Handle 404 Not Found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Not found - ${req.originalUrl}`,
    errorType: 'NotFound',
  });
};

/**
 * Async handler to avoid try-catch blocks in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Export error handling utilities
module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  APIError,
};