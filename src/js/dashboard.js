// Dashboard functionality
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Create a mock user for testing
        this.currentUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            walletBalance: 100.00,
            isOnline: true
        };
        this.setUser(this.currentUser);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.currentTarget.dataset.page);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Wallet recharge
        document.getElementById('recharge-btn').addEventListener('click', () => {
            this.switchPage('wallet');
        });
    }

    setUser(user) {
        this.currentUser = user;
        this.updateUserInfo();
        this.loadDashboardData();
    }

    updateUserInfo() {
        if (!this.currentUser) return;

        // Update header user info
        document.getElementById('user-name').textContent = this.currentUser.fullName;
        document.getElementById('dashboard-user-name').textContent = this.currentUser.fullName;
        
        // Update wallet balance
        this.updateWalletBalance(this.currentUser.walletBalance);
    }

    updateWalletBalance(balance) {
        const balanceElement = document.getElementById('wallet-balance');
        const walletPageBalance = document.getElementById('wallet-page-balance');
        
        if (balanceElement) {
            balanceElement.textContent = `$${balance.toFixed(2)}`;
        }
        if (walletPageBalance) {
            walletPageBalance.textContent = `$${balance.toFixed(2)}`;
        }
    }

    switchPage(page) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Update page content
        document.querySelectorAll('.page').forEach(pageElement => {
            pageElement.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        // Load page-specific data
        this.loadPageData(page);
    }

    loadPageData(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'study-partner':
                this.loadStudyPartners();
                break;
            case 'wallet':
                this.loadWalletData();
                break;
        }
    }

    async loadDashboardData() {
        if (!this.currentUser) return;

        try {
            // Load user profile to get updated data
            const result = await window.electron.ipcRenderer.invoke('get-user-profile', this.currentUser.id);
            if (result.success) {
                this.currentUser = { ...this.currentUser, ...result.data };
                this.updateWalletBalance(this.currentUser.walletBalance);
            }

            // Load dashboard statistics
            this.loadDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    loadDashboardStats() {
        // This would typically load from the database
        // For now, we'll show placeholder data
        const stats = {
            studySessions: 0,
            partnersFound: 0,
            hoursStudied: 0
        };

        // Update stat cards
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 3) {
            statNumbers[0].textContent = stats.studySessions;
            statNumbers[1].textContent = stats.partnersFound;
            statNumbers[2].textContent = stats.hoursStudied;
        }
    }

    async loadStudyPartners() {
        if (!this.currentUser) return;

        const usersList = document.getElementById('online-users-list');
        usersList.innerHTML = '<div class="users-loading"><div class="loading"></div></div>';

        try {
            // This would typically load from a WebSocket connection
            // For now, we'll simulate with mock data
            const mockUsers = [
                {
                    id: 2,
                    username: 'alice_student',
                    full_name: 'Alice Johnson',
                    last_seen: new Date().toISOString(),
                    is_online: true
                },
                {
                    id: 3,
                    username: 'bob_learner',
                    full_name: 'Bob Smith',
                    last_seen: new Date(Date.now() - 300000).toISOString(),
                    is_online: true
                },
                {
                    id: 4,
                    username: 'charlie_study',
                    full_name: 'Charlie Brown',
                    last_seen: new Date(Date.now() - 600000).toISOString(),
                    is_online: false
                }
            ];

            this.renderOnlineUsers(mockUsers);
        } catch (error) {
            console.error('Error loading study partners:', error);
            usersList.innerHTML = '<div class="empty-state"><h3>Unable to load users</h3><p>Please try again later.</p></div>';
        }
    }

    renderOnlineUsers(users) {
        const usersList = document.getElementById('online-users-list');
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="empty-state"><h3>No online users</h3><p>Check back later for study partners.</p></div>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <div class="user-card ${user.is_online ? 'online' : 'offline'}" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">
                        ${user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-username">@${user.username}</div>
                    </div>
                </div>
                <div class="user-status">
                    <div class="status-indicator ${user.is_online ? '' : 'offline'}"></div>
                    <span>${user.is_online ? 'Online' : 'Offline'}</span>
                </div>
                <div class="user-actions">
                    <button class="btn-connect" ${!user.is_online ? 'disabled' : ''} 
                            onclick="dashboardManager.connectToUser(${user.id}, '${user.full_name}')">
                        ${user.is_online ? 'Connect' : 'Offline'}
                    </button>
                    <button class="btn-message" onclick="dashboardManager.messageUser(${user.id}, '${user.full_name}')">
                        Message
                    </button>
                </div>
            </div>
        `).join('');
    }

    connectToUser(userId, userName) {
        // This would initiate a WebRTC connection
        console.log(`Connecting to user ${userId} (${userName})`);
        
        // For now, show a modal or notification
        alert(`Connecting to ${userName}...\n\nThis would start a screen sharing session.`);
        
        // In a real implementation, this would:
        // 1. Send a connection request via WebSocket
        // 2. Wait for acceptance
        // 3. Initialize WebRTC peer connection
        // 4. Open screen sharing modal
    }

    messageUser(userId, userName) {
        // This would open a chat interface
        console.log(`Messaging user ${userId} (${userName})`);
        alert(`Opening chat with ${userName}...\n\nThis would open a messaging interface.`);
    }

    async loadWalletData() {
        if (!this.currentUser) return;

        try {
            // Load transaction history
            this.loadTransactionHistory();
        } catch (error) {
            console.error('Error loading wallet data:', error);
        }
    }

    loadTransactionHistory() {
        // This would typically load from the database
        // For now, we'll show placeholder data
        const transactions = [
            {
                id: 1,
                amount: 50.00,
                type: 'credit',
                description: 'Wallet recharge',
                date: new Date().toISOString()
            },
            {
                id: 2,
                amount: -10.00,
                type: 'debit',
                description: 'Study session fee',
                date: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        this.renderTransactions(transactions);
    }

    renderTransactions(transactions) {
        const transactionList = document.getElementById('transaction-list');
        
        if (transactions.length === 0) {
            transactionList.innerHTML = '<div class="empty-transactions"><h3>No transactions yet</h3><p>Your transaction history will appear here.</p></div>';
            return;
        }

        transactionList.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-type">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    $${Math.abs(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Set user offline in database
            if (this.currentUser) {
                window.electronAPI.setUserOffline(this.currentUser.id);
            }
            
            // Return to auth screen
            if (window.authManager) {
                window.authManager.logout();
            }
        }
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
