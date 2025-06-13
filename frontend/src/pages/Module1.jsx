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

  // Module ID for this page
  const moduleId = 1;

  useEffect(() => {
    fetchModuleData();
  }, [moduleId, useAdaptive]);

  const fetchModuleData = async () => {
    try {
      setLoading(true);
      
      if (useAdaptive) {
        // Fetch adaptive content and quizzes with error handling
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
          setContent(regularContentData); // Keep as fallback
          setQuizzes(regularQuizzesData); // Keep as fallback
        } catch (adaptiveError) {
          console.warn('Adaptive learning failed, falling back to regular mode:', adaptiveError);
          setUseAdaptive(false);
          // Fall through to regular content loading
        }
      }
      
      if (!useAdaptive) {
        // Fetch regular content and quizzes
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
    
    // Mark content as viewed/in progress (only for regular content tracking)
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
    
    // Refresh adaptive content after quiz completion
    if (useAdaptive) {
      setTimeout(() => {
        fetchModuleData();
      }, 1000);
    }
  };

  const handleContentComplete = (content, metrics) => {
    console.log('Content completed:', content.title, 'Metrics:', metrics);
    
    // Refresh adaptive recommendations
    if (useAdaptive) {
      setTimeout(() => {
        fetchModuleData();
      }, 1000);
    }
  };

  const handleNeedHelp = (content, metrics) => {
    console.log('User needs help with:', content.title, 'Metrics:', metrics);
    
    // Could show additional help content or resources
    alert(`Help resources for "${content.title}" would be shown here. 
    We detected you might be struggling and will adjust future recommendations accordingly.`);
  };

  const handleRecommendationSelect = (recommendedContent) => {
    // Find the full content object
    const fullContent = useAdaptive 
      ? adaptiveContent.find(c => c._id === recommendedContent._id) 
      : content.find(c => c._id === recommendedContent._id);
    
    if (fullContent) {
      handleContentSelect(fullContent);
    }
  };

  const handleQuizRecommendationSelect = (recommendedQuiz) => {
    // Find the full quiz object
    const fullQuiz = useAdaptive 
      ? adaptiveQuizzes.find(q => q._id === recommendedQuiz._id) 
      : quizzes.find(q => q._id === recommendedQuiz._id);
    
    if (fullQuiz) {
      handleQuizSelect(fullQuiz);
    }
  };

  if (loading) return <div className="text-center my-4">Loading module data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Choose which content/quizzes to display
  const displayContent = useAdaptive && adaptiveContent.length > 0 ? adaptiveContent : content;
  const displayQuizzes = useAdaptive && adaptiveQuizzes.length > 0 ? adaptiveQuizzes : quizzes;

  // Apply user preference filtering if user preferences exist
  const filteredContent = user?.preferences?.learningStyle === 'visual'
    ? displayContent.filter(c => c.type !== 'text').concat(displayContent.filter(c => c.type === 'text'))
    : displayContent.filter(c => c.type === 'text').concat(displayContent.filter(c => c.type !== 'text'));

  return (
    <div className="module-container">
      <div className="row">
        <div className="col-md-3">
          {/* Module Header with Adaptive Toggle */}
          <div className="card mb-3">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-1">Module 1: History & Religious Significance</h5>
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

          {/* Content and Quiz Navigation */}
          <div className="card mb-4">
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-light fw-bold d-flex justify-content-between">
                  Content
                  {useAdaptive && adaptiveContent.length > 0 && (
                    <span className="badge bg-primary">Smart</span>
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
          {!activeContent && !activeQuiz && (
            <div className="alert alert-info">
              <h4>Welcome to Module 1: History & Religious Significance</h4>
              <p>
                {useAdaptive && adaptiveContent.length > 0
                  ? '🎯 Adaptive learning is enabled! Content and quizzes are personalized based on your performance and preferences.' 
                  : 'Select a content item or quiz from the sidebar to begin learning about Mount Athos.'
                }
              </p>
              
              {useAdaptive && adaptiveContent.length > 0 && (
                <div className="mt-3">
                  <h6>🌟 Smart Features Active:</h6>
                  <ul className="mb-0">
                    <li>📊 Performance-based content recommendations</li>
                    <li>🎯 Personalized learning paths</li>
                    <li>📈 Real-time progress tracking</li>
                    <li>💡 Struggle detection and help suggestions</li>
                    <li>🚀 Advanced content unlocking</li>
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

export default Module1;