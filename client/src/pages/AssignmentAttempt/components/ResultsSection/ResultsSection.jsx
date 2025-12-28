import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ResultsSection.scss';

const normalizeTable = (tableData) => {
  if (!tableData || !tableData.columns || !tableData.rows) return null;
  
    const sortedColumns = [...tableData.columns].sort();
  
    const sortedRows = [...tableData.rows].sort((a, b) => {
    const firstCol = sortedColumns[0];
    const aVal = String(a[firstCol] || '').toLowerCase();
    const bVal = String(b[firstCol] || '').toLowerCase();
    return aVal.localeCompare(bVal);
  });
  
  return {
    columns: sortedColumns,
    rows: sortedRows
  };
};

const checkIfCorrect = (results, expectedOutput) => {
  if (!results || !expectedOutput) return false;

  if (expectedOutput.type === 'table') {
    const normalizedResults = normalizeTable(results);
    const normalizedExpected = normalizeTable({ columns: Object.keys(expectedOutput.value[0] || {}), rows: expectedOutput.value });

    return JSON.stringify(normalizedResults) === JSON.stringify(normalizedExpected);
  }

  if (expectedOutput.type === 'single_value') {
        if (!results.rows || results.rows.length === 0 || !results.columns || results.columns.length === 0) {
      return false;
    }
    const actualValue = results.rows[0][results.columns[0]];
    return actualValue == expectedOutput.value;   }

  if (expectedOutput.type === 'column') {
        if (!results.rows || !results.columns || results.columns.length === 0) {
      return false;
    }
    const actualColumn = results.rows.map(row => row[results.columns[0]]);
    const expectedColumn = Array.isArray(expectedOutput.value) ? expectedOutput.value : [expectedOutput.value];
    return JSON.stringify(actualColumn.sort()) === JSON.stringify(expectedColumn.sort());
  }

  if (expectedOutput.type === 'count') {
        if (!results.rows || results.rows.length === 0 || !results.columns || results.columns.length === 0) {
      return false;
    }
    const actualCount = parseInt(results.rows[0][results.columns[0]]);
    const expectedCount = parseInt(expectedOutput.value);
    return actualCount === expectedCount;
  }

  if (expectedOutput.type === 'row') {
        if (!results.rows || results.rows.length === 0) {
      return false;
    }
    const actualRow = results.rows[0];
    const expectedRow = expectedOutput.value;
    return JSON.stringify(actualRow) === JSON.stringify(expectedRow);
  }

  return false;
};

const ResultsSection = ({ results, error, isExecuting, expectedOutput, assignmentId, currentQuery, onSaveProgress }) => {
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const correct = checkIfCorrect(results, expectedOutput);
    setIsCorrect(correct);
        if (results) {
      setSaveSuccess(false);
    }
  }, [results, expectedOutput]);

  const handleSaveSolution = async () => {
    if (!onSaveProgress || !currentQuery) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveProgress(currentQuery);
      setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save solution:', err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };
  if (isExecuting) {
    return (
      <section className="results-section loading">
        <h2>Results</h2>
        <div className="loading-spinner"></div>
        <p>Executing query...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results-section error">
        <h2>Error</h2>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!results) {
    return (
      <section className="results-section empty">
        <h2>Results</h2>
        <p>Execute a query to see results</p>
      </section>
    );
  }

  return (
    <section className="results-section">
      <div className="results-header">
        <h2>Results</h2>
        <div className="results-meta">
          {results.rows.length} row{results.rows.length !== 1 ? 's' : ''} returned
          {isCorrect && (
            <div className="save-action">
              {saveSuccess && (
                <span className="save-success-message">✓ Solution saved successfully!</span>
              )}
              <button
                className="save-button"
                onClick={handleSaveSolution}
                disabled={isSaving || saveSuccess}
              >
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Solution'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              {results.columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {results.columns.map(column => (
                  <td key={`${rowIndex}-${column}`}>
                    {row[column] !== null ? String(row[column]) : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

ResultsSection.propTypes = {
  results: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.object)
  }),
  error: PropTypes.string,
  isExecuting: PropTypes.bool
};

export default ResultsSection;
