const { Pool } = require('pg');

// Database configuration
const dbConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
} : {
  user: process.env.DB_USER || 'edtech_learning_db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'edtech_learning_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  ssl: false
};

// Debug logging for Railway
console.log('Database configuration:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

// For local development without database, we'll use a mock
const isLocalDev = !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production';

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', (client) => {
  console.log('Connected to PostgreSQL database');
  console.log('Database URL configured:', !!process.env.DATABASE_URL);
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  console.error('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.error('Node environment:', process.env.NODE_ENV);
  // Don't exit in production, let the app handle it gracefully
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

module.exports = pool;
