// frontend/src/components/Quiz.jsx
import React, { useState, useEffect } from 'react';
import { getQuizById, submitQuiz } from '../services/api';
import { behaviorTracker, trackUserBehavior } from '../services/adaptiveLearning';

const Quiz = ({ quizId, onCompleted }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizData = await getQuizById(quizId);
        setQuiz(quizData);
        if (quizData && quizData.questions) {
          setAnswers(Array(quizData.questions.length).fill(null));
        }
        setStartTime(Date.now());
        setLoading(false);

        trackUserBehavior({
          quizId: quizId,
          timeSpent: 0,
          interactions: 1,
          actionType: 'view',
          metadata: {
            quizTitle: quizData.title,
            questionCount: quizData.questions ? quizData.questions.length : 0
          }
        });

      } catch (err) {
        setError('Failed to load quiz');
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  // Track time spent
  useEffect(() => {
    if (startTime && !submitted) {
      const interval = setInterval(() => {
        setTimeSpent(Math.round((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, submitted]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);

    trackUserBehavior({
      quizId: quizId,
      timeSpent: Math.round((Date.now() - startTime) / 1000),
      interactions: 1,
      actionType: 'navigation',
      metadata: {
        action: 'answer_selected',
        questionIndex: questionIndex,
        optionIndex: optionIndex
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quiz || !answers.length || answers.includes(null)) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      setLoading(true);
      
      const formattedAnswers = quiz.questions.map((question, index) => ({
        questionId: question._id,
        selectedOption: answers[index]
      }));

      const quizResults = await submitQuiz(quizId, formattedAnswers);
      setResults(quizResults);
      setSubmitted(true);

      const finalTimeSpent = Math.round((Date.now() - startTime) / 1000);
      trackUserBehavior({
        quizId: quizId,
        timeSpent: finalTimeSpent,
        interactions: answers.length + 1,
        actionType: 'complete',
        completed: true,
        metadata: {
          score: quizResults.score,
          correctAnswers: quizResults.correctAnswers,
          totalQuestions: quizResults.totalQuestions,
          completionTime: finalTimeSpent
        }
      });
      
      if (onCompleted && quizResults) {
        onCompleted(quizResults);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to submit quiz');
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  if (loading) return (
    <div className="card">
      <div className="card-body text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading quiz...</span>
        </div>
        <p className="mt-2 mb-0 text-muted">Loading quiz questions...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="alert alert-danger">
      <span className="icon me-2">!</span>
      {error}
    </div>
  );
  
  if (!quiz) return (
    <div className="alert alert-warning">
      <span className="icon me-2">?</span>
      Quiz not found
    </div>
  );

  return (
    <div className="quiz-container card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <span className="icon me-2">?</span>
            {quiz.title}
          </h5>
          {!submitted && startTime && (
            <div className="text-end">
              <small className="text-muted">
                <span className="icon me-1">⏱</span>
                Time: {formatTime(timeSpent)}
              </small>
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {quiz.questions && quiz.questions.map((question, qIndex) => (
              <div key={question._id || qIndex} className="question-container mb-4">
                <h5 className="question-text mb-3">
                  {qIndex + 1}. {question.text}
                  {question.difficulty && (
                    <span className={`badge ms-2 ${question.difficulty === 'hard' ? 'bg-danger' : 'bg-success'}`}>
                      {question.difficulty}
                    </span>
                  )}
                </h5>
                <div className="options-container">
                  {question.options && question.options.map((option, oIndex) => (
                    <div key={option._id || oIndex} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`question-${qIndex}`}
                        id={`q${qIndex}-o${oIndex}`}
                        checked={answers[qIndex] === oIndex}
                        onChange={() => handleOptionSelect(qIndex, oIndex)}
                      />
                      <label className="form-check-label" htmlFor={`q${qIndex}-o${oIndex}`}>
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Clean Progress indicator */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <small>
                  <span className="icon me-1">◈</span>
                  Progress: {answers.filter(a => a !== null).length} / {quiz.questions.length} answered
                </small>
                <small>{Math.round((answers.filter(a => a !== null).length / quiz.questions.length) * 100)}%</small>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar"
                  style={{ width: `${(answers.filter(a => a !== null).length / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || answers.includes(null)}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="icon me-2">✓</span>
                  Submit Quiz
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="results-container">
            <h4 className="mb-3">
              <span className="icon me-2">◈</span>
              Quiz Results
            </h4>
            {results ? (
              <>
                <div className="score-display text-center mb-4">
                  <div className={`display-4 text-${getScoreColor(results.score)}`}>
                    {typeof results.score === 'number' ? Math.round(results.score) : '?'}%
                  </div>
                  <p>
                    You got {results.correctAnswers || 0} out of {results.totalQuestions || quiz.questions.length} questions correct
                  </p>
                  <p className="text-muted">
                    <span className="icon me-2">⏱</span>
                    Completed in {formatTime(timeSpent)}
                  </p>
                  
                  {/* Clean Performance feedback */}
                  {results.score >= 85 && (
                    <div className="alert alert-success">
                      <strong>
                        <span className="icon me-2">✓</span>
                        Excellent!
                      </strong> You've mastered this material!
                    </div>
                  )}
                  {results.score >= 70 && results.score < 85 && (
                    <div className="alert alert-info">
                      <strong>
                        <span className="icon me-2">◈</span>
                        Good job!
                      </strong> You have a solid understanding.
                    </div>
                  )}
                  {results.score < 70 && (
                    <div className="alert alert-warning">
                      <strong>
                        <span className="icon me-2">◈</span>
                        Keep studying!
                      </strong> Consider reviewing the material and retaking this quiz.
                    </div>
                  )}
                </div>
                
                <div className="answer-review">
                  <h5>
                    <span className="icon me-2">◈</span>
                    Review Your Answers
                  </h5>
                  {quiz.questions && quiz.questions.map((question, qIndex) => {
                    const resultItem = results.results && results.results[qIndex];
                    const isCorrect = resultItem ? resultItem.isCorrect : false;
                    
                    const selectedIndex = answers[qIndex];
                    const selectedOption = question.options && selectedIndex !== null && 
                                          selectedIndex !== undefined && 
                                          selectedIndex < question.options.length ? 
                                          question.options[selectedIndex] : null;
                    
                    const correctOption = question.options ? 
                                         question.options.find(opt => opt.isCorrect) : 
                                         null;
                    
                    return (
                      <div 
                        key={question._id || qIndex} 
                        className={`question-result mb-3 p-3 border rounded ${isCorrect ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'}`}
                      >
                        <h6 className="d-flex justify-content-between align-items-center">
                          <span>{qIndex + 1}. {question.text}</span>
                          <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                            <span className="icon me-1">{isCorrect ? '✓' : '×'}</span>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </h6>
                        {selectedOption && (
                          <p className="mb-1">
                            <strong>Your answer:</strong> {selectedOption.text}
                          </p>
                        )}
                        {!isCorrect && correctOption && (
                          <p className="mb-0 text-success">
                            <strong>Correct answer:</strong> {correctOption.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="alert alert-warning">
                <span className="icon me-2">!</span>
                Could not load quiz results. Please try again.
              </div>
            )}
            
            <div className="mt-4 d-flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.reload()}
              >
                <span className="icon me-2">↻</span>
                Retake Quiz
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSubmitted(false);
                  setResults(null);
                  setAnswers(Array(quiz.questions.length).fill(null));
                  setStartTime(Date.now());
                  setTimeSpent(0);
                }}
              >
                <span className="icon me-2">→</span>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;