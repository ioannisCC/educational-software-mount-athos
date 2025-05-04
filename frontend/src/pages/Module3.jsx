// frontend/src/pages/Module1.jsx
import React, { useState, useEffect } from 'react';
import { getContentByModule, getQuizzesByModule, updateContentProgress } from '../services/api';
import Progress from '../components/Progress';
import Quiz from '../components/Quiz';

const Module1 = ({ user }) => {
  const [content, setContent] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module ID for this page
  const moduleId = 1;

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        // Fetch content for this module
        const contentData = await getContentByModule(moduleId);
        setContent(contentData);

        // Fetch quizzes for this module
        const quizzesData = await getQuizzesByModule(moduleId);
        setQuizzes(quizzesData);

        setLoading(false);
      } catch (err) {
        setError('Failed to load module data');
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [moduleId]);

  const handleContentSelect = (contentItem) => {
    setActiveContent(contentItem);
    setActiveQuiz(null);
    
    // Mark content as viewed/in progress
    updateContentProgress(contentItem._id, true).catch(err => {
      console.error('Failed to update content progress:', err);
    });
  };

  const handleQuizSelect = (quiz) => {
    setActiveQuiz(quiz);
    setActiveContent(null);
  };

  const handleQuizComplete = (results) => {
    console.log('Quiz completed with results:', results);
    // You could refresh content or show congratulations message
  };

  if (loading) return <div className="text-center my-4">Loading module data...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Determine which content to show based on user preferences
  const filteredContent = user?.preferences?.learningStyle === 'visual'
    ? content.filter(item => item.type !== 'text').concat(content.filter(item => item.type === 'text'))
    : content.filter(item => item.type === 'text').concat(content.filter(item => item.type !== 'text'));

  return (
    <div className="module-container">
      <div className="row">
        <div className="col-md-3">
          {/* Sidebar with content and quiz list */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Module 1: History & Religious Significance</h5>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item bg-light fw-bold">Content</li>
                {filteredContent.map(item => (
                  <li 
                    key={item._id} 
                    className={`list-group-item list-group-item-action ${activeContent?._id === item._id ? 'active' : ''}`}
                    onClick={() => handleContentSelect(item)}
                    style={{cursor: 'pointer'}}
                  >
                    {item.title}
                    {item.difficulty === 'advanced' && 
                      <span className="badge bg-warning ms-2">Advanced</span>
                    }
                  </li>
                ))}
                
                <li className="list-group-item bg-light fw-bold">Quizzes</li>
                {quizzes.map(quiz => (
                  <li 
                    key={quiz._id} 
                    className={`list-group-item list-group-item-action ${activeQuiz?._id === quiz._id ? 'active' : ''}`}
                    onClick={() => handleQuizSelect(quiz)}
                    style={{cursor: 'pointer'}}
                  >
                    {quiz.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* User progress */}
          <Progress />
        </div>
        
        <div className="col-md-9">
          {/* Content display area */}
          {activeContent && (
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
              <p>Select a content item or quiz from the sidebar to begin learning about Mount Athos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Module1;