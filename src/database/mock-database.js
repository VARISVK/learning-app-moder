// Mock database for local development testing
class MockDatabase {
  constructor() {
    this.users = new Map();
    this.sessions = [];
    this.transactions = [];
    this.nextId = 1;
    console.log('Using Mock Database for local development');
  }

  async registerUser(userData) {
    const { username, email, password, fullName } = userData;
    
    // Check if user already exists
    for (let user of this.users.values()) {
      if (user.username === username || user.email === email) {
        throw new Error('Username or email already exists');
      }
    }

    const user = {
      id: this.nextId++,
      username,
      email,
      fullName,
      password, // Store the password for login verification
      walletBalance: 0.0,
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date()
    };

    this.users.set(user.id, user);
    console.log('Mock: User registered:', user);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    };
  }

  async loginUser(credentials) {
    const { username, password } = credentials;
    
    console.log('Mock: Login attempt for:', username);
    
    // Find user by username or email
    let user = null;
    for (let u of this.users.values()) {
      if (u.username === username || u.email === username) {
        user = u;
        break;
      }
    }

    if (!user) {
      console.log('Mock: User not found:', username);
      throw new Error('User not found');
    }

    console.log('Mock: Found user, checking password...');
    console.log('Mock: Stored password:', user.password);
    console.log('Mock: Provided password:', password);

    // Check password (simple string comparison for mock)
    if (password !== user.password) {
      console.log('Mock: Password mismatch');
      throw new Error('Invalid password');
    }

    console.log('Mock: Login successful for:', username);

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      walletBalance: user.walletBalance,
      isOnline: true
    };
  }

  async getUserProfile(userId) {
    const user = this.users.get(parseInt(userId));
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      walletBalance: user.walletBalance,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    };
  }

  async getOnlineUsers(currentUserId) {
    const onlineUsers = [];
    for (let user of this.users.values()) {
      if (user.isOnline && user.id !== parseInt(currentUserId)) {
        onlineUsers.push({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          lastSeen: user.lastSeen
        });
      }
    }
    return onlineUsers;
  }

  async updateWallet(userId, amount) {
    const user = this.users.get(parseInt(userId));
    if (!user) {
      throw new Error('User not found');
    }

    user.walletBalance += amount;
    
    // Record transaction
    this.transactions.push({
      id: this.transactions.length + 1,
      userId: parseInt(userId),
      amount,
      type: amount > 0 ? 'credit' : 'debit',
      description: amount > 0 ? 'Wallet recharge' : 'Wallet deduction',
      createdAt: new Date()
    });

    return { 
      success: true, 
      newBalance: user.walletBalance
    };
  }

  async setUserOffline(userId) {
    const user = this.users.get(parseInt(userId));
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
    }
    return { success: true };
  }

  async getWalletTransactions(userId) {
    return this.transactions
      .filter(t => t.userId === parseInt(userId))
      .map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt
      }));
  }
}

module.exports = new MockDatabase();

