// frontend/src/components/Progress.jsx
import React, { useEffect, useState } from 'react';
import { getProgressOverview } from '../services/api';

const Progress = () => {
  const [progress, setProgress] = useState({
    moduleProgress: [],
    completedContents: 0,
    quizzesTaken: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await getProgressOverview();
        setProgress(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading progress...</span>
          </div>
          <p className="mt-2 mb-0 text-muted">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const overallProgress = progress.moduleProgress.length > 0 
    ? Math.round(progress.moduleProgress.reduce((acc, curr) => acc + curr.progress, 0) / progress.moduleProgress.length)
    : 0;

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Your Learning Progress</h5>
      </div>
      <div className="card-body">
        {/* Overall Statistics */}
        <div className="row text-center mb-4">
          <div className="col-4">
            <div className="stat-card h-100 d-flex flex-column justify-content-center">
              <span className="stat-number">{progress.completedContents}</span>
              <span className="stat-label">Contents Completed</span>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card h-100 d-flex flex-column justify-content-center">
              <span className="stat-number">{progress.quizzesTaken}</span>
              <span className="stat-label">Quizzes Taken</span>
            </div>
          </div>
          <div className="col-4">
            <div className="stat-card h-100 d-flex flex-column justify-content-center">
              <span className="stat-number">{overallProgress}%</span>
              <span className="stat-label">Overall Progress</span>
            </div>
          </div>
        </div>

        {/* Module Progress */}
        <div className="mb-3">
          <h6 className="mb-3">Module Progress</h6>
          {progress.moduleProgress.length > 0 ? (
            progress.moduleProgress.map((module) => (
              <div key={module.moduleId} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <span className="icon me-2">
                      {module.moduleId === 1 ? 'I' : module.moduleId === 2 ? 'II' : 'III'}
                    </span>
                    <span className="fw-medium">
                      Module {module.moduleId}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">{module.progress}%</span>
                    {module.progress >= 90 && (
                      <span className="badge bg-success">Complete</span>
                    )}
                    {module.progress >= 50 && module.progress < 90 && (
                      <span className="badge bg-warning">In Progress</span>
                    )}
                    {module.progress < 50 && module.progress > 0 && (
                      <span className="badge bg-info">Started</span>
                    )}
                    {module.progress === 0 && (
                      <span className="badge bg-secondary">Not Started</span>
                    )}
                  </div>
                </div>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${module.progress}%` }}
                    aria-valuenow={module.progress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <span className="icon me-2">i</span>
                <div>
                  <strong>Welcome!</strong> Start exploring the modules to track your progress.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Encouragement Message */}
        {overallProgress > 0 && (
          <div className="mt-3 text-center">
            {overallProgress >= 90 && (
              <div className="alert alert-success">
                <span className="icon me-2">✓</span>
                <strong>Excellent!</strong> You've mastered the Mount Athos curriculum.
              </div>
            )}
            {overallProgress >= 50 && overallProgress < 90 && (
              <div className="alert alert-info">
                <span className="icon me-2">→</span>
                <strong>Great progress!</strong> You're well on your way to completion.
              </div>
            )}
            {overallProgress < 50 && overallProgress > 0 && (
              <div className="alert alert-warning">
                <span className="icon me-2">◆</span>
                <strong>Keep going!</strong> Every step brings you closer to understanding Mount Athos.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;