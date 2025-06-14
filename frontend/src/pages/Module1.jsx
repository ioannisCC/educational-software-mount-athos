// frontend/src/pages/Module1.jsx
import React, { useState, useEffect } from 'react';
import { getContentByModule, getQuizzesByModule, updateContentProgress } from '../services/api';
import { getAdaptiveContent, getAdaptiveQuizzes } from '../services/adaptiveLearning';
import Progress from '../components/Progress';
import Quiz from '../components/Quiz';
import AdaptiveRecommendations from '../components/AdaptiveRecommendations';
import AdaptiveContentViewer from '../components/AdaptiveContentViewer';

const Module1 = ({ user }) => {
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
  const [contentFilter, setContentFilter] = useState('all'); // all, text, image, video

  // Module ID for this page
  const moduleId = 1;

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
    
    if (!useAdaptive) {
      updateContentProgress(contentItem._id, false).catch(err => {
        console.error('Failed to update content progress:', err);
      });
    }
  };

  const handleQuizSelect = (quiz) => {
    setActiveQuiz(quiz);
    setActiveContent(null);
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
    
    const helpMessages = {
      text: `📚 For "${content.title}": Try reading each section slowly. Focus on key dates like 963 AD (Great Lavra foundation) and important figures like St. Athanasius. The timeline spans over 1000 years of continuous monastic life.`,
      image: `🖼️ For "${content.title}": Take time to examine details in this historical image. Look for architectural features, religious symbols, and historical context. This visual represents important aspects of Mount Athos heritage.`,
      video: `🎬 For "${content.title}": Watch the complete video for full understanding. You can pause to take notes or rewind important sections. Pay attention to both visual and narrated information about Mount Athos history.`
    };
    
    const message = helpMessages[content.type] || helpMessages.text;
    alert(message);
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

  // Get display content with filtering
  const getDisplayContent = () => {
    const sourceContent = useAdaptive && adaptiveContent.length > 0 ? adaptiveContent : content;
    
    if (contentFilter === 'all') {
      return sourceContent;
    }
    return sourceContent.filter(item => item.type === contentFilter);
  };

  // Apply user preference filtering
  const getFilteredContent = () => {
    const displayContent = getDisplayContent();
    
    if (!user?.preferences?.learningStyle) {
      return displayContent;
    }

    // For visual learners, prioritize visual content
    if (user.preferences.learningStyle === 'visual') {
      const visualContent = displayContent.filter(c => c.type !== 'text');
      const textContent = displayContent.filter(c => c.type === 'text');
      return [...visualContent, ...textContent];
    } else {
      // For textual learners, prioritize text content
      const textContent = displayContent.filter(c => c.type === 'text');
      const visualContent = displayContent.filter(c => c.type !== 'text');
      return [...textContent, ...visualContent];
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'text': return '📖';
      case 'image': return '🖼️';
      case 'video': return '🎬';
      default: return '📄';
    }
  };

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'text': return 'primary';
      case 'image': return 'success';
      case 'video': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) return <div className="text-center my-4">Loading module data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const displayQuizzes = useAdaptive && adaptiveQuizzes.length > 0 ? adaptiveQuizzes : quizzes;
  const filteredContent = getFilteredContent();

  return (
    <div className="module-container">
      <div className="row">
        <div className="col-md-3">
          {/* Enhanced Module Header */}
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-1">📜 Module 1: History & Religious Significance</h5>
              <div className="d-flex flex-wrap gap-2 mt-2">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="adaptiveToggle"
                    checked={useAdaptive}
                    onChange={(e) => setUseAdaptive(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="adaptiveToggle">
                    🎯 Adaptive {useAdaptive && adaptiveContent.length > 0 ? '(Active)' : '(Fallback)'}
                  </label>
                </div>
              </div>
              {user?.preferences?.learningStyle && (
                <small className="d-block mt-1">
                  👤 Learning Style: {user.preferences.learningStyle === 'visual' ? '👁️ Visual' : '📖 Textual'}
                </small>
              )}
            </div>
          </div>

          {/* Content Type Filter */}
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">🎨 Content Filter</h6>
            </div>
            <div className="card-body py-2">
              <div className="btn-group-vertical w-100" role="group">
                <input type="radio" className="btn-check" name="contentFilter" id="filter-all" 
                       checked={contentFilter === 'all'} onChange={() => setContentFilter('all')} />
                <label className="btn btn-outline-secondary btn-sm" htmlFor="filter-all">
                  📚 All Content ({filteredContent.length})
                </label>
                
                <input type="radio" className="btn-check" name="contentFilter" id="filter-text" 
                       checked={contentFilter === 'text'} onChange={() => setContentFilter('text')} />
                <label className="btn btn-outline-primary btn-sm" htmlFor="filter-text">
                  📖 Text ({content.filter(c => c.type === 'text').length})
                </label>
                
                <input type="radio" className="btn-check" name="contentFilter" id="filter-image" 
                       checked={contentFilter === 'image'} onChange={() => setContentFilter('image')} />
                <label className="btn btn-outline-success btn-sm" htmlFor="filter-image">
                  🖼️ Images ({content.filter(c => c.type === 'image').length})
                </label>
                
                <input type="radio" className="btn-check" name="contentFilter" id="filter-video" 
                       checked={contentFilter === 'video'} onChange={() => setContentFilter('video')} />
                <label className="btn btn-outline-danger btn-sm" htmlFor="filter-video">
                  🎬 Videos ({content.filter(c => c.type === 'video').length})
                </label>
              </div>
            </div>
          </div>

          {/* Enhanced Content Navigation */}
          <div className="card mb-4">
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-light fw-bold d-flex justify-content-between">
                  📚 Content 
                  <div>
                    {useAdaptive && adaptiveContent.length > 0 && (
                      <span className="badge bg-primary">Smart</span>
                    )}
                    {user?.preferences?.learningStyle === 'visual' && (
                      <span className="badge bg-success ms-1">👁️</span>
                    )}
                  </div>
                </li>
                {filteredContent.map(item => (
                  <li 
                    key={item._id} 
                    className={`list-group-item list-group-item-action ${activeContent?._id === item._id ? 'active' : ''}`}
                    onClick={() => handleContentSelect(item)}
                    style={{cursor: 'pointer'}}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <span className="me-2">{getContentTypeIcon(item.type)}</span>
                          <span className="small fw-medium">{item.title}</span>
                        </div>
                        <div className="d-flex gap-1 flex-wrap">
                          <span className={`badge bg-${getContentTypeColor(item.type)} badge-sm`}>
                            {item.type}
                          </span>
                          {item.difficulty === 'advanced' && 
                            <span className="badge bg-warning badge-sm">Advanced</span>
                          }
                          {item.adaptiveMetadata?.recommended && 
                            <span className="badge bg-success badge-sm">⭐</span>
                          }
                          {item.adaptiveMetadata?.priority === 'high' && 
                            <span className="badge bg-danger badge-sm">!</span>
                          }
                          {item.adaptiveMetadata?.visualLearnerBoost && 
                            <span className="badge bg-info badge-sm">👁️</span>
                          }
                        </div>
                      </div>
                    </div>
                    {item.adaptiveMetadata?.reason && (
                      <small className="text-muted d-block mt-1">
                        💡 {item.adaptiveMetadata.reason}
                      </small>
                    )}
                  </li>
                ))}
                
                {/* Quiz Section */}
                <li className="list-group-item bg-light fw-bold d-flex justify-content-between">
                  🧠 Quizzes
                  {useAdaptive && adaptiveQuizzes.length > 0 && (
                    <span className="badge bg-primary">Smart</span>
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

          {/* Learning Style Info */}
          {user?.preferences?.learningStyle && (
            <div className="card mb-3">
              <div className="card-body py-2">
                <h6 className="small mb-1">🎯 Your Learning Style</h6>
                <p className="small mb-0">
                  {user.preferences.learningStyle === 'visual' 
                    ? '👁️ Visual: You learn best with images, videos, and visual content. They appear first in your content list.'
                    : '📖 Textual: You learn best with text-based content. Written materials appear first in your content list.'
                  }
                </p>
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

          {/* Content display area */}
          {activeContent && (
            <AdaptiveContentViewer
              content={activeContent}
              onComplete={handleContentComplete}
              onNeedHelp={handleNeedHelp}
            />
          )}
          
          {/* Quiz display area */}
          {activeQuiz && (
            <Quiz 
              quizId={activeQuiz._id} 
              onCompleted={handleQuizComplete} 
            />
          )}
          
          {/* Enhanced Default view */}
          {!activeContent && !activeQuiz && (
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">📜 Welcome to Module 1: History & Religious Significance</h4>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <p className="lead">
                      Discover over 1000 years of monastic tradition on the Holy Mountain of Mount Athos.
                    </p>
                    
                    {useAdaptive && adaptiveContent.length > 0 ? (
                      <div className="alert alert-info">
                        <h6>🎯 Adaptive Learning Active!</h6>
                        <p className="mb-2">Content is personalized based on your learning style and performance:</p>
                        <ul className="mb-0">
                          <li>📊 Performance-based content recommendations</li>
                          <li>🎯 Personalized learning paths</li>
                          <li>📈 Real-time progress tracking</li>
                          <li>💡 Struggle detection and help suggestions</li>
                          {user?.preferences?.learningStyle === 'visual' && (
                            <li>👁️ Visual content prioritized for you</li>
                          )}
                          {user?.preferences?.learningStyle === 'textual' && (
                            <li>📖 Text content prioritized for you</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <h6>📚 Standard Learning Mode</h6>
                        <p className="mb-0">Enable adaptive learning for a personalized experience that adapts to your learning style and progress.</p>
                      </div>
                    )}

                    <h6 className="mt-3">📚 What You'll Learn:</h6>
                    <div className="row">
                      <div className="col-sm-6">
                        <ul>
                          <li>🏛️ Foundation by St. Athanasius (963 AD)</li>
                          <li>👑 Byzantine imperial support</li>
                          <li>⛪ Orthodox Christian significance</li>
                        </ul>
                      </div>
                      <div className="col-sm-6">
                        <ul>
                          <li>🚫 The Avaton tradition</li>
                          <li>🌍 UNESCO World Heritage status</li>
                          <li>📜 Spiritual and cultural impact</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6>📊 Content Overview</h6>
                        <div className="row">
                          <div className="col-4">
                            <div className="text-primary">
                              <strong>{content.filter(c => c.type === 'text').length}</strong>
                              <br /><small>📖 Texts</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="text-success">
                              <strong>{content.filter(c => c.type === 'image').length}</strong>
                              <br /><small>🖼️ Images</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="text-danger">
                              <strong>{content.filter(c => c.type === 'video').length}</strong>
                              <br /><small>🎬 Videos</small>
                            </div>
                          </div>
                        </div>
                        <hr />
                        <div className="text-warning">
                          <strong>{quizzes.length}</strong><br />
                          <small>🧠 Quizzes</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <button 
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                          const firstContent = filteredContent[0];
                          if (firstContent) handleContentSelect(firstContent);
                        }}
                        disabled={filteredContent.length === 0}
                      >
                        🚀 Start Learning
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Module1;