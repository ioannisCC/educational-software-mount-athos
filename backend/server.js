// backend/server.js

// Import needed packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create the app
const app = express();
const PORT = 5000;

// Set up middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://ioanniscatargiu:mountathos@cluster.qp2teap.mongodb.net/?retryWrites=true&w=majority&appName=cluster')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Simple test route
app.get('/', (req, res) => {
  res.send('Mount Athos Explorer API is working!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});