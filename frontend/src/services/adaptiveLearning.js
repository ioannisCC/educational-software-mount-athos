// frontend/src/services/adaptiveLearning.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/adaptive';

// Get personalized recommendations
export const getPersonalizedRecommendations = async () => {
  try {
    const response = await axios.get(`${API_URL}/recommendations`);
    return response.data;
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    throw error.response?.data || { message: 'Failed to get recommendations' };
  }
};

// Get adaptive content for a module
export const getAdaptiveContent = async (moduleId) => {
  try {
    const response = await axios.get(`${API_URL}/content/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get adaptive content:', error);
    throw error.response?.data || { message: 'Failed to get adaptive content' };
  }
};

// Get adaptive quizzes for a module
export const getAdaptiveQuizzes = async (moduleId) => {
  try {
    const response = await axios.get(`${API_URL}/quizzes/${moduleId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get adaptive quizzes:', error);
    throw error.response?.data || { message: 'Failed to get adaptive quizzes' };
  }
};

// Track user behavior - IMPROVED ERROR HANDLING
export const trackUserBehavior = async (behaviorData) => {
  try {
    const response = await axios.post(`${API_URL}/track-behavior`, behaviorData);
    return response.data;
  } catch (error) {
    console.error('Failed to track behavior:', error);
    // Don't throw error for tracking - it shouldn't break the user experience
    return null;
  }
};

// Behavior tracking utility class - IMPROVED VERSION
export class BehaviorTracker {
  constructor() {
    this.currentContent = null;
    this.startTime = null;
    this.interactions = 0;
    this.scrollPercentage = 0;
    this.clickCount = 0;
    this.pauseTime = 0;
    this.lastActivity = Date.now();
    this.isTracking = false;
    this.trackingQueue = []; // Queue for failed tracking attempts
    
    // Bind methods
    this.trackInteraction = this.trackInteraction.bind(this);
    this.trackScroll = this.trackScroll.bind(this);
    this.trackClick = this.trackClick.bind(this);
    this.checkForPause = this.checkForPause.bind(this);
    this.retryFailedTracking = this.retryFailedTracking.bind(this);
    
    // Set up activity monitoring
    this.setupActivityMonitoring();
    
    // Set up retry mechanism for failed tracking
    setInterval(this.retryFailedTracking, 30000); // Retry every 30 seconds
  }

  startTracking(contentId, difficulty = 'basic') {
    if (this.isTracking && this.currentContent) {
      // Stop previous tracking first
      this.stopTracking(false, 'new_content_started');
    }

    this.currentContent = contentId;
    this.startTime = Date.now();
    this.interactions = 0;
    this.scrollPercentage = 0;
    this.clickCount = 0;
    this.pauseTime = 0;
    this.lastActivity = Date.now();
    this.isTracking = true;
    
    console.log(`Started tracking content: ${contentId}`);
  }

  stopTracking(completed = false, exitReason = null) {
    if (!this.currentContent || !this.startTime || !this.isTracking) return;

    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    const behaviorData = {
      contentId: this.currentContent,
      timeSpent: Math.max(timeSpent, 0),
      interactions: Math.max(this.interactions, 0),
      completed,
      actionType: completed ? 'complete' : 'view',
      metadata: {
        scrollPercentage: Math.max(0, Math.min(100, this.scrollPercentage)),
        clickCount: Math.max(this.clickCount, 0),
        pauseTime: Math.max(this.pauseTime, 0),
        exitReason: exitReason || 'normal'
      }
    };

    // Send behavior data with error handling
    this.sendBehaviorData(behaviorData);

    // Analyze if user struggled
    this.analyzeStruggle(timeSpent, completed);

    // Reset tracking
    this.currentContent = null;
    this.startTime = null;
    this.isTracking = false;
  }

  async sendBehaviorData(behaviorData) {
    try {
      await trackUserBehavior(behaviorData);
    } catch (error) {
      console.warn('Failed to send behavior data, adding to queue:', error);
      // Add to queue for retry
      this.trackingQueue.push({
        data: behaviorData,
        timestamp: Date.now(),
        retries: 0
      });
    }
  }

  async retryFailedTracking() {
    if (this.trackingQueue.length === 0) return;

    const itemsToRetry = [...this.trackingQueue];
    this.trackingQueue = [];

    for (const item of itemsToRetry) {
      try {
        await trackUserBehavior(item.data);
        console.log('Successfully retried behavior tracking');
      } catch (error) {
        // Retry up to 3 times
        if (item.retries < 3) {
          item.retries++;
          this.trackingQueue.push(item);
        } else {
          console.warn('Abandoning behavior tracking after 3 retries:', item.data);
        }
      }
    }
  }

  trackInteraction() {
    if (!this.isTracking) return;
    this.interactions++;
    this.lastActivity = Date.now();
  }

  trackScroll(scrollTop, scrollHeight, clientHeight) {
    if (!this.isTracking) return;
    
    try {
      const percentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      this.scrollPercentage = Math.max(this.scrollPercentage, Math.min(100, percentage || 0));
      this.trackInteraction();
    } catch (error) {
      console.warn('Error tracking scroll:', error);
    }
  }

  trackClick() {
    if (!this.isTracking) return;
    this.clickCount++;
    this.trackInteraction();
  }

  setupActivityMonitoring() {
    // Check for pauses every 10 seconds
    setInterval(this.checkForPause, 10000);
    
    // Add event listeners for common interactions
    if (typeof window !== 'undefined') {
      // Throttled scroll tracking
      let scrollTimeout;
      window.addEventListener('scroll', (e) => {
        if (this.currentContent && this.isTracking) {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this.trackScroll(
              window.pageYOffset,
              document.body.scrollHeight,
              window.innerHeight
            );
          }, 100); // Throttle to every 100ms
        }
      });

      window.addEventListener('click', () => {
        if (this.currentContent && this.isTracking) {
          this.trackClick();
        }
      });

      window.addEventListener('keydown', () => {
        if (this.currentContent && this.isTracking) {
          this.trackInteraction();
        }
      });

      // Track when user leaves/returns to tab
      document.addEventListener('visibilitychange', () => {
        if (this.currentContent && this.isTracking) {
          if (document.hidden) {
            this.pauseStart = Date.now();
          } else if (this.pauseStart) {
            this.pauseTime += Math.max(0, Date.now() - this.pauseStart);
            this.pauseStart = null;
          }
        }
      });

      // Track page unload
      window.addEventListener('beforeunload', () => {
        if (this.isTracking) {
          this.stopTracking(false, 'page_unload');
        }
      });
    }
  }

  checkForPause() {
    if (!this.currentContent || !this.isTracking) return;

    const timeSinceLastActivity = Date.now() - this.lastActivity;
    if (timeSinceLastActivity > 30000) { // 30 seconds of inactivity
      this.pauseTime += timeSinceLastActivity;
      this.lastActivity = Date.now();
    }
  }

  analyzeStruggle(timeSpent, completed) {
    if (!this.currentContent || !this.isTracking) return;

    let isStruggling = false;
    let reason = '';

    try {
      // Indicators of struggle
      if (timeSpent > 600 && !completed) { // More than 10 minutes without completion
        isStruggling = true;
        reason = 'excessive_time_without_completion';
      } else if (this.pauseTime > timeSpent * 0.3) { // More than 30% pause time
        isStruggling = true;
        reason = 'excessive_pause_time';
      } else if (this.scrollPercentage < 50 && timeSpent > 180) { // Less than 50% scroll after 3 minutes
        isStruggling = true;
        reason = 'limited_content_engagement';
      } else if (timeSpent < 30 && !completed) { // Quick exit without completion
        isStruggling = true;
        reason = 'quick_exit';
      }

      if (isStruggling) {
        const struggleData = {
          contentId: this.currentContent,
          timeSpent: Math.max(timeSpent, 0),
          interactions: Math.max(this.interactions, 0),
          actionType: reason === 'quick_exit' ? 'quick_exit' : 'struggle',
          metadata: {
            reason,
            scrollPercentage: Math.max(0, Math.min(100, this.scrollPercentage)),
            clickCount: Math.max(this.clickCount, 0),
            pauseTime: Math.max(this.pauseTime, 0)
          }
        };

        this.sendBehaviorData(struggleData);
      }
    } catch (error) {
      console.warn('Error analyzing struggle:', error);
    }
  }

  // Track deep engagement (positive indicator)
  trackDeepEngagement() {
    if (!this.currentContent || !this.isTracking) return;

    try {
      const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
      
      // Indicators of deep engagement
      if (timeSpent > 120 && this.scrollPercentage > 80 && this.interactions > 10) {
        const engagementData = {
          contentId: this.currentContent,
          timeSpent: Math.max(timeSpent, 0),
          interactions: Math.max(this.interactions, 0),
          actionType: 'deep_engagement',
          metadata: {
            scrollPercentage: Math.max(0, Math.min(100, this.scrollPercentage)),
            clickCount: Math.max(this.clickCount, 0),
            pauseTime: Math.max(this.pauseTime, 0)
          }
        };

        this.sendBehaviorData(engagementData);
      }
    } catch (error) {
      console.warn('Error tracking deep engagement:', error);
    }
  }

  // Manually trigger help request tracking
  trackHelpRequest(reason = 'user_requested') {
    if (!this.currentContent || !this.isTracking) return;

    try {
      const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
      const helpData = {
        contentId: this.currentContent,
        timeSpent: Math.max(timeSpent, 0),
        interactions: Math.max(this.interactions, 0),
        actionType: 'struggle',
        metadata: {
          reason: 'help_requested',
          helpReason: reason,
          scrollPercentage: Math.max(0, Math.min(100, this.scrollPercentage)),
          clickCount: Math.max(this.clickCount, 0),
          pauseTime: Math.max(this.pauseTime, 0)
        }
      };

      this.sendBehaviorData(helpData);
    } catch (error) {
      console.warn('Error tracking help request:', error);
    }
  }
}

// Create a global instance
export const behaviorTracker = new BehaviorTracker();