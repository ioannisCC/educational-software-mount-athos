/**
 * Content Controller
 * 
 * Handles educational content delivery for the Mount Athos Explorer
 * educational software.
 */

const Content = require('../models/Content');
const { APIError } = require('../middleware/errorHandler');
const { paginate } = require('../utils/database');
const { sanitizeHtml } = require('../utils/validation');
const { logger } = require('../middleware/logger');
const mongoose = require('mongoose');
const analyticsService = require('../services/analyticsService');

/**
 * Get all content (with pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllContent = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, moduleId, published = true } = req.query;
    
    // Build query
    const query = Content.find();
    
    // Apply filters
    if (type) query.where('type', type);
    if (moduleId) query.where('moduleId', moduleId);
    
    // Only admins can see unpublished content
    if (req.user?.role !== 'admin') {
      query.where('isPublished', true);
    } else if (published !== undefined) {
      query.where('isPublished', published === 'true');
    }
    
    // Sort by module, section, and order
    query.sort({ moduleId: 1, sectionId: 1, order: 1 });
    
    // Apply pagination
    const result = await paginate(query, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get content by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const content = await Content.findById(id);
    
    if (!content) {
      return next(new APIError('Content not found', 404));
    }
    
    // Check if content is published or user is admin
    if (!content.isPublished && req.user?.role !== 'admin') {
      return next(new APIError('Content not found', 404));
    }
    
    // Track content view for authenticated users
    if (req.user) {
      analyticsService.trackUserActivity(req.user._id, 'content_view', {
        contentId: content._id,
        moduleId: content.moduleId,
        sectionId: content.sectionId,
        contentType: content.type,
      });
    }
    
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get content by module and section
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getContentBySection = async (req, res, next) => {
  try {
    const { moduleId, sectionId } = req.params;
    
    // Find content for the specified module and section
    const query = {
      moduleId,
      sectionId,
    };
    
    // Only admins can see unpublished content
    if (req.user?.role !== 'admin') {
      query.isPublished = true;
    }
    
    const content = await Content.find(query).sort({ order: 1 });
    
    if (!content.length) {
      return next(new APIError('No content found for this section', 404));
    }
    
    // Track section view for authenticated users
    if (req.user) {
      analyticsService.trackUserActivity(req.user._id, 'section_view', {
        moduleId,
        sectionId,
      });
    }
    
    res.status(200).json({
      success: true,
      count: content.length,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createContent = async (req, res, next) => {
  try {
    // Only admins can create content
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to create content', 403));
    }
    
    const {
      moduleId,
      sectionId,
      title,
      content,
      type,
      order,
      metadata,
      resources,
      isPublished,
    } = req.body;
    
    // Sanitize HTML content to prevent XSS
    const sanitizedContent = sanitizeHtml(content);
    
    const newContent = new Content({
      moduleId,
      sectionId,
      title,
      content: sanitizedContent,
      type,
      order: order || 0,
      metadata: metadata || {},
      resources: resources || [],
      isPublished: isPublished || false,
      createdBy: req.user._id,
    });
    
    await newContent.save();
    
    res.status(201).json({
      success: true,
      data: newContent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateContent = async (req, res, next) => {
  try {
    // Only admins can update content
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to update content', 403));
    }
    
    const { id } = req.params;
    
    // Find content
    let content = await Content.findById(id);
    
    if (!content) {
      return next(new APIError('Content not found', 404));
    }
    
    // Sanitize HTML content if provided
    if (req.body.content) {
      req.body.content = sanitizeHtml(req.body.content);
    }
    
    // Update lastUpdated timestamp
    req.body.lastUpdated = Date.now();
    req.body.updatedBy = req.user._id;
    
    // Update content
    content = await Content.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteContent = async (req, res, next) => {
  try {
    // Only admins can delete content
    if (req.user.role !== 'admin') {
      return next(new APIError('Not authorized to delete content', 403));
    }
    
    const { id } = req.params;
    
    // Find content
    const content = await Content.findById(id);
    
    if (!content) {
      return next(new APIError('Content not found', 404));
    }
    
    await content.remove();
    
    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.searchContent = async (req, res, next) => {
  try {
    const { q, moduleId, type, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return next(new APIError('Search query is required', 400));
    }
    
    // Build search query
    const searchQuery = {
      $text: { $search: q },
      isPublished: true, // Only search published content for regular users
    };
    
    // Apply additional filters
    if (moduleId) searchQuery.moduleId = moduleId;
    if (type) searchQuery.type = type;
    
    // Allow admins to search unpublished content
    if (req.user?.role === 'admin' && req.query.published === 'false') {
      delete searchQuery.isPublished;
    }
    
    // Create base query with text score
    const query = Content.find(
      searchQuery,
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    // Apply pagination
    const result = await paginate(query, parseInt(page), parseInt(limit));
    
    // Track search for authenticated users
    if (req.user) {
      analyticsService.trackUserActivity(req.user._id, 'content_search', {
        query: q,
        moduleId,
        type,
        resultsCount: result.pagination.totalItems,
      });
    }
    
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get related content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getRelatedContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 3 } = req.query;
    
    // Find current content
    const content = await Content.findById(id);
    
    if (!content) {
      return next(new APIError('Content not found', 404));
    }
    
    // Get keywords from metadata
    const keywords = content.metadata?.keywords || [];
    const moduleId = content.moduleId;
    const sectionId = content.sectionId;
    
    // Find related content based on same module, section, or keywords
    const relatedContent = await Content.aggregate([
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(id) },
          isPublished: true,
          $or: [
            { moduleId },
            { sectionId },
            { 'metadata.keywords': { $in: keywords } },
          ],
        },
      },
      {
        $addFields: {
          // Score based on relevance:
          // Same module = 3 points
          // Same section = 5 points
          // Each matching keyword = 1 point
          relevanceScore: {
            $add: [
              { $cond: [{ $eq: ['$moduleId', moduleId] }, 3, 0] },
              { $cond: [{ $eq: ['$sectionId', sectionId] }, 5, 0] },
              {
                $size: {
                  $setIntersection: ['$metadata.keywords', keywords],
                },
              },
            ],
          },
        },
      },
      { $sort: { relevanceScore: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          title: 1,
          moduleId: 1,
          sectionId: 1,
          type: 1,
          relevanceScore: 1,
        },
      },
    ]);
    
    res.status(200).json({
      success: true,
      count: relatedContent.length,
      data: relatedContent,
    });
  } catch (error) {
    next(error);
  }
};