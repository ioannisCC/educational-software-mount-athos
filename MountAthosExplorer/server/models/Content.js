/**
 * Content Model
 * 
 * Schema for educational content in the Mount Athos Explorer
 * educational application.
 */

const mongoose = require('mongoose');

// Resource schema (for attachments, links, etc.)
const ResourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['link', 'file', 'image', 'video', 'audio', '3d'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  mimeType: String,
  size: Number, // in bytes
  duration: Number, // in seconds (for audio/video)
  dimensions: {
    width: Number,
    height: Number,
  },
});

// Content schema
const ContentSchema = new mongoose.Schema({
  moduleId: {
    type: String,
    required: [true, 'Module ID is required'],
    index: true,
  },
  sectionId: {
    type: String,
    required: [true, 'Section ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  type: {
    type: String,
    enum: ['lesson', 'article', 'video', 'interactive', '3d'],
    required: [true, 'Content type is required'],
    default: 'lesson',
  },
  order: {
    type: Number,
    default: 0,
  },
  metadata: {
    keywords: [String],
    learningStyles: [{
      type: String,
      enum: ['visual', 'textual', 'interactive'],
    }],
    duration: {
      type: Number, // in minutes
      min: [1, 'Duration must be at least 1 minute'],
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    authors: [String],
    sources: [String],
    lastUpdated: Date,
  },
  resources: [ResourceSchema],
  isPublished: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  ratingsCount: {
    type: Number,
    default: 0,
  },
});

// Create indexes
ContentSchema.index({ moduleId: 1, sectionId: 1, order: 1 });
ContentSchema.index({ title: 'text', content: 'text', 'metadata.keywords': 'text' });
ContentSchema.index({ 'metadata.learningStyles': 1 });
ContentSchema.index({ 'metadata.difficulty': 1 });
ContentSchema.index({ isPublished: 1 });

// Update lastUpdated timestamp on save
ContentSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Virtual for content summary
ContentSchema.virtual('summary').get(function() {
  if (!this.content) return '';
  
  // Strip HTML tags and get plain text
  const plainText = this.content.replace(/<[^>]+>/g, '');
  
  // Get first 150 characters
  return plainText.length > 150
    ? plainText.substring(0, 150) + '...'
    : plainText;
});

module.exports = mongoose.model('Content', ContentSchema);