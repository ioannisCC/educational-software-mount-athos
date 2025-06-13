// backend/server.js

require('dotenv').config({ path: '../.env' });

// Import needed packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const progressRoutes = require('./routes/progressRoutes');
const adaptiveLearningRoutes = require('./routes/adaptiveLearningRoutes'); // NEW

// Create the app
const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to match frontend

// Set up middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://ioanniscatargiu:mountathos@cluster.qp2teap.mongodb.net/?retryWrites=true&w=majority&appName=cluster')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/adaptive', adaptiveLearningRoutes); // NEW: Adaptive Learning Routes

// Simple test route
app.get('/', (req, res) => {
  res.send('Mount Athos Explorer API with Adaptive Learning is working!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('🤖 Adaptive Learning System: ACTIVE');
  console.log('Available endpoints:');
  console.log('  - GET  /api/adaptive/recommendations');
  console.log('  - GET  /api/adaptive/content/:moduleId');
  console.log('  - GET  /api/adaptive/quizzes/:moduleId');
  console.log('  - POST /api/adaptive/track-behavior');
  console.log('  - GET  /api/adaptive/learning-path');
});