MountAthosExplorer/
├── frontend/                     # Simplified frontend
│   ├── public/                   # Essential assets only
│   │   ├── images/               # Monastery images, maps
│   │   ├── videos/               # Few key videos
│   │
│   ├── src/                      # React frontend (simpler)
│       ├── components/           # Basic components only
│       │   ├── Navigation.jsx    # Simple navigation
│       │   ├── MapViewer.jsx     # Basic map
│       │   ├── Quiz.jsx          # Quiz component
│       │   └── Progress.jsx      # Progress tracker
│       │
│       ├── pages/                # Just the required modules
│       │   ├── Home.jsx          # Simple landing page
│       │   ├── Module1.jsx       # History & Religious Significance
│       │   ├── Module2.jsx       # Monasteries & Architecture
│       │   └── Module3.jsx       # Natural Environment
│       │
│       ├── services/             # Minimal services
│       │   ├── api.js            # Basic API calls
│       │   └── auth.js           # Simple authentication
│       │
│       └── App.jsx               # Main application
│
├── backend/                      # Simplified backend
│   ├── controllers/              # Basic controllers
│   │   ├── authController.js     # User authentication
│   │   ├── contentController.js  # Content delivery
│   │   └── progressController.js # Track progress
│   │
│   ├── models/                   # Essential MongoDB models
│   │   ├── User.js               # User profile (simplified)
│   │   ├── Content.js            # Educational content
│   │   ├── Quiz.js               # Quiz questions
│   │   └── Progress.js           # User progress
│   │
│   ├── routes/                   # Basic routes
│   │   ├── authRoutes.js         # Authentication
│   │   ├── contentRoutes.js      # Content delivery
│   │   └── progressRoutes.js     # Progress tracking
│   │
│   └── server.js                 # Express setup
│
├── content/                      # Educational content
│   ├── module1/                  # History & Religious Significance
│   ├── module2/                  # Monasteries & Architecture
│   └── module3/                  # Natural Environment
│
├── docs/                         # Assignment documentation
│   └── analysis_design.pdf       # Required manual
│
├── package.json                  # Project dependencies
└── README.md                     # Project information

usermodel
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  preferences: {
    learningStyle: String  // visual, textual
  },
  createdAt: Date
}

contentmodel
{
  _id: ObjectId,
  moduleId: Number,
  title: String,
  type: String, // text, image, video
  content: String, // HTML content or file reference
  difficulty: String, // basic, advanced
  createdAt: Date
}

quizmodel
{
  _id: ObjectId,
  moduleId: Number,
  title: String,
  questions: [{
    text: String,
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    difficulty: String // easy, hard
  }]
}

progressmodel
{
  _id: ObjectId,
  userId: ObjectId,
  contentProgress: [{
    contentId: ObjectId,
    completed: Boolean,
    lastAccessed: Date
  }],
  quizResults: [{
    quizId: ObjectId,
    score: Number,
    answers: [{
      questionId: ObjectId,
      isCorrect: Boolean
    }]
  }],
  moduleProgress: [{
    moduleId: Number,
    progress: Number // percentage
  }]
}





db user credentials
username: ioanniscatargiu
pass: mountathos