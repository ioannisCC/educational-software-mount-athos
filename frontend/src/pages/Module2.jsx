// frontend/src/pages/Module2.jsx
import React, { useState, useEffect } from 'react';
import { getContentByModule, getQuizzesByModule, updateContentProgress } from '../services/api';
import { getAdaptiveContent, getAdaptiveQuizzes } from '../services/adaptiveLearning';
import Progress from '../components/Progress';
import Quiz from '../components/Quiz';
import AdaptiveRecommendations from '../components/AdaptiveRecommendations';
import AdaptiveContentViewer from '../components/AdaptiveContentViewer';
import MapViewer from '../components/MapViewer';

const Module2 = ({ user }) => {
  const [content, setContent] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [adaptiveContent, setAdaptiveContent] = useState([]);
  const [adaptiveQuizzes, setAdaptiveQuizzes] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useAdaptive, setUseAdaptive] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showMap, setShowMap] = useState(false);
  
  // Sample monastery locations for the interactive map
  const [monasteryLocations] = useState([
    { id: 1, name: 'Great Lavra', x: 30, y: 80, description: 'Founded 963 AD by St. Athanasius the Athonite. First monastery and highest in hierarchy.' },
    { id: 2, name: 'Vatopedi', x: 45, y: 35, description: 'Founded 972 AD. Houses the Belt of the Virgin Mary and extensive library.' },
    { id: 3, name: 'Iviron', x: 60, y: 40, description: 'Founded 976 AD by Georgian monks. Famous for Panagia Portaitissa icon.' },
    { id: 4, name: 'Hilandar', x: 25, y: 50, description: 'Founded 1198 AD by Serbian saints. Serbian Orthodox spiritual center.' },
    { id: 5, name: 'Dionysiou', x: 15, y: 60, description: 'Founded 1375 AD. Dramatically perched on cliff above the sea.' },
    { id: 6, name: 'St. Panteleimon', x: 70, y: 25, description: 'Russian monastery with distinctive green domes. Re-established 19th century.' },
    { id: 7, name: 'Simonopetra', x: 20, y: 65, description: 'Founded ca. 1360 AD. Famous for buildings growing from granite rock.' },
    { id: 8, name: 'Zografou', x: 35, y: 45, description: 'Bulgarian monastery founded 10th century. Dedicated to St. George.' }
  ]);
  
  const [activeLocation, setActiveLocation] = useState(null);

  // Module ID for this page
  const moduleId = 2;

  useEffect(() => {
    fetchModuleData();
  }, [moduleId, useAdaptive]);

  const fetchModuleData = async () => {
    try {
      setLoading(true);
      
      if (useAdaptive) {
        try {
          const [adaptiveContentData, adaptiveQuizzesData, regularContentData, regularQuizzesData] = 
            await Promise.all([
              getAdaptiveContent(moduleId).catch(err => {
                console.warn('Adaptive content failed, using regular content:', err);
                return [];
              }),
              getAdaptiveQuizzes(moduleId).catch(err => {
                console.warn('Adaptive quizzes failed, using regular quizzes:', err);
                return [];
              }),
              getContentByModule(moduleId),
              getQuizzesByModule(moduleId)
            ]);
          
          setAdaptiveContent(adaptiveContentData);
          setAdaptiveQuizzes(adaptiveQuizzesData);
          setContent(regularContentData);
          setQuizzes(regularQuizzesData);
        } catch (adaptiveError) {
          console.warn('Adaptive learning failed, falling back to regular mode:', adaptiveError);
          setUseAdaptive(false);
        }
      }
      
      if (!useAdaptive) {
        const [contentData, quizzesData] = await Promise.all([
          getContentByModule(moduleId),
          getQuizzesByModule(moduleId)
        ]);
        
        setContent(contentData);
        setQuizzes(quizzesData);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load module data');
      setLoading(false);
      console.error('Module data fetch error:', err);
    }
  };

  const handleContentSelect = (contentItem) => {
    setActiveContent(contentItem);
    setActiveQuiz(null);
    setShowMap(false);
    
    if (!useAdaptive) {
      updateContentProgress(contentItem._id, false).catch(err => {
        console.error('Failed to update content progress:', err);
      });
    }
  };

  const handleQuizSelect = (quiz) => {
    setActiveQuiz(quiz);
    setActiveContent(null);
    setShowMap(false);
  };
  
  const handleShowMap = () => {
    setShowMap(true);
    setActiveContent(null);
    setActiveQuiz(null);
  };

  const handleQuizComplete = (results) => {
    console.log('Quiz completed with results:', results);
    
    if (useAdaptive) {
      setTimeout(() => {
        fetchModuleData();
      }, 1000);
    }
  };

  const handleContentComplete = (content, metrics) => {
    console.log('Content completed:', content.title, 'Metrics:', metrics);
    
    if (useAdaptive) {
      setTimeout(() => {
        fetchModuleData();
      }, 1000);
    }
  };

  const handleNeedHelp = (content, metrics) => {
    console.log('User needs help with:', content.title, 'Metrics:', metrics);
    alert(`📚 Help for "${content.title}": Consider reviewing the monastery hierarchy and architectural terms. Check the interactive map to visualize monastery locations!`);
  };

  const handleRecommendationSelect = (recommendedContent) => {
    const fullContent = useAdaptive && adaptiveContent.length > 0
      ? adaptiveContent.find(c => c._id === recommendedContent._id) 
      : content.find(c => c._id === recommendedContent._id);
    
    if (fullContent) {
      handleContentSelect(fullContent);
    }
  };

  const handleQuizRecommendationSelect = (recommendedQuiz) => {
    const fullQuiz = useAdaptive && adaptiveQuizzes.length > 0
      ? adaptiveQuizzes.find(q => q._id === recommendedQuiz._id) 
      : quizzes.find(q => q._id === recommendedQuiz._id);
    
    if (fullQuiz) {
      handleQuizSelect(fullQuiz);
    }
  };
  
  const handleLocationSelect = (location) => {
    setActiveLocation(location);
    
    // Find content related to this location if available
    const displayContentArray = useAdaptive && adaptiveContent.length > 0 ? adaptiveContent : content;
    const relatedContent = displayContentArray.find(item => 
      item.title.toLowerCase().includes(location.name.toLowerCase())
    );
    
    if (relatedContent) {
      handleContentSelect(relatedContent);
    }
  };

  if (loading) return <div className="text-center my-4">Loading module data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const displayContent = useAdaptive && adaptiveContent.length > 0 ? adaptiveContent : content;
  const displayQuizzes = useAdaptive && adaptiveQuizzes.length > 0 ? adaptiveQuizzes : quizzes;

  const filteredContent = user?.preferences?.learningStyle === 'visual'
    ? displayContent.filter(c => c.type !== 'text').concat(displayContent.filter(c => c.type === 'text'))
    : displayContent.filter(c => c.type === 'text').concat(displayContent.filter(c => c.type !== 'text'));

  return (
    <div className="module-container">
      <div className="row">
        <div className="col-md-3">
          {/* Module Header with Adaptive Toggle */}
          <div className="card mb-3">
            <div className="card-header bg-success text-white">
              <h5 className="mb-1">Module 2: Monasteries & Architecture</h5>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="adaptiveToggle"
                  checked={useAdaptive}
                  onChange={(e) => setUseAdaptive(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="adaptiveToggle">
                  🎯 Adaptive Learning {useAdaptive && adaptiveContent.length > 0 ? '(Active)' : '(Fallback)'}
                </label>
              </div>
            </div>
          </div>

          {/* Interactive Map Button */}
          <div className="card mb-3">
            <div className="card-body py-2">
              <button 
                className={`btn btn-info w-100 ${showMap ? 'active' : ''}`}
                onClick={handleShowMap}
              >
                🗺️ Interactive Monastery Map
              </button>
            </div>
          </div>

          {/* Content and Quiz Navigation */}
          <div className="card mb-4">
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-light fw-bold d-flex justify-content-between">
                  Content
                  {useAdaptive && adaptiveContent.length > 0 && (
                    <span className="badge bg-success">Smart</span>
                  )}
                </li>
                {filteredContent.map(item => (
                  <li 
                    key={item._id} 
                    className={`list-group-item list-group-item-action ${activeContent?._id === item._id ? 'active' : ''}`}
                    onClick={() => handleContentSelect(item)}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{item.title}</span>
                      <div>
                        {item.difficulty === 'advanced' && 
                          <span className="badge bg-warning ms-1">Advanced</span>
                        }
                        {item.adaptiveMetadata?.recommended && 
                          <span className="badge bg-success ms-1">⭐</span>
                        }
                        {item.adaptiveMetadata?.priority === 'high' && 
                          <span className="badge bg-danger ms-1">!</span>
                        }
                      </div>
                    </div>
                    {item.adaptiveMetadata?.reason && (
                      <small className="text-muted d-block mt-1">
                        💡 {item.adaptiveMetadata.reason}
                      </small>
                    )}
                  </li>
                ))}
                
                <li className="list-group-item bg-light fw-bold d-flex justify-content-between">
                  Quizzes
                  {useAdaptive && adaptiveQuizzes.length > 0 && (
                    <span className="badge bg-success">Smart</span>
                  )}
                </li>
                {displayQuizzes.map(quiz => (
                  <li 
                    key={quiz._id} 
                    className={`list-group-item list-group-item-action ${activeQuiz?._id === quiz._id ? 'active' : ''}`}
                    onClick={() => handleQuizSelect(quiz)}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{quiz.title}</span>
                      <div>
                        {quiz.adaptiveMetadata?.shouldRetake && 
                          <span className="badge bg-warning ms-1">🔄</span>
                        }
                        {quiz.adaptiveMetadata?.recommended && 
                          <span className="badge bg-success ms-1">⭐</span>
                        }
                        {quiz.adaptiveMetadata?.lastScore && 
                          <span className="badge bg-info ms-1">{quiz.adaptiveMetadata.lastScore}%</span>
                        }
                      </div>
                    </div>
                    {quiz.adaptiveMetadata?.reason && (
                      <small className="text-muted d-block mt-1">
                        💡 {quiz.adaptiveMetadata.reason}
                      </small>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Toggle Recommendations */}
          {useAdaptive && (
            <div className="card mb-3">
              <div className="card-body py-2">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="recommendationsToggle"
                    checked={showRecommendations}
                    onChange={(e) => setShowRecommendations(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="recommendationsToggle">
                    Show Recommendations
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* User progress */}
          <Progress />
        </div>
        
        <div className="col-md-9">
          {/* Adaptive Recommendations */}
          {useAdaptive && showRecommendations && (
            <AdaptiveRecommendations 
              onSelectContent={handleRecommendationSelect}
              onSelectQuiz={handleQuizRecommendationSelect}
            />
          )}

          {/* Interactive Map */}
          {showMap && (
            <MapViewer 
              locations={monasteryLocations}
              activeLocation={activeLocation}
              onSelectLocation={handleLocationSelect}
            />
          )}

          {/* Content display area */}
          {activeContent && (
            useAdaptive ? (
              <AdaptiveContentViewer
                content={activeContent}
                onComplete={handleContentComplete}
                onNeedHelp={handleNeedHelp}
              />
            ) : (
              <div className="card">
                <div className="card-header">
                  <h5>{activeContent.title}</h5>
                </div>
                <div className="card-body">
                  {activeContent.type === 'text' ? (
                    <div dangerouslySetInnerHTML={{ __html: activeContent.content }} />
                  ) : activeContent.type === 'image' ? (
                    <img 
                      src={activeContent.content} 
                      alt={activeContent.title} 
                      className="img-fluid" 
                    />
                  ) : (
                    <div className="ratio ratio-16x9">
                      <iframe 
                        src={activeContent.content} 
                        title={activeContent.title} 
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
          
          {/* Quiz display area */}
          {activeQuiz && (
            <Quiz 
              quizId={activeQuiz._id} 
              onCompleted={handleQuizComplete} 
            />
          )}
          
          {/* Default view when nothing is selected */}
          {!activeContent && !activeQuiz && !showMap && (
            <div className="alert alert-info">
              <h4>Welcome to Module 2: Monasteries & Architecture</h4>
              <p>
                {useAdaptive && adaptiveContent.length > 0
                  ? '🏛️ Explore the 20 sacred monasteries of Mount Athos with personalized adaptive learning! Use the interactive map to visualize monastery locations.' 
                  : 'Discover the architectural marvels and spiritual centers of the Holy Mountain. Select content or try the interactive map!'
                }
              </p>
              
              {useAdaptive && adaptiveContent.length > 0 && (
                <div className="mt-3">
                  <h6>🌟 Smart Features Active:</h6>
                  <ul className="mb-0">
                    <li>🗺️ Interactive monastery map with locations</li>
                    <li>🏛️ Architecture-focused adaptive content</li>
                    <li>📊 Performance-based monastery recommendations</li>
                    <li>🎯 Personalized learning about monastic life</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Module2;