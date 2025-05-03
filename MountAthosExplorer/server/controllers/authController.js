/**
 * Authentication Controller
 * 
 * Handles user authentication and authorization for the Mount Athos Explorer
 * educational software.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const { APIError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logger');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, displayName, profile } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new APIError('User already exists with that email', 400));
    }
    
    // Create new user
    const user = new User({
      email,
      password, // Will be hashed in the model pre-save hook
      displayName: displayName || email.split('@')[0],
      profile: profile || {
        learningPreferences: {
          style: 'balanced',
          difficulty: 'beginner',
        }
      }
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Send response (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profile: user.profile,
    };
    
    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new APIError('Invalid credentials', 401));
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new APIError('Invalid credentials', 401));
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Generate refresh token
    const refreshToken = generateRefreshToken(user);
    
    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.isProd,
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    });
    
    // Set access token cookie if configured
    if (config.JWT.cookieName) {
      res.cookie(config.JWT.cookieName, token, config.JWT.cookieOptions);
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Send response (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profile: user.profile,
    };
    
    res.status(200).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = (req, res) => {
  // Clear cookies
  res.clearCookie('refresh_token');
  
  if (config.JWT.cookieName) {
    res.clearCookie(config.JWT.cookieName);
  }
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = (req, res) => {
  // User is attached to request by auth middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, profile } = req.body;
    const updateData = {};
    
    // Only update fields that are provided
    if (displayName) updateData.displayName = displayName;
    if (profile) {
      // Merge with existing profile to avoid losing fields
      updateData.profile = {
        ...req.user.profile,
        ...profile,
      };
      
      // Handle nested objects like learningPreferences
      if (profile.learningPreferences) {
        updateData.profile.learningPreferences = {
          ...req.user.profile.learningPreferences,
          ...profile.learningPreferences,
        };
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new APIError('Current password is incorrect', 401));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new token with updated info
    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetUrl = `${config.SERVER.publicUrl}/reset-password/${resetToken}`;
    
    // In a real app, send email with reset URL
    // For now, just log it
    logger.info(`Password reset token for ${email}: ${resetUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      // Only include reset URL in development mode
      ...(config.isDev && { resetUrl }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    // Hash token to compare with stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    
    if (!user) {
      return next(new APIError('Invalid or expired reset token', 400));
    }
    
    // Update password and clear reset token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Generate new token
    const jwtToken = generateToken(user);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.JWT.secret,
    { expiresIn: config.JWT.expire }
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.JWT.refreshSecret,
    { expiresIn: config.JWT.refreshExpire }
  );
};