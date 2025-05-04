// backend/server.js

require('dotenv').config({ path: '../.env' });

// Import needed packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create the app
const app = express();
const PORT = process.env.PORT || 5001;

// Set up middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://ioanniscatargiu:mountathos@cluster.qp2teap.mongodb.net/?retryWrites=true&w=majority&appName=cluster')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

// Simple test route
app.get('/', (req, res) => {
  res.send('Mount Athos Explorer API is working!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});