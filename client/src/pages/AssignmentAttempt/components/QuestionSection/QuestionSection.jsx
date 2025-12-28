import React from 'react';
import PropTypes from 'prop-types';
import { FaTable, FaListUl, FaInfoCircle, FaCheckCircle, FaClock, FaChartBar } from 'react-icons/fa';
import './QuestionSection.scss';

const QuestionSection = ({ 
  title = 'SQL Assignment',
  description = 'No description provided',
  requirements = [],
  schema = {},
  difficulty = 'Medium',
  isCompleted = false,
  attemptCount = 0,
  lastAttempt = null
}) => {
    const renderSchemaInfo = () => {
    if (!schema || Object.keys(schema).length === 0) {
      return <p className="no-data">No schema information available</p>;
    }

    return (
      <div className="schema-info">
        {Object.entries(schema).map(([tableName, columns]) => (
          <div key={tableName} className="table-schema">
            <h4>
              <FaTable className="icon" />
              {tableName}
            </h4>
            <div className="columns">
              {Array.isArray(columns) && columns.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col, idx) => (
                      <tr key={`${tableName}-${col.name}-${idx}`}>
                        <td className="column-name">{col.name}</td>
                        <td className="column-type">{col.type}</td>
                        <td className="column-desc">{col.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-columns">No columns defined</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="question-section">
      {}
      <div className="dashboard-header">
        <div className="header-content">
          <h2>{title}</h2>
          <div className="header-badges">
            <span className={`difficulty-badge ${difficulty.toLowerCase()}`}>
              {difficulty}
            </span>
            {isCompleted && (
              <span className="completion-badge completed">
                <FaCheckCircle /> Completed
              </span>
            )}
          </div>
        </div>
        
        {}
        <div className="stats-grid">
          <div className={`stat-card ${isCompleted ? 'completed' : ''}`}>
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-label">Status</div>
              <div className="stat-value">
                {isCompleted ? 'Completed' : attemptCount > 0 ? 'In Progress' : 'Not Started'}
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon attempts">
              <FaChartBar />
            </div>
            <div className="stat-content">
              <div className="stat-label">Attempts</div>
              <div className="stat-value">{attemptCount}</div>
            </div>
          </div>
          
          {lastAttempt && (
            <div className="stat-card">
              <div className="stat-icon time">
                <FaClock />
              </div>
              <div className="stat-content">
                <div className="stat-label">Last Attempt</div>
                <div className="stat-value">{formatDate(lastAttempt)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {}
      <div className="question-content card">
        <h3><FaInfoCircle className="icon" /> Problem Statement</h3>
        <div className="content">
          {description.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
      
      {}
      {Array.isArray(requirements) && requirements.length > 0 && (
        <div className="requirements card">
          <h3><FaListUl className="icon" /> Requirements</h3>
          <ul>
            {requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {}
      <div className="schema-preview card">
        <h3><FaTable className="icon" /> Database Schema</h3>
        {renderSchemaInfo()}
      </div>
    </section>
  );
};

QuestionSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  requirements: PropTypes.arrayOf(PropTypes.string),
  schema: PropTypes.object,
  difficulty: PropTypes.oneOf(['Easy', 'Medium', 'Hard']),
  isCompleted: PropTypes.bool,
  attemptCount: PropTypes.number,
  lastAttempt: PropTypes.string
};

export default QuestionSection;
