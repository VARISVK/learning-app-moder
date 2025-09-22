const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'edtech_learning_db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'edtech_learning_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

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
