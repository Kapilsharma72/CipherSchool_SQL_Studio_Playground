const { Pool } = require('pg');
const mongoose = require('mongoose');

const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
    max: 20,   idleTimeoutMillis: 30000,   connectionTimeoutMillis: 5000,   application_name: 'sql-sandbox-app', });

const createFallbackPool = () => {
  return new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    statement_timeout: 5000,
    idle_in_transaction_session_timeout: 10000,
    max: 10,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
    application_name: 'sql-sandbox-fallback',
  });
};

const getSandboxPool = () => {
  const sandboxUser = process.env.DB_SANDBOX_USER;
  const sandboxPassword = process.env.DB_SANDBOX_PASSWORD;
  
    if (!sandboxUser || !sandboxPassword) {
    console.warn('⚠️  DB_SANDBOX_USER or DB_SANDBOX_PASSWORD not set. Using main database user for sandbox queries.');
    return createFallbackPool();
  }
  
    try {
    return new Pool({
      host: process.env.DB_SANDBOX_HOST || process.env.DB_HOST,
      port: process.env.DB_SANDBOX_PORT || process.env.DB_PORT,
      database: process.env.DB_SANDBOX_NAME || process.env.DB_NAME,
      user: sandboxUser,
      password: sandboxPassword,
            statement_timeout: 5000,       idle_in_transaction_session_timeout: 10000,       max: 10,             ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false 
      } : false,
            options: '-c search_path=sandbox,public',
      application_name: 'sql-sandbox-user',
    });
  } catch (error) {
    console.warn('⚠️  Failed to create sandbox pool, using fallback:', error.message);
    return createFallbackPool();
  }
};

const sandboxPool = getSandboxPool();
const fallbackPool = createFallbackPool();

const testPgConnection = async () => {
  try {
    const client = await pgPool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }
    
        await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,       socketTimeoutMS: 45000,     });
    
        await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const testSandboxConnection = async () => {
  let client;
  try {
    client = await sandboxPool.connect();
    console.log('✅ PostgreSQL Sandbox connected successfully');
    
        try {
      const { rows } = await client.query('SHOW search_path');
      console.log('🔍 Sandbox search_path:', rows[0].search_path);
    } catch (e) {
          }
    
        try {
      const userQuery = `
        SELECT 
          usename, 
          usecreatedb, 
          usesuper, 
          usebypassrls 
        FROM pg_user 
        WHERE usename = current_user;
      `;
      const userInfo = await client.query(userQuery);
      console.log('👤 Sandbox user info:', userInfo.rows[0]);
    } catch (e) {
          }
    
  } catch (error) {
    if (error.code === '28P01') {
      console.warn('⚠️  PostgreSQL Sandbox authentication failed. Using fallback connection.');
      console.warn('   To use dedicated sandbox user, set DB_SANDBOX_USER and DB_SANDBOX_PASSWORD in .env');
      console.warn('   Or create sandbox_user in PostgreSQL with: CREATE USER sandbox_user WITH PASSWORD \'your_password\';');
    } else {
      console.error('❌ PostgreSQL Sandbox connection error:', error.message);
      throw error;
    }
  } finally {
    if (client) client.release();
  }
};

const initializeDatabases = async () => {
  try {
    await testPgConnection();
    
        try {
      await testSandboxConnection();
    } catch (sandboxError) {
      console.warn('⚠️  Sandbox connection test failed, but continuing with fallback...');
    }
    
    if (process.env.MONGO_URL) {
      await connectMongoDB();
    }
    console.log('✅ All database connections established successfully');
  } catch (error) {
    console.error('❌ Failed to initialize databases:', error.message);
    process.exit(1);
  }
};

module.exports = {
  pgPool,
  sandboxPool,
  fallbackPool,
  testPgConnection,
  testSandboxConnection,
  connectMongoDB,
  initializeDatabases,
};
