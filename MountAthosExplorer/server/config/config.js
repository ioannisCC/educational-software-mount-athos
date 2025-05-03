/**
 * Server Configuration
 * 
 * Central configuration file for the Mount Athos Explorer server
 * Loads environment variables and provides defaults for server settings
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Server settings
const SERVER = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:5000',
};

// MongoDB database connection
const MONGODB = {
  uri: isProd 
    ? process.env.MONGODB_URI_PROD 
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/mount_athos_explorer',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: isDev, // Don't build indexes in production
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  },
};

// JWT Authentication
const JWT = {
  secret: process.env.JWT_SECRET || 'mount-athos-explorer-jwt-secret-key',
  expire: process.env.JWT_EXPIRE || '30d', // Token expiration
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'mount-athos-explorer-refresh-secret-key',
  refreshExpire: process.env.JWT_REFRESH_EXPIRE || '90d', // Refresh token expiration
  cookieName: 'jwt',
  cookieOptions: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
  },
};

// Content storage paths
const CONTENT = {
  basePath: process.env.CONTENT_PATH || path.resolve(__dirname, '../../content'),
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB default
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'application/pdf',
    'model/gltf-binary', // For 3D models
    'application/json',
  ],
};

// CORS settings
const CORS = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  maxAge: 86400, // 24 hours in seconds
};

// Rate limiting to prevent abuse
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later',
};

// Logger configuration
const LOGGER = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? 'dev' : 'combined',
  directory: process.env.LOG_DIR || path.resolve(__dirname, '../../logs'),
  maxFiles: process.env.LOG_MAX_FILES || '14d', // Keep logs for 14 days
  maxSize: process.env.LOG_MAX_SIZE || '20m', // 20MB per file
};

// Adaptive learning settings
const ADAPTIVE_LEARNING = {
  // Weight factors for different aspects of user behavior when generating recommendations
  weights: {
    quizPerformance: 0.4,
    contentInteraction: 0.3,
    learningStyle: 0.2,
    popularity: 0.1,
  },
  // Thresholds for determining when to recommend additional content
  thresholds: {
    quizScoreThreshold: 70, // Score % above which user can move to advanced content
    lowPerformanceThreshold: 40, // Score % below which user needs remedial content
    contentViewTimeMinimum: 30, // Minimum seconds user should spend on content
  },
  // How frequently recommendations should be recalculated
  recalculationInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Email configuration (for password resets, notifications)
const EMAIL = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  from: process.env.EMAIL_FROM || 'no-reply@mountathosexplorer.edu',
  service: process.env.EMAIL_SERVICE || 'smtp',
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Session configuration
const SESSION = {
  secret: process.env.SESSION_SECRET || 'mount-athos-explorer-session-secret',
  name: 'mountathos.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  store: null, // Will be set in app.js with MongoDB session store
};

// Static file serving configuration
const STATIC = {
  path: process.env.STATIC_PATH || path.resolve(__dirname, '../../client/build'),
  options: {
    maxAge: isProd ? '7d' : 0, // Cache for 7 days in production
    etag: true,
    lastModified: true,
    index: 'index.html',
  },
};

// Analytics configuration
const ANALYTICS = {
  enabled: process.env.ANALYTICS_ENABLED !== 'false',
  trackAnonymous: process.env.ANALYTICS_TRACK_ANONYMOUS === 'true',
  anonymizeIP: process.env.ANALYTICS_ANONYMIZE_IP !== 'false',
  eventBatchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '20', 10),
  flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '30000', 10), // 30 seconds
};

// Export all configuration
module.exports = {
  NODE_ENV,
  isDev,
  isProd,
  isTest,
  SERVER,
  MONGODB,
  JWT,
  CONTENT,
  CORS,
  RATE_LIMIT,
  LOGGER,
  ADAPTIVE_LEARNING,
  EMAIL,
  SESSION,
  STATIC,
  ANALYTICS,
};