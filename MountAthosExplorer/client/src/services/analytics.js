/**
 * Analytics Service
 * 
 * Handles tracking of user learning behavior, progress metrics, and usage patterns
 * for the Mount Athos Explorer educational software.
 */

// Track event types
const EVENT_TYPES = {
    PAGE_VIEW: 'page_view',
    MODULE_START: 'module_start',
    MODULE_COMPLETE: 'module_complete',
    SECTION_START: 'section_start',
    SECTION_COMPLETE: 'section_complete',
    QUIZ_START: 'quiz_start',
    QUIZ_COMPLETE: 'quiz_complete',
    QUIZ_ANSWER: 'quiz_answer',
    VIDEO_START: 'video_start',
    VIDEO_COMPLETE: 'video_complete',
    VIDEO_PROGRESS: 'video_progress',
    MODEL_INTERACT: '3d_model_interact',
    MAP_INTERACT: 'map_interact',
    ACHIEVEMENT_EARNED: 'achievement_earned',
    SEARCH: 'search',
    ERROR: 'error'
  };
  
  class AnalyticsService {
    constructor() {
      this.sessionId = this._generateSessionId();
      this.initialized = false;
      this.userId = null;
      this.eventQueue = [];
      this.flushInterval = null;
      this.trackingEnabled = true;
  
      // Check if analytics are disabled in local storage
      this.checkTrackingPreferences();
    }
  
    /**
     * Initialize the analytics service with user information
     * @param {string} userId - The ID of the current user
     */
    init(userId) {
      if (this.initialized) return;
      
      this.userId = userId;
      this.initialized = true;
      
      // Start event queue flushing at regular intervals
      this.flushInterval = setInterval(() => this.flushEvents(), 30000); // Flush every 30 seconds
      
      // Track initial session start
      this.trackEvent(EVENT_TYPES.PAGE_VIEW, {
        path: window.location.pathname,
        sessionStart: true
      });
      
      // Add event listeners
      window.addEventListener('beforeunload', () => this.flushEvents(true));
      
      console.log('Analytics service initialized');
    }
  
    /**
     * Check if user has opted out of analytics tracking
     */
    checkTrackingPreferences() {
      const trackingDisabled = localStorage.getItem('analytics_opt_out') === 'true';
      this.trackingEnabled = !trackingDisabled;
      return this.trackingEnabled;
    }
  
    /**
     * Allow user to opt out of analytics tracking
     * @param {boolean} optOut - Whether to opt out of tracking
     */
    setTrackingPreferences(optOut) {
      localStorage.setItem('analytics_opt_out', optOut.toString());
      this.trackingEnabled = !optOut;
      
      if (optOut && this.flushInterval) {
        clearInterval(this.flushInterval);
        this.flushInterval = null;
        this.eventQueue = [];
      } else if (!optOut && !this.flushInterval) {
        this.flushInterval = setInterval(() => this.flushEvents(), 30000);
      }
      
      return this.trackingEnabled;
    }
  
    /**
     * Track a user event
     * @param {string} eventType - The type of event (from EVENT_TYPES)
     * @param {object} data - Additional data for the event
     */
    trackEvent(eventType, data = {}) {
      if (!this.trackingEnabled) return;
      
      const event = {
        eventType,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        data: {
          ...data,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }
      };
      
      // Add to queue for batch processing
      this.eventQueue.push(event);
      
      // If queue gets too large, flush it
      if (this.eventQueue.length >= 20) {
        this.flushEvents();
      }
      
      return event;
    }
  
    /**
     * Track page views
     * @param {string} path - Path of the page viewed
     */
    trackPageView(path = window.location.pathname) {
      return this.trackEvent(EVENT_TYPES.PAGE_VIEW, { path });
    }
  
    /**
     * Track module interaction
     * @param {string} moduleId - ID of the module
     * @param {string} action - Action taken (start/complete)
     * @param {object} additionalData - Any additional data to track
     */
    trackModule(moduleId, action, additionalData = {}) {
      const eventType = 
        action === 'start' ? EVENT_TYPES.MODULE_START : 
        action === 'complete' ? EVENT_TYPES.MODULE_COMPLETE : 
        EVENT_TYPES.PAGE_VIEW;
      
      return this.trackEvent(eventType, {
        moduleId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track section interaction
     * @param {string} moduleId - ID of the parent module
     * @param {string} sectionId - ID of the section
     * @param {string} action - Action taken (start/complete)
     * @param {object} additionalData - Any additional data to track
     */
    trackSection(moduleId, sectionId, action, additionalData = {}) {
      const eventType = 
        action === 'start' ? EVENT_TYPES.SECTION_START : 
        action === 'complete' ? EVENT_TYPES.SECTION_COMPLETE : 
        EVENT_TYPES.PAGE_VIEW;
      
      return this.trackEvent(eventType, {
        moduleId,
        sectionId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track quiz interaction
     * @param {string} quizId - ID of the quiz
     * @param {string} action - Action taken (start/complete/answer)
     * @param {object} additionalData - Any additional data to track
     */
    trackQuiz(quizId, action, additionalData = {}) {
      const eventType = 
        action === 'start' ? EVENT_TYPES.QUIZ_START : 
        action === 'complete' ? EVENT_TYPES.QUIZ_COMPLETE : 
        action === 'answer' ? EVENT_TYPES.QUIZ_ANSWER : 
        EVENT_TYPES.PAGE_VIEW;
      
      return this.trackEvent(eventType, {
        quizId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track video interaction
     * @param {string} videoId - ID of the video
     * @param {string} action - Action taken (start/complete/progress)
     * @param {object} additionalData - Any additional data to track
     */
    trackVideo(videoId, action, additionalData = {}) {
      const eventType = 
        action === 'start' ? EVENT_TYPES.VIDEO_START : 
        action === 'complete' ? EVENT_TYPES.VIDEO_COMPLETE : 
        action === 'progress' ? EVENT_TYPES.VIDEO_PROGRESS : 
        EVENT_TYPES.PAGE_VIEW;
      
      return this.trackEvent(eventType, {
        videoId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track 3D model interaction
     * @param {string} modelId - ID of the 3D model
     * @param {string} action - Action taken
     * @param {object} additionalData - Any additional data to track
     */
    trackModelInteraction(modelId, action, additionalData = {}) {
      return this.trackEvent(EVENT_TYPES.MODEL_INTERACT, {
        modelId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track map interaction
     * @param {string} mapId - ID of the map
     * @param {string} action - Action taken
     * @param {object} additionalData - Any additional data to track
     */
    trackMapInteraction(mapId, action, additionalData = {}) {
      return this.trackEvent(EVENT_TYPES.MAP_INTERACT, {
        mapId,
        action,
        ...additionalData
      });
    }
  
    /**
     * Track achievement earned
     * @param {string} achievementId - ID of the achievement
     * @param {object} additionalData - Any additional data to track
     */
    trackAchievement(achievementId, additionalData = {}) {
      return this.trackEvent(EVENT_TYPES.ACHIEVEMENT_EARNED, {
        achievementId,
        ...additionalData
      });
    }
  
    /**
     * Track errors
     * @param {Error} error - The error object
     * @param {string} context - Where the error occurred
     */
    trackError(error, context = 'application') {
      return this.trackEvent(EVENT_TYPES.ERROR, {
        message: error.message,
        stack: error.stack,
        context
      });
    }
  
    /**
     * Send queued events to the backend API
     * @param {boolean} immediate - Whether to flush immediately
     */
    async flushEvents(immediate = false) {
      if (!this.trackingEnabled || this.eventQueue.length === 0) return;
      
      try {
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        // Make API call to send events
        const response = await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events,
            immediate
          }),
          // If not immediate, use keepalive to ensure data is sent even if page unloads
          keepalive: !immediate
        });
        
        if (!response.ok) {
          console.error('Failed to send analytics events');
          // Put events back in queue
          this.eventQueue = [...events, ...this.eventQueue];
        }
      } catch (error) {
        console.error('Error sending analytics events:', error);
        // Put events back in queue
        this.eventQueue = [...this.eventQueue, ...this.eventQueue];
      }
    }
  
    /**
     * Generate a unique session ID
     * @returns {string} Session ID
     * @private
     */
    _generateSessionId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  
    /**
     * Clean up event listeners and intervals
     */
    cleanup() {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
        this.flushInterval = null;
      }
      
      // Flush any remaining events
      this.flushEvents(true);
      
      this.initialized = false;
    }
  }
  
  // Export singleton instance
  const analyticsService = new AnalyticsService();
  export default analyticsService;
  
  // Export event types for reference
  export { EVENT_TYPES };