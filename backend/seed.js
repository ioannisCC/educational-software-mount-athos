// backend/seed.js
const mongoose = require('mongoose');
const User = require('./models/User');
const Content = require('./models/Content');
const Quiz = require('./models/Quiz');
const bcrypt = require('bcryptjs');

// MongoDB connection
mongoose.connect('mongodb+srv://ioanniscatargiu:mountathos@cluster.qp2teap.mongodb.net/?retryWrites=true&w=majority&appName=cluster')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Clear existing data
const clearData = async () => {
  await User.deleteMany({});
  await Content.deleteMany({});
  await Quiz.deleteMany({});
  console.log('Data cleared');
};

// Seed users
const seedUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  const users = [
    {
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      preferences: { learningStyle: 'visual' }
    },
    {
      username: 'student1',
      email: 'student1@example.com',
      password: hashedPassword,
      preferences: { learningStyle: 'textual' }
    }
  ];
  
  await User.insertMany(users);
  console.log('Users seeded');
};

// Seed content
const seedContent = async () => {
  const content = [
    {
      moduleId: 1,
      title: 'History of Mount Athos',
      type: 'text',
      content: '<h2>Ancient History</h2><p>Mount Athos has been inhabited since ancient times and is mentioned in Greek mythology. According to legend, the mountain got its name from the giant Athos who threw a massive rock at Poseidon during their battle.</p><p>The first Christian monks arrived on Mount Athos in the 4th century AD, seeking isolation for prayer and contemplation. By the 9th century, it had become a major center for Orthodox monasticism.</p>',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Religious Significance',
      type: 'text',
      content: '<h2>Spiritual Center</h2><p>Mount Athos is one of the most important centers of Eastern Orthodox monasticism, often referred to as the "Garden of the Virgin Mary" because, according to tradition, the Virgin Mary and St. John the Evangelist were shipwrecked there while traveling to visit Lazarus.</p><p>The peninsula has been dedicated exclusively to prayer and worship of God for over a millennium, with daily routines centered around prayer, work, and spiritual study.</p>',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Avaton Tradition',
      type: 'text',
      content: '<h2>The Avaton Rule</h2><p>One of the most distinctive aspects of Mount Athos is the "avaton" (ἄβατον) rule, which prohibits women from entering the peninsula. This tradition has been maintained for over 1,000 years and is based on the dedication of the mountain to the Virgin Mary.</p><p>The prohibition extends to female animals as well, with the exception of cats (for pest control) and certain birds and insects.</p>',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Monasteries Overview',
      type: 'text',
      content: '<h2>The Twenty Monasteries</h2><p>There are twenty sovereign monasteries on Mount Athos, arranged in a hierarchy established in 1924. The oldest is Great Lavra, founded in 963 by Saint Athanasius the Athonite with the support of Byzantine Emperor Nicephorus Phocas.</p><p>The monasteries hold countless religious artifacts, relics, icons, and a vast collection of ancient manuscripts and books, making Mount Athos a treasury of Byzantine art and Orthodox Christian heritage.</p>',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Great Lavra Monastery',
      type: 'text',
      content: '<h2>First Among the Monasteries</h2><p>The Great Lavra Monastery (Μεγίστη Λαύρα) is the first monastery built on Mount Athos and ranks first in the hierarchical order of the twenty monasteries. It was founded in 963 by Saint Athanasius the Athonite.</p><p>The monastery\'s katholikon (main church) was the first church of the Athonite Byzantine type and served as a model for all later Athonite churches. The library contains over 2,000 manuscripts and 20,000 printed books.</p>',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Architectural Styles',
      type: 'text',
      content: '<h2>Byzantine Architecture</h2><p>The monasteries feature Byzantine architectural elements, with strong walls resembling fortresses—a necessity during periods of pirate raids. The central focus of each monastery is the katholikon (main church), typically featuring a dome and built in the cross-in-square style.</p><p>Many monasteries are built in a rectangular shape around an inner courtyard, with the katholikon at the center. The defensive nature of the architecture is evident in the high walls, minimal windows on the exterior, and watchtowers.</p>',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Flora and Fauna',
      type: 'text',
      content: '<h2>Biodiversity</h2><p>Mount Athos hosts a remarkable biodiversity, with over 1,400 plant species identified, including some endemic to the region. The mountain\'s isolation and limited human intervention have helped preserve its natural environment.</p><p>The forests consist primarily of oak, chestnut, and evergreen trees such as cypress and pine. The diverse habitat supports a variety of wildlife, including wild boars, foxes, jackals, and numerous bird species.</p>',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Geological Features',
      type: 'text',
      content: '<h2>Mountain Formation</h2><p>Mount Athos rises to a height of 2,033 meters (6,670 feet) above sea level, forming the southeastern extremity of the Chalcidice Peninsula in northern Greece. The mountain consists mainly of metamorphic rocks, primarily gneiss and schist.</p><p>The peninsula is approximately 60 kilometers long and 7 to 12 kilometers wide, with a rugged coastline featuring many small bays and coves. The terrain is steep and mountainous, with numerous streams creating small valleys and ravines.</p>',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Environmental Conservation',
      type: 'text',
      content: '<h2>Preservation Efforts</h2><p>The unique governance of Mount Athos has inadvertently served as a form of environmental protection. The limited development, restricted access, and traditional agricultural practices have helped preserve the peninsula\'s natural environment.</p><p>In recent years, there have been more systematic conservation efforts, including sustainable forest management, wastewater treatment systems, and waste reduction initiatives. The peninsula is recognized as a UNESCO World Heritage Site in part for its natural value.</p>',
      difficulty: 'basic'
    }
  ];
  
  await Content.insertMany(content);
  console.log('Content seeded');
};

// Seed quizzes
const seedQuizzes = async () => {
  const quizzes = [
    {
      moduleId: 1,
      title: 'History Quiz',
      questions: [
        {
          text: 'When did Mount Athos become a major spiritual center?',
          options: [
            { text: '3rd century BC', isCorrect: false },
            { text: '9th century AD', isCorrect: true },
            { text: '15th century AD', isCorrect: false },
            { text: '18th century AD', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which emperor granted Mount Athos its autonomous status?',
          options: [
            { text: 'Constantine the Great', isCorrect: false },
            { text: 'Justinian', isCorrect: false },
            { text: 'John Tzimiskes', isCorrect: true },
            { text: 'Alexios I Komnenos', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'What is the primary language used in Mount Athos liturgical services?',
          options: [
            { text: 'Modern Greek', isCorrect: false },
            { text: 'Byzantine Greek', isCorrect: true },
            { text: 'Latin', isCorrect: false },
            { text: 'Church Slavonic', isCorrect: false }
          ],
          difficulty: 'easy'
        }
      ]
    },
    {
      moduleId: 2,
      title: 'Monasteries Quiz',
      questions: [
        {
          text: 'How many monasteries are there on Mount Athos?',
          options: [
            { text: '10', isCorrect: false },
            { text: '15', isCorrect: false },
            { text: '20', isCorrect: true },
            { text: '25', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which is the oldest monastery on Mount Athos?',
          options: [
            { text: 'Great Lavra', isCorrect: true },
            { text: 'Vatopedi', isCorrect: false },
            { text: 'Iviron', isCorrect: false },
            { text: 'Hilandar', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'What architectural style is most common for the katholikon (main church) in Mount Athos monasteries?',
          options: [
            { text: 'Gothic', isCorrect: false },
            { text: 'Romanesque', isCorrect: false },
            { text: 'Byzantine cross-in-square', isCorrect: true },
            { text: 'Baroque', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },
    {
      moduleId: 3,
      title: 'Natural Environment Quiz',
      questions: [
        {
          text: 'What is the highest peak of Mount Athos?',
          options: [
            { text: 'Athos Peak', isCorrect: true },
            { text: 'Olympus', isCorrect: false },
            { text: 'Saos', isCorrect: false },
            { text: 'Vigla', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which of these animal species is NOT found on Mount Athos?',
          options: [
            { text: 'Wild boar', isCorrect: false },
            { text: 'Golden eagle', isCorrect: false },
            { text: 'Deer', isCorrect: false },
            { text: 'Lion', isCorrect: true }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Approximately how many plant species have been identified on Mount Athos?',
          options: [
            { text: 'About 500', isCorrect: false },
            { text: 'About 1,400', isCorrect: true },
            { text: 'About 2,500', isCorrect: false },
            { text: 'About 3,800', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    }
  ];
  
  await Quiz.insertMany(quizzes);
  console.log('Quizzes seeded');
};

// Run seeding
const seedDB = async () => {
  try {
    await clearData();
    await seedUsers();
    await seedContent();
    await seedQuizzes();
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();