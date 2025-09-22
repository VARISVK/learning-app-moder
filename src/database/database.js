const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class Database {
  constructor() {
    // Use absolute path to ensure database can be found
    const dbPath = path.resolve(__dirname, '../../data/users.db');
    console.log('Database path:', dbPath);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Database connected successfully');
      }
    });
    this.initDatabase();
  }

  initDatabase() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          wallet_balance REAL DEFAULT 0.0,
          is_online BOOLEAN DEFAULT 0,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Study sessions table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS study_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          partner_id INTEGER,
          session_type TEXT DEFAULT 'screen_share',
          status TEXT DEFAULT 'active',
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (partner_id) REFERENCES users (id)
        )
      `);

      // Wallet transactions table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          amount REAL NOT NULL,
          transaction_type TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
    });
  }

  async registerUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, password, fullName } = userData;
      const hashedPassword = bcrypt.hashSync(password, 10);

      console.log('Attempting to register user:', { username, email, fullName });

      this.db.run(
        `INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, fullName],
        function(err) {
          if (err) {
            console.error('Registration error:', err);
            reject(err);
          } else {
            console.log('User registered successfully with ID:', this.lastID);
            resolve({
              id: this.lastID,
              username,
              email,
              fullName
            });
          }
        }
      );
    });
  }

  async loginUser(credentials) {
    return new Promise((resolve, reject) => {
      const { username, password } = credentials;

      this.db.get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [username, username],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('User not found'));
          } else if (!bcrypt.compareSync(password, row.password)) {
            reject(new Error('Invalid password'));
          } else {
            // Update online status
            this.db.run(
              `UPDATE users SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
              [row.id]
            );

            resolve({
              id: row.id,
              username: row.username,
              email: row.email,
              fullName: row.full_name,
              walletBalance: row.wallet_balance,
              isOnline: true
            });
          }
        }
      );
    });
  }

  async getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, username, email, full_name, wallet_balance, is_online, last_seen FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            reject(new Error('User not found'));
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async getOnlineUsers(currentUserId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, username, full_name, last_seen FROM users WHERE is_online = 1 AND id != ? ORDER BY last_seen DESC`,
        [currentUserId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async updateWallet(userId, amount) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Update wallet balance
        this.db.run(
          `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
          [amount, userId],
          function(err) {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Record transaction
            this.db.run(
              `INSERT INTO wallet_transactions (user_id, amount, transaction_type, description) VALUES (?, ?, ?, ?)`,
              [userId, amount, amount > 0 ? 'credit' : 'debit', amount > 0 ? 'Wallet recharge' : 'Wallet deduction'],
              function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                this.db.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ success: true, newBalance: amount });
                  }
                });
              }
            );
          }
        );
      });
    });
  }

  async setUserOffline(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  }
}

module.exports = new Database();
