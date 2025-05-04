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
    return <div className="text-center my-4">Loading progress...</div>;
  }

  return (
    <div className="progress-tracker card mt-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Your Learning Progress</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-4 text-center mb-3">
            <h6>Contents Completed</h6>
            <div className="display-4">{progress.completedContents}</div>
          </div>
          <div className="col-md-4 text-center mb-3">
            <h6>Quizzes Taken</h6>
            <div className="display-4">{progress.quizzesTaken}</div>
          </div>
          <div className="col-md-4 text-center mb-3">
            <h6>Overall Progress</h6>
            <div className="display-4">
              {Math.round(
                progress.moduleProgress.reduce((acc, curr) => acc + curr.progress, 0) / 
                progress.moduleProgress.length
              )}%
            </div>
          </div>
        </div>

        <h6 className="mt-4">Module Progress</h6>
        {progress.moduleProgress.map((module) => (
          <div key={module.moduleId} className="mb-3">
            <div className="d-flex justify-content-between">
              <span>Module {module.moduleId}</span>
              <span>{module.progress}%</span>
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
        ))}
      </div>
    </div>
  );
};

export default Progress;