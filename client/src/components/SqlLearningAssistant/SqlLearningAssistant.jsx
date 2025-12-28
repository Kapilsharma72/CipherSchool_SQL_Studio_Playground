import React, { useState } from 'react';
import { learningAssistantService } from '../../services/apiService';
import './SqlLearningAssistant.scss';

const SqlLearningAssistant = ({ 
  isVisible, 
  onClose, 
  assignmentContext = {},
  currentQuery = ''
}) => {
  const [userQuestion, setUserQuestion] = useState('');
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your SQL Learning Assistant. Ask me for hints about your SQL queries, and I\'ll help guide you without giving away the solution.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const userMessage = { 
      role: 'user', 
      content: userQuestion,
      timestamp: new Date().toISOString()
    };
    
        setConversation(prev => [...prev, userMessage]);
    setUserQuestion('');
    setIsLoading(true);

    try {
            const context = {
        assignment: {
          title: assignmentContext.title || 'Current Assignment',
          description: assignmentContext.description || '',
          requirements: assignmentContext.requirements || [],
          schema: assignmentContext.schema || {}
        },
        currentQuery: currentQuery || 'No query written yet',
        conversation: conversation
          .filter(msg => msg.role !== 'system')
          .map(({ role, content }) => ({ role, content }))
      };

            const token = localStorage.getItem('token');
      const response = await learningAssistantService.getHint({
        userQuestion,
        context
      }, token);

            const hint = response.hint || response.data?.hint || 'I\'m not sure how to help with that. Could you rephrase your question?';
      
            setConversation(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: hint,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error getting hint:', error);
      
            let errorMessage = 'Failed to get hint. Please try again.';
      
      if (error.message) {
        if (error.message.includes('quota') || error.message.includes('unavailable')) {
          errorMessage = '⚠️ The AI assistant is currently unavailable due to API quota limits. You can still practice SQL queries without hints.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '⏱️ The request timed out. Please try again with a shorter question.';
        } else if (error.message.includes('API key') || error.message.includes('configuration')) {
          errorMessage = '⚙️ AI assistant configuration error. Please contact support.';
        } else {
          errorMessage = `⚠️ ${error.message}`;
        }
      }
      
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage,
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="sql-learning-assistant">
      <div className="assistant-header">
        <h3>SQL Learning Assistant</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="conversation">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="assistant-form">
        <input
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="Ask for a hint about your SQL query..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !userQuestion.trim()}>
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default SqlLearningAssistant;
