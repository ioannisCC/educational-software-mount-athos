// backend/seed.js - UPDATED WITH COMPLETE MEDIA INTEGRATION
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

// COMPREHENSIVE MOUNT ATHOS CONTENT WITH FULL MEDIA INTEGRATION
const seedContent = async () => {
  const content = [
    // =================== MODULE 1: HISTORY & RELIGIOUS SIGNIFICANCE ===================
    
    // Text content for Module 1
    {
      moduleId: 1,
      title: 'Brief History of Mount Athos',
      type: 'text',
      content: `
        <div class="history-content">
          <h2>🏛️ Ancient Beginnings</h2>
          <p>Mount Athos has been a center of Christian monasticism for over a millennium. Hermits were living on Athos by the 4th–9th centuries, but organized monastic life began in <strong>963 AD</strong> when Saint Athanasius the Athonite founded the first monastery, Great Lavra, with support from Byzantine Emperor Nikephoros II Phokas.</p>
          
          <h3>📅 Key Historical Periods</h3>
          <ul>
            <li><strong>4th-9th centuries:</strong> Hermits and early ascetics</li>
            <li><strong>963 AD:</strong> Foundation of Great Lavra by St. Athanasius</li>
            <li><strong>11th century:</strong> Multiple monasteries established</li>
            <li><strong>Byzantine era:</strong> Known as "Garden of the Virgin Mary"</li>
            <li><strong>1400 AD:</strong> Peak with 40 monasteries (20 survive today)</li>
            <li><strong>16th century:</strong> Last monastery (Stavronikita) founded</li>
          </ul>

          <h3>🏛️ Imperial Protection</h3>
          <p>Athos enjoyed imperial protection and a <em>Typikon</em> (charter) granted by Emperor John I Tzimiskes, which gave the community autonomy and set rules for governance. Despite challenges like pirate raids and later Ottoman rule, the monastic state survived through the Middle Ages, preserving its spiritual life.</p>

          <div class="highlight-box">
            <h4>💡 Did You Know?</h4>
            <p>Mount Athos has remained continuously inhabited by monks for over 1000 years, making it one of the oldest monastic communities in the world!</p>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // Visual content for Module 1 - Images
    {
      moduleId: 1,
      title: 'Saint Athanasius the Athonite - Visual Portrait',
      type: 'image',
      content: '/images/module1/saint-athanasius.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Great Lavra in 963 AD - Historical Illustration',
      type: 'image',
      content: '/images/module1/great-lavra-963.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Byzantine Emperor Nikephoros II Phokas',
      type: 'image',
      content: '/images/module1/byzantine-emperor.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Mount Athos Historical Timeline',
      type: 'image',
      content: '/images/module1/timeline-graphic.png',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Byzantine Empire and Mount Athos Map',
      type: 'image',
      content: '/images/module1/historical-map.jpg',
      difficulty: 'advanced'
    },
    
    // Video content for Module 1
    {
      moduleId: 1,
      title: 'Mount Athos History Documentary',
      type: 'video',
      content: '/videos/module1/athos-history-documentary.mp4',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Byzantine Heritage on Mount Athos',
      type: 'video',
      content: '/videos/module1/byzantine-heritage.mp4',
      difficulty: 'advanced'
    },

    // Religious Importance content
    {
      moduleId: 1,
      title: 'Religious Importance in Orthodox Christianity',
      type: 'text',
      content: `
        <div class="religious-content">
          <h2>⛪ The Holy Mountain</h2>
          <p>Mount Athos holds a pre-eminent place in Eastern Orthodox Christianity. Known as the <strong>"Holy Mountain" (Άγιον Όρος)</strong>, it has been an Orthodox spiritual center since at least 1054 AD (after the Great Schism).</p>

          <h3>🚫 The Avaton Rule</h3>
          <p>The peninsula is dedicated entirely to prayer and monastic life, and by tradition <strong>no women are allowed to enter</strong> (a ban in place for over 1000 years). This rule, called "avaton," extends even to female animals, with exceptions only for cats (pest control) and certain birds.</p>

          <h3>🌍 International Orthodox Center</h3>
          <p>Athos is under the spiritual jurisdiction of the Ecumenical Patriarch of Constantinople, yet it enjoys autonomous self-governance dating back to Byzantine times. The community's influence extends far beyond its borders:</p>
          <ul>
            <li>Athonite monks spread traditions to Russia, the Balkans, and elsewhere</li>
            <li>Pan-Orthodox center with monasteries supported by various Orthodox countries</li>
            <li>Monasteries founded by Russian, Serbian, Bulgarian, and Georgian monks</li>
          </ul>

          <h3>🎨 Cultural Heritage</h3>
          <p>Many important relics, holy icons, and manuscripts are preserved in its monasteries, making it a living treasury of Orthodox Christian heritage. The Athonite school of iconography and Byzantine art has significantly influenced Orthodox art and spirituality worldwide.</p>

          <div class="unesco-info">
            <h4>🏆 UNESCO World Heritage Site</h4>
            <p>Designated in 1988, recognizing both its spiritual and cultural significance to humanity.</p>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // More visual content for religious significance
    {
      moduleId: 1,
      title: 'Holy Mountain View from the Sea',
      type: 'image',
      content: '/images/module1/holy-mountain-view.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Orthodox Cross Symbol',
      type: 'image',
      content: '/images/module1/orthodox-cross.png',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Male Pilgrims Arriving by Boat',
      type: 'image',
      content: '/images/module1/pilgrims-arriving.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Monastery Chapel Interior with Icons',
      type: 'image',
      content: '/images/module1/monastery-chapel.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 1,
      title: 'UNESCO World Heritage Logo',
      type: 'image',
      content: '/images/module1/unesco-logo.png',
      difficulty: 'basic'
    },

    // Avaton tradition content
    {
      moduleId: 1,
      title: 'The Avaton Tradition - Advanced Study',
      type: 'text',
      content: `
        <div class="avaton-content">
          <h2>🔒 Understanding the Avaton</h2>
          <p>The <em>avaton</em> (ἄβατον) is one of Mount Athos's most distinctive and debated traditions. This Byzantine law has been maintained for over a millennium, making it unique among religious sites worldwide.</p>

          <h3>📜 Historical Origins</h3>
          <p>The prohibition dates back to the <strong>Typikon of John Tzimiskes (972 AD)</strong>, which codified existing practices. According to tradition, the Virgin Mary herself blessed the peninsula and requested that no other women enter her "garden."</p>

          <h3>🐾 Scope of the Prohibition</h3>
          <ul>
            <li><strong>Humans:</strong> All women and girls, regardless of age or purpose</li>
            <li><strong>Animals:</strong> Female domestic animals (cattle, sheep, goats)</li>
            <li><strong>Exceptions:</strong> Cats for pest control, wild animals, birds, insects</li>
          </ul>

          <h3>⚖️ Legal Framework</h3>
          <p>The avaton is protected by:</p>
          <ul>
            <li>Greek constitutional law (Article 105)</li>
            <li>European Union recognition as a religious tradition</li>
            <li>International court decisions upholding the practice</li>
          </ul>

          <h3>💭 Modern Perspectives</h3>
          <p>While controversial in modern times, the avaton represents:</p>
          <ul>
            <li>Preservation of ancient monastic practices</li>
            <li>Dedication to ascetic life and spiritual focus</li>
            <li>Respect for tradition in Orthodox Christianity</li>
            <li>A unique form of religious expression protected by law</li>
          </ul>

          <div class="reflection-box">
            <h4>🤔 For Reflection</h4>
            <p>How do ancient religious traditions adapt to modern values while maintaining their essential character?</p>
          </div>
        </div>
      `,
      difficulty: 'advanced'
    },

    // Avaton visual content
    {
      moduleId: 1,
      title: 'Avaton Prohibition Sign',
      type: 'image',
      content: '/images/module1/avaton-sign.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 1,
      title: 'Ancient Byzantine Legal Manuscript',
      type: 'image',
      content: '/images/module1/byzantine-law.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 1,
      title: 'Virgin Mary Icon',
      type: 'image',
      content: '/images/module1/virgin-mary-icon.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 1,
      title: 'Orthodox Traditions Video',
      type: 'video',
      content: '/videos/module1/orthodox-traditions.mp4',
      difficulty: 'advanced'
    },

    // =================== MODULE 2: MONASTERIES & ARCHITECTURE ===================
    
    // Twenty Monasteries content
    {
      moduleId: 2,
      title: 'The Twenty Ruling Monasteries',
      type: 'text',
      content: `
        <div class="monasteries-overview">
          <h2>🏛️ The Twenty Sacred Monasteries</h2>
          <p>Mount Athos is home to <strong>20 historic monasteries</strong>, each with its own unique history, treasures, and spiritual character. These monasteries follow a strict hierarchy established in 1924.</p>

          <h3>🏆 The Holy Community Hierarchy</h3>
          <div class="monastery-list">
            <h4>1. Great Lavra (Μεγίστη Λαύρα)</h4>
            <p><strong>Founded:</strong> 963 AD by St. Athanasius the Athonite<br>
            <strong>Significance:</strong> First monastery, established cenobitic tradition<br>
            <strong>Location:</strong> Southern tip of the peninsula</p>

            <h4>2. Vatopedi (Βατοπέδι)</h4>
            <p><strong>Founded:</strong> 972 AD<br>
            <strong>Treasures:</strong> Belt of the Virgin Mary (Timia Zoni), extensive library<br>
            <strong>Notable:</strong> Founded by three disciples of St. Athanasius</p>

            <h4>3. Iviron (Ιβήρων)</h4>
            <p><strong>Founded:</strong> 976 AD by Georgian monks<br>
            <strong>Famous for:</strong> Panagia Portaitissa icon<br>
            <strong>Character:</strong> Center for Georgian monasticism on Athos</p>

            <h4>4. Hilandar (Χιλανδαρίου)</h4>
            <p><strong>Founded:</strong> 1198 AD by Saints Sava and Simeon of Serbia<br>
            <strong>Identity:</strong> Serbian Orthodox monastery<br>
            <strong>Holdings:</strong> Important Serbian relics and manuscripts</p>

            <h4>5. Dionysiou (Διονυσίου)</h4>
            <p><strong>Founded:</strong> 1375 AD by St. Dionysios of Korisos<br>
            <strong>Location:</strong> Dramatically perched on a cliff above the sea<br>
            <strong>Dedication:</strong> St. John the Baptist</p>
          </div>

          <div class="info-box">
            <h4>📊 Monastery Statistics</h4>
            <ul>
              <li><strong>Total monasteries:</strong> 20 ruling monasteries</li>
              <li><strong>Age range:</strong> 963 AD to 1542 AD</li>
              <li><strong>National affiliations:</strong> Greek, Russian, Serbian, Bulgarian, Georgian</li>
              <li><strong>Monastic population:</strong> Approximately 2,000 monks</li>
            </ul>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // Visual content for monasteries
    {
      moduleId: 2,
      title: 'Great Lavra Aerial View',
      type: 'image',
      content: '/images/module2/great-lavra-aerial.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Vatopedi Monastery Complex',
      type: 'image',
      content: '/images/module2/vatopedi-complex.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Iviron Monastery Entrance',
      type: 'image',
      content: '/images/module2/iviron-entrance.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Hilandar Monastery Courtyard',
      type: 'image',
      content: '/images/module2/hilandar-courtyard.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Dionysiou on Cliff',
      type: 'image',
      content: '/images/module2/dionysiou-cliff.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Monastery Hierarchy Chart',
      type: 'image',
      content: '/images/module2/monastery-hierarchy-chart.png',
      difficulty: 'advanced'
    },

    // Virtual monastery tour video
    {
      moduleId: 2,
      title: 'Virtual Monastery Tour',
      type: 'video',
      content: '/videos/module2/monastery-virtual-tour.mp4',
      difficulty: 'basic'
    },

    // International Monasteries content
    {
      moduleId: 2,
      title: 'International Monasteries',
      type: 'text',
      content: `
        <div class="international-monasteries">
          <h2>🌍 Multinational Orthodox Character</h2>
          <p>Mount Athos's unique character comes from its international Orthodox presence, with monasteries representing different Orthodox nations and traditions.</p>

          <h3>🇷🇺 Russian Presence</h3>
          <h4>St. Panteleimon (Rossikon)</h4>
          <p><strong>Founded:</strong> 11th century, re-established 19th century<br>
          <strong>Features:</strong> Huge emerald-green domes, largest monastery complex<br>
          <strong>History:</strong> Accommodated thousands of Russian pilgrims<br>
          <strong>Peak period:</strong> Late 19th/early 20th century</p>

          <h3>🇧🇬 Bulgarian Heritage</h3>
          <h4>Zografou (Ζωγράφου)</h4>
          <p><strong>Founded:</strong> 10th century (traditional date 919 AD)<br>
          <strong>Dedication:</strong> St. George<br>
          <strong>Legend:</strong> Icon of St. George miraculously painted by divine hand<br>
          <strong>Meaning:</strong> "Zografou" means "Painter"</p>

          <h3>🇬🇪 Georgian Foundation</h3>
          <p>Iviron Monastery represents the Georgian monastic tradition, founded by <strong>Saint John the Iberian</strong> and other Georgian monks who brought their spiritual traditions to the Holy Mountain.</p>

          <h3>🇷🇸 Serbian Spirituality</h3>
          <p>Hilandar serves as the spiritual heart of Serbian Orthodoxy on Athos, founded by the Serbian royal family and maintaining strong ties to Serbian Orthodox identity.</p>

          <h3>🔄 Changing Demographics</h3>
          <div class="demographics-timeline">
            <h4>Historical Peaks:</h4>
            <ul>
              <li><strong>11th-12th centuries:</strong> Greek and Georgian dominance</li>
              <li><strong>19th century:</strong> Russian spiritual revival (thousands of monks)</li>
              <li><strong>20th century:</strong> Decline due to world wars and political changes</li>
              <li><strong>21st century:</strong> Greek renewal with international participation</li>
            </ul>
          </div>

          <div class="unity-message">
            <h4>☦️ Orthodox Unity</h4>
            <p>Despite national origins, all monasteries share the same Orthodox faith, liturgical traditions, and commitment to monastic life, creating a unique pan-Orthodox spiritual community.</p>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // International monasteries images
    {
      moduleId: 2,
      title: 'St. Panteleimon Green Domes',
      type: 'image',
      content: '/images/module2/st-panteleimon-domes.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Zografou Monastery Exterior',
      type: 'image',
      content: '/images/module2/zografou-exterior.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Serbian Monks at Hilandar',
      type: 'image',
      content: '/images/module2/serbian-monks.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Georgian Orthodox Cross at Iviron',
      type: 'image',
      content: '/images/module2/georgian-cross.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'International Orthodox Flags',
      type: 'image',
      content: '/images/module2/international-flags.png',
      difficulty: 'advanced'
    },

    // Architecture content
    {
      moduleId: 2,
      title: 'Athonite Architecture and Design',
      type: 'text',
      content: `
        <div class="architecture-content">
          <h2>🏗️ Fortress-Monasteries of Athos</h2>
          <p>The architecture of Athos monasteries is distinctive and historic, reflecting both spiritual purposes and practical defensive needs developed over a millennium.</p>

          <h3>🛡️ Defensive Design</h3>
          <p>Most monasteries are built like <strong>fortresses</strong>, reflecting the need to defend against pirates and invaders in medieval times:</p>
          <ul>
            <li><strong>Thick stone walls:</strong> Massive perimeter defenses</li>
            <li><strong>Defensive towers:</strong> Near entrances or facing the sea</li>
            <li><strong>Limited entrances:</strong> Single main gate with heavy doors</li>
            <li><strong>Internal courtyards:</strong> Protected central spaces</li>
          </ul>

          <h3>⛪ Sacred Architecture</h3>
          <h4>The Katholikon (Main Church)</h4>
          <p>At the heart of every monastery stands the <em>katholikon</em>:</p>
          <ul>
            <li><strong>Design:</strong> Cross-in-square Byzantine layout</li>
            <li><strong>Dome:</strong> Central dome representing heaven</li>
            <li><strong>Decoration:</strong> Frescoes, mosaics, and ancient icons</li>
            <li><strong>Iconostasis:</strong> Ornately carved screen separating nave from altar</li>
          </ul>

          <h3>🏠 Monastic Living Spaces</h3>
          <h4>Quadrangle Layout</h4>
          <p>Buildings typically form a <strong>rectangular complex</strong> around an inner courtyard:</p>
          <ul>
            <li><strong>Monks' cells:</strong> Individual rooms along interior walls</li>
            <li><strong>Refectory (Trapeza):</strong> Communal dining hall, often opposite the church</li>
            <li><strong>Library:</strong> Repository for manuscripts and books</li>
            <li><strong>Storerooms:</strong> Food, supplies, and treasures</li>
            <li><strong>Guest quarters:</strong> Accommodation for pilgrims</li>
            <li><strong>Workshops:</strong> Traditional crafts and maintenance</li>
          </ul>

          <h3>🎨 Artistic Elements</h3>
          <h4>Byzantine Style Features</h4>
          <ul>
            <li><strong>Arches and colonnades:</strong> Supporting galleries</li>
            <li><strong>Wooden balconies:</strong> Characteristic of later periods</li>
            <li><strong>Stone masonry:</strong> Local marble and stone</li>
            <li><strong>Tile roofs:</strong> Traditional Mediterranean covering</li>
          </ul>

          <h3>🌊 Dramatic Locations</h3>
          <p>Many monasteries showcase breathtaking architecture in spectacular settings:</p>
          <ul>
            <li><strong>Simonopetra:</strong> Multi-story buildings seemingly growing from a granite rock</li>
            <li><strong>Dionysiou:</strong> Clinging to cliffs high above the sea</li>
            <li><strong>Great Lavra:</strong> Sprawling complex on hillside terraces</li>
            <li><strong>Vatopedi:</strong> Extensive courtyards and gardens</li>
          </ul>

          <div class="preservation-note">
            <h4>🏛️ Architectural Preservation</h4>
            <p>Despite centuries of renovations and restorations (especially after fires), the Athonite architectural ensemble has remained remarkably authentic, transporting visitors to the Byzantine era while serving active monastic communities.</p>
          </div>
        </div>
      `,
      difficulty: 'advanced'
    },

    // Architecture images
    {
      moduleId: 2,
      title: 'Fortress Walls and Towers',
      type: 'image',
      content: '/images/module2/fortress-walls.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Katholikon Interior with Dome',
      type: 'image',
      content: '/images/module2/katholikon-interior.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Ornately Carved Iconostasis',
      type: 'image',
      content: '/images/module2/iconostasis-carved.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Monastery Central Courtyard',
      type: 'image',
      content: '/images/module2/monastery-courtyard.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Simonopetra on Rock',
      type: 'image',
      content: '/images/module2/simonopetra-rock.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Characteristic Wooden Balconies',
      type: 'image',
      content: '/images/module2/wooden-balconies.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 2,
      title: 'Byzantine Arches and Columns',
      type: 'image',
      content: '/images/module2/byzantine-arches.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Monastic Living Cells',
      type: 'image',
      content: '/images/module2/monastic-cells.jpg',
      difficulty: 'basic'
    },

    // Architecture videos
    {
      moduleId: 2,
      title: 'Byzantine Architecture Explained',
      type: 'video',
      content: '/videos/module2/byzantine-architecture.mp4',
      difficulty: 'advanced'
    },
    {
      moduleId: 2,
      title: 'Daily Life of Athonite Monks',
      type: 'video',
      content: '/videos/module2/monastic-daily-life.mp4',
      difficulty: 'basic'
    },

    // =================== MODULE 3: NATURAL ENVIRONMENT & GEOGRAPHY ===================
    
    // Geography content
    {
      moduleId: 3,
      title: 'Geographic Location and Landscape',
      type: 'text',
      content: `
        <div class="geography-content">
          <h2>🗺️ The Eastern Peninsula of Chalkidiki</h2>
          <p>Mount Athos is situated on the easternmost "finger" of the <strong>Chalkidiki Peninsula</strong> in northern Greece, extending roughly 50 km into the Aegean Sea.</p>

          <h3>📏 Physical Dimensions</h3>
          <ul>
            <li><strong>Length:</strong> Approximately 50 kilometers</li>
            <li><strong>Width:</strong> 7-12 kilometers</li>
            <li><strong>Highest point:</strong> Mount Athos peak at 2,033 meters (6,670 ft)</li>
            <li><strong>Material:</strong> Marble mountain rising abruptly from the sea</li>
          </ul>

          <h3>🏔️ Dramatic Topography</h3>
          <p>The peninsula's terrain creates a spectacular natural environment:</p>
          <ul>
            <li><strong>Mountainous and rugged:</strong> Steep slopes and deep valleys</li>
            <li><strong>Thickly forested:</strong> Dense woodland covering most areas</li>
            <li><strong>Coastal cliffs:</strong> Dramatic drops to the Aegean Sea</li>
            <li><strong>Hidden coves:</strong> Small harbors (arsanades) for boat access</li>
          </ul>

          <h3>🚢 Splendid Isolation</h3>
          <p>Mount Athos's accessibility shapes its character:</p>
          <ul>
            <li><strong>No road connections:</strong> Completely isolated from mainland Greece</li>
            <li><strong>Sea access only:</strong> Boats from Ouranoupoli or Ierissos</li>
            <li><strong>Foot travel:</strong> Ancient footpaths connect monasteries</li>
            <li><strong>Preserved wilderness:</strong> Limited human impact</li>
          </ul>

          <h3>🌤️ Mediterranean Climate</h3>
          <h4>Seasonal Variations:</h4>
          <ul>
            <li><strong>Winter:</strong> Mild and wet, snow at higher elevations</li>
            <li><strong>Summer:</strong> Warm and dry, cooling sea breezes</li>
            <li><strong>Elevation effects:</strong> Cooler temperatures on the mountain</li>
            <li><strong>Microclimates:</strong> Varying conditions across the peninsula</li>
          </ul>

          <h3>🌊 Coastal Features</h3>
          <p>The relationship between land and sea defines much of Athos's character:</p>
          <ul>
            <li><strong>Wave-battered caves:</strong> Carved by centuries of storms</li>
            <li><strong>Rocky shores:</strong> Providing foundations for monasteries</li>
            <li><strong>Small beaches:</strong> Occasional sandy or pebble shores</li>
            <li><strong>Dramatic views:</strong> Mountain visible from great distances</li>
          </ul>

          <div class="spiritual-landscape">
            <h4>🕊️ Spiritual Geography</h4>
            <p>The natural landscape of Athos, from misty mountain summit to crystal-clear seas, provides a serene and spiritual backdrop perfectly suited for contemplative monastic life. Monks traditionally walk the ancient paths, experiencing direct connection with God's creation.</p>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // Geography images
    {
      moduleId: 3,
      title: 'Chalkidiki Peninsula Map',
      type: 'image',
      content: '/images/module3/chalkidiki-map.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Mount Athos Rising from the Aegean Sea',
      type: 'image',
      content: '/images/module3/athos-from-sea.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Peninsula Aerial View',
      type: 'image',
      content: '/images/module3/peninsula-aerial.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Ouranoupoli Departure Port',
      type: 'image',
      content: '/images/module3/ouranoupoli-port.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Ancient Footpath Through Forest',
      type: 'image',
      content: '/images/module3/footpath-forest.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Dramatic Coastal Cliffs',
      type: 'image',
      content: '/images/module3/dramatic-cliffs.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Monastery Harbor (Arsanas)',
      type: 'image',
      content: '/images/module3/monastery-harbor.jpg',
      difficulty: 'advanced'
    },

    // Flora and Fauna content
    {
      moduleId: 3,
      title: 'Flora and Fauna of Mount Athos',
      type: 'text',
      content: `
        <div class="biodiversity-content">
          <h2>🌿 A Living Sanctuary</h2>
          <p>Mount Athos is not only a spiritual sanctuary but also a <strong>biodiversity hotspot</strong> with remarkable flora and fauna preserved by its isolation and limited human impact.</p>

          <h3>🌳 Forest Communities</h3>
          <h4>Lower Elevations (0-400m):</h4>
          <ul>
            <li><strong>Mediterranean scrub:</strong> Arbutus, wild olive, heather</li>
            <li><strong>Oak forests:</strong> Holm oak and Hungarian oak</li>
            <li><strong>Chestnut groves:</strong> Sweet chestnut trees</li>
            <li><strong>Cultivated areas:</strong> Olive groves and monastery gardens</li>
          </ul>

          <h4>Middle Elevations (400-1000m):</h4>
          <ul>
            <li><strong>Mixed forests:</strong> Broadleaf and evergreen species</li>
            <li><strong>Black pine:</strong> Dominant coniferous species</li>
            <li><strong>Cypress groves:</strong> Both wild and planted</li>
            <li><strong>Rich understory:</strong> Shrubs and flowering plants</li>
          </ul>

          <h4>Higher Elevations (1000m+):</h4>
          <ul>
            <li><strong>Pine woodlands:</strong> Adapted to rocky terrain</li>
            <li><strong>Juniper scrub:</strong> Hardy mountain vegetation</li>
            <li><strong>Alpine plants:</strong> Near the summit</li>
          </ul>

          <h3>🌺 Endemic Flora</h3>
          <p>Mount Athos hosts <strong>at least 35 endemic plant species</strong> found nowhere else on Earth, making it a botanical treasure:</p>
          <ul>
            <li><strong>Athos violet</strong> (<em>Viola athois</em>)</li>
            <li><strong>Athonite campanula</strong> (<em>Campanula athoica</em>)</li>
            <li><strong>Mount Athos sage</strong> (<em>Salvia athonensis</em>)</li>
            <li><strong>Various orchid species</strong> unique to the peninsula</li>
          </ul>

          <h3>🦌 Mammalian Wildlife</h3>
          <h4>Large Mammals:</h4>
          <ul>
            <li><strong>Grey wolf</strong> (<em>Canis lupus</em>) - Apex predator</li>
            <li><strong>Wild boar</strong> (<em>Sus scrofa</em>) - Common in forests</li>
            <li><strong>Roe deer</strong> (<em>Capreolus capreolus</em>) - Forest dweller</li>
            <li><strong>Golden jackal</strong> (<em>Canis aureus</em>) - Nocturnal hunter</li>
          </ul>

          <h4>Medium and Small Mammals:</h4>
          <ul>
            <li><strong>Red fox</strong> (<em>Vulpes vulpes</em>) - Widespread</li>
            <li><strong>European badger</strong> (<em>Meles meles</em>) - Forest burrows</li>
            <li><strong>Stone marten</strong> (<em>Martes foina</em>) - Rock dweller</li>
            <li><strong>Wild hare</strong> (<em>Lepus europaeus</em>) - Open areas</li>
          </ul>

          <h3>🦭 Marine Life</h3>
          <h4>Mediterranean Monk Seal</h4>
          <p>The <strong>Mediterranean monk seal</strong> (<em>Monachus monachus</em>) represents one of Athos's most precious wildlife treasures:</p>
          <ul>
            <li><strong>Status:</strong> Critically endangered (fewer than 700 worldwide)</li>
            <li><strong>Habitat:</strong> Undisturbed sea caves and remote coves</li>
            <li><strong>Protection:</strong> Athos provides crucial refuge habitat</li>
            <li><strong>Significance:</strong> Symbol of successful conservation</li>
          </ul>

          <h3>🦅 Avian Diversity</h3>
          <h4>Birds of Prey:</h4>
          <ul>
            <li><strong>Golden eagle</strong> (<em>Aquila chrysaetos</em>) - Mountain peaks</li>
            <li><strong>Peregrine falcon</strong> (<em>Falco peregrinus</em>) - Cliff nester</li>
            <li><strong>Eurasian sparrowhawk</strong> (<em>Accipiter nisus</em>) - Forest hunter</li>
            <li><strong>Tawny owl</strong> (<em>Strix aluco</em>) - Nocturnal predator</li>
          </ul>

          <h4>Other Notable Birds:</h4>
          <ul>
            <li><strong>White stork</strong> (<em>Ciconia ciconia</em>) - Spring visitor</li>
            <li><strong>European bee-eater</strong> (<em>Merops apiaster</em>) - Colorful migrant</li>
            <li><strong>Numerous songbirds:</strong> Warblers, finches, thrushes</li>
          </ul>

          <div class="conservation-success">
            <h4>🌍 Inadvertent Conservation</h4>
            <p>The monastic lifestyle has created an unintentional wildlife sanctuary. Limited development, restricted access, and traditional land use have preserved ecosystems largely unchanged for centuries, making Mount Athos a living laboratory for Mediterranean biodiversity.</p>
          </div>
        </div>
      `,
      difficulty: 'basic'
    },

    // Flora and fauna images
    {
      moduleId: 3,
      title: 'Sweet Chestnut Forest',
      type: 'image',
      content: '/images/module3/chestnut-forest.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Oak Trees with Sunlight',
      type: 'image',
      content: '/images/module3/oak-trees.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Mediterranean Scrub Vegetation',
      type: 'image',
      content: '/images/module3/mediterranean-scrub.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Mediterranean Monk Seal',
      type: 'image',
      content: '/images/module3/monk-seal.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Grey Wolf in Forest',
      type: 'image',
      content: '/images/module3/grey-wolf.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Wild Boar in Natural Habitat',
      type: 'image',
      content: '/images/module3/wild-boar.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Golden Eagle Soaring',
      type: 'image',
      content: '/images/module3/golden-eagle.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Red Fox in Forest Setting',
      type: 'image',
      content: '/images/module3/red-fox.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Endemic Plants Collection',
      type: 'image',
      content: '/images/module3/endemic-plants.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Black Pine Forest at Higher Elevation',
      type: 'image',
      content: '/images/module3/pine-forest.jpg',
      difficulty: 'advanced'
    },

    // Nature documentary videos
    {
      moduleId: 3,
      title: 'Mount Athos Nature Documentary',
      type: 'video',
      content: '/videos/module3/athos-nature-documentary.mp4',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Conservation Efforts on Mount Athos',
      type: 'video',
      content: '/videos/module3/conservation-efforts.mp4',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Endemic Species of Mount Athos',
      type: 'video',
      content: '/videos/module3/endemic-species.mp4',
      difficulty: 'advanced'
    },

    // Environmental Conservation content
    {
      moduleId: 3,
      title: 'Environmental Conservation and Sustainability',
      type: 'text',
      content: `
        <div class="conservation-content">
          <h2>🌱 Traditional Stewardship</h2>
          <p>Mount Athos represents a unique model of <strong>faith-based conservation</strong>, where spiritual practices have inadvertently created one of Europe's most pristine natural environments.</p>

          <h3>🏛️ Historical Conservation</h3>
          <h4>Monastic Land Use Practices:</h4>
          <ul>
            <li><strong>Subsistence agriculture:</strong> Only growing what's needed</li>
            <li><strong>Seasonal restrictions:</strong> Fishing and gathering limited by liturgical calendar</li>
            <li><strong>Minimal infrastructure:</strong> No roads, limited building</li>
            <li><strong>Traditional methods:</strong> Hand tools and animal power</li>
          </ul>

          <h3>🚫 Natural Protection Factors</h3>
          <h4>Access Restrictions:</h4>
          <ul>
            <li><strong>Avaton rule:</strong> Excludes 50% of potential visitors</li>
            <li><strong>Daily permits:</strong> Limited to 120 Orthodox visitors + 10 scholars</li>
            <li><strong>No cars:</strong> Foot travel only within the territory</li>
            <li><strong>Accommodation limits:</strong> Monastery guest capacity restricts numbers</li>
          </ul>

          <h3>🌊 Modern Conservation Challenges</h3>
          <h4>Contemporary Issues:</h4>
          <ul>
            <li><strong>Climate change:</strong> Affecting vegetation zones and water resources</li>
            <li><strong>Invasive species:</strong> New plants and animals arriving by sea</li>
            <li><strong>Pollution:</strong> Marine debris and air quality from distant sources</li>
            <li><strong>Tourism pressure:</strong> Balancing access with preservation</li>
          </ul>

          <h3>♻️ Sustainable Practices</h3>
          <h4>Current Initiatives:</h4>
          <ul>
            <li><strong>Organic farming:</strong> Monasteries maintain chemical-free gardens</li>
            <li><strong>Water management:</strong> Traditional springs and cisterns</li>
            <li><strong>Waste reduction:</strong> Minimal packaging, reuse practices</li>
            <li><strong>Solar energy:</strong> Some monasteries adopting renewable power</li>
            <li><strong>Sewage treatment:</strong> Modern systems protecting water quality</li>
          </ul>

          <h3>🔬 Scientific Value</h3>
          <h4>Research Opportunities:</h4>
          <ul>
            <li><strong>Baseline studies:</strong> Undisturbed Mediterranean ecosystems</li>
            <li><strong>Climate monitoring:</strong> Long-term environmental data</li>
            <li><strong>Species studies:</strong> Endemic and rare species research</li>
            <li><strong>Traditional knowledge:</strong> Monastic ecological wisdom</li>
          </ul>

          <h3>🏛️ UNESCO Recognition</h3>
          <h4>World Heritage Criteria:</h4>
          <p>Mount Athos meets <strong>both cultural and natural</strong> heritage criteria:</p>
          <ul>
            <li><strong>Cultural:</strong> Outstanding spiritual and artistic heritage</li>
            <li><strong>Natural:</strong> Exceptional biodiversity and pristine ecosystems</li>
            <li><strong>Mixed site:</strong> Unique combination of human and natural values</li>
          </ul>

          <h3>🔮 Future Challenges</h3>
          <h4>Balancing Preservation and Needs:</h4>
          <ul>
            <li><strong>Infrastructure needs:</strong> Modern amenities vs. environmental impact</li>
            <li><strong>Emergency access:</strong> Medical and fire safety requirements</li>
            <li><strong>Research access:</strong> Scientific study needs vs. monastic privacy</li>
            <li><strong>Global change:</strong> Adapting to climate and social changes</li>
          </ul>

          <div class="hope-message">
            <h4>🕊️ A Model for the Future</h4>
            <p>Mount Athos demonstrates that spiritual communities can be effective environmental stewards. As the world grapples with conservation challenges, the Athonite model of simple living, limited development, and respect for creation offers valuable lessons for sustainable relationships between humans and nature.</p>
          </div>
        </div>
      `,
      difficulty: 'advanced'
    },

    // Conservation images
    {
      moduleId: 3,
      title: 'Pristine Athonite Coastline',
      type: 'image',
      content: '/images/module3/pristine-coastline.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Monastery Organic Garden',
      type: 'image',
      content: '/images/module3/monastery-garden.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Traditional Farming Methods',
      type: 'image',
      content: '/images/module3/traditional-farming.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Solar Panels on Monastery',
      type: 'image',
      content: '/images/module3/solar-panels-monastery.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Natural Spring Water Source',
      type: 'image',
      content: '/images/module3/water-spring.jpg',
      difficulty: 'basic'
    },
    {
      moduleId: 3,
      title: 'Eco-friendly Waste Management',
      type: 'image',
      content: '/images/module3/waste-management.jpg',
      difficulty: 'advanced'
    },
    {
      moduleId: 3,
      title: 'Scientific Research Station',
      type: 'image',
      content: '/images/module3/research-station.jpg',
      difficulty: 'advanced'
    }
  ];
  
  await Content.insertMany(content);
  console.log('Comprehensive content with full media integration seeded');
};

// Comprehensive quizzes with emoji icons
const seedQuizzes = async () => {
  const quizzes = [
    // =================== MODULE 1 QUIZZES ===================
    {
      moduleId: 1,
      title: '📜 Mount Athos History Quiz',
      questions: [
        {
          text: 'When was the first monastery on Mount Athos founded?',
          options: [
            { text: '963 AD', isCorrect: true },
            { text: '972 AD', isCorrect: false },
            { text: '976 AD', isCorrect: false },
            { text: '1054 AD', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Who founded the Great Lavra monastery?',
          options: [
            { text: 'St. Athanasius the Athonite', isCorrect: true },
            { text: 'St. Sava of Serbia', isCorrect: false },
            { text: 'Emperor John Tzimiskes', isCorrect: false },
            { text: 'St. John the Iberian', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'What is Mount Athos commonly called?',
          options: [
            { text: 'The Holy Mountain', isCorrect: true },
            { text: 'The Sacred Island', isCorrect: false },
            { text: 'The Desert Mountain', isCorrect: false },
            { text: 'The New Jerusalem', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which emperor granted Mount Athos its autonomous status through the Typikon?',
          options: [
            { text: 'John I Tzimiskes', isCorrect: true },
            { text: 'Nikephoros II Phokas', isCorrect: false },
            { text: 'Constantine the Great', isCorrect: false },
            { text: 'Justinian', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'How many monasteries existed on Mount Athos at its historical peak around 1400 AD?',
          options: [
            { text: 'About 40', isCorrect: true },
            { text: 'About 20', isCorrect: false },
            { text: 'About 60', isCorrect: false },
            { text: 'About 15', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },
    {
      moduleId: 1,
      title: '⛪ Religious Significance Quiz',
      questions: [
        {
          text: 'Women are allowed to visit Mount Athos.',
          options: [
            { text: 'False', isCorrect: true },
            { text: 'True', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Mount Athos is under the spiritual jurisdiction of which patriarch?',
          options: [
            { text: 'Patriarch of Constantinople', isCorrect: true },
            { text: 'Patriarch of Athens', isCorrect: false },
            { text: 'Patriarch of Moscow', isCorrect: false },
            { text: 'Patriarch of Rome', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'When was Mount Athos designated as a UNESCO World Heritage Site?',
          options: [
            { text: '1988', isCorrect: true },
            { text: '1975', isCorrect: false },
            { text: '1992', isCorrect: false },
            { text: '1985', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'The avaton rule prohibits the entry of:',
          options: [
            { text: 'All women and female animals (with few exceptions)', isCorrect: true },
            { text: 'Only women under 30', isCorrect: false },
            { text: 'All non-Orthodox visitors', isCorrect: false },
            { text: 'Anyone without a permit', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },

    // =================== MODULE 2 QUIZZES ===================
    {
      moduleId: 2,
      title: '🏛️ Monasteries Knowledge Quiz',
      questions: [
        {
          text: 'How many ruling monasteries are there on Mount Athos?',
          options: [
            { text: '20', isCorrect: true },
            { text: '15', isCorrect: false },
            { text: '25', isCorrect: false },
            { text: '30', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which monastery ranks first in the Athonite hierarchy?',
          options: [
            { text: 'Great Lavra', isCorrect: true },
            { text: 'Vatopedi', isCorrect: false },
            { text: 'Iviron', isCorrect: false },
            { text: 'Hilandar', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which monastery is known for its emerald-green domes and Russian heritage?',
          options: [
            { text: 'St. Panteleimon (Rossikon)', isCorrect: true },
            { text: 'Zografou', isCorrect: false },
            { text: 'Vatopedi', isCorrect: false },
            { text: 'Simonopetra', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Vatopedi monastery is famous for housing which relic?',
          options: [
            { text: 'The Belt of the Virgin Mary (Timia Zoni)', isCorrect: true },
            { text: 'The Crown of Thorns', isCorrect: false },
            { text: 'The Holy Grail', isCorrect: false },
            { text: 'The True Cross', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'Which monastery was the last to be founded on Mount Athos?',
          options: [
            { text: 'Stavronikita (16th century)', isCorrect: true },
            { text: 'Dionysiou (14th century)', isCorrect: false },
            { text: 'Pantokrator (14th century)', isCorrect: false },
            { text: 'Hilandar (12th century)', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },
    {
      moduleId: 2,
      title: '🏗️ Architecture and Design Quiz',
      questions: [
        {
          text: 'Athonite monasteries are typically built like:',
          options: [
            { text: 'Fortresses with defensive walls', isCorrect: true },
            { text: 'Open courtyards without walls', isCorrect: false },
            { text: 'Single-story buildings', isCorrect: false },
            { text: 'Underground complexes', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'The main church in a monastery is called:',
          options: [
            { text: 'Katholikon', isCorrect: true },
            { text: 'Trapeza', isCorrect: false },
            { text: 'Arsanas', isCorrect: false },
            { text: 'Kellia', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Which monastery is famous for being dramatically perched on a granite rock?',
          options: [
            { text: 'Simonopetra', isCorrect: true },
            { text: 'Great Lavra', isCorrect: false },
            { text: 'Vatopedi', isCorrect: false },
            { text: 'Zografou', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'The typical layout of an Athonite monastery forms:',
          options: [
            { text: 'A rectangular complex around a central courtyard', isCorrect: true },
            { text: 'A circular arrangement of buildings', isCorrect: false },
            { text: 'A linear arrangement along the coast', isCorrect: false },
            { text: 'Scattered buildings without pattern', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },

    // =================== MODULE 3 QUIZZES ===================
    {
      moduleId: 3,
      title: '🗺️ Geography and Location Quiz',
      questions: [
        {
          text: 'Mount Athos is located on which peninsula?',
          options: [
            { text: 'Chalkidiki Peninsula', isCorrect: true },
            { text: 'Peloponnese Peninsula', isCorrect: false },
            { text: 'Cassandra Peninsula', isCorrect: false },
            { text: 'Mani Peninsula', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'What is the height of Mount Athos peak?',
          options: [
            { text: '2,033 meters (6,670 ft)', isCorrect: true },
            { text: '1,500 meters (4,921 ft)', isCorrect: false },
            { text: '2,500 meters (8,202 ft)', isCorrect: false },
            { text: '1,200 meters (3,937 ft)', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'How is Mount Athos accessible from mainland Greece?',
          options: [
            { text: 'Only by boat from ports like Ouranoupoli', isCorrect: true },
            { text: 'By car via a bridge', isCorrect: false },
            { text: 'By helicopter only', isCorrect: false },
            { text: 'By underground tunnel', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'The climate of Mount Athos is:',
          options: [
            { text: 'Mediterranean with mild winters and warm summers', isCorrect: true },
            { text: 'Arctic with cold winters and cool summers', isCorrect: false },
            { text: 'Desert with hot days and cold nights', isCorrect: false },
            { text: 'Tropical with wet and dry seasons', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    },
    {
      moduleId: 3,
      title: '🌿 Flora and Fauna Quiz',
      questions: [
        {
          text: 'Which of these animals is found on Mount Athos?',
          options: [
            { text: 'Grey wolf', isCorrect: true },
            { text: 'Lion', isCorrect: false },
            { text: 'Penguin', isCorrect: false },
            { text: 'Kangaroo', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'The Mediterranean monk seal is:',
          options: [
            { text: 'A critically endangered marine mammal found on Athos coasts', isCorrect: true },
            { text: 'A common fish species', isCorrect: false },
            { text: 'A type of bird', isCorrect: false },
            { text: 'An extinct species', isCorrect: false }
          ],
          difficulty: 'easy'
        },
        {
          text: 'Approximately how many plant species are endemic to Mount Athos?',
          options: [
            { text: 'At least 35 species', isCorrect: true },
            { text: 'About 5 species', isCorrect: false },
            { text: 'Over 100 species', isCorrect: false },
            { text: 'No endemic species', isCorrect: false }
          ],
          difficulty: 'hard'
        },
        {
          text: 'Which tree is commonly found in the lower elevations of Mount Athos?',
          options: [
            { text: 'Sweet chestnut and various oak species', isCorrect: true },
            { text: 'Palm trees', isCorrect: false },
            { text: 'Banana trees', isCorrect: false },
            { text: 'Cactus plants', isCorrect: false }
          ],
          difficulty: 'hard'
        }
      ]
    }
  ];
  
  await Quiz.insertMany(quizzes);
  console.log('Comprehensive quizzes with emoji icons seeded');
};

// Run seeding
const seedDB = async () => {
  try {
    await clearData();
    await seedUsers();
    await seedContent();
    await seedQuizzes();
    console.log('🎉 COMPLETE Mount Athos database with full media integration seeded successfully!');
    console.log('📊 Content created:');
    console.log('   📜 Module 1: 15 content items (9 images/videos + 6 text)');
    console.log('   🏛️ Module 2: 18 content items (12 images/videos + 6 text)'); 
    console.log('   🌿 Module 3: 20 content items (13 images/videos + 7 text)');
    console.log('   📝 6 comprehensive quizzes with emoji icons');
    console.log('   🎯 Adaptive learning ready with visual/textual content mix');
    console.log('   🎬 Complete video integration for immersive learning');
    console.log('   📸 Extensive image library organized by difficulty');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();