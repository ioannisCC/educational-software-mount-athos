// frontend/src/components/AdaptiveContentViewer.jsx FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { behaviorTracker, trackUserBehavior } from '../services/adaptiveLearning'; // Import both
import { updateContentProgress } from '../services/api';

const AdaptiveContentViewer = ({ content, onComplete, onNeedHelp }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [strugglingDetected, setStrugglingDetected] = useState(false);
  
  const contentRef = useRef(null);
  const timeInterval = useRef(null);
  const scrollTimeout = useRef(null);

  // Timer for tracking time spent
  useEffect(() => {
    if (content) {
      // Start behavior tracking
      behaviorTracker.startTracking(content._id, content.difficulty);
      
      // Start time tracking
      timeInterval.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      // Check for struggling after some time
      const struggleTimeout = setTimeout(() => {
        checkForStruggling();
      }, 120000); // Check after 2 minutes

      return () => {
        if (timeInterval.current) {
          clearInterval(timeInterval.current);
        }
        clearTimeout(struggleTimeout);
        
        // Stop behavior tracking
        behaviorTracker.stopTracking(isCompleted, isCompleted ? null : 'navigation');
      };
    }
  }, [content, isCompleted]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        if (scrollHeight > clientHeight) {
          const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
          setReadingProgress(Math.max(readingProgress, progress));
          
          // Debounced behavior tracking
          if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
          }
          scrollTimeout.current = setTimeout(() => {
            behaviorTracker.trackScroll(scrollTop, scrollHeight, clientHeight);
          }, 500);
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [readingProgress]);

  const checkForStruggling = useCallback(() => {
    // Check indicators of struggling
    const indicators = [];
    
    if (timeSpent > 300 && readingProgress < 30) { // 5 minutes, less than 30% read
      indicators.push('slow_reading');
    }
    
    if (timeSpent > 600 && !isCompleted) { // 10 minutes without completion
      indicators.push('extended_time');
    }
    
    if (readingProgress > 80 && timeSpent < 60) { // Fast scrolling through content
      indicators.push('fast_scrolling');
    }
    
    if (indicators.length > 0) {
      setStrugglingDetected(true);
      setShowHelp(true);
      
      // Track struggling behavior using the class method
      behaviorTracker.analyzeStruggle(timeSpent, isCompleted);
    }
  }, [timeSpent, readingProgress, isCompleted]);

  const handleComplete = async () => {
    try {
      setIsCompleted(true);
      
      // Update progress in backend
      await updateContentProgress(content._id, true);
      
      // Track completion behavior
      behaviorTracker.stopTracking(true);
      
      // Track deep engagement if applicable
      if (timeSpent > 120 && readingProgress > 80) {
        behaviorTracker.trackDeepEngagement();
      }
      
      if (onComplete) {
        onComplete(content, {
          timeSpent,
          readingProgress,
          strugglingDetected,
          deepEngagement: timeSpent > 120 && readingProgress > 80
        });
      }
    } catch (error) {
      console.error('Failed to mark content as complete:', error);
    }
  };

  const handleNeedHelp = () => {
    setShowHelp(true);
    
    // Track help request using the standalone function - FIXED
    trackUserBehavior({
      contentId: content._id,
      timeSpent,
      interactions: behaviorTracker.interactions,
      actionType: 'struggle',
      metadata: {
        reason: 'help_requested',
        readingProgress,
        timeSpent
      }
    });
    
    // Also use the class method for help tracking
    behaviorTracker.trackHelpRequest('user_clicked_help_button');
    
    if (onNeedHelp) {
      onNeedHelp(content, { timeSpent, readingProgress, strugglingDetected: true });
    }
  };

  const handleContentInteraction = (e) => {
    behaviorTracker.trackInteraction();
    
    // Track specific interactions
    if (e.type === 'click') {
      behaviorTracker.trackClick();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (readingProgress >= 80) return 'success';
    if (readingProgress >= 50) return 'warning';
    return 'danger';
  };

  const getDifficultyBadge = () => {
    const difficulty = content?.difficulty || 'basic';
    return (
      <span className={`badge ${difficulty === 'advanced' ? 'bg-danger' : 'bg-primary'}`}>
        {difficulty === 'advanced' ? '🔥 Advanced' : '📚 Basic'}
      </span>
    );
  };

  if (!content) {
    return (
      <div className="alert alert-info">
        <p>Select content from the sidebar to begin learning.</p>
      </div>
    );
  }

  return (
    <div className="adaptive-content-viewer">
      {/* Progress Header */}
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">{content.title}</h5>
            <div className="d-flex gap-2 align-items-center">
              {getDifficultyBadge()}
              <small className="text-muted">⏱️ {formatTime(timeSpent)}</small>
              {isCompleted && <span className="badge bg-success">✅ Completed</span>}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={handleNeedHelp}
              disabled={isCompleted}
            >
              🆘 Need Help
            </button>
            <button 
              className="btn btn-success btn-sm"
              onClick={handleComplete}
              disabled={isCompleted || readingProgress < 70}
            >
              {isCompleted ? '✅ Completed' : '✓ Mark Complete'}
            </button>
          </div>
        </div>
        
        {/* Reading Progress Bar */}
        <div className="card-body py-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small>Reading Progress</small>
            <small>{readingProgress}%</small>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div 
              className={`progress-bar bg-${getProgressColor()}`}
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
          {readingProgress < 70 && !isCompleted && (
            <small className="text-muted">
              💡 Complete at least 70% to mark as finished
            </small>
          )}
        </div>
      </div>

      {/* Struggling Detected Alert */}
      {strugglingDetected && showHelp && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>🤔 Having trouble?</strong> We noticed you might need some help with this content.
          <div className="mt-2">
            <button className="btn btn-sm btn-warning me-2">📚 Show Summary</button>
            <button className="btn btn-sm btn-outline-warning me-2">🎥 Watch Video</button>
            <button className="btn btn-sm btn-outline-warning">💬 Get Explanation</button>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setShowHelp(false)}
          ></button>
        </div>
      )}

      {/* Content Display */}
      <div className="card">
        <div 
          ref={contentRef}
          className="card-body"
          style={{ 
            maxHeight: '600px', 
            overflowY: 'auto',
            lineHeight: '1.6'
          }}
          onClick={handleContentInteraction}
          onKeyDown={handleContentInteraction}
        >
          {content.type === 'text' ? (
            <div 
              dangerouslySetInnerHTML={{ __html: content.content }}
              style={{ fontSize: '1.1rem' }}
            />
          ) : content.type === 'image' ? (
            <div className="text-center">
              <img 
                src={content.content} 
                alt={content.title} 
                className="img-fluid rounded shadow"
                onLoad={handleContentInteraction}
              />
            </div>
          ) : content.type === 'video' ? (
            <div className="ratio ratio-16x9">
              <iframe 
                src={content.content} 
                title={content.title} 
                allowFullScreen
                onLoad={handleContentInteraction}
              ></iframe>
            </div>
          ) : (
            <div className="alert alert-warning">
              Unsupported content type: {content.type}
            </div>
          )}
        </div>
      </div>

      {/* Adaptive Metadata Display */}
      {content.adaptiveMetadata && (
        <div className="card mt-3">
          <div className="card-header">
            <h6 className="mb-0">🎯 Why This Content?</h6>
          </div>
          <div className="card-body">
            {content.adaptiveMetadata.recommended && (
              <div className="alert alert-info mb-2">
                <strong>Recommended for you:</strong> {content.adaptiveMetadata.reason}
              </div>
            )}
            
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Priority: <span className={`badge bg-${
                  content.adaptiveMetadata.priority === 'high' ? 'danger' :
                  content.adaptiveMetadata.priority === 'medium' ? 'warning' : 'secondary'
                }`}>
                  {content.adaptiveMetadata.priority}
                </span>
              </small>
              
              {timeSpent > 0 && (
                <small className="text-muted">
                  Engagement Score: {Math.round((readingProgress + (timeSpent > 60 ? 50 : 0)) / 1.5)}%
                </small>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Tips */}
      {timeSpent > 180 && readingProgress < 50 && (
        <div className="card mt-3 border-warning">
          <div className="card-body">
            <h6 className="text-warning">💡 Learning Tips</h6>
            <ul className="mb-0 small">
              <li>Try reading each section carefully before moving on</li>
              <li>Take notes of key concepts</li>
              <li>Don't hesitate to re-read difficult parts</li>
              <li>Use the "Need Help" button if you're stuck</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveContentViewer;