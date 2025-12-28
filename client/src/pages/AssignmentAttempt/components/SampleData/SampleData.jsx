import React from 'react';
import PropTypes from 'prop-types';
import './SampleData.scss';

const SampleData = ({ tables, schema }) => {
  if (!tables || Object.keys(tables).length === 0) {
    return (
      <section className="sample-data">
        <h2>Sample Data</h2>
        <p className="no-data-message">No sample data available for this assignment.</p>
      </section>
    );
  }

  return (
    <section className="sample-data">
      <h2>Sample Data</h2>
      <div className="tables-container">
        {Object.entries(tables).map(([tableName, rows]) => {
                    const tableSchema = schema && schema[tableName];
          const columns = tableSchema && Array.isArray(tableSchema) 
            ? tableSchema.map(col => col.columnName || col.name)
            : rows.length > 0 ? Object.keys(rows[0]) : [];

          return (
            <div key={tableName} className="data-table">
              <h3>{tableName}</h3>
              {rows && rows.length > 0 ? (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        {columns.map(header => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {columns.map(column => (
                            <td key={`${rowIndex}-${column}`}>
                              {row[column] !== null && row[column] !== undefined 
                                ? String(row[column]) 
                                : <span className="null-value">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No data available</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

SampleData.propTypes = {
  tables: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.object)
  )
};

export default SampleData;
