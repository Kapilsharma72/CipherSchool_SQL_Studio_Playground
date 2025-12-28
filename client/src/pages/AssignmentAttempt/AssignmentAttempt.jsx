import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/AssignmentAttempt.scss';
import QuestionSection from './components/QuestionSection/QuestionSection';
import SampleData from './components/SampleData/SampleData';
import SqlEditor from './components/SqlEditor/SqlEditor';
import ResultsSection from './components/ResultsSection/ResultsSection';
import SqlLearningAssistant from '../../components/SqlLearningAssistant/SqlLearningAssistant';
import { assignmentService, queryService } from '../../services/apiService';
import { useAppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AssignmentAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  
  const [assignmentData, setAssignmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [completionStatus, setCompletionStatus] = useState({
    isCompleted: false,
    attemptCount: 0,
    lastAttempt: null
  });

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    const fetchCompletionStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !id) return;
      
      const progressResponse = await assignmentService.getProgress(id, token);
      if (progressResponse && progressResponse.data && progressResponse.data.progress) {
        const progress = progressResponse.data.progress;
        setCompletionStatus({
          isCompleted: progress.isCompleted || false,
          attemptCount: progress.attemptCount || 0,
          lastAttempt: progress.lastAttempt || null
        });
        
                if (progress.sqlQuery) {
          setQuery(progress.sqlQuery);
        }
      }
    } catch (err) {
      console.error('Error fetching completion status:', err);
    }
  }, [id]);

    useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        const token = localStorage.getItem('token');
        const response = await assignmentService.getOne(id, token);
        
        if (response && response.data && response.data.assignment) {
          const assignment = response.data.assignment;
          
                    if (assignment.userProgress) {
            setCompletionStatus({
              isCompleted: assignment.userProgress.isCompleted || false,
              attemptCount: assignment.userProgress.attemptCount || 0,
              lastAttempt: assignment.userProgress.lastAttempt || null
            });
            
                        if (assignment.userProgress.sqlQuery) {
              setQuery(assignment.userProgress.sqlQuery);
            }
          } else {
                        await fetchCompletionStatus();
          }
          
          setAssignmentData(assignment);
        } else {
          setLoadError('Assignment not found');
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setLoadError(err.message || 'Failed to load assignment');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id, fetchCompletionStatus]);

  const handleExecute = async (sql) => {
    if (!sql || !sql.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await queryService.execute({
        query: sql,
        assignmentId: id
      }, token);

      if (response && response.data) {
        setResults(response.data);

                try {
          const progressResponse = await assignmentService.saveProgress(id, {
            sqlQuery: sql,
            isCompleted: false            }, token);

                    if (progressResponse?.data?.progress) {
            const { progress } = progressResponse.data;
            setCompletionStatus(prev => ({
              ...prev,
              isCompleted: false,                attemptCount: progress.attemptCount || prev.attemptCount,
              lastAttempt: progress.lastAttempt || new Date()
            }));
          } else {
                        await fetchCompletionStatus();
          }
        } catch (saveErr) {
          console.error('Failed to save progress after execution:', saveErr);
                  }
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
      setResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

      const onSaveQuery = async (sqlQuery) => {
    try {
      const token = localStorage.getItem('token');
      const progressResponse = await assignmentService.saveProgress(id, {
        sqlQuery,
        isCompleted: false       }, token);
      
                  if (progressResponse && progressResponse.data && progressResponse.data.progress) {
        const progress = progressResponse.data.progress;
        setCompletionStatus({
          isCompleted: progress.isCompleted || false,
          attemptCount: progress.attemptCount || 0,
          lastAttempt: progress.lastAttempt || new Date()
        });
      } else {
                await fetchCompletionStatus();
      }
    } catch (err) {
      console.error('Failed to save query:', err);
      throw err;
    }
  };

    const onSaveProgress = async (sqlQuery) => {
    try {
      const token = localStorage.getItem('token');
      const progressResponse = await assignmentService.saveProgress(id, {
        sqlQuery,
        isCompleted: true
      }, token);

            if (progressResponse?.data?.progress) {
        const { progress } = progressResponse.data;
        const newStatus = {
          isCompleted: true,
          attemptCount: progress.attemptCount || completionStatus.attemptCount,
          lastAttempt: progress.lastAttempt || new Date()
        };
        
                setCompletionStatus(newStatus);
        
                setAssignmentData(prev => ({
          ...prev,
          userProgress: {
            ...(prev.userProgress || {}),
            isCompleted: true,
            lastAttempt: newStatus.lastAttempt,
            attemptCount: newStatus.attemptCount
          }
        }));
        
                        if (window.parent && typeof window.parent.updateAssignmentsList === 'function') {
          window.parent.updateAssignmentsList();
        }
      } else {
                await fetchCompletionStatus();
      }
    } catch (err) {
      console.error('Failed to save solution:', err);
      throw err;
    }
  };

    const toggleAssistant = useCallback(() => {
    setIsAssistantOpen(prev => !prev);
  }, []);

    const formatAssignmentData = (assignment) => {
    if (!assignment) return null;

        const sampleData = {};
    const schema = {};
    
    if (assignment.sampleTables && Array.isArray(assignment.sampleTables)) {
      assignment.sampleTables.forEach(table => {
        sampleData[table.tableName] = table.rows || [];
                schema[table.tableName] = (table.columns || []).map(col => ({
          name: col.columnName || col.name,
          type: col.dataType || col.type,
          description: col.description || `${col.columnName || col.name} column`
        }));
      });
    }

    return {
      id: assignment._id,
      title: assignment.title,
      description: assignment.question || assignment.description,
      requirements: assignment.description ? [assignment.description] : [],
      difficulty: assignment.difficulty || 'Medium',
      sampleData,
      schema
    };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (loadError || !assignmentData) {
    return (
      <div className="assignment-attempt">
        <div className="error-message">
          <p>{loadError || 'Assignment not found'}</p>
          <button onClick={() => navigate('/')}>Back to Assignments</button>
        </div>
      </div>
    );
  }

  const formattedData = formatAssignmentData(assignmentData);

  return (
    <div className="assignment-attempt">
      <header className="assignment-header">
        <h1>{formattedData.title}</h1>
        <button 
          className="assistant-button"
          onClick={toggleAssistant}
          aria-label="Get SQL help"
        >
          <span className="button-icon">💡</span>
          <span className="button-text">Get Help</span>
        </button>
      </header>
      
      <div className="assignment-layout">
        <div className="assignment-row">
          <QuestionSection 
            title={formattedData.title}
            description={formattedData.description}
            requirements={formattedData.requirements}
            schema={formattedData.schema}
            difficulty={formattedData.difficulty}
            isCompleted={completionStatus.isCompleted}
            attemptCount={completionStatus.attemptCount}
            lastAttempt={completionStatus.lastAttempt}
          />
          <SampleData 
            tables={formattedData.sampleData} 
            schema={formattedData.schema}
          />
        </div>
        
        <div className="assignment-row">
          <SqlEditor 
            value={query}
            onChange={setQuery}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            onSaveQuery={onSaveQuery}
            onHelpRequested={() => setIsAssistantOpen(true)}
          />
          <ResultsSection
            results={results}
            error={error}
            isExecuting={isExecuting}
            expectedOutput={assignmentData.expectedOutput}
            assignmentId={id}
            currentQuery={query}
            onSaveProgress={onSaveProgress}
          />
        </div>
      </div>

      {}
      {formattedData && (
        <SqlLearningAssistant 
          isVisible={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          assignmentContext={{
            title: formattedData.title,
            description: formattedData.description,
            requirements: formattedData.requirements,
            schema: formattedData.schema
          }}
          currentQuery={query}
        />
      )}
    </div>
  );
};

export default AssignmentAttempt;
