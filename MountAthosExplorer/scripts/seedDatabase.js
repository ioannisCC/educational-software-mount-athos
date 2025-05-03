/**
 * Database Seeding Script
 * 
 * This script populates the MongoDB database with initial data for the
 * Mount Athos Explorer educational software.
 * 
 * Usage: node seedDatabase.js [--clear] [--sample-data] [--verbose]
 * Options:
 *   --clear         Clear all existing data before seeding
 *   --sample-data   Include sample user accounts and progress data
 *   --verbose       Show detailed logging during seeding
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

// Import MongoDB models
const User = require('../server/models/User');
const Content = require('../server/models/Content');
const Quiz = require('../server/models/Quiz');
const Progress = require('../server/models/Progress');
const LearningPath = require('../server/models/LearningPath');

// Parse command line arguments
program
  .option('--clear', 'Clear all existing data before seeding')
  .option('--sample-data', 'Include sample user accounts and progress data')
  .option('--verbose', 'Show detailed logging during seeding')
  .parse(process.argv);

const options = program.opts();
const verbose = options.verbose || false;
const clearData = options.clear || false;
const includeSampleData = options.sampleData || false;

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

// Clear existing data
async function clearExistingData() {
  if (!clearData) return;
  
  console.log('🗑️  Clearing all existing data...');
  
  try {
    await User.deleteMany({});
    await Content.deleteMany({});
    await Quiz.deleteMany({});
    await Progress.deleteMany({});
    await LearningPath.deleteMany({});
    
    console.log('✓ All existing data cleared');
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    process.exit(1);
  }
}

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mountathos.explorer' });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists. Skipping creation.');
      return existingAdmin;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = new User({
      email: 'admin@mountathos.explorer',
      password: hashedPassword,
      displayName: 'Admin',
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        learningPreferences: {
          style: 'balanced',
          difficulty: 'intermediate',
        },
      },
    });
    
    await adminUser.save();
    console.log('✅ Admin user created');
    return adminUser;
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    throw err;
  }
}

// Create monastery data
async function seedMonasteryData() {
  try {
    // Create a MongoDB model for monasteries (if not already done in your models)
    const Monastery = mongoose.model('Monastery', new mongoose.Schema({
      name: String,
      founded: Number,
      location: {
        latitude: Number,
        longitude: Number,
      },
      description: String,
      images: [String],
      model3d: String,
      visits: {
        requirements: String,
        schedule: String,
      },
      order: Number,
    }));
    
    // Clear existing monastery data if requested
    if (clearData) {
      await Monastery.deleteMany({});
    }
    
    // Check if monastery data already exists
    const existingCount = await Monastery.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️ ${existingCount} monasteries already exist. Skipping creation.`);
      return;
    }
    
    // Sample monastery data
    const monasteries = [
      {
        name: 'Great Lavra',
        founded: 963,
        location: {
          latitude: 40.1697,
          longitude: 24.3775,
        },
        description: 'The first monastery built on Mount Athos, founded by Saint Athanasius the Athonite with the support of Byzantine Emperor Nikephoros Phokas.',
        images: ['/images/monasteries/great-lavra.jpg'],
        model3d: '/models/monasteries/great-lavra.glb',
        visits: {
          requirements: 'Diamonitirion (visitor permit) required. Male visitors only.',
          schedule: 'Daily, sunrise to sunset. Closed on major religious holidays.',
        },
        order: 1,
      },
      {
        name: 'Vatopedi',
        founded: 972,
        location: {
          latitude: 40.3119,
          longitude: 24.2083,
        },
        description: 'One of the oldest and largest monasteries on Mount Athos, founded by three monks from Adrianople: Athanasius, Nicholas, and Antonius.',
        images: ['/images/monasteries/vatopedi.jpg'],
        model3d: '/models/monasteries/vatopedi.glb',
        visits: {
          requirements: 'Diamonitirion (visitor permit) required. Male visitors only.',
          schedule: 'Daily, sunrise to sunset. Closed on major religious holidays.',
        },
        order: 2,
      },
      {
        name: 'Iviron',
        founded: 980,
        location: {
          latitude: 40.3028,
          longitude: 24.1981,
        },
        description: 'Founded by Georgian monks, Iviron houses the miraculous icon of Panagia Portaitissa (the Gate-keeper), one of the most revered icons in Orthodox Christianity.',
        images: ['/images/monasteries/iviron.jpg'],
        model3d: '/models/monasteries/iviron.glb',
        visits: {
          requirements: 'Diamonitirion (visitor permit) required. Male visitors only.',
          schedule: 'Daily, sunrise to sunset. Closed on major religious holidays.',
        },
        order: 3,
      },
    ];
    
    // Save monastery data to database
    for (const monastery of monasteries) {
      const newMonastery = new Monastery(monastery);
      await newMonastery.save();
      if (verbose) {
        console.log(`  ✅ Created monastery: ${monastery.name}`);
      }
    }
    
    console.log(`✅ Created ${monasteries.length} monasteries`);
  } catch (err) {
    console.error('❌ Error seeding monastery data:', err);
    throw err;
  }
}

// Create sample users
async function createSampleUsers() {
  if (!includeSampleData) return [];
  
  try {
    // Check if sample users already exist
    const existingCount = await User.countDocuments({ email: { $ne: 'admin@mountathos.explorer' } });
    if (existingCount > 0) {
      console.log(`ℹ️ ${existingCount} sample users already exist. Skipping creation.`);
      return await User.find({ email: { $ne: 'admin@mountathos.explorer' } });
    }
    
    console.log('🧑‍🤝‍🧑 Creating sample users...');
    
    // Sample user data
    const salt = await bcrypt.genSalt(10);
    const sampleUsers = [
      {
        email: 'visual@example.com',
        password: await bcrypt.hash('password123', salt),
        displayName: 'Visual Learner',
        profile: {
          firstName: 'John',
          lastName: 'Visual',
          learningPreferences: {
            style: 'visual',
            difficulty: 'beginner',
          },
        },
      },
      {
        email: 'textual@example.com',
        password: await bcrypt.hash('password123', salt),
        displayName: 'Text Learner',
        profile: {
          firstName: 'Maria',
          lastName: 'Text',
          learningPreferences: {
            style: 'textual',
            difficulty: 'intermediate',
          },
        },
      },
      {
        email: 'interactive@example.com',
        password: await bcrypt.hash('password123', salt),
        displayName: 'Interactive Learner',
        profile: {
          firstName: 'Alex',
          lastName: 'Interactive',
          learningPreferences: {
            style: 'interactive',
            difficulty: 'advanced',
          },
        },
      },
    ];
    
    const createdUsers = [];
    
    // Save sample users to database
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      if (verbose) {
        console.log(`  ✅ Created user: ${userData.email}`);
      }
    }
    
    console.log(`✅ Created ${createdUsers.length} sample users`);
    return createdUsers;
  } catch (err) {
    console.error('❌ Error creating sample users:', err);
    throw err;
  }
}

// Create sample progress data
async function createSampleProgress(users) {
  if (!includeSampleData || !users.length) return;
  
  try {
    // Check if progress data already exists
    const existingCount = await Progress.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️ ${existingCount} progress records already exist. Skipping creation.`);
      return;
    }
    
    console.log('📊 Creating sample progress data...');
    
    // Get all content items and quizzes
    const contentItems = await Content.find().select('_id moduleId sectionId');
    const quizzes = await Quiz.find().select('_id moduleId sectionId');
    
    if (!contentItems.length || !quizzes.length) {
      console.log('⚠️ No content or quizzes found. Run importContent.js first, or use the --clear option.');
      return;
    }
    
    for (const user of users) {
      // Different progress for different user types
      let progressMultiplier = 0.5; // Default
      
      // Visual learner has more progress in module2 (Monasteries & Architecture)
      if (user.profile.learningPreferences.style === 'visual') {
        progressMultiplier = user.email === 'visual@example.com' ? 0.8 : 0.5;
      }
      // Textual learner has more progress in module1 (History & Religion)
      else if (user.profile.learningPreferences.style === 'textual') {
        progressMultiplier = user.email === 'textual@example.com' ? 0.9 : 0.5;
      }
      // Interactive learner has more progress in module3 (Natural Environment)
      else if (user.profile.learningPreferences.style === 'interactive') {
        progressMultiplier = user.email === 'interactive@example.com' ? 0.7 : 0.5;
      }
      
      // Create progress record
      const userProgress = new Progress({
        userId: user._id,
        modules: [
          {
            id: 'module1',
            completion: Math.round(user.email === 'textual@example.com' ? 90 : 40),
            lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random day in last week
            sections: []
          },
          {
            id: 'module2',
            completion: Math.round(user.email === 'visual@example.com' ? 75 : 25),
            lastAccessed: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random day in last two weeks
            sections: []
          },
          {
            id: 'module3',
            completion: Math.round(user.email === 'interactive@example.com' ? 60 : 15),
            lastAccessed: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000), // Random day in last three weeks
            sections: []
          }
        ],
        contentProgress: [],
        quizProgress: [],
        achievements: []
      });
      
      // Add section progress for each module
      const modules = ['module1', 'module2', 'module3'];
      const sections = {
        module1: ['origins', 'monastic-republic', 'through-ages', 'religious-life'],
        module2: ['overview', 'architecture', 'treasures', 'preservation'],
        module3: ['geography', 'flora-fauna', 'paths', 'conservation'],
      };
      
      modules.forEach((moduleId, moduleIndex) => {
        const baseProgress = userProgress.modules[moduleIndex].completion;
        
        sections[moduleId].forEach((sectionId, sectionIndex) => {
          // Calculate section completion - earlier sections have more progress
          const sectionCompletion = Math.min(100, Math.round(
            baseProgress * (1 + (1 - sectionIndex / sections[moduleId].length) / 2)
          ));
          
          userProgress.modules[moduleIndex].sections.push({
            id: sectionId,
            completion: sectionCompletion,
            lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random day in last month
          });
          
          // Find content items for this section
          const sectionContent = contentItems.filter(c => 
            c.moduleId === moduleId && c.sectionId === sectionId
          );
          
          // Add content progress
          sectionContent.forEach(content => {
            userProgress.contentProgress.push({
              contentId: content._id,
              completed: Math.random() < sectionCompletion / 100,
              progress: Math.round(Math.random() * sectionCompletion),
              lastAccessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            });
          });
          
          // Find quizzes for this section
          const sectionQuizzes = quizzes.filter(q => 
            q.moduleId === moduleId && q.sectionId === sectionId
          );
          
          // Add quiz progress
          sectionQuizzes.forEach(quiz => {
            const quizScore = Math.round(Math.random() * sectionCompletion);
            userProgress.quizProgress.push({
              quizId: quiz._id,
              score: quizScore,
              attempts: Math.ceil(Math.random() * 3), // 1-3 attempts
              completed: quizScore > 60, // Completed if score > 60%
              lastAttempt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            });
          });
        });
      });
      
      // Add some achievements
      if (user.email === 'visual@example.com') {
        userProgress.achievements.push(
          { id: 'module2-architecture-explorer', title: 'Architecture Explorer', description: 'Completed the Architecture section of Module 2', earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { id: 'monastery-expert', title: 'Monastery Expert', description: 'Identified all monasteries correctly', earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        );
      } else if (user.email === 'textual@example.com') {
        userProgress.achievements.push(
          { id: 'module1-history-scholar', title: 'History Scholar', description: 'Scored 90% or higher on all Module 1 quizzes', earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { id: 'monastic-life-expert', title: 'Monastic Life Expert', description: 'Completed all sections about monastic traditions', earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
        );
      } else if (user.email === 'interactive@example.com') {
        userProgress.achievements.push(
          { id: 'module3-nature-explorer', title: 'Nature Explorer', description: 'Explored all nature paths in Module 3', earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
        );
      }
      
      // Save progress
      await userProgress.save();
      
      // Create learning path
      const learningPath = new LearningPath({
        userId: user._id,
        currentModule: user.email === 'visual@example.com' ? 'module2' :
                      user.email === 'textual@example.com' ? 'module1' : 'module3',
        currentSection: user.email === 'visual@example.com' ? 'treasures' :
                        user.email === 'textual@example.com' ? 'through-ages' : 'paths',
        recommendedContent: [],
        adaptiveSuggestions: [],
        learningStyle: user.profile.learningPreferences.style,
        difficulty: user.profile.learningPreferences.difficulty,
      });
      
      // Add recommended content based on learning style
      const moduleFilter = user.email === 'visual@example.com' ? 'module2' :
                          user.email === 'textual@example.com' ? 'module1' : 'module3';
      
      const recommendedContent = await Content.find({ moduleId: moduleFilter })
        .select('_id moduleId sectionId title')
        .limit(3);
      
      learningPath.recommendedContent = recommendedContent.map(item => item._id);
      
      // Add adaptive suggestions
      const adaptiveSuggestions = [
        {
          contentId: recommendedContent[0]?._id,
          reason: 'Based on your learning style',
          priority: 3,
        },
        {
          contentId: recommendedContent[1]?._id,
          reason: 'Recommended to improve your knowledge',
          priority: 2,
        },
        {
          contentId: recommendedContent[2]?._id,
          reason: 'Popular among similar learners',
          priority: 1,
        },
      ].filter(item => item.contentId); // Filter out undefined content IDs
      
      learningPath.adaptiveSuggestions = adaptiveSuggestions;
      
      // Save learning path
      await learningPath.save();
      
      if (verbose) {
        console.log(`  ✅ Created progress data for user: ${user.email}`);
      }
    }
    
    console.log(`✅ Created progress data for ${users.length} users`);
  } catch (err) {
    console.error('❌ Error creating sample progress:', err);
    throw err;
  }
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing data if requested
    await clearExistingData();
    
    // Create admin user
    const admin = await createAdminUser();
    
    // Create monastery data
    await seedMonasteryData();
    
    // Create sample users if requested
    const sampleUsers = await createSampleUsers();
    
    // Create sample progress data if requested
    await createSampleProgress(sampleUsers);
    
    console.log('✅ Database seeding completed successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('👋 MongoDB Disconnected');
    
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();