// Web-based EdTech Learning Platform
class EdTechApp {
    constructor() {
        this.currentUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            walletBalance: 100.00,
            isOnline: true
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showDashboard();
        this.loadStudyPartners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.currentTarget.dataset.page);
            });
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Wallet recharge
        document.getElementById('process-recharge')?.addEventListener('click', () => {
            this.handleRecharge();
        });

        // WebRTC controls
        document.getElementById('start-screen-share')?.addEventListener('click', () => {
            this.startScreenShare();
        });

        document.getElementById('start-camera-share')?.addEventListener('click', () => {
            this.startCameraShare();
        });

        document.getElementById('test-screen-share')?.addEventListener('click', () => {
            this.testScreenShare();
        });

        document.getElementById('stop-screen-share')?.addEventListener('click', () => {
            this.stopScreenShare();
        });

        document.getElementById('close-share-modal')?.addEventListener('click', () => {
            this.closeScreenShareModal();
        });

        // Connection requests
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-connect')) {
                const userId = e.target.closest('.user-card').dataset.userId;
                const userName = e.target.closest('.user-card').querySelector('.user-name').textContent;
                this.connectToUser(userId, userName);
            }
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    switchPage(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        document.querySelectorAll('.page').forEach(pageElement => {
            pageElement.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        if (page === 'study-partner') {
            this.loadStudyPartners();
        }
    }

    showDashboard() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        this.updateUserInfo();
    }

    updateUserInfo() {
        document.getElementById('user-name').textContent = this.currentUser.fullName;
        document.getElementById('dashboard-user-name').textContent = this.currentUser.fullName;
        document.getElementById('wallet-balance').textContent = `$${this.currentUser.walletBalance.toFixed(2)}`;
        document.getElementById('wallet-page-balance').textContent = `$${this.currentUser.walletBalance.toFixed(2)}`;
    }

    handleLogin() {
        this.showMessage('Login successful!', 'success');
        setTimeout(() => {
            this.showDashboard();
        }, 1000);
    }

    handleRegister() {
        this.showMessage('Registration successful! Please login.', 'success');
        setTimeout(() => {
            this.switchTab('login');
        }, 2000);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            document.getElementById('dashboard-container').classList.add('hidden');
            document.getElementById('auth-container').classList.remove('hidden');
        }
    }

    handleRecharge() {
        const amount = parseFloat(document.getElementById('recharge-amount').value);
        if (amount && amount > 0) {
            this.currentUser.walletBalance += amount;
            this.updateUserInfo();
            this.showNotification(`Successfully recharged $${amount.toFixed(2)}`, 'success');
            document.getElementById('recharge-amount').value = '';
        }
    }

    loadStudyPartners() {
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

        this.renderOnlineUsers(mockUsers);
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
        this.showNotification(`Connecting to ${userName}...`, 'info');
        setTimeout(() => {
            this.showScreenShareModal();
        }, 1000);
    }

    showScreenShareModal() {
        document.getElementById('screen-share-modal').classList.remove('hidden');
    }

    closeScreenShareModal() {
        document.getElementById('screen-share-modal').classList.add('hidden');
        this.stopScreenShare();
    }

    async testScreenShare() {
        try {
            console.log('Testing screen share capabilities...');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                this.showNotification('Screen sharing not supported in this browser', 'error');
                return;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            console.log('Screen sharing test successful!');
            this.showNotification('Screen sharing test successful!', 'success');
            
            stream.getTracks().forEach(track => track.stop());

        } catch (error) {
            console.error('Screen sharing test failed:', error);
            this.showNotification(`Screen sharing test failed: ${error.message}`, 'error');
        }
    }

    async startScreenShare() {
        try {
            console.log('Starting screen share...');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                this.showNotification('Screen sharing not supported in this browser', 'error');
                return;
            }

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: false
            });

            console.log('Screen capture started successfully');
            this.displayLocalStream(stream);
            this.isSharing = true;
            this.updateShareControls();

            // Handle stream end
            stream.getVideoTracks()[0].onended = () => {
                console.log('Screen sharing ended by user');
                this.stopScreenShare();
            };

        } catch (error) {
            console.error('Error starting screen share:', error);
            this.showNotification(`Failed to start screen sharing: ${error.message}`, 'error');
        }
    }

    async startCameraShare() {
        try {
            console.log('Starting camera share...');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showNotification('Camera access not available', 'error');
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log('Camera capture started successfully');
            this.displayLocalStream(stream);
            this.isSharing = true;
            this.updateShareControls();

        } catch (error) {
            console.error('Error starting camera share:', error);
            this.showNotification(`Failed to start camera: ${error.message}`, 'error');
        }
    }

    displayLocalStream(stream) {
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = stream;
        }
    }

    stopScreenShare() {
        const localVideo = document.getElementById('local-video');
        if (localVideo && localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
        }
        this.isSharing = false;
        this.updateShareControls();
    }

    updateShareControls() {
        const startBtn = document.getElementById('start-screen-share');
        const cameraBtn = document.getElementById('start-camera-share');
        const stopBtn = document.getElementById('stop-screen-share');

        if (startBtn) startBtn.disabled = this.isSharing;
        if (cameraBtn) cameraBtn.disabled = this.isSharing;
        if (stopBtn) stopBtn.disabled = !this.isSharing;
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = message;
        messageElement.className = `auth-message ${type}`;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.edtechApp = new EdTechApp();
});



