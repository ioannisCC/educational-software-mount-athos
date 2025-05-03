/**
 * Content Import Utility
 * 
 * This script imports educational content from structured files into the MongoDB database
 * for the Mount Athos Explorer educational software.
 * 
 * Usage: node importContent.js [--module=<moduleId>] [--clear] [--verbose]
 * Options:
 *   --module=<moduleId>  Import only specific module (e.g., module1, module2, module3)
 *   --clear              Clear existing content before importing
 *   --verbose            Show detailed logging during import
 */

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const marked = require('marked');
const matter = require('gray-matter');
const { program } = require('commander');

// Import MongoDB models (adjust paths based on your project structure)
const Content = require('../server/models/Content');
const Quiz = require('../server/models/Quiz');
const User = require('../server/models/User');

// Parse command line arguments
program
  .option('--module <moduleId>', 'Import only specific module')
  .option('--clear', 'Clear existing content before importing')
  .option('--verbose', 'Show detailed logging during import')
  .parse(process.argv);

const options = program.opts();
const verbose = options.verbose || false;
const clearContent = options.clear || false;
const specificModule = options.module || null;

// Base content directory
const CONTENT_DIR = path.join(__dirname, '../content');

// MongoDB connection
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mount_athos_explorer';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
}

// Clear existing content
async function clearExistingContent() {
  if (!clearContent) return;
  
  try {
    if (specificModule) {
      console.log(`🗑️  Clearing existing content for module: ${specificModule}`);
      await Content.deleteMany({ moduleId: specificModule });
      await Quiz.deleteMany({ moduleId: specificModule });
    } else {
      console.log('🗑️  Clearing all existing content and quizzes');
      await Content.deleteMany({});
      await Quiz.deleteMany({});
    }
  } catch (err) {
    console.error('❌ Error clearing content:', err);
    process.exit(1);
  }
}

// Process Markdown files and extract content
function processMarkdownFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(content);
    
    return {
      ...data, // Frontmatter metadata
      content: htmlContent,
      markdown: content,
      path: filePath,
    };
  } catch (err) {
    console.error(`❌ Error processing file ${filePath}:`, err);
    return null;
  }
}

// Process JSON files
function processJSONFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`❌ Error processing JSON file ${filePath}:`, err);
    return null;
  }
}

// Import module content
async function importModuleContent(moduleId) {
  const moduleDir = path.join(CONTENT_DIR, moduleId);
  
  if (!fs.existsSync(moduleDir)) {
    console.error(`❌ Module directory not found: ${moduleDir}`);
    return;
  }
  
  console.log(`📚 Importing content for module: ${moduleId}`);
  
  // Import lessons content
  const lessonsDir = path.join(moduleDir, 'lessons');
  if (fs.existsSync(lessonsDir)) {
    const lessonFiles = fs.readdirSync(lessonsDir).filter(file => 
      file.endsWith('.md') || file.endsWith('.json')
    );
    
    for (const file of lessonFiles) {
      const filePath = path.join(lessonsDir, file);
      let lessonData;
      
      if (file.endsWith('.md')) {
        lessonData = processMarkdownFile(filePath);
      } else if (file.endsWith('.json')) {
        lessonData = processJSONFile(filePath);
      }
      
      if (lessonData) {
        // Extract section ID from filename (e.g., origins.md -> origins)
        const sectionId = path.basename(file, path.extname(file));
        
        const contentItem = new Content({
          moduleId,
          sectionId,
          title: lessonData.title || `Untitled (${sectionId})`,
          content: lessonData.content || lessonData.html || '',
          type: 'lesson',
          order: lessonData.order || 0,
          metadata: {
            keywords: lessonData.keywords || [],
            learningStyles: lessonData.learningStyles || ['visual', 'textual'],
            duration: lessonData.duration || 15, // in minutes
            difficulty: lessonData.difficulty || 'beginner',
          },
          resources: lessonData.resources || [],
        });
        
        try {
          await contentItem.save();
          if (verbose) {
            console.log(`  ✅ Imported lesson: ${sectionId} - ${lessonData.title}`);
          }
        } catch (err) {
          console.error(`  ❌ Error saving lesson ${sectionId}:`, err);
        }
      }
    }
  }
  
  // Import quizzes
  const quizzesDir = path.join(moduleDir, 'quizzes');
  if (fs.existsSync(quizzesDir)) {
    const quizFiles = fs.readdirSync(quizzesDir).filter(file => 
      file.endsWith('.json')
    );
    
    for (const file of quizFiles) {
      const filePath = path.join(quizzesDir, file);
      const quizData = processJSONFile(filePath);
      
      if (quizData) {
        // Extract section ID from filename (e.g., origins-quiz.json -> origins)
        const sectionId = path.basename(file, '-quiz.json');
        
        const quiz = new Quiz({
          moduleId,
          sectionId,
          title: quizData.title || `Quiz: ${sectionId}`,
          description: quizData.description || '',
          questions: quizData.questions || [],
        });
        
        try {
          await quiz.save();
          if (verbose) {
            console.log(`  ✅ Imported quiz: ${sectionId} - ${quizData.title}`);
          }
        } catch (err) {
          console.error(`  ❌ Error saving quiz ${sectionId}:`, err);
        }
      }
    }
  }
}

// Create placeholder content if no files found
async function createPlaceholderContent() {
  console.log('⚠️  No content files found. Creating placeholder content...');
  
  const modules = ['module1', 'module2', 'module3'];
  const sections = {
    module1: ['origins', 'monastic-republic', 'through-ages', 'religious-life'],
    module2: ['overview', 'architecture', 'treasures', 'preservation'],
    module3: ['geography', 'flora-fauna', 'paths', 'conservation'],
  };
  
  for (const moduleId of modules) {
    if (specificModule && moduleId !== specificModule) continue;
    
    for (const sectionId of sections[moduleId]) {
      // Create placeholder lesson content
      const contentItem = new Content({
        moduleId,
        sectionId,
        title: `${sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        content: `<h1>${sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
                 <p>This is placeholder content for the ${sectionId} section of ${moduleId}.</p>
                 <p>Replace this with actual content by adding markdown files to the content/${moduleId}/lessons directory.</p>`,
        type: 'lesson',
        order: sections[moduleId].indexOf(sectionId),
        metadata: {
          keywords: [moduleId, sectionId],
          learningStyles: ['visual', 'textual'],
          duration: 15,
          difficulty: 'beginner',
        },
        resources: [],
      });
      
      try {
        await contentItem.save();
        if (verbose) {
          console.log(`  ✅ Created placeholder lesson: ${moduleId}/${sectionId}`);
        }
      } catch (err) {
        console.error(`  ❌ Error creating placeholder lesson ${moduleId}/${sectionId}:`, err);
      }
      
      // Create placeholder quiz
      const quiz = new Quiz({
        moduleId,
        sectionId,
        title: `Quiz: ${sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `Test your knowledge about ${sectionId.replace(/-/g, ' ')}`,
        questions: [
          {
            id: `${sectionId}-q1`,
            type: 'multiple-choice',
            question: `Sample question about ${sectionId.replace(/-/g, ' ')}?`,
            options: [
              { id: 'a', text: 'Answer option A' },
              { id: 'b', text: 'Answer option B' },
              { id: 'c', text: 'Answer option C' },
              { id: 'd', text: 'Answer option D' },
            ],
            correctAnswer: 'a',
            explanation: 'This is a placeholder question. Replace with actual content.',
            points: 10,
          },
        ],
      });
      
      try {
        await quiz.save();
        if (verbose) {
          console.log(`  ✅ Created placeholder quiz: ${moduleId}/${sectionId}`);
        }
      } catch (err) {
        console.error(`  ❌ Error creating placeholder quiz ${moduleId}/${sectionId}:`, err);
      }
    }
  }
}

// Check if content directories exist
function contentDirectoriesExist() {
  let found = false;
  
  // If specific module is specified, only check that one
  if (specificModule) {
    const moduleDir = path.join(CONTENT_DIR, specificModule);
    const lessonsDir = path.join(moduleDir, 'lessons');
    const quizzesDir = path.join(moduleDir, 'quizzes');
    
    return fs.existsSync(lessonsDir) || fs.existsSync(quizzesDir);
  }
  
  // Otherwise check all modules
  const modules = ['module1', 'module2', 'module3'];
  for (const moduleId of modules) {
    const moduleDir = path.join(CONTENT_DIR, moduleId);
    const lessonsDir = path.join(moduleDir, 'lessons');
    const quizzesDir = path.join(moduleDir, 'quizzes');
    
    if (fs.existsSync(lessonsDir) || fs.existsSync(quizzesDir)) {
      found = true;
      break;
    }
  }
  
  return found;
}

// Main import function
async function importContent() {
  console.log('🚀 Starting content import...');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing content if requested
    await clearExistingContent();
    
    const hasContentDirs = contentDirectoriesExist();
    
    if (!hasContentDirs) {
      // Create placeholder content if no content directories found
      await createPlaceholderContent();
    } else {
      // Import actual content from files
      if (specificModule) {
        await importModuleContent(specificModule);
      } else {
        // Import all modules
        await importModuleContent('module1');
        await importModuleContent('module2');
        await importModuleContent('module3');
      }
    }
    
    console.log('✅ Content import completed successfully!');
    
    // Import statistics
    const contentCount = await Content.countDocuments();
    const quizCount = await Quiz.countDocuments();
    console.log(`📊 Statistics: ${contentCount} content items, ${quizCount} quizzes imported.`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('👋 MongoDB Disconnected');
    
  } catch (err) {
    console.error('❌ Error during content import:', err);
    process.exit(1);
  }
}

// Run the import
importContent();