// backend/controllers/contentController.js
const Content = require('../models/Content');

// Get all modules
exports.getModules = async (req, res) => {
  try {
    // Get unique modules
    const modules = await Content.distinct('moduleId');
    
    // Format modules with titles
    const moduleData = modules.map(id => ({
      id,
      title: `Module ${id}`
    }));
    
    res.json(moduleData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get content by module ID
exports.getContentByModule = async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const content = await Content.find({ moduleId });
    
    if (content.length === 0) {
      return res.status(404).json({ message: 'No content found for this module' });
    }
    
    res.json(content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get content by ID
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Create content
exports.createContent = async (req, res) => {
  try {
    const { moduleId, title, type, content, difficulty } = req.body;
    
    const newContent = new Content({
      moduleId,
      title,
      type,
      content,
      difficulty
    });
    
    await newContent.save();
    res.status(201).json(newContent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update content
exports.updateContent = async (req, res) => {
  try {
    const { moduleId, title, type, content, difficulty } = req.body;
    
    // Find and update content
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      { moduleId, title, type, content, difficulty },
      { new: true }
    );
    
    if (!updatedContent) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(updatedContent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete content
exports.deleteContent = async (req, res) => {
    try {
      const content = await Content.findById(req.params.id);
      
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }
      
      // Use deleteOne instead of remove
      await Content.deleteOne({ _id: req.params.id });
      res.json({ message: 'Content removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };

// Delete all content for a module
exports.deleteModule = async (req, res) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    
    // Check if module exists
    const moduleExists = await Content.exists({ moduleId });
    if (!moduleExists) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Delete all content for this module
    await Content.deleteMany({ moduleId });
    
    res.json({ message: `All content for Module ${moduleId} has been removed` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.searchContent = async (req, res) => {
    try {
      const { term } = req.query;
      
      if (!term) {
        return res.status(400).json({ message: 'Search term is required' });
      }
      
      // Search in title and content fields
      const searchResults = await Content.find({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { content: { $regex: term, $options: 'i' } }
        ]
      });
      
      res.json(searchResults);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  };