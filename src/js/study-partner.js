// Study Partner functionality
class StudyPartnerManager {
    constructor() {
        this.currentUser = null;
        this.onlineUsers = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWebSocket();
        // Create a mock user for testing
        this.currentUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            walletBalance: 100.00,
            isOnline: true
        };
    }

    setupEventListeners() {
        // Connection requests
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-connect')) {
                const userId = e.target.closest('.user-card').dataset.userId;
                const userName = e.target.closest('.user-card').querySelector('.user-name').textContent;
                this.connectToUser(userId, userName);
            }
        });

        // Message requests
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-message')) {
                const userId = e.target.closest('.user-card').dataset.userId;
                const userName = e.target.closest('.user-card').querySelector('.user-name').textContent;
                this.messageUser(userId, userName);
            }
        });
    }

    setupWebSocket() {
        // In a real implementation, this would connect to a WebSocket server
        // For now, we'll simulate with periodic updates
        this.simulateOnlineUsers();
    }

    simulateOnlineUsers() {
        // Simulate online users updating every 30 seconds
        setInterval(() => {
            this.loadOnlineUsers();
        }, 30000);
    }

    async loadOnlineUsers() {
        if (!this.currentUser) return;

        try {
            // This would typically load from a WebSocket connection
            // For now, we'll use mock data with some randomization
            const mockUsers = this.generateMockUsers();
            this.onlineUsers = mockUsers;
            this.renderOnlineUsers(mockUsers);
        } catch (error) {
            console.error('Error loading online users:', error);
        }
    }

    generateMockUsers() {
        const baseUsers = [
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
            },
            {
                id: 5,
                username: 'diana_learns',
                full_name: 'Diana Prince',
                last_seen: new Date(Date.now() - 120000).toISOString(),
                is_online: true
            },
            {
                id: 6,
                username: 'eve_student',
                full_name: 'Eve Wilson',
                last_seen: new Date(Date.now() - 900000).toISOString(),
                is_online: true
            }
        ];

        // Filter out current user and return online users first
        return baseUsers
            .filter(user => user.id !== this.currentUser?.id)
            .sort((a, b) => {
                if (a.is_online && !b.is_online) return -1;
                if (!a.is_online && b.is_online) return 1;
                return new Date(b.last_seen) - new Date(a.last_seen);
            });
    }

    renderOnlineUsers(users) {
        const usersList = document.getElementById('online-users-list');
        
        if (!usersList) return;

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
                    <button class="btn-connect" ${!user.is_online ? 'disabled' : ''}>
                        ${user.is_online ? 'Connect' : 'Offline'}
                    </button>
                    <button class="btn-message">
                        Message
                    </button>
                </div>
            </div>
        `).join('');
    }

    connectToUser(userId, userName) {
        if (!this.currentUser) {
            alert('Please login to connect with other users.');
            return;
        }

        // Show connection modal
        this.showConnectionModal(userId, userName);
    }

    showConnectionModal(userId, userName) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('connection-modal');
        if (!modal) {
            modal = this.createConnectionModal();
            document.body.appendChild(modal);
        }

        // Update modal content
        modal.querySelector('.connection-content h3').textContent = `Connect with ${userName}`;
        modal.querySelector('.connection-content p').textContent = 
            `This will initiate a screen sharing session with ${userName}. Both users will be able to see each other's screens and collaborate in real-time.`;

        // Update connect button
        const connectBtn = modal.querySelector('#confirm-connect');
        connectBtn.onclick = () => this.initiateConnection(userId, userName);

        // Show modal
        modal.classList.remove('hidden');
    }

    createConnectionModal() {
        const modal = document.createElement('div');
        modal.id = 'connection-modal';
        modal.className = 'connection-modal hidden';
        modal.innerHTML = `
            <div class="connection-content">
                <h3>Connect with User</h3>
                <p>This will initiate a screen sharing session.</p>
                <div class="connection-actions">
                    <button id="confirm-connect" class="btn btn-primary">Start Session</button>
                    <button id="cancel-connect" class="btn btn-outline">Cancel</button>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('#cancel-connect').onclick = () => {
            modal.classList.add('hidden');
        };

        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };

        return modal;
    }

    initiateConnection(userId, userName) {
        // Close modal
        const modal = document.getElementById('connection-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Show loading state
        this.showConnectionStatus('Connecting...', 'info');

        // Simulate connection process
        setTimeout(() => {
            this.showConnectionStatus(`Connection request sent to ${userName}`, 'success');
            
            // Simulate acceptance after 2 seconds
            setTimeout(() => {
                this.startScreenShare(userId, userName);
            }, 2000);
        }, 1000);
    }

    showConnectionStatus(message, type) {
        // Create or update status notification
        let statusDiv = document.getElementById('connection-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'connection-status';
            statusDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                z-index: 1001;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusDiv);
        }

        statusDiv.textContent = message;
        statusDiv.className = `connection-status ${type}`;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                statusDiv.style.backgroundColor = '#00ff88';
                statusDiv.style.color = '#000000';
                break;
            case 'error':
                statusDiv.style.backgroundColor = '#ff4444';
                break;
            case 'info':
                statusDiv.style.backgroundColor = '#333333';
                break;
        }

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusDiv) {
                statusDiv.style.opacity = '0';
                setTimeout(() => {
                    if (statusDiv.parentNode) {
                        statusDiv.parentNode.removeChild(statusDiv);
                    }
                }, 300);
            }
        }, 3000);
    }

    startScreenShare(userId, userName) {
        // This would initialize WebRTC connection
        console.log(`Starting screen share with ${userName} (ID: ${userId})`);
        
        // Show screen share modal
        const modal = document.getElementById('screen-share-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }

        // Initialize WebRTC (this would be handled by webrtc.js)
        if (window.webrtcManager) {
            window.webrtcManager.startSession(userId, userName);
        }
    }

    messageUser(userId, userName) {
        if (!this.currentUser) {
            alert('Please login to message other users.');
            return;
        }

        // This would open a chat interface
        console.log(`Opening chat with ${userName} (ID: ${userId})`);
        alert(`Opening chat with ${userName}...\n\nThis would open a messaging interface.`);
    }

    setUser(user) {
        this.currentUser = user;
        this.loadOnlineUsers();
    }

    // Method to be called when the study partner page is shown
    onPageShow() {
        this.loadOnlineUsers();
    }
}

// Initialize study partner manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studyPartnerManager = new StudyPartnerManager();
});
