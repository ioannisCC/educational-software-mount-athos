/**
 * Adaptive Learning Service
 * 
 * Provides adaptive learning functionality for the Mount Athos Explorer
 * educational application.
 */

const Content = require('../models/Content');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const config = require('../config/config');
const { logger } = require('../middleware/logger');
const mongoose = require('mongoose');

/**
 * Generate personalized recommendations for a user
 * @param {string} userId - User ID
 * @param {Object} progress - User progress data
 * @param {string} learningStyle - User learning style preference
 * @param {string} difficulty - User difficulty preference
 * @param {string} currentModule - Current module
 * @param {string} currentSection - Current section
 * @param {mongoose.ClientSession} session - MongoDB session (optional)
 * @returns {Promise<Object>} - Recommendations
 */
exports.generateRecommendations = async (
  userId,
  progress,
  learningStyle,
  difficulty,
  currentModule,
  currentSection,
  session = null
) => {
  try {
    // Default empty progress if not provided
    if (!progress) {
      progress = {
        modules: [],
        contentProgress: [],
        quizProgress: [],
      };
    }
    
    // Find content based on learning style and difficulty
    const baseQuery = {
      isPublished: true,
    };
    
    // Add learning style filter if specified
    if (learningStyle && learningStyle !== 'balanced') {
      baseQuery['metadata.learningStyles'] = learningStyle;
    }
    
    // Add difficulty filter
    if (difficulty) {
      baseQuery['metadata.difficulty'] = difficulty;
    }
    
    // Create MongoDB session query options
    const queryOptions = session ? { session } : {};
    
    // Define recommendation strategies based on user state
    let recommendedContent = [];
    let adaptiveSuggestions = [];
    
    // 1. Current section content that hasn't been completed
    const currentSectionContent = await Content.find({
      ...baseQuery,
      moduleId: currentModule,
      sectionId: currentSection,
    }, null, queryOptions).sort({ order: 1 });
    
    // Filter to find incomplete content
    const completedContentIds = progress.contentProgress
      .filter(cp => cp.completed)
      .map(cp => cp.contentId.toString());
    
    const incompleteCurrentContent = currentSectionContent
      .filter(content => !completedContentIds.includes(content._id.toString()));
    
    // Add current section incomplete content as highest priority
    if (incompleteCurrentContent.length > 0) {
      recommendedContent.push(...incompleteCurrentContent.map(c => c._id));
      
      // Add first 2 as high-priority suggestions
      adaptiveSuggestions.push(
        ...incompleteCurrentContent.slice(0, 2).map(content => ({
          contentId: content._id,
          reason: 'Continue your current section',
          priority: 5, // Highest priority
        }))
      );
    }
    
    // 2. Uncompleted quizzes for current section
    const currentSectionQuiz = await Quiz.findOne({
      moduleId: currentModule,
      sectionId: currentSection,
      isPublished: true,
    }, null, queryOptions);
    
    if (currentSectionQuiz) {
      const quizCompleted = progress.quizProgress.some(
        qp => qp.quizId.toString() === currentSectionQuiz._id.toString() && qp.completed
      );
      
      if (!quizCompleted) {
        // Add a quiz suggestion if quiz not completed
        adaptiveSuggestions.push({
          contentId: currentSectionContent[0]?._id, // Link to first content in section
          reason: 'Take the quiz for this section',
          priority: 4,
        });
      }
    }
    
    // 3. Content from next logical section
    const nextSection = await determineNextSection(currentModule, currentSection);
    
    if (nextSection) {
      const nextSectionContent = await Content.find({
        ...baseQuery,
        moduleId: nextSection.moduleId,
        sectionId: nextSection.sectionId,
      }, null, queryOptions).sort({ order: 1 }).limit(2);
      
      if (nextSectionContent.length > 0) {
        recommendedContent.push(...nextSectionContent.map(c => c._id));
        
        // Add as medium-priority suggestion
        adaptiveSuggestions.push({
          contentId: nextSectionContent[0]._id,
          reason: `Continue to next section: ${nextSection.sectionId}`,
          priority: 3,
        });
      }
    }
    
    // 4. Content based on learning style (related content, different module)
    const learningStyleContent = await Content.find({
      ...baseQuery,
      'metadata.learningStyles': learningStyle,
      moduleId: { $ne: currentModule },
    }, null, queryOptions)
      .sort({ createdAt: -1 })
      .limit(3);
    
    if (learningStyleContent.length > 0) {
      recommendedContent.push(...learningStyleContent.map(c => c._id));
      
      // Add as medium-priority suggestion
      adaptiveSuggestions.push({
        contentId: learningStyleContent[0]._id,
        reason: `Matches your ${learningStyle} learning style`,
        priority: 2,
      });
    }
    
    // 5. Popular content (most viewed)
    const popularContent = await Content.find({
      ...baseQuery,
      _id: { $nin: recommendedContent }, // Exclude already recommended content
    }, null, queryOptions)
      .sort({ views: -1 })
      .limit(2);
    
    if (popularContent.length > 0) {
      recommendedContent.push(...popularContent.map(c => c._id));
      
      // Add as lower-priority suggestion
      adaptiveSuggestions.push({
        contentId: popularContent[0]._id,
        reason: 'Popular among other learners',
        priority: 1,
      });
    }
    
    // Deduplicate recommendations
    recommendedContent = [...new Set(recommendedContent.map(id => id.toString()))].map(
      id => mongoose.Types.ObjectId(id)
    );
    
    // Limit to 10 recommendations
    return {
      recommendedContent: recommendedContent.slice(0, 10),
      adaptiveSuggestions,
    };
  } catch (error) {
    logger.error(`Error generating recommendations: ${error.message}`);
    // Return empty recommendations in case of error
    return {
      recommendedContent: [],
      adaptiveSuggestions: [],
    };
  }
};

/**
 * Determine the next logical section for a user
 * @param {string} currentModule - Current module
 * @param {string} currentSection - Current section
 * @returns {Promise<Object>} - Next section info
 */
async function determineNextSection(currentModule, currentSection) {
  try {
    // Define module structure
    const moduleStructure = {
      module1: ['origins', 'monastic-republic', 'through-ages', 'religious-life'],
      module2: ['overview', 'architecture', 'treasures', 'preservation'],
      module3: ['geography', 'flora-fauna', 'paths', 'conservation'],
    };
    
    const modules = Object.keys(moduleStructure);
    
    // Find current module index
    const currentModuleIndex = modules.indexOf(currentModule);
    
    if (currentModuleIndex === -1) {
      return null; // Invalid module
    }
    
    // Find current section index
    const sections = moduleStructure[currentModule];
    const currentSectionIndex = sections.indexOf(currentSection);
    
    if (currentSectionIndex === -1) {
      return null; // Invalid section
    }
    
    // Check if there's a next section in the same module
    if (currentSectionIndex < sections.length - 1) {
      return {
        moduleId: currentModule,
        sectionId: sections[currentSectionIndex + 1],
      };
    }
    
    // If this is the last section, move to the next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      return {
        moduleId: nextModule,
        sectionId: moduleStructure[nextModule][0], // First section of next module
      };
    }
    
    // If this is the last section of the last module, no next section
    return null;
  } catch (error) {
    logger.error(`Error determining next section: ${error.message}`);
    return null;
  }
}

/**
 * Evaluate user's learning progress and adapt content difficulty
 * @param {string} userId - User ID
 * @param {string} moduleId - Current module
 * @param {string} sectionId - Current section
 * @returns {Promise<Object>} - Adaptive recommendations
 */
exports.evaluateLearningProgress = async (userId, moduleId, sectionId) => {
  try {
    // Get user progress
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return {
        difficulty: 'beginner',
        recommendations: [],
      };
    }
    
    // Get quiz progress for this section
    const sectionQuizzes = await Quiz.find({ moduleId, sectionId, isPublished: true });
    
    let averageQuizScore = 0;
    let quizAttempts = 0;
    
    if (sectionQuizzes.length > 0) {
      // Calculate average quiz score
      let totalScore = 0;
      
      sectionQuizzes.forEach(quiz => {
        const quizProgress = progress.quizProgress.find(
          qp => qp.quizId.toString() === quiz._id.toString()
        );
        
        if (quizProgress) {
          totalScore += quizProgress.score;
          quizAttempts += quizProgress.attempts;
        }
      });
      
      averageQuizScore = quizAttempts > 0 ? Math.round(totalScore / sectionQuizzes.length) : 0;
    }
    
    // Determine recommended difficulty based on quiz performance
    let recommendedDifficulty = 'beginner';
    
    if (averageQuizScore >= config.ADAPTIVE_LEARNING.thresholds.quizScoreThreshold) {
      // High performance - increase difficulty
      recommendedDifficulty = 'advanced';
    } else if (averageQuizScore >= 50) {
      // Medium performance - keep intermediate
      recommendedDifficulty = 'intermediate';
    } else if (quizAttempts > 0) {
      // Low performance - keep beginner
      recommendedDifficulty = 'beginner';
    }
    
    // Get content viewed in this section
    const viewedContentIds = progress.contentProgress
      .filter(cp => cp.moduleId === moduleId && cp.sectionId === sectionId)
      .map(cp => cp.contentId);
    
    // Find remedial content if performance is low
    let recommendations = [];
    
    if (averageQuizScore < config.ADAPTIVE_LEARNING.thresholds.lowPerformanceThreshold && quizAttempts > 0) {
      // Find remedial content (beginner level, not viewed yet)
      const remedialContent = await Content.find({
        moduleId,
        sectionId,
        isPublished: true,
        _id: { $nin: viewedContentIds },
        'metadata.difficulty': 'beginner',
      }).limit(3);
      
      recommendations = remedialContent.map(content => ({
        contentId: content._id,
        reason: 'Additional practice to strengthen understanding',
        priority: 5,
      }));
    } else if (averageQuizScore >= config.ADAPTIVE_LEARNING.thresholds.quizScoreThreshold) {
      // Find advanced content for high performers
      const advancedContent = await Content.find({
        moduleId,
        'metadata.difficulty': 'advanced',
        isPublished: true,
      }).limit(3);
      
      recommendations = advancedContent.map(content => ({
        contentId: content._id,
        reason: 'Advanced content to challenge your understanding',
        priority: 4,
      }));
    }
    
    return {
      difficulty: recommendedDifficulty,
      recommendations,
    };
  } catch (error) {
    logger.error(`Error evaluating learning progress: ${error.message}`);
    return {
      difficulty: 'beginner',
      recommendations: [],
    };
  }
};

/**
 * Calculate learning style weights based on user interaction
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Learning style weights
 */
exports.calculateLearningStyleWeights = async (userId) => {
  try {
    const progress = await Progress.findOne({ userId });
    
    if (!progress || !progress.contentProgress || progress.contentProgress.length === 0) {
      return {
        visual: 0.25,
        textual: 0.25,
        interactive: 0.25,
        balanced: 0.25,
      };
    }
    
    // Get all content IDs from user's progress
    const contentIds = progress.contentProgress.map(cp => cp.contentId);
    
    // Get content details
    const contentItems = await Content.find({
      _id: { $in: contentIds },
    }).select('_id metadata.learningStyles timeSpent');
    
    // Count completed content by learning style
    const styleCounts = {
      visual: 0,
      textual: 0,
      interactive: 0,
      balanced: 0,
    };
    
    const styleTimeSpent = {
      visual: 0,
      textual: 0,
      interactive: 0,
      balanced: 0,
    };
    
    // Map content to progress entries
    contentItems.forEach(content => {
      const progressEntry = progress.contentProgress.find(
        cp => cp.contentId.toString() === content._id.toString()
      );
      
      if (!progressEntry) return;
      
      // Get learning styles for this content
      const styles = content.metadata?.learningStyles || ['balanced'];
      
      styles.forEach(style => {
        if (progressEntry.completed) {
          styleCounts[style] = (styleCounts[style] || 0) + 1;
        }
        
        styleTimeSpent[style] = (styleTimeSpent[style] || 0) + (progressEntry.timeSpent || 0);
      });
    });
    
    // Calculate total counts and time
    const totalCompleted = Object.values(styleCounts).reduce((sum, count) => sum + count, 0);
    const totalTimeSpent = Object.values(styleTimeSpent).reduce((sum, time) => sum + time, 0);
    
    // Calculate weights based on completed content and time spent
    const weights = {
      visual: 0.25,
      textual: 0.25,
      interactive: 0.25,
      balanced: 0.25,
    };
    
    if (totalCompleted > 0) {
      Object.keys(styleCounts).forEach(style => {
        const completionWeight = styleCounts[style] / totalCompleted;
        const timeWeight = totalTimeSpent > 0 ? styleTimeSpent[style] / totalTimeSpent : 0;
        
        // Combine completion and time weights (70% completion, 30% time)
        weights[style] = 0.7 * completionWeight + 0.3 * timeWeight;
      });
    }
    
    return weights;
  } catch (error) {
    logger.error(`Error calculating learning style weights: ${error.message}`);
    return {
      visual: 0.25,
      textual: 0.25,
      interactive: 0.25,
      balanced: 0.25,
    };
  }
};

/**
 * Get learning path milestones
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Milestone list
 */
exports.getLearningPathMilestones = async (userId) => {
  try {
    const progress = await Progress.findOne({ userId });
    
    if (!progress) {
      return [];
    }
    
    // Define module structure
    const moduleStructure = {
      module1: ['origins', 'monastic-republic', 'through-ages', 'religious-life'],
      module2: ['overview', 'architecture', 'treasures', 'preservation'],
      module3: ['geography', 'flora-fauna', 'paths', 'conservation'],
    };
    
    const milestones = [];
    
    // Process each module
    for (const [moduleId, sections] of Object.entries(moduleStructure)) {
      const moduleProgress = progress.modules.find(m => m.id === moduleId);
      const moduleCompletion = moduleProgress ? moduleProgress.completion || 0 : 0;
      
      // If module is not started or complete, add module milestone
      if (moduleCompletion === 0) {
        // Add start module milestone
        const firstSectionContent = await Content.findOne({
          moduleId,
          sectionId: sections[0],
          isPublished: true,
        }).sort({ order: 1 });
        
        if (firstSectionContent) {
          milestones.push({
            moduleId,
            sectionId: sections[0],
            type: 'content',
            itemId: firstSectionContent._id,
            title: `Start ${moduleId}: ${firstSectionContent.title}`,
            priority: 5,
          });
        }
      } else if (moduleCompletion < 100) {
        // Module in progress - add section milestones
        for (const sectionId of sections) {
          const sectionProgress = moduleProgress?.sections.find(s => s.id === sectionId);
          const sectionCompletion = sectionProgress ? sectionProgress.completion || 0 : 0;
          
          if (sectionCompletion < 100) {
            // Add content milestone
            const nextContent = await Content.findOne({
              moduleId,
              sectionId,
              isPublished: true,
              _id: {
                $nin: progress.contentProgress
                  .filter(cp => cp.completed)
                  .map(cp => cp.contentId),
              },
            }).sort({ order: 1 });
            
            if (nextContent) {
              milestones.push({
                moduleId,
                sectionId,
                type: 'content',
                itemId: nextContent._id,
                title: `Continue ${sectionId}: ${nextContent.title}`,
                priority: 4,
              });
            }
            
            // Add quiz milestone
            const quiz = await Quiz.findOne({
              moduleId,
              sectionId,
              isPublished: true,
            });
            
            if (quiz) {
              const quizCompleted = progress.quizProgress.some(
                qp => qp.quizId.toString() === quiz._id.toString() && qp.completed
              );
              
              if (!quizCompleted) {
                milestones.push({
                  moduleId,
                  sectionId,
                  type: 'quiz',
                  itemId: quiz._id,
                  title: `Complete quiz: ${quiz.title}`,
                  priority: 3,
                });
              }
            }
            
            // Only add milestones for the first incomplete section
            break;
          }
        }
      }
    }
    
    return milestones;
  } catch (error) {
    logger.error(`Error getting learning path milestones: ${error.message}`);
    return [];
  }
};