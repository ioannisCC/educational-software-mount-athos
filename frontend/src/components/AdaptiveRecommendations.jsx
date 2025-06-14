// frontend/src/components/AdaptiveRecommendations.jsx
import React, { useState, useEffect } from 'react';
import { getPersonalizedRecommendations } from '../services/adaptiveLearning';

const AdaptiveRecommendations = ({ onSelectContent, onSelectQuiz, compactMode = false }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getPersonalizedRecommendations();
      setRecommendations(data);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error('Recommendations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = (content) => {
    if (onSelectContent) {
      onSelectContent(content);
    }
  };

  const handleQuizClick = (quiz) => {
    if (onSelectQuiz) {
      onSelectQuiz(quiz);
    }
  };

  if (loading) {
    return (
      <div className={`${!compactMode ? 'card' : ''}`}>
        {!compactMode && (
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">🎯 Your Learning Recommendations</h5>
          </div>
        )}
        <div className={`${!compactMode ? 'card-body' : ''} text-center py-3`}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading recommendations...</span>
          </div>
          {!compactMode && <div className="mt-2">Loading your personalized learning path...</div>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${!compactMode ? 'card' : 'alert alert-warning'}`}>
        {!compactMode && (
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">🚨 Recommendations Error</h5>
          </div>
        )}
        <div className={`${!compactMode ? 'card-body' : ''}`}>
          <p className="mb-2">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchRecommendations}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  // Compact mode for sidebar
  if (compactMode) {
    return (
      <div className="compact-recommendations">
        <div className="mb-3">
          <h6 className="small fw-bold text-primary mb-2">🎯 Your Learning Path</h6>
          
          {/* Quick Stats */}
          <div className="mb-3">
            {Object.keys(recommendations.performanceInsights || {}).map(moduleKey => {
              const module = recommendations.performanceInsights[moduleKey];
              return (
                <div key={moduleKey} className="mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="fw-medium">Module {module.moduleId}</small>
                    <div className="d-flex gap-1">
                      <span className={`badge badge-sm ${
                        module.averageScore >= 85 ? 'bg-success' :
                        module.averageScore >= 60 ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {module.averageScore}%
                      </span>
                      {module.needsRemediation && (
                        <span className="badge bg-warning badge-sm">⚠️</span>
                      )}
                    </div>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className={`progress-bar ${
                        module.completionRate >= 80 ? 'bg-success' :
                        module.completionRate >= 50 ? 'bg-warning' : 'bg-danger'
                      }`}
                      style={{ width: `${module.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Next Steps */}
          {recommendations.nextContent && recommendations.nextContent.length > 0 && (
            <div className="mb-3">
              <h6 className="small fw-bold text-success mb-2">👉 Next Steps</h6>
              {recommendations.nextContent.slice(0, 3).map((content) => (
                <div 
                  key={content._id} 
                  className="d-flex align-items-center mb-2 p-2 bg-light rounded cursor-pointer hover-bg-primary"
                  onClick={() => handleContentClick(content)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="me-2">
                    {content.type === 'text' ? '📖' : content.type === 'image' ? '🖼️' : '🎬'}
                  </span>
                  <div className="flex-grow-1">
                    <div className="small fw-medium">{content.title}</div>
                    {content.adaptiveMetadata?.priority === 'high' && (
                      <span className="badge bg-danger badge-sm">High Priority</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Review Needed */}
          {recommendations.remedialContent && recommendations.remedialContent.length > 0 && (
            <div className="mb-3">
              <h6 className="small fw-bold text-warning mb-2">🔄 Review Needed</h6>
              {recommendations.remedialContent.slice(0, 2).map((content) => (
                <div 
                  key={content._id} 
                  className="d-flex align-items-center mb-2 p-2 bg-warning bg-opacity-10 rounded cursor-pointer"
                  onClick={() => handleContentClick(content)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="me-2">⚠️</span>
                  <div className="flex-grow-1">
                    <div className="small fw-medium">{content.title}</div>
                    <div className="small text-muted">Strengthen understanding</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <small className="text-muted">💡 Updates automatically</small>
          </div>
        </div>
      </div>
    );
  }

  // Full mode for bottom section
  return (
    <div className="card mb-4">
      <div className="card-header bg-info text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">🎯 Your Personalized Learning Path</h5>
          <button 
            className="btn btn-light btn-sm"
            onClick={fetchRecommendations}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              ◈ Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'next' ? 'active' : ''}`}
              onClick={() => setActiveTab('next')}
            >
              → Next Steps
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'remedial' ? 'active' : ''}`}
              onClick={() => setActiveTab('remedial')}
            >
              ↻ Review Needed
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              ◆ Advanced
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h6>◈ Your Learning Summary</h6>
            <div className="row mb-4">
              {Object.keys(recommendations.performanceInsights || {}).map(moduleKey => {
                const module = recommendations.performanceInsights[moduleKey];
                return (
                  <div key={moduleKey} className="col-md-4 mb-3">
                    <div className={`card border-2 ${
                      module.averageScore >= 85 ? 'border-success' :
                      module.averageScore >= 60 ? 'border-warning' : 'border-danger'
                    }`}>
                      <div className="card-body">
                        <h6 className="card-title">Module {module.moduleId}</h6>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Progress:</span>
                          <strong>{module.completionRate}%</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Average Score:</span>
                          <strong>{module.averageScore}%</strong>
                        </div>
                        <div className="mt-2">
                          {module.needsRemediation && (
                            <span className="badge bg-warning me-1">⚠️ Review Needed</span>
                          )}
                          {module.readyForAdvanced && (
                            <span className="badge bg-success">🚀 Ready for Advanced</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Learning Path */}
            {recommendations.learningPath && recommendations.learningPath.length > 0 && (
              <div className="mt-4">
                <h6>→ Your Learning Path</h6>
                <div className="timeline">
                  {recommendations.learningPath.map((step, index) => (
                    <div key={step.moduleId} className="timeline-item mb-3">
                      <div className={`card ${
                        step.status === 'completed' ? 'border-success' :
                        step.status === 'in_progress' ? 'border-primary' :
                        step.status === 'needs_review' ? 'border-warning' : 'border-secondary'
                      }`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-1">
                              Module {step.moduleId}
                              <span className={`ms-2 badge ${
                                step.status === 'completed' ? 'bg-success' :
                                step.status === 'in_progress' ? 'bg-primary' :
                                step.status === 'needs_review' ? 'bg-warning' :
                                step.status === 'advanced_ready' ? 'bg-info' : 'bg-secondary'
                              }`}>
                                {step.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </h6>
                          </div>
                          <p className="mb-2">{step.recommendation}</p>
                          {step.nextActions && step.nextActions.length > 0 && (
                            <ul className="mb-0">
                              {step.nextActions.slice(0, 2).map((action, i) => (
                                <li key={i} className="small text-muted">• {action}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'next' && (
          <div className="tab-content">
            <h6>→ Recommended Next Content</h6>
            {recommendations.nextContent && recommendations.nextContent.length > 0 ? (
              <div className="row">
                {recommendations.nextContent.slice(0, 6).map((content) => (
                  <div key={content._id} className="col-md-6 mb-3">
                    <div className="card border-primary h-100">
                      <div className="card-body">
                        <h6 className="card-title">{content.title}</h6>
                        {content.adaptiveMetadata && (
                          <div className="mb-2">
                            <span className={`badge ${
                              content.adaptiveMetadata.priority === 'high' ? 'bg-danger' :
                              content.adaptiveMetadata.priority === 'medium' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {content.adaptiveMetadata.priority} priority
                            </span>
                            {content.difficulty === 'advanced' && (
                              <span className="badge bg-info ms-1">Advanced</span>
                            )}
                          </div>
                        )}
                        {content.adaptiveMetadata?.reason && (
                          <p className="card-text small text-muted">
                            💡 {content.adaptiveMetadata.reason}
                          </p>
                        )}
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleContentClick(content)}
                        >
                          Start Learning
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                <p>🎉 Great job! You're up to date with your recommended content.</p>
                <p>Continue exploring other modules or try some advanced content.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'remedial' && (
          <div className="tab-content">
            <h6>↻ Content to Review</h6>
            {recommendations.remedialContent && recommendations.remedialContent.length > 0 ? (
              <div className="alert alert-warning mb-3">
                <strong>📚 Strengthening Recommendations:</strong> Based on your quiz performance, 
                we recommend reviewing these topics to strengthen your understanding.
              </div>
            ) : null}
            
            {recommendations.remedialContent && recommendations.remedialContent.length > 0 ? (
              <div className="row">
                {recommendations.remedialContent.map((content) => (
                  <div key={content._id} className="col-md-6 mb-3">
                    <div className="card border-warning h-100">
                      <div className="card-body">
                        <h6 className="card-title">{content.title}</h6>
                        <div className="mb-2">
                          <span className="badge bg-warning">⚠️ Review Recommended</span>
                          {content.difficulty === 'basic' && (
                            <span className="badge bg-success ms-1">Foundational</span>
                          )}
                        </div>
                        <p className="card-text small text-muted">
                          🎯 Reviewing this content will help improve your quiz scores.
                        </p>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => handleContentClick(content)}
                        >
                          Review Content
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-success">
                <p>✅ Excellent! You don't have any content that needs immediate review.</p>
                <p>Your understanding appears solid across all completed modules.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="tab-content">
            <h6>◆ Advanced Challenges</h6>
            {recommendations.advancedContent && recommendations.advancedContent.length > 0 ? (
              <>
                <div className="alert alert-success mb-3">
                  <strong>🌟 Ready for More:</strong> Your excellent performance has unlocked 
                  these advanced topics and challenges!
                </div>
                <div className="row">
                  {recommendations.advancedContent.map((content) => (
                    <div key={content._id} className="col-md-6 mb-3">
                      <div className="card border-success h-100">
                        <div className="card-body">
                          <h6 className="card-title">{content.title}</h6>
                          <div className="mb-2">
                            <span className="badge bg-success">🚀 Advanced</span>
                            <span className="badge bg-info ms-1">Challenge</span>
                          </div>
                          <p className="card-text small text-muted">
                            🎯 Expand your knowledge with this advanced content.
                          </p>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleContentClick(content)}
                          >
                            Take Challenge
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                <p>🏆 Advanced content will be unlocked as you progress through the modules.</p>
                <p>Complete more quizzes with high scores to access challenging material!</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              💡 Recommendations update automatically based on your progress
            </small>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={fetchRecommendations}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveRecommendations;