MountAthosExplorer/
│
├── client/                      # Frontend application
│   ├── public/                  # Static assets
│   │   ├── images/              # All images (monasteries, maps, icons)
│   │   ├── audio/               # Audio files (narrations, chants)
│   │   ├── videos/              # Video content
│   │   └── models/              # 3D models
│   │
│   ├── src/                     # React/Vue frontend source
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Navigation.jsx   # Navigation system
│   │   │   ├── MapViewer.jsx    # Interactive map
│   │   │   ├── ModelViewer.jsx  # 3D model viewer
│   │   │   ├── Quiz.jsx         # Quiz component
│   │   │   └── Progress.jsx     # Progress tracking display
│   │   │
│   │   ├── pages/               # Main application pages
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Module1/         # History & Religious Significance
│   │   │   ├── Module2/         # Monasteries & Architecture
│   │   │   └── Module3/         # Natural Environment & Geography
│   │   │
│   │   ├── services/            # API communication
│   │   │   ├── api.js           # API client
│   │   │   ├── auth.js          # Authentication
│   │   │   └── analytics.js     # Usage analytics
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   ├── context/             # React context providers
│   │   ├── utils/               # Helper functions
│   │   ├── styles/              # CSS/SCSS files
│   │   └── App.jsx              # Main application
│
├── server/                      # Backend application
│   ├── controllers/             # Request handlers
│   │   ├── authController.js    # Authentication logic
│   │   ├── contentController.js # Content delivery
│   │   ├── quizController.js    # Quiz management
│   │   ├── progressController.js# Progress tracking
│   │   └── adaptiveController.js# Adaptive learning logic
│   │
│   ├── models/                  # MongoDB models (schemas)
│   │   ├── User.js              # User profile
│   │   ├── Content.js           # Educational content
│   │   ├── Quiz.js              # Quiz questions
│   │   ├── Progress.js          # User progress
│   │   └── LearningPath.js      # Adaptive learning paths
│   │
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   ├── contentRoutes.js     # Content delivery endpoints
│   │   ├── quizRoutes.js        # Quiz interaction endpoints
│   │   └── userRoutes.js        # User data endpoints
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Error handling
│   │   └── logger.js            # Request logging
│   │
│   ├── services/                # Business logic
│   │   ├── adaptiveService.js   # Adaptive learning engine
│   │   ├── analyticsService.js  # Learning analytics 
│   │   └── recommendationService.js # Content recommendations
│   │
│   ├── utils/                   # Helper utilities
│   │   ├── database.js          # MongoDB connection
│   │   └── validation.js        # Input validation
│   │
│   ├── config/                  # Configuration
│   │   └── config.js            # Environment variables
│   │
│   └── app.js                   # Express app setup
│
├── content/                     # Educational content (source files)
│   ├── module1/                 # History & Religious Significance
│   │   ├── lessons/             # Lesson content
│   │   └── quizzes/             # Quiz questions
│   │
│   ├── module2/                 # Monasteries & Architecture
│   │   ├── lessons/             # Lesson content
│   │   └── quizzes/             # Quiz questions
│   │
│   └── module3/                 # Natural Environment & Geography
│       ├── lessons/             # Lesson content
│       └── quizzes/             # Quiz questions
│
├── scripts/                     # Utility scripts
│   ├── seedDatabase.js          # Populate MongoDB with initial data
│   └── importContent.js         # Content import utilities
│
├── docs/                        # Documentation
│   ├── api/                     # API documentation
│   ├── development/             # Developer guides
│   └── analysis/                # Analysis and design documentation
│
├── tests/                       # Testing
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── package.json                 # Project dependencies
├── README.md                    # Project information
└── docker-compose.yml           # Docker configuration



Technology Stack
Frontend

Framework: React.js or Vue.js
State Management: Redux or Context API
Styling: CSS Modules or Styled Components
3D Rendering: Three.js for monastery models
Maps: Leaflet.js for interactive maps
Testing: Jest and React Testing Library

Backend

Runtime: Node.js with Express
Database: MongoDB (as requested)
Authentication: JWT (JSON Web Tokens)
API: RESTful API architecture
Documentation: Swagger/OpenAPI



User Collection
javascript{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  profile: {
    name: String,
    preferences: {
      learningStyle: String, // visual, textual, interactive
      difficulty: String // beginner, intermediate, advanced
    },
    lastActive: Date
  },
  createdAt: Date,
  updatedAt: Date
}
Content Collection
javascript{
  _id: ObjectId,
  moduleId: Number,
  sectionId: Number,
  title: String,
  type: String, // text, video, audio, interactive, 3d
  content: String, // HTML content or reference to media file
  difficulty: String, // beginner, intermediate, advanced
  prerequisites: [ObjectId], // references to other content items
  metadata: {
    duration: Number, // estimated time in minutes
    keywords: [String],
    learningStyles: [String] // which learning styles this content suits
  },
  createdAt: Date,
  updatedAt: Date
}
Quiz Collection
javascript{
  _id: ObjectId,
  moduleId: Number,
  sectionId: Number,
  title: String,
  questions: [{
    questionId: ObjectId,
    text: String,
    type: String, // multiple-choice, true-false, matching
    options: [{
      id: String,
      text: String,
      isCorrect: Boolean
    }],
    difficulty: String, // easy, medium, hard
    explanation: String // explanation for the correct answer
  }],
  createdAt: Date,
  updatedAt: Date
}
Progress Collection
javascript{
  _id: ObjectId,
  userId: ObjectId,
  contentProgress: [{
    contentId: ObjectId,
    completed: Boolean,
    timeSpent: Number, // in seconds
    lastAccessed: Date
  }],
  quizProgress: [{
    quizId: ObjectId,
    attempts: Number,
    score: Number,
    lastAttempt: Date,
    answers: [{
      questionId: ObjectId,
      selectedOption: String,
      isCorrect: Boolean,
      timeSpent: Number // in seconds
    }]
  }],
  moduleCompletion: [{
    moduleId: Number,
    progress: Number, // percentage
    quizScores: [Number]
  }],
  createdAt: Date,
  updatedAt: Date
}
LearningPath Collection
javascript{
  _id: ObjectId,
  userId: ObjectId,
  currentModule: Number,
  currentSection: Number,
  recommendedContent: [ObjectId], // content IDs
  adaptiveSuggestions: [{
    contentId: ObjectId,
    reason: String, // why this content is suggested
    priority: Number
  }],
  strengths: [String], // topics the user is good at
  weaknesses: [String], // topics the user needs to improve
  createdAt: Date,
  updatedAt: Date
}




