/**
 * Logger Middleware
 * 
 * Configures Winston logging and provides Express middleware
 * for request/response logging in the Mount Athos Explorer server.
 */

const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure log directory exists
if (!fs.existsSync(config.LOGGER.directory)) {
  fs.mkdirSync(config.LOGGER.directory, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: config.LOGGER.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mount-athos-explorer' },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      ),
    }),
    
    // Write all logs to files
    new winston.transports.File({
      filename: path.join(config.LOGGER.directory, 'error.log'),
      level: 'error',
      maxsize: config.LOGGER.maxSize,
      maxFiles: config.LOGGER.maxFiles,
    }),
    new winston.transports.File({
      filename: path.join(config.LOGGER.directory, 'combined.log'),
      maxsize: config.LOGGER.maxSize,
      maxFiles: config.LOGGER.maxFiles,
    }),
  ],
  exitOnError: false,
});

// Custom Morgan token for request body (in development only)
morgan.token('body', (req) => {
  if (config.isDev && req.body && Object.keys(req.body).length) {
    // Mask sensitive data
    const maskedBody = { ...req.body };
    
    // Mask password fields
    if (maskedBody.password) maskedBody.password = '[MASKED]';
    if (maskedBody.currentPassword) maskedBody.currentPassword = '[MASKED]';
    if (maskedBody.newPassword) maskedBody.newPassword = '[MASKED]';
    
    // Mask token fields
    if (maskedBody.token) maskedBody.token = '[MASKED]';
    if (maskedBody.refreshToken) maskedBody.refreshToken = '[MASKED]';
    
    return JSON.stringify(maskedBody);
  }
  return '';
});

// Custom Morgan token for response time
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    // Missing request/response start time
    return '';
  }
  
  // Calculate time in milliseconds
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 + (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(2);
});

// Custom Morgan token for user ID (if authenticated)
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Create Morgan middleware
const morganFormat = config.isDev
  ? ':method :url :status :response-time-ms ms - :res[content-length] - :user-id :body'
  : ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time-ms ms';

const httpLogger = morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
  skip: (req, res) => {
    // Skip logging for static files and successful health checks in production
    if (config.isProd) {
      if ((req.originalUrl && req.originalUrl.startsWith('/static/'))) return true;
      if (req.originalUrl === '/api/health' && res.statusCode === 200) return true;
    }
    return false;
  },
});

/**
 * Request ID middleware
 * Adds a unique request ID to each request for better tracing
 */
const requestId = (req, res, next) => {
  const id = req.get('X-Request-ID') || 
            require('crypto').randomBytes(16).toString('hex');
  
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Response time tracking middleware
 * Adds start time to request object
 */
const startTimer = (req, res, next) => {
  req._startAt = process.hrtime();
  
  // Add response finish listener to capture end time
  res.on('finish', () => {
    res._startAt = process.hrtime();
  });
  
  next();
};

/**
 * Error logging middleware
 * Log errors with Winston
 */
const errorLogger = (err, req, res, next) => {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    path: req.path,
    method: req.method,
    query: req.query,
    params: req.params,
    user: req.user ? req.user._id : 'anonymous',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  next(err);
};

// Export logger and middleware
module.exports = {
  logger,
  httpLogger,
  requestId,
  startTimer,
  errorLogger,
  
  // Helper methods for convenient logging
  log: logger.info.bind(logger),
  info: logger.info.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  debug: logger.debug.bind(logger),
  
  // Winston instance for direct access
  winston: logger,
};