const { Pool } = require('pg');

// Database configuration
const dbConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
} : {
  user: process.env.DB_USER || 'edtech_learning_db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'edtech_learning_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// For local development without database, we'll use a mock
const isLocalDev = !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production';

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

module.exports = pool;
