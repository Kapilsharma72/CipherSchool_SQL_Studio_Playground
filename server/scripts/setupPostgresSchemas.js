require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');

const adminPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
});

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await mongoose.connection.db.admin().ping();
    console.log(' MongoDB connected successfully');
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    throw error;
  }
};

const mapDataType = (dataType) => {
  const typeMap = {
    'INTEGER': 'INTEGER',
    'TEXT': 'TEXT',
    'VARCHAR': 'VARCHAR(255)',
    'REAL': 'REAL',
    'DECIMAL': 'DECIMAL(10, 2)',
    'DATE': 'DATE',
    'BOOLEAN': 'BOOLEAN',
    'TIMESTAMP': 'TIMESTAMP',
    'NUMERIC': 'NUMERIC(10, 2)',
    'BIGINT': 'BIGINT',
    'SMALLINT': 'SMALLINT',
    'DOUBLE PRECISION': 'DOUBLE PRECISION'
  };
  return typeMap[dataType] || 'TEXT';
};

const setupAssignmentSchema = async (assignment) => {
  const client = await adminPool.connect();
  
  try {
    await client.query('BEGIN');
    
    const schemaName = assignment.schemaName;
    
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`  ✓ Created schema: ${schemaName}`);
    
        await client.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO sandbox_user`);
    
        for (const table of assignment.sampleTables) {
      const tableName = table.tableName;
      const columns = table.columns;
      
            const dropTableSQL = `DROP TABLE IF EXISTS "${schemaName}"."${tableName}" CASCADE`;
      await client.query(dropTableSQL);
      
            const columnDefinitions = columns.map(col => {
        const pgType = mapDataType(col.dataType);
        let def = `"${col.columnName}" ${pgType}`;
        
                if (col.columnName.toLowerCase() === 'id' && 
            (col.dataType === 'INTEGER' || col.dataType === 'BIGINT')) {
          def += ' PRIMARY KEY';
        }
        
        return def;
      }).join(', ');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "${schemaName}"."${tableName}" (
          ${columnDefinitions}
        )
      `;
      
      await client.query(createTableSQL);
      console.log(`  ✓ Created table: ${schemaName}.${tableName}`);
      
            await client.query(`TRUNCATE TABLE "${schemaName}"."${tableName}" CASCADE`);
      
            if (table.rows && Array.isArray(table.rows) && table.rows.length > 0) {
        const columnNames = columns.map(col => `"${col.columnName}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        let insertedCount = 0;
        for (const row of table.rows) {
          const values = columns.map(col => {
            const value = row[col.columnName];
                        if (value === null || value === undefined) {
              return null;
            }
            return value;
          });
          
          const insertSQL = `
            INSERT INTO "${schemaName}"."${tableName}" (${columnNames})
            VALUES (${placeholders})
          `;
          
          try {
            await client.query(insertSQL, values);
            insertedCount++;
          } catch (insertError) {
                        if (insertError.code === '23505') {
                            console.log(`    ⚠ Skipped duplicate row in ${tableName}`);
              continue;
            }
            throw insertError;
          }
        }
        
        console.log(`  ✓ Inserted ${insertedCount} rows into ${schemaName}.${tableName}`);
      } else {
        console.log(`  ⚠ No sample data provided for ${schemaName}.${tableName}`);
      }
      
            await client.query(`GRANT SELECT ON "${schemaName}"."${tableName}" TO sandbox_user`);
    }
    
        await client.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA "${schemaName}"
      GRANT SELECT ON TABLES TO sandbox_user
    `);
    
    await client.query('COMMIT');
    console.log(` Successfully set up schema: ${schemaName}\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(` Error setting up schema ${assignment.schemaName}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
};

const setupAllSchemas = async () => {
  try {
        await connectMongoDB();
    
        const testClient = await adminPool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    console.log(' PostgreSQL connected successfully\n');
    
        const assignments = await Assignment.find();
    
    if (assignments.length === 0) {
      console.log('  No assignments found in MongoDB. Please run seed script first:');
      console.log('   npm run seed');
      process.exit(1);
    }
    
    console.log(` Found ${assignments.length} assignment(s) to set up:\n`);
    
        for (const assignment of assignments) {
      console.log(` Setting up schema for: ${assignment.title} (${assignment.schemaName})`);
      await setupAssignmentSchema(assignment);
    }
    
    console.log(' All PostgreSQL schemas set up successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error(' Error setting up PostgreSQL schemas:', error);
    process.exit(1);
  }
};

setupAllSchemas();

