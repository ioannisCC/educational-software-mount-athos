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
  const [contentFilter, setContentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarTab, setSidebarTab] = useState('content'); // content, quizzes, recommendations
  const [showSlidingRecommendations, setShowSlidingRecommendations] = useState(false);

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
  };

  const handleContentComplete = (content, metrics) => {
    console.log('Content completed:', content.title, 'Metrics:', metrics);
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
    
    let filtered = displayContent;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (!user?.preferences?.learningStyle) {
      return filtered;
    }

    // For visual learners, prioritize visual content
    if (user.preferences.learningStyle === 'visual') {
      const visualContent = filtered.filter(c => c.type !== 'text');
      const textContent = filtered.filter(c => c.type === 'text');
      return [...visualContent, ...textContent];
    } else {
      // For textual learners, prioritize text content
      const textContent = filtered.filter(c => c.type === 'text');
      const visualContent = filtered.filter(c => c.type !== 'text');
      return [...textContent, ...visualContent];
    }
  };

  const getFilteredQuizzes = () => {
    const sourceQuizzes = useAdaptive && adaptiveQuizzes.length > 0 ? adaptiveQuizzes : quizzes;
    
    if (searchTerm) {
      return sourceQuizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return sourceQuizzes;
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

  if (loading) return <div className="text-center py-5">Loading module data...</div>;
  if (error) return <div className="alert alert-danger m-3">{error}</div>;

  const filteredContent = getFilteredContent();
  const filteredQuizzes = getFilteredQuizzes();

  return (
    <div className="module-redesign" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* COMPACT HEADER */}
      <div className="module-header bg-primary text-white p-3 shadow-sm">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <h4 className="mb-0">📜 Module 1: History & Religious Significance</h4>
                <div className="d-flex gap-2">
                  <span className="badge bg-light text-primary">
                    {filteredContent.length} Contents
                  </span>
                  <span className="badge bg-light text-primary">
                    {filteredQuizzes.length} Quizzes
                  </span>
                  {user?.preferences?.learningStyle && (
                    <span className="badge bg-warning">
                      {user.preferences.learningStyle === 'visual' ? '👁️ Visual' : '📖 Textual'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <div className="form-check form-switch d-inline-block me-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="adaptiveToggle"
                  checked={useAdaptive}
                  onChange={(e) => setUseAdaptive(e.target.checked)}
                />
                <label className="form-check-label text-white" htmlFor="adaptiveToggle">
                  🎯 Adaptive
                </label>
              </div>
              <div className="form-check form-switch d-inline-block">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="recommendationsToggle"
                  checked={showRecommendations}
                  onChange={(e) => setShowRecommendations(e.target.checked)}
                />
                <label className="form-check-label text-white" htmlFor="recommendationsToggle">
                  💡 Recommendations
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LEARNING AREA */}
      <div className="main-learning-area flex-grow-1 d-flex" style={{ minHeight: 0 }}>
        
        {/* COMPACT SIDEBAR */}
        <div className="sidebar bg-light border-end" style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Sidebar Header with Search and Filters */}
          <div className="sidebar-header p-3 border-bottom">
            <div className="input-group input-group-sm mb-2">
              <span className="input-group-text">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search content & quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Filter Buttons */}
            <div className="btn-group w-100" role="group">
              <input type="radio" className="btn-check" name="contentFilter" id="filter-all" 
                     checked={contentFilter === 'all'} onChange={() => setContentFilter('all')} />
              <label className="btn btn-outline-secondary btn-sm" htmlFor="filter-all">All</label>
              
              <input type="radio" className="btn-check" name="contentFilter" id="filter-text" 
                     checked={contentFilter === 'text'} onChange={() => setContentFilter('text')} />
              <label className="btn btn-outline-primary btn-sm" htmlFor="filter-text">📖</label>
              
              <input type="radio" className="btn-check" name="contentFilter" id="filter-image" 
                     checked={contentFilter === 'image'} onChange={() => setContentFilter('image')} />
              <label className="btn btn-outline-success btn-sm" htmlFor="filter-image">🖼️</label>
              
              <input type="radio" className="btn-check" name="contentFilter" id="filter-video" 
                     checked={contentFilter === 'video'} onChange={() => setContentFilter('video')} />
              <label className="btn btn-outline-danger btn-sm" htmlFor="filter-video">🎬</label>
            </div>
          </div>

          {/* Sidebar Navigation Tabs */}
          <ul className="nav nav-tabs nav-fill">
            <li className="nav-item">
              <button 
                className={`nav-link ${sidebarTab === 'content' ? 'active' : ''}`}
                onClick={() => setSidebarTab('content')}
              >
                📚 Content ({filteredContent.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${sidebarTab === 'quizzes' ? 'active' : ''}`}
                onClick={() => setSidebarTab('quizzes')}
              >
                🧠 Quizzes ({filteredQuizzes.length})
              </button>
            </li>
            {useAdaptive && (
              <li className="nav-item">
              <button 
                className={`nav-link ${showSlidingRecommendations ? 'active' : ''}`}
                onClick={() => setShowSlidingRecommendations(!showSlidingRecommendations)}
              >
                🎯 Smart {showSlidingRecommendations ? '▲' : '▼'}
              </button>
            </li>
            )}
          </ul>

          {/* SCROLLABLE CONTENT LIST */}
          <div className="sidebar-content flex-grow-1 overflow-auto">
            
            {sidebarTab === 'content' && (
              <div className="content-list">
                {filteredContent.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <div className="mb-2">📭</div>
                    <div>No content matches your filters</div>
                  </div>
                ) : (
                  filteredContent.map(item => (
                    <div
                      key={item._id}
                      className={`content-item p-3 border-bottom cursor-pointer hover-bg-light ${
                        activeContent?._id === item._id ? 'bg-primary text-white' : ''
                      }`}
                      onClick={() => handleContentSelect(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <span className="content-icon">{getContentTypeIcon(item.type)}</span>
                        <div className="flex-grow-1">
                          <div className="content-title fw-medium small">{item.title}</div>
                          <div className="content-badges mt-1">
                            <span className={`badge bg-${getContentTypeColor(item.type)} badge-sm me-1`}>
                              {item.type}
                            </span>
                            {item.difficulty === 'advanced' && 
                              <span className="badge bg-warning badge-sm me-1">Advanced</span>
                            }
                            {item.adaptiveMetadata?.recommended && 
                              <span className="badge bg-success badge-sm me-1">⭐</span>
                            }
                            {item.adaptiveMetadata?.priority === 'high' && 
                              <span className="badge bg-danger badge-sm">!</span>
                            }
                          </div>
                          {item.adaptiveMetadata?.reason && (
                            <div className="content-reason small text-muted mt-1">
                              💡 {item.adaptiveMetadata.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {sidebarTab === 'quizzes' && (
              <div className="quiz-list">
                {filteredQuizzes.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <div className="mb-2">🎯</div>
                    <div>No quizzes match your search</div>
                  </div>
                ) : (
                  filteredQuizzes.map(quiz => (
                    <div
                      key={quiz._id}
                      className={`quiz-item p-3 border-bottom cursor-pointer hover-bg-light ${
                        activeQuiz?._id === quiz._id ? 'bg-primary text-white' : ''
                      }`}
                      onClick={() => handleQuizSelect(quiz)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <span className="quiz-icon">🧠</span>
                        <div className="flex-grow-1">
                          <div className="quiz-title fw-medium small">{quiz.title}</div>
                          <div className="quiz-badges mt-1">
                            {quiz.adaptiveMetadata?.shouldRetake && 
                              <span className="badge bg-warning badge-sm me-1">🔄</span>
                            }
                            {quiz.adaptiveMetadata?.recommended && 
                              <span className="badge bg-success badge-sm me-1">⭐</span>
                            }
                            {quiz.adaptiveMetadata?.lastScore && 
                              <span className="badge bg-info badge-sm me-1">{quiz.adaptiveMetadata.lastScore}%</span>
                            }
                          </div>
                          {quiz.adaptiveMetadata?.reason && (
                            <div className="quiz-reason small text-muted mt-1">
                              💡 {quiz.adaptiveMetadata.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="content-area flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
          <div className="content-display flex-grow-1 overflow-auto p-3">
            
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
              <div className="welcome-screen text-center py-5">
                <div className="mb-4">
                  <h2 className="text-primary mb-3">📜 Welcome to Module 1: History & Religious Significance</h2>
                  <p className="lead text-muted">
                    Discover over 1000 years of monastic tradition on the Holy Mountain of Mount Athos.
                  </p>
                </div>
                
                {useAdaptive && adaptiveContent.length > 0 ? (
                  <div className="alert alert-info mb-4">
                    <h6>🎯 Adaptive Learning Active!</h6>
                    <p className="mb-2">Content is personalized based on your learning style and performance:</p>
                    <ul className="mb-0 text-start">
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
                  <div className="alert alert-warning mb-4">
                    <h6>📚 Standard Learning Mode</h6>
                    <p className="mb-0">Enable adaptive learning for a personalized experience that adapts to your learning style and progress.</p>
                  </div>
                )}

                <div className="row mb-4">
                  <div className="col-md-6 offset-md-3">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <h6>📊 Module Overview</h6>
                        <div className="row text-center">
                          <div className="col-3">
                            <div className="text-primary">
                              <strong>{content.filter(c => c.type === 'text').length}</strong>
                              <br /><small>📖 Texts</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="text-success">
                              <strong>{content.filter(c => c.type === 'image').length}</strong>
                              <br /><small>🖼️ Images</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="text-danger">
                              <strong>{content.filter(c => c.type === 'video').length}</strong>
                              <br /><small>🎬 Videos</small>
                            </div>
                          </div>
                          <div className="col-3">
                            <div className="text-warning">
                              <strong>{quizzes.length}</strong>
                              <br /><small>🧠 Quizzes</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6>📚 What You'll Learn:</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <ul className="list-unstyled text-start">
                        <li className="mb-2">🏛️ Foundation by St. Athanasius (963 AD)</li>
                        <li className="mb-2">👑 Byzantine imperial support</li>
                        <li className="mb-2">⛪ Orthodox Christian significance</li>
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <ul className="list-unstyled text-start">
                        <li className="mb-2">🚫 The Avaton tradition</li>
                        <li className="mb-2">🌍 UNESCO World Heritage status</li>
                        <li className="mb-2">📜 Spiritual and cultural impact</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-lg mt-3"
                  onClick={() => {
                    const firstContent = filteredContent[0];
                    if (firstContent) handleContentSelect(firstContent);
                  }}
                  disabled={filteredContent.length === 0}
                >
                  🚀 Start Learning
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* SLIDING RECOMMENDATIONS PANEL */}
        {useAdaptive && showSlidingRecommendations && (
        <div 
            className="sliding-recommendations-panel"
            onClick={(e) => {
            // Close panel if clicking on backdrop
            if (e.target === e.currentTarget) {
                setShowSlidingRecommendations(false);
            }
            }}
        >
            <div className="sliding-panel-header">
            <h6 className="mb-0 text-primary">
                🎯 Your Personalized Learning Path
            </h6>
            <button 
                className="sliding-panel-close-btn"
                onClick={() => setShowSlidingRecommendations(false)}
                title="Close Recommendations"
            >
                ✕
            </button>
            </div>
            <div className="sliding-panel-content">
            <AdaptiveRecommendations 
                onSelectContent={(content) => {
                handleRecommendationSelect(content);
                setShowSlidingRecommendations(false); // Auto-close when content selected
                }}
                onSelectQuiz={(quiz) => {
                handleQuizRecommendationSelect(quiz);
                setShowSlidingRecommendations(false); // Auto-close when quiz selected
                }}
                compactMode={false}
            />
            </div>
        </div>
        )}

      {/* BOTTOM SECTIONS - Full AdaptiveRecommendations when not in learning mode */}
      {(!activeContent && !activeQuiz && !useAdaptive) && (
        <div className="progress-section bg-light border-top p-3">
          <Progress />
        </div>
      )}

    </div>
  );
};

export default Module1;