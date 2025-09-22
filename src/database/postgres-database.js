const pool = require('./postgres-config');
const bcrypt = require('bcryptjs');

class PostgreSQLDatabase {
  constructor() {
    this.initialized = false;
    this.initDatabase();
  }

  async initDatabase() {
    try {
      console.log('Starting database initialization...');
      console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
      
      // Test connection first
      await this.testConnection();
      // Create tables if they don't exist
      await this.createTables();
      this.initialized = true;
      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      console.log('Will retry database operations on first use');
      this.initialized = false;
    }
  }

  async testConnection() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
          console.log('Database connection test successful');
          return;
        } finally {
          client.release();
        }
      } catch (error) {
        retries++;
        console.error(`Database connection attempt ${retries} failed:`, error.message);
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      console.log('Database not initialized, attempting to initialize...');
      await this.initDatabase();
      if (!this.initialized) {
        throw new Error('Database initialization failed');
      }
    }
  }

  async createTables() {
    const client = await pool.connect();
    try {
      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          wallet_balance DECIMAL(10,2) DEFAULT 0.0,
          is_online BOOLEAN DEFAULT FALSE,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Study sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS study_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          partner_id INTEGER REFERENCES users(id),
          session_type VARCHAR(50) DEFAULT 'screen_share',
          status VARCHAR(20) DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Wallet transactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          amount DECIMAL(10,2) NOT NULL,
          transaction_type VARCHAR(20) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Study partners table (new)
      await client.query(`
        CREATE TABLE IF NOT EXISTS study_partners (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          partner_id INTEGER REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, partner_id)
        )
      `);

      // Study preferences table (new)
      await client.query(`
        CREATE TABLE IF NOT EXISTS study_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) UNIQUE,
          subjects TEXT[],
          availability JSONB,
          skill_level VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    } finally {
      client.release();
    }
  }

  async registerUser(userData) {
    await this.ensureInitialized();
    const client = await pool.connect();
    try {
      const { username, email, password, fullName } = userData;
      const hashedPassword = bcrypt.hashSync(password, 10);

      console.log('Attempting to register user:', { username, email, fullName });

      const result = await client.query(
        `INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name`,
        [username, email, hashedPassword, fullName]
      );

      const user = result.rows[0];
      console.log('User registered successfully with ID:', user.id);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async loginUser(credentials) {
    const client = await pool.connect();
    try {
      const { username, password } = credentials;

      const result = await client.query(
        `SELECT * FROM users WHERE username = $1 OR email = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      if (!bcrypt.compareSync(password, user.password)) {
        throw new Error('Invalid password');
      }

      // Update online status
      await client.query(
        `UPDATE users SET is_online = TRUE, last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id]
      );

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        walletBalance: parseFloat(user.wallet_balance),
        isOnline: true
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserProfile(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, username, email, full_name, wallet_balance, is_online, last_seen FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        walletBalance: parseFloat(user.wallet_balance),
        isOnline: user.is_online,
        lastSeen: user.last_seen
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async getOnlineUsers(currentUserId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, username, full_name, last_seen FROM users WHERE is_online = TRUE AND id != $1 ORDER BY last_seen DESC`,
        [currentUserId]
      );

      return result.rows.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        lastSeen: user.last_seen
      }));
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async updateWallet(userId, amount) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update wallet balance
      const updateResult = await client.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`,
        [amount, userId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('User not found');
      }

      // Record transaction
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)`,
        [userId, amount, amount > 0 ? 'credit' : 'debit', amount > 0 ? 'Wallet recharge' : 'Wallet deduction']
      );

      await client.query('COMMIT');

      return { 
        success: true, 
        newBalance: parseFloat(updateResult.rows[0].wallet_balance)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setUserOffline(userId) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE users SET is_online = FALSE, last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
        [userId]
      );

      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async getWalletTransactions(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(transaction => ({
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        type: transaction.transaction_type,
        description: transaction.description,
        createdAt: transaction.created_at
      }));
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async createStudySession(userId, partnerId, sessionType = 'screen_share') {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO study_sessions (user_id, partner_id, session_type) VALUES ($1, $2, $3) RETURNING id`,
        [userId, partnerId, sessionType]
      );

      return { id: result.rows[0].id, success: true };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async endStudySession(sessionId) {
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE study_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [sessionId]
      );

      return { success: true };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PostgreSQLDatabase();
