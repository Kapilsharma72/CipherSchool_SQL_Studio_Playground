const AppError = require('../utils/appError');
const Assignment = require('../models/Assignment');
const { sandboxPool, fallbackPool } = require('../config/db');
const catchAsync = require('../utils/catchAsync');


const executeQuery = async (query, schemaName = 'sandbox') => {
  let client;
  let usingFallback = false;
  
    try {
    client = await sandboxPool.connect();
  } catch (connectionError) {
        if (connectionError.code === '28P01' || connectionError.code === 'ECONNREFUSED') {
      console.warn('  Sandbox pool connection failed, trying fallback pool...');
      try {
        client = await fallbackPool.connect();
        usingFallback = true;
        console.log(' Using fallback database connection (main user)');
      } catch (fallbackError) {
                throw new AppError(
          'Database authentication failed. Please check your database credentials in .env file:\n' +
          '- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD must be set correctly.\n' +
          '- If using sandbox_user, ensure DB_SANDBOX_USER and DB_SANDBOX_PASSWORD are correct, or remove them to use main user.',
          500
        );
      }
    } else {
      throw new AppError(`Database connection failed: ${connectionError.message}`, 500);
    }
  }
  
  try {
        await client.query('BEGIN');
    
            const sanitizedSchema = schemaName.replace(/[^a-z0-9_]/gi, '');
    
        try {
      await client.query(`SET LOCAL search_path TO "${sanitizedSchema}", public`);
    } catch (schemaError) {
            console.warn(`Schema ${sanitizedSchema} not found, using public schema`);
      await client.query('SET LOCAL search_path TO public');
    }
    
        await client.query('SET LOCAL statement_timeout = 5000');     
        const result = await client.query({
      text: query,
      rowMode: 'array',     });
    
        await client.query('ROLLBACK');
    
        const columns = result.fields.map(field => field.name);
    const rows = result.rows.map(row => {
      const rowObj = {};
      columns.forEach((col, index) => {
        rowObj[col] = row[index];
      });
      return rowObj;
    });
    
    return {
      rowCount: result.rowCount,
      rows: rows,
      columns: columns,
      fields: result.fields.map(field => ({
        name: field.name,
        dataTypeID: field.dataTypeID,
        dataType: field.dataTypeName || 'unknown',
      }))
    };
  } catch (error) {
        if (client) {
      await client.query('ROLLBACK').catch(rollbackError => {
        console.error('Error rolling back transaction:', rollbackError);
      });
    }
    
    console.error('Query execution error:', error);
    
        if (error.code === '42P01') {
      throw new AppError(`Table not found: ${error.message}. Please check the table name and schema.`, 400);
    } else if (error.code === '42703') {
      throw new AppError(`Column not found: ${error.message}. Please check the column names.`, 400);
    } else if (error.code === '42601') {
      throw new AppError(`SQL syntax error: ${error.message}. Please check your query syntax.`, 400);
    }
    
    throw new AppError(`Query execution failed: ${error.message}`, 400);
  } finally {
        if (client) {
      client.release();
    }
  }
};


const validateQuery = (query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new AppError('Query cannot be empty', 400);
  }

    const upperQuery = query.toUpperCase().replace(/\s+/g, ' ');
  
    if (!upperQuery.trim().startsWith('SELECT')) {
    throw new AppError('Only SELECT queries are allowed', 403);
  }
  
    const blockedKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'DROP', 'ALTER', 
    'CREATE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
    'PREPARE', 'EXECUTE', 'COPY', 'VACUUM', 'ANALYZE', 'REINDEX',
    'REFRESH', 'EXPLAIN', 'WITH', 'RECURSIVE'
  ];
  
    const blockedPatterns = [
    /;.*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|GRANT|REVOKE)/i,
    /\/\*.*\*\    /--.*\n/,          /pg_/i,             /current_(user|database|schema)/i,
    /session_user|current_setting|set_config/i,
    /\$\$.*\$\$/s,    ];
  
    const hasBlockedKeyword = blockedKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`, 'i').test(query)
  );
  
    const hasBlockedPattern = blockedPatterns.some(pattern => 
    pattern.test(query)
  );
  
    if (query.length > 10000) {
    throw new AppError('Query is too long', 400);
  }
  
  if (hasBlockedKeyword || hasBlockedPattern) {
    throw new AppError('This operation is not allowed in the sandbox', 403);
  }
};

exports.execute = catchAsync(async (req, res, next) => {
  const { query, assignmentId } = req.body;
  
    validateQuery(query);
  
    let schemaName = 'sandbox';   if (assignmentId) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }
    schemaName = assignment.schemaName || 'sandbox';
  }
  
    const result = await executeQuery(query, schemaName);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

exports.validate = catchAsync(async (req, res, next) => {
  const { query } = req.body;
  validateQuery(query);
  
  res.status(200).json({
    status: 'success',
    message: 'Query is valid'
  });
});
