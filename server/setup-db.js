const fs = require('fs');
const readline = require('readline');
const { exec } = require('child_process');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(' PostgreSQL Setup Helper');
console.log('-------------------------');

const questions = [
  {
    name: 'DB_USER',
    question: 'PostgreSQL username (default: postgres): ',
    default: 'postgres'
  },
  {
    name: 'DB_PASSWORD',
    question: 'PostgreSQL password: ',
    sensitive: true
  },
  {
    name: 'DB_NAME',
    question: 'Database name (default: sql_sandbox): ',
    default: 'sql_sandbox'
  },
  {
    name: 'DB_HOST',
    question: 'Database host (default: localhost): ',
    default: 'localhost'
  },
  {
    name: 'DB_PORT',
    question: 'Database port (default: 5432): ',
    default: '5432'
  },
  {
    name: 'DB_SANDBOX_PASSWORD',
    question: 'Password for sandbox_user (default: secure_password): ',
    default: 'secure_password'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
        writeEnvFile();
    return;
  }

  const q = questions[index];
  const prompt = q.question + (q.default ? `[${q.default}] ` : '');
  
  rl.question(prompt, (answer) => {
    answers[q.name] = answer || q.default || '';
    askQuestion(index + 1);
  });
}

function writeEnvFile() {
  const envPath = path.join(__dirname, '.env');
  let envContent = `# Database Configuration
DB_USER=${answers.DB_USER}
DB_PASSWORD=${answers.DB_PASSWORD}
DB_NAME=${answers.DB_NAME}
DB_HOST=${answers.DB_HOST}
DB_PORT=${answers.DB_PORT}
DB_SANDBOX_PASSWORD=${answers.DB_SANDBOX_PASSWORD}

# Server Configuration
NODE_ENV=development
PORT=5000

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES=90

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=100
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n Created .env file with your database configuration');
  
    console.log('\n Testing database connection...');
  testDatabaseConnection(answers);
}

function testDatabaseConnection(config) {
  const { Pool } = require('pg');
  const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: 'postgres',     password: config.DB_PASSWORD,
    port: parseInt(config.DB_PORT)
  });

  pool.connect((err, client, done) => {
    if (err) {
      console.error(' Failed to connect to PostgreSQL:', err.message);
      console.log('\nTroubleshooting steps:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Verify your username and password');
      console.log('3. Check if PostgreSQL is configured to accept connections');
      console.log('4. Ensure the port (default 5432) is open in your firewall');
      process.exit(1);
    }

    console.log(' Successfully connected to PostgreSQL');
    
        client.query(`SELECT 1 FROM pg_database WHERE datname = '${config.DB_NAME}'`, (err, res) => {
      if (err) {
        console.error('Error checking database:', err);
        process.exit(1);
      }

      if (res.rows.length === 0) {
        console.log(`\nCreating database '${config.DB_NAME}'...`);
        client.query(`CREATE DATABASE ${config.DB_NAME}`, (err) => {
          if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
          }
          console.log(` Created database '${config.DB_NAME}'`);
          setupDatabase(config);
        });
      } else {
        console.log(`\n Database '${config.DB_NAME}' already exists`);
        setupDatabase(config);
      }
    });
  });
}

function setupDatabase(config) {
  console.log('\n🛠️  Setting up database schema and user...');
  
    const pool = new Pool({
    user: config.DB_USER,
    host: config.DB_HOST,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    port: parseInt(config.DB_PORT)
  });

  const setupScript = `
    -- Create schema
    CREATE SCHEMA IF NOT EXISTS sandbox;
    
    -- Create sandbox user if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_user') THEN
        CREATE USER sandbox_user WITH PASSWORD '${config.DB_SANDBOX_PASSWORD}';
      END IF;
    END $$;
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA sandbox TO sandbox_user;
    GRANT SELECT ON ALL TABLES IN SCHEMA sandbox TO sandbox_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA sandbox GRANT SELECT ON TABLES TO sandbox_user;
  `;

  pool.query(setupScript, (err) => {
    if (err) {
      console.error('Error setting up database:', err);
      process.exit(1);
    }
    
    console.log('Database setup complete!');
    console.log('\n Setup completed successfully!');
    console.log('You can now start the application with:');
    console.log('1. cd server');
    console.log('2. npm start');
    
    process.exit(0);
  });
}

askQuestion(0);
