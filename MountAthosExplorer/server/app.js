/**
 * Mount Athos Explorer Server
 * 
 * Main server application file for the Mount Athos Explorer
 * educational software.
 */

// Import required modules
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Import custom middleware
const { httpLogger, requestId, startTimer, errorLogger } = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import configuration
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(config.MONGODB.uri, config.MONGODB.options)
  .then(() => console.log(`📦 MongoDB Connected: ${mongoose.connection.host}`))
  .catch(err => {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  });

// Middleware setup
app.use(requestId); // Add unique request ID
app.use(startTimer); // Add request timer
app.use(httpLogger); // Request logging

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// CORS setup
app.use(cors({
  origin: config.CORS.origin,
  credentials: config.CORS.credentials,
  allowedHeaders: config.CORS.allowedHeaders,
  methods: config.CORS.methods,
  maxAge: config.CORS.maxAge,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.windowMs,
  max: config.RATE_LIMIT.max,
  standardHeaders: config.RATE_LIMIT.standardHeaders,
  legacyHeaders: config.RATE_LIMIT.legacyHeaders,
  message: config.RATE_LIMIT.message,
});
app.use(limiter);

// API Routes
app.use(`${config.SERVER.apiPrefix}/auth`, authRoutes);
app.use(`${config.SERVER.apiPrefix}/content`, contentRoutes);
app.use(`${config.SERVER.apiPrefix}/quizzes`, quizRoutes);
app.use(`${config.SERVER.apiPrefix}/users`, userRoutes);

// Health check endpoint
app.get(`${config.SERVER.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.NODE_ENV,
  });
});

// Serve static files from the React app in production
if (config.isProd) {
  app.use(express.static(config.STATIC.path, config.STATIC.options));
  
  // For any request that doesn't match an API route, send the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.STATIC.path, 'index.html'));
  });
}

// Error handling middleware
app.use(errorLogger); // Log errors
app.use(errorHandler); // Handle errors
app.use(notFound); // Handle 404 Not Found

// Start the server
const PORT = config.SERVER.port || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  console.log(`📊 API available at ${config.SERVER.publicUrl}${config.SERVER.apiPrefix}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Promise Rejection: ${err.message}`);
  console.error(err.stack);
  // Don't exit in development for easier debugging
  if (config.isProd) {
    process.exit(1);
  }
});

module.exports = app;