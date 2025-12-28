import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaSearch, FaChartBar, FaPlay, FaCheckCircle } from 'react-icons/fa';
import { assignmentService } from '../../services/apiService';
import './AssignmentList.scss';

const QuestionItem = ({ assignment, index, onSelect }) => {
  const getStatus = (progress) => {
    if (progress?.status) {
      return progress.status;
    }
    if (progress?.isCompleted) {
      return 'solved';
    }
    if (progress && progress.attemptCount > 0) {
      return 'started';
    }
    return 'not_started';
  };

  const status = getStatus(assignment.progress);
  const progressPercent = assignment.progress?.isCompleted ? 100 : (assignment.progress?.attemptCount || 0) * 10;

  return (
    <div 
      className="question-item"
      onClick={() => onSelect && onSelect(assignment._id)}
    >
      <div className="question-item__content">
        <div className="question-item__number">{index + 1}.</div>
        <div className="question-item__details">
          <h3 className="question-item__title">{assignment.title}</h3>
          <div className="question-item__meta">
            {progressPercent > 0 && (
              <span className="question-item__percentage">{progressPercent}%</span>
            )}
            <span className={`question-item__difficulty question-item__difficulty--${assignment.difficulty.toLowerCase()}`}>
              {assignment.difficulty === 'Medium' ? 'Med.' : assignment.difficulty}
            </span>
          </div>
        </div>
      </div>
      <div className="question-item__status">
        {status === 'solved' && <FaCheckCircle className="status-icon completed" />}
        {status === 'started' && <div className="status-dot status-dot--started" />}
        {status === 'not_started' && <div className="status-dot status-dot--not-started" />}
      </div>
    </div>
  );
};

QuestionItem.propTypes = {
  assignment: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelect: PropTypes.func
};

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  
  const stats = useMemo(() => {
    const total = assignments.length;
    const solved = assignments.filter(a => a.progress?.isCompleted).length;
    const attempted = assignments.filter(a => {
      const progress = a.progress;
      if (!progress) return false;
      return progress.status === 'started' || 
             progress.status === 'solved' || 
             progress.attemptCount > 0 ||
             (progress.sqlQuery && progress.sqlQuery.trim());
    }).length;
    const attempting = assignments.filter(a => {
      const progress = a.progress;
      if (!progress) return false;
      return (progress.status === 'started' || 
              (progress.attemptCount > 0 && !progress.isCompleted));
    }).length;
    
    const easy = assignments.filter(a => a.difficulty === 'Easy');
    const medium = assignments.filter(a => a.difficulty === 'Medium');
    const hard = assignments.filter(a => a.difficulty === 'Hard');
    
    const easySolved = easy.filter(a => a.progress?.isCompleted).length;
    const mediumSolved = medium.filter(a => a.progress?.isCompleted).length;
    const hardSolved = hard.filter(a => a.progress?.isCompleted).length;

    return {
      total,
      solved,
      attempted,
      attempting,
      easy: { total: easy.length, solved: easySolved },
      medium: { total: medium.length, solved: mediumSolved },
      hard: { total: hard.length, solved: hardSolved }
    };
  }, [assignments]);

  useEffect(() => {
    let filtered = assignments;

    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.difficulty.toLowerCase() === difficultyFilter
      );
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, difficultyFilter]);

  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await assignmentService.getAll(token);
      
      if (response && response.data && response.data.assignments) {
        setAssignments(response.data.assignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectAssignment = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  const handleStartPractice = () => {
    const firstIncomplete = assignments.find(a => !a.progress?.isCompleted);
    if (firstIncomplete) {
      navigate(`/assignment/${firstIncomplete._id}`);
    } else if (assignments.length > 0) {
      navigate(`/assignment/${assignments[0]._id}`);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (location.pathname === '/') {
      fetchAssignments();
    }
  }, [location.pathname, fetchAssignments]);

  const handleRetry = () => {
    fetchAssignments();
  };

  const progressPercentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (progressPercentage / 100) * circumference;

  if (isLoading) {
    return (
      <div className="assignment-list__loading" role="status" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignment-list__error" role="alert">
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={handleRetry}
          aria-label="Retry loading assignments"
        >
          Retry
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="assignment-list__empty" role="status">
        <p>No assignments found. Check back later for new assignments.</p>
      </div>
    );
  }

  return (
    <div className="assignment-list">
      <div className="assignment-list__container">
        {}
        <aside className="assignment-list__sidebar">
          <div className="sidebar__header">
            <div className="sidebar__icon">
              <FaChartBar />
            </div>
            <h1 className="sidebar__title">SQL Practice Questions</h1>
            <p className="sidebar__meta">
              {stats.total} questions
            </p>
          </div>

          <div className="sidebar__actions">
            <button 
              className="sidebar__practice-button"
              onClick={handleStartPractice}
            >
              <FaPlay className="button-icon" />
              Practice
            </button>
          </div>

          <div className="sidebar__progress">
            <div className="progress-section">
              <div className="progress-header">
                <h3>Progress</h3>
                <button 
                  className="refresh-button"
                  onClick={fetchAssignments}
                  aria-label="Refresh progress"
                >
                  ↻
                </button>
              </div>
              
              <div className="progress-content">
                <div className="progress-circle">
                  <svg className="progress-circle__svg" viewBox="0 0 100 100">
                    <circle
                      className="progress-circle__bg"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="8"
                    />
                    <circle
                      className="progress-circle__fill"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="progress-circle__text">
                    <div className="progress-circle__value">{stats.solved}/{stats.total}</div>
                    <div className="progress-circle__label">Solved</div>
                    {stats.attempting > 0 && (
                      <div className="progress-circle__attempting">{stats.attempting} Attempting</div>
                    )}
                  </div>
                </div>

                <div className="difficulty-stats">
                  <div className="difficulty-stat difficulty-stat--easy">
                    <div className="difficulty-stat__label">Easy</div>
                    <div className="difficulty-stat__value">{stats.easy.solved}/{stats.easy.total}</div>
                  </div>
                  <div className="difficulty-stat difficulty-stat--medium">
                    <div className="difficulty-stat__label">Med.</div>
                    <div className="difficulty-stat__value">{stats.medium.solved}/{stats.medium.total}</div>
                  </div>
                  <div className="difficulty-stat difficulty-stat--hard">
                    <div className="difficulty-stat__label">Hard</div>
                    <div className="difficulty-stat__value">{stats.hard.solved}/{stats.hard.total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {}
        <main className="assignment-list__main">
          <div className="questions-header">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search questions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-controls">
              <button 
                className={`filter-button ${difficultyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDifficultyFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${difficultyFilter === 'easy' ? 'active' : ''}`}
                onClick={() => setDifficultyFilter('easy')}
              >
                Easy
              </button>
              <button 
                className={`filter-button ${difficultyFilter === 'medium' ? 'active' : ''}`}
                onClick={() => setDifficultyFilter('medium')}
              >
                Medium
              </button>
              <button 
                className={`filter-button ${difficultyFilter === 'hard' ? 'active' : ''}`}
                onClick={() => setDifficultyFilter('hard')}
              >
                Hard
              </button>
            </div>
          </div>

          <div className="questions-list">
            {filteredAssignments.length === 0 ? (
              <div className="questions-empty">
                <p>No questions found matching your criteria.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment, index) => (
                <QuestionItem
            key={assignment._id} 
            assignment={assignment}
                  index={assignments.findIndex(a => a._id === assignment._id)}
            onSelect={handleSelectAssignment}
          />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AssignmentList;