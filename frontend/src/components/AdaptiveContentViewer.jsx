// frontend/src/components/AdaptiveContentViewer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { behaviorTracker, trackUserBehavior } from '../services/adaptiveLearning';
import { updateContentProgress } from '../services/api';

const AdaptiveContentViewer = ({ content, onComplete, onNeedHelp }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [strugglingDetected, setStrugglingDetected] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  
  const contentRef = useRef(null);
  const videoRef = useRef(null);
  const timeInterval = useRef(null);
  const scrollTimeout = useRef(null);

  // Timer for tracking time spent
  useEffect(() => {
    if (content) {
      behaviorTracker.startTracking(content._id, content.difficulty);
      
      timeInterval.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      const struggleTimeout = setTimeout(() => {
        checkForStruggling();
      }, getStruggleCheckTime());

      return () => {
        if (timeInterval.current) {
          clearInterval(timeInterval.current);
        }
        clearTimeout(struggleTimeout);
        behaviorTracker.stopTracking(isCompleted, isCompleted ? null : 'navigation');
      };
    }
  }, [content, isCompleted]);

  const getStruggleCheckTime = () => {
    if (!content) return 120000;
    
    switch (content.type) {
      case 'text': return 120000;
      case 'image': return 60000;
      case 'video': return 180000;
      default: return 120000;
    }
  };

  // Scroll tracking for text content
  useEffect(() => {
    if (content?.type !== 'text') return;

    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        if (scrollHeight > clientHeight) {
          const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
          setReadingProgress(Math.max(readingProgress, progress));
          
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
  }, [readingProgress, content]);

  // Video progress tracking
  useEffect(() => {
    if (content?.type !== 'video' || !videoRef.current) return;

    const video = videoRef.current;
    
    const handleVideoProgress = () => {
      if (video.duration > 0) {
        const progress = Math.round((video.currentTime / video.duration) * 100);
        setReadingProgress(Math.max(readingProgress, progress));
        behaviorTracker.trackInteraction();
      }
    };

    const handleVideoEnded = () => {
      setReadingProgress(100);
      behaviorTracker.trackInteraction();
    };

    video.addEventListener('timeupdate', handleVideoProgress);
    video.addEventListener('ended', handleVideoEnded);
    video.addEventListener('play', () => behaviorTracker.trackInteraction());
    video.addEventListener('pause', () => behaviorTracker.trackInteraction());

    return () => {
      video.removeEventListener('timeupdate', handleVideoProgress);
      video.removeEventListener('ended', handleVideoEnded);
      video.removeEventListener('play', () => behaviorTracker.trackInteraction());
      video.removeEventListener('pause', () => behaviorTracker.trackInteraction());
    };
  }, [readingProgress, content, mediaLoaded]);

  // Image viewing progress
  useEffect(() => {
    if (content?.type !== 'image' || !mediaLoaded) return;

    const progressInterval = setInterval(() => {
      setReadingProgress(prev => {
        const newProgress = Math.min(prev + 5, 100);
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [content, mediaLoaded]);

  const checkForStruggling = useCallback(() => {
    const indicators = [];
    
    if (content?.type === 'text') {
      if (timeSpent > 300 && readingProgress < 30) {
        indicators.push('slow_reading');
      }
      if (timeSpent > 600 && !isCompleted) {
        indicators.push('extended_time');
      }
    } else if (content?.type === 'image') {
      if (timeSpent > 120 && readingProgress < 50) {
        indicators.push('slow_viewing');
      }
      if (timeSpent < 30 && !isCompleted) {
        indicators.push('too_quick');
      }
    } else if (content?.type === 'video') {
      if (timeSpent > 300 && readingProgress < 20) {
        indicators.push('not_watching');
      }
      if (videoRef.current && videoRef.current.paused && timeSpent > 60) {
        indicators.push('video_paused_long');
      }
    }
    
    if (indicators.length > 0) {
      setStrugglingDetected(true);
      setShowHelp(true);
      behaviorTracker.analyzeStruggle(timeSpent, isCompleted);
    }
  }, [timeSpent, readingProgress, isCompleted, content]);

  const handleComplete = async () => {
    try {
      setIsCompleted(true);
      
      await updateContentProgress(content._id, true);
      behaviorTracker.stopTracking(true);
      
      const isDeepEngagement = getDeepEngagementStatus();
      if (isDeepEngagement) {
        behaviorTracker.trackDeepEngagement();
      }
      
      if (onComplete) {
        onComplete(content, {
          timeSpent,
          readingProgress,
          strugglingDetected,
          deepEngagement: isDeepEngagement,
          mediaType: content.type
        });
      }
    } catch (error) {
      console.error('Failed to mark content as complete:', error);
    }
  };

  const getDeepEngagementStatus = () => {
    switch (content?.type) {
      case 'text':
        return timeSpent > 120 && readingProgress > 80;
      case 'image':
        return timeSpent > 60 && readingProgress > 70;
      case 'video':
        return timeSpent > 60 && readingProgress > 85;
      default:
        return false;
    }
  };

  const handleNeedHelp = () => {
    setShowHelp(true);
    
    trackUserBehavior({
      contentId: content._id,
      timeSpent,
      interactions: behaviorTracker.interactions,
      actionType: 'struggle',
      metadata: {
        reason: 'help_requested',
        readingProgress,
        timeSpent,
        contentType: content.type
      }
    });
    
    behaviorTracker.trackHelpRequest('user_clicked_help_button');
    
    if (onNeedHelp) {
      onNeedHelp(content, { 
        timeSpent, 
        readingProgress, 
        strugglingDetected: true,
        contentType: content.type
      });
    }
  };

  const handleContentInteraction = (e) => {
    behaviorTracker.trackInteraction();
    
    if (e.type === 'click') {
      behaviorTracker.trackClick();
    }
  };

  const handleMediaLoad = () => {
    setMediaLoaded(true);
    setMediaError(false);
    behaviorTracker.trackInteraction();
    
    if (content?.type === 'image') {
      setReadingProgress(10);
    }
  };

  const handleMediaError = () => {
    setMediaError(true);
    setMediaLoaded(false);
    console.error('Media failed to load:', content.content);
  };

  const getCompletionThreshold = () => {
    switch (content?.type) {
      case 'text': return 70;
      case 'image': return 60;
      case 'video': return 80;
      default: return 70;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const threshold = getCompletionThreshold();
    if (readingProgress >= threshold) return 'success';
    if (readingProgress >= threshold * 0.7) return 'warning';
    return 'danger';
  };

  const getDifficultyBadge = () => {
    const difficulty = content?.difficulty || 'basic';
    return (
      <span className={`badge ${difficulty === 'advanced' ? 'bg-warning' : 'bg-secondary'}`}>
        {difficulty === 'advanced' ? 'Advanced' : 'Basic'}
      </span>
    );
  };

  const getContentTypeIcon = () => {
    switch (content?.type) {
      case 'text': return '◈';
      case 'image': return '◊';
      case 'video': return '◆';
      default: return '○';
    }
  };

  const renderHelpSuggestions = () => {
    if (!strugglingDetected || !showHelp) return null;

    const suggestions = {
      text: [
        { text: 'Show Summary', action: () => alert('Summary would be shown here') },
        { text: 'Audio Version', action: () => alert('Audio narration would play here') },
        { text: 'Key Points', action: () => alert('Key points would be highlighted') }
      ],
      image: [
        { text: 'Zoom & Details', action: () => alert('Image zoom and details would be shown') },
        { text: 'Description', action: () => alert('Detailed description would be provided') },
        { text: 'Focus Areas', action: () => alert('Important areas would be highlighted') }
      ],
      video: [
        { text: 'Replay Key Parts', action: () => videoRef.current?.play() },
        { text: 'Transcript', action: () => alert('Video transcript would be shown') },
        { text: 'Skip to Important', action: () => alert('Would skip to key moments') }
      ]
    };

    const contentSuggestions = suggestions[content?.type] || suggestions.text;

    return (
      <div className="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>
          <span className="icon me-2">?</span>
          Having trouble with this {content?.type}?
        </strong> Here are some helpful options:
        <div className="mt-2">
          {contentSuggestions.map((suggestion, index) => (
            <button 
              key={index}
              className="btn btn-sm btn-warning me-2 mb-1"
              onClick={suggestion.action}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
        <button 
          type="button" 
          className="btn-close" 
          onClick={() => setShowHelp(false)}
        ></button>
      </div>
    );
  };

  const renderContent = () => {
    if (!content) return null;

    switch (content.type) {
      case 'text':
        return (
          <div 
            ref={contentRef}
            className="card-body text-content"
            style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              lineHeight: '1.6',
              fontSize: '1.1rem'
            }}
            onClick={handleContentInteraction}
            onKeyDown={handleContentInteraction}
          >
            <div dangerouslySetInnerHTML={{ __html: content.content }} />
          </div>
        );

      case 'image':
        return (
          <div className="card-body text-center image-content">
            {mediaError ? (
              <div className="alert alert-warning">
                <h6>
                  <span className="icon me-2">!</span>
                  Image Not Available
                </h6>
                <p>Could not load: {content.content}</p>
                <small className="text-muted">
                  Please ensure the image file exists at: <code>{content.content}</code>
                </small>
              </div>
            ) : (
              <>
                <img 
                  src={content.content} 
                  alt={content.title} 
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: '500px', cursor: 'pointer' }}
                  onLoad={handleMediaLoad}
                  onError={handleMediaError}
                  onClick={handleContentInteraction}
                />
                {mediaLoaded && (
                  <div className="mt-3">
                    <p className="text-muted">
                      <span className="icon me-2">◊</span>
                      Take your time to examine the details in this image. 
                      Click for larger view or use zoom controls.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="card-body video-content">
            {mediaError ? (
              <div className="alert alert-warning">
                <h6>
                  <span className="icon me-2">!</span>
                  Video Not Available
                </h6>
                <p>Could not load: {content.content}</p>
                <small className="text-muted">
                  Please ensure the video file exists at: <code>{content.content}</code>
                </small>
              </div>
            ) : (
              <>
                <div className="ratio ratio-16x9">
                  <video 
                    ref={videoRef}
                    controls 
                    className="rounded"
                    onLoadedData={handleMediaLoad}
                    onError={handleMediaError}
                    onClick={handleContentInteraction}
                  >
                    <source src={content.content} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                {mediaLoaded && (
                  <div className="mt-3 text-center">
                    <p className="text-muted">
                      <span className="icon me-2">◆</span>
                      Watch the complete video for full understanding. 
                      Use controls to pause, rewind, or adjust volume as needed.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="card-body">
            <div className="alert alert-warning">
              <h6>
                <span className="icon me-2">?</span>
                Unsupported Content Type
              </h6>
              <p>Content type "{content.type}" is not supported.</p>
              <small>Supported types: text, image, video</small>
            </div>
          </div>
        );
    }
  };

  if (!content) {
    return (
      <div className="alert alert-info">
        <h6>
          <span className="icon me-2">◈</span>
          Ready to Learn
        </h6>
        <p>Select content from the sidebar to begin your adaptive learning journey through Mount Athos.</p>
      </div>
    );
  }

  const completionThreshold = getCompletionThreshold();

  return (
    <div className="adaptive-content-viewer">
      {/* Clean Progress Header */}
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              <span className="icon me-2">{getContentTypeIcon()}</span>
              {content.title}
            </h5>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              {getDifficultyBadge()}
              <span className="badge bg-secondary">{content.type}</span>
              <small className="text-muted">
                <span className="icon me-1">⏱</span>
                {formatTime(timeSpent)}
              </small>
              {isCompleted && (
                <span className="badge bg-success">
                  <span className="icon me-1">✓</span>
                  Completed
                </span>
              )}
              {mediaLoaded && content.type !== 'text' && (
                <span className="badge bg-info">
                  <span className="icon me-1">◆</span>
                  Loaded
                </span>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={handleNeedHelp}
              disabled={isCompleted}
              title="Get help with this content"
            >
              <span className="icon me-1">?</span>
              Need Help
            </button>
            <button 
              className="btn btn-success btn-sm"
              onClick={handleComplete}
              disabled={isCompleted || readingProgress < completionThreshold}
              title={`Complete ${completionThreshold}% to finish`}
            >
              {isCompleted ? (
                <>
                  <span className="icon me-1">✓</span>
                  Completed
                </>
              ) : (
                <>
                  <span className="icon me-1">✓</span>
                  Mark Complete
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Clean Progress Bar */}
        <div className="card-body py-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small>
              <span className="icon me-1">{getContentTypeIcon()}</span>
              {content.type === 'text' && 'Reading Progress'}
              {content.type === 'image' && 'Viewing Progress'}
              {content.type === 'video' && 'Watch Progress'}
            </small>
            <small>{readingProgress}%</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className={`progress-bar bg-${getProgressColor()}`}
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
          {readingProgress < completionThreshold && !isCompleted && (
            <small className="text-muted">
              <span className="icon me-1">→</span>
              Complete at least {completionThreshold}% to mark as finished
              {content.type === 'video' && ' (watch most of the video)'}
              {content.type === 'image' && ' (spend enough time viewing)'}
              {content.type === 'text' && ' (read through the content)'}
            </small>
          )}
        </div>
      </div>

      {/* Content-Type Specific Help */}
      {renderHelpSuggestions()}

      {/* Main Content Display */}
      <div className="card">
        {renderContent()}
      </div>

      {/* Clean Adaptive Metadata Display */}
      {content.adaptiveMetadata && (
        <div className="card mt-3">
          <div className="card-header">
            <h6 className="mb-0">
              <span className="icon me-2">⚡</span>
              Why This {content.type.charAt(0).toUpperCase() + content.type.slice(1)}?
            </h6>
          </div>
          <div className="card-body">
            {content.adaptiveMetadata.recommended && (
              <div className="alert alert-info mb-2">
                <strong>
                  <span className="icon me-2">→</span>
                  Recommended for you:
                </strong> {content.adaptiveMetadata.reason}
              </div>
            )}
            
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">
                  Priority: <span className={`badge bg-${
                    content.adaptiveMetadata.priority === 'high' ? 'danger' :
                    content.adaptiveMetadata.priority === 'medium' ? 'warning' : 'secondary'
                  }`}>
                    {content.adaptiveMetadata.priority}
                  </span>
                </small>
              </div>
              <div className="col-md-6 text-end">
                {timeSpent > 0 && (
                  <small className="text-muted">
                    Engagement: {Math.round((readingProgress + (timeSpent > 60 ? 50 : 0)) / 1.5)}%
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Clean Learning Tips */}
      {timeSpent > 60 && readingProgress < 50 && (
        <div className="card mt-3 border-warning">
          <div className="card-body">
            <h6 className="text-warning">
              <span className="icon me-2">→</span>
              {content.type.charAt(0).toUpperCase() + content.type.slice(1)} Learning Tips
            </h6>
            <ul className="mb-0 small">
              {content.type === 'text' && (
                <>
                  <li>Read each section carefully before moving on</li>
                  <li>Take notes of key concepts and dates</li>
                  <li>Don't hesitate to re-read difficult parts</li>
                  <li>Look for connections between ideas</li>
                </>
              )}
              {content.type === 'image' && (
                <>
                  <li>Examine all details in the image carefully</li>
                  <li>Look for architectural features, symbols, or people</li>
                  <li>Consider the historical context of what you see</li>
                  <li>Try to identify different elements and their significance</li>
                </>
              )}
              {content.type === 'video' && (
                <>
                  <li>Watch the complete video without distractions</li>
                  <li>Use pause and rewind to review important sections</li>
                  <li>Pay attention to both visual and audio information</li>
                  <li>Take mental notes of key points and scenes</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveContentViewer;