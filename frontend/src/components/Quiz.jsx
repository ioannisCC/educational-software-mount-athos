// frontend/src/components/Quiz.jsx
import React, { useState, useEffect } from 'react';
import { getQuizById, submitQuiz } from '../services/api';

const Quiz = ({ quizId, onCompleted }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizData = await getQuizById(quizId);
        setQuiz(quizData);
        setAnswers(quizData.questions.map(() => null));
        setLoading(false);
      } catch (err) {
        setError('Failed to load quiz');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all questions are answered
    if (answers.includes(null)) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      // Format answers for submission
      const formattedAnswers = quiz.questions.map((question, index) => ({
        questionId: question._id,
        selectedOption: answers[index]
      }));

      const quizResults = await submitQuiz(quizId, formattedAnswers);
      setResults(quizResults);
      setSubmitted(true);
      
      if (onCompleted) {
        onCompleted(quizResults);
      }
    } catch (err) {
      setError('Failed to submit quiz');
    }
  };

  if (loading) return <div className="text-center my-4">Loading quiz...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!quiz) return <div className="alert alert-warning">Quiz not found</div>;

  return (
    <div className="quiz-container card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">{quiz.title}</h5>
      </div>
      <div className="card-body">
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {quiz.questions.map((question, qIndex) => (
              <div key={question._id} className="question-container mb-4">
                <h5 className="question-text mb-3">{qIndex + 1}. {question.text}</h5>
                <div className="options-container">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="form-check mb-2">
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
            <button type="submit" className="btn btn-primary">Submit Quiz</button>
          </form>
        ) : (
          <div className="results-container">
            <h4 className="mb-3">Quiz Results</h4>
            <div className="score-display text-center mb-4">
              <div className="display-4">{Math.round(results.score)}%</div>
              <p>You got {results.correctAnswers} out of {results.totalQuestions} questions correct</p>
            </div>
            <div className="answer-review">
              {quiz.questions.map((question, qIndex) => {
                const isCorrect = results.results[qIndex]?.isCorrect;
                return (
                  <div key={question._id} className={`question-result mb-3 p-3 ${isCorrect ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                    <h5>{qIndex + 1}. {question.text}</h5>
                    <p>
                      <strong>Your answer:</strong> {question.options[answers[qIndex]].text}
                      {isCorrect ? ' ✓' : ' ✗'}
                    </p>
                    {!isCorrect && (
                      <p><strong>Correct answer:</strong> {question.options.find(opt => opt.isCorrect).text}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retake Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;