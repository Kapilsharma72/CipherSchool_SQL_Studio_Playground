import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './SqlEditor.scss';

const SqlEditor = ({ value, onChange, onExecute, isExecuting, onSaveQuery }) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useEffect(() => {
        import('@monaco-editor/react').then(monaco => {
      monacoRef.current = monaco;
      setIsEditorReady(true);
    });
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecute();
    });
  };

    useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value || '');
      }
    }
  }, [value]);

  const handleExecute = () => {
    if (isExecuting) return;
    onExecute(editorRef.current?.getValue() || '');
  };

  const handleSaveQuery = async () => {
    if (!onSaveQuery) return;
    
    const currentQuery = editorRef.current?.getValue() || value || '';
    if (!currentQuery.trim()) {
      return;     }

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveQuery(currentQuery);
      setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save query:', err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditorReady) {
    return (
      <div className="sql-editor loading">
        <p>Loading SQL Editor...</p>
      </div>
    );
  }

  const Editor = monacoRef.current.default;

  return (
    <section className="sql-editor">
      <div className="editor-header">
        <h2>SQL Editor</h2>
        <div className="editor-actions">
          {onSaveQuery && (
            <div className="save-query-action">
              {saveSuccess && (
                <span className="save-success-message">✓ Query saved!</span>
              )}
              <button 
                onClick={handleSaveQuery}
                disabled={isSaving}
                className="save-query-button"
                title="Save your query for later"
              >
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Query'}
              </button>
            </div>
          )}
          <button 
            onClick={handleExecute}
            disabled={isExecuting}
            className="execute-button"
          >
            {isExecuting ? 'Executing...' : 'Execute (Ctrl+Enter)'}
          </button>
        </div>
      </div>
      
      <div className="editor-container">
        <Editor
          height="400px"
          defaultLanguage="sql"
          theme="vs-dark"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: false,
            padding: { top: 10 },
          }}
        />
      </div>
      
      <div className="editor-help">
        <small>Tip: Press Ctrl+Enter to execute your query</small>
      </div>
    </section>
  );
};

SqlEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onExecute: PropTypes.func.isRequired,
  isExecuting: PropTypes.bool,
  onSaveQuery: PropTypes.func
};

export default SqlEditor;
