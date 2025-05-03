/**
 * Database Utility Functions
 * 
 * Provides utility functions for MongoDB database operations
 * in the Mount Athos Explorer educational software.
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { logger } = require('../middleware/logger');

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
exports.connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB.uri, config.MONGODB.options);
    
    logger.info(`MongoDB connected: ${conn.connection.host} (${config.NODE_ENV} mode)`);
    
    // Set up connection event handlers
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Handle process termination for clean database disconnection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return conn.connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
exports.disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Check if MongoDB connection is established
 * @returns {boolean} - True if connected, false otherwise
 */
exports.isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Create database indexes
 * Use this function to ensure all necessary indexes are created
 * @returns {Promise<void>}
 */
exports.createIndexes = async () => {
  try {
    // Import models
    const User = require('../models/User');
    const Content = require('../models/Content');
    const Quiz = require('../models/Quiz');
    const Progress = require('../models/Progress');
    
    // Create indexes (if they don't already exist)
    // These are just examples - adjust based on your actual query patterns
    await User.createIndexes();
    await Content.createIndexes();
    await Quiz.createIndexes();
    await Progress.createIndexes();
    
    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error(`Error creating MongoDB indexes: ${error.message}`);
    throw error;
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} - Database statistics
 */
exports.getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    
    // Get collection counts
    const User = require('../models/User');
    const Content = require('../models/Content');
    const Quiz = require('../models/Quiz');
    const Progress = require('../models/Progress');
    
    const userCount = await User.countDocuments();
    const contentCount = await Content.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const progressCount = await Progress.countDocuments();
    
    return {
      dbStats: stats,
      counts: {
        users: userCount,
        content: contentCount,
        quizzes: quizCount,
        progress: progressCount,
      },
      connection: {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
      },
    };
  } catch (error) {
    logger.error(`Error getting database stats: ${error.message}`);
    throw error;
  }
};

/**
 * Run database health check
 * @returns {Promise<Object>} - Health check results
 */
exports.healthCheck = async () => {
  try {
    // Check connection status
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return {
        status: 'error',
        connection: false,
        message: 'Database connection is not established',
      };
    }
    
    // Ping database
    const pingResult = await mongoose.connection.db.admin().ping();
    
    // Run simple query to check read functionality
    const User = require('../models/User');
    await User.findOne().select('_id').lean().exec();
    
    return {
      status: 'ok',
      connection: true,
      ping: pingResult.ok === 1,
      message: 'Database is healthy',
    };
  } catch (error) {
    logger.error(`Database health check failed: ${error.message}`);
    
    return {
      status: 'error',
      connection: false,
      message: `Database health check failed: ${error.message}`,
      error: config.isDev ? error.stack : undefined,
    };
  }
};

/**
 * Backup database collections (simulated - for real implementation use MongoDB tools)
 * @param {Array<string>} collections - Collection names to backup
 * @returns {Promise<Object>} - Backup results
 */
exports.backupCollections = async (collections = []) => {
  try {
    logger.info(`Starting backup of collections: ${collections.join(', ') || 'all'}`);
    
    // In a real application, you would use MongoDB's native backup tools
    // like mongodump, or a backup service. This is just a simulated backup
    // that exports collection data to JSON for demonstration purposes.
    
    const results = {};
    const db = mongoose.connection.db;
    
    // If no collections specified, get all collections
    const collectionsList = collections.length > 0 
      ? collections 
      : (await db.listCollections().toArray()).map(c => c.name);
    
    for (const collectionName of collectionsList) {
      try {
        // Get collection
        const collection = db.collection(collectionName);
        
        // Count documents
        const count = await collection.countDocuments();
        
        // In a real backup, you would export the data here
        // For example:
        // const data = await collection.find().toArray();
        // await fs.writeFile(`./backup/${collectionName}.json`, JSON.stringify(data));
        
        results[collectionName] = {
          success: true,
          count,
          message: `Simulated backup of ${count} documents`,
        };
        
        logger.info(`Backup of collection ${collectionName} completed (${count} documents)`);
      } catch (collectionError) {
        results[collectionName] = {
          success: false,
          error: collectionError.message,
        };
        
        logger.error(`Error backing up collection ${collectionName}: ${collectionError.message}`);
      }
    }
    
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      collections: results,
    };
  } catch (error) {
    logger.error(`Database backup failed: ${error.message}`);
    
    return {
      status: 'error',
      message: `Database backup failed: ${error.message}`,
      error: config.isDev ? error.stack : undefined,
    };
  }
};

/**
 * Execute an aggregation pipeline with proper error handling
 * @param {mongoose.Model} model - Mongoose model to run the aggregation on
 * @param {Array<Object>} pipeline - MongoDB aggregation pipeline
 * @param {Object} options - Aggregation options
 * @returns {Promise<Array<Object>>} - Aggregation results
 */
exports.safeAggregation = async (model, pipeline, options = {}) => {
  try {
    // Add timeout if not specified
    const aggregateOptions = {
      allowDiskUse: true, // For large datasets
      maxTimeMS: 30000, // 30 second timeout
      ...options,
    };
    
    // Execute aggregation
    const results = await model.aggregate(pipeline).option(aggregateOptions).exec();
    
    return results;
  } catch (error) {
    logger.error(`Aggregation error: ${error.message}`);
    
    // Provide more context in the error
    const enhancedError = new Error(`Aggregation error on ${model.modelName}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.pipeline = pipeline;
    enhancedError.model = model.modelName;
    
    throw enhancedError;
  }
};

/**
 * Paginate query results with simplified interface
 * @param {mongoose.Query} query - Mongoose query to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Promise<Object>} - Paginated results with metadata
 */
exports.paginate = async (query, page = 1, limit = 10) => {
  try {
    // Ensure positive numbers
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, limit);
    
    // Apply pagination
    const skip = (pageNum - 1) * limitNum;
    const countQuery = query.model.find().merge(query).skip(0).limit(0).select('_id');
    
    // Execute both queries in parallel
    const [data, totalCount] = await Promise.all([
      query.skip(skip).limit(limitNum).exec(),
      countQuery.countDocuments(),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    
    return {
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        pageSize: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  } catch (error) {
    logger.error(`Pagination error: ${error.message}`);
    throw error;
  }
};

/**
 * Transaction helper for MongoDB operations that need atomicity
 * @param {Function} callback - Async function that performs the transaction operations
 * @returns {Promise<any>} - Result from the transaction callback
 */
exports.withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await callback(session);
    await session.commitTransaction();
    
    return result;
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Transaction aborted: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};