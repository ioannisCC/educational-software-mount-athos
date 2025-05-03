/**
 * Authentication Middleware
 * 
 * Handles JWT authentication and authorization for protected routes
 * in the Mount Athos Explorer educational software.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

/**
 * Verify JWT token from Authorization header or cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token;
    
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Check cookies
    else if (req.cookies && req.cookies[config.JWT.cookieName]) {
      token = req.cookies[config.JWT.cookieName];
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT.secret);
    
    // Check if token has expired
    const now = Date.now() / 1000;
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.id).select('-password');
    
    // If user not found (e.g., deleted after token issued)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Call next middleware
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }
    
    // Handle token expiration (redundant but for clarity)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }
    
    // Other errors
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
      error: config.isDev ? error.message : undefined,
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if authenticate middleware has run
    if (!req.user) {
      return res.status(500).json({
        success: false,
        message: 'Server error: Authorization middleware used without authentication',
      });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: ${roles.join(' or ')}`,
      });
    }
    
    // User has required role, proceed
    next();
  };
};

/**
 * Optional authentication middleware
 * Tries to authenticate user but proceeds even if no token is provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token;
    
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // Check cookies
    else if (req.cookies && req.cookies[config.JWT.cookieName]) {
      token = req.cookies[config.JWT.cookieName];
    }
    
    // If no token found, continue without authentication
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT.secret);
    
    // Check if token has expired
    const now = Date.now() / 1000;
    if (decoded.exp && decoded.exp < now) {
      // Token expired, but we continue without user authentication
      return next();
    }
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.id).select('-password');
    
    // If user found, attach to request object
    if (user) {
      req.user = user;
    }
    
    // Call next middleware, even if user not found
    next();
  } catch (error) {
    // For optional authentication, we proceed even if there's an error
    next();
  }
};

/**
 * Check if user is the owner of a resource or has admin role
 * @param {Function} getOwnerId - Function to extract owner ID from request
 * @returns {Function} Middleware function
 */
exports.checkOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      // Check if authenticate middleware has run
      if (!req.user) {
        return res.status(500).json({
          success: false,
          message: 'Server error: Ownership middleware used without authentication',
        });
      }
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get owner ID using the provided function
      const ownerId = await getOwnerId(req);
      
      // If no owner ID could be determined
      if (!ownerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found or ownership cannot be determined',
        });
      }
      
      // Convert IDs to strings for comparison
      const ownerIdStr = ownerId.toString();
      const userIdStr = req.user._id.toString();
      
      // Check if user is the owner
      if (ownerIdStr !== userIdStr) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You do not own this resource',
        });
      }
      
      // User is the owner, proceed
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
        error: config.isDev ? error.message : undefined,
      });
    }
  };
};

/**
 * Refresh JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    // Get refresh token from request body or cookies
    const refreshToken = req.body.refreshToken || 
                        (req.cookies && req.cookies['refresh_token']);
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT.refreshSecret);
    
    // Find user by ID from token payload
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Generate new access token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.JWT.secret,
      { expiresIn: config.JWT.expire }
    );
    
    // Send new token
    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    
    // Other errors
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: config.isDev ? error.message : undefined,
    });
  }
};