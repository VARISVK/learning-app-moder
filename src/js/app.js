// Main application initialization
class App {
    constructor() {
        this.isElectron = this.checkElectronEnvironment();
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    checkElectronEnvironment() {
        // Check if running in Electron
        return typeof window !== 'undefined' && 
               window.process && 
               window.process.type === 'renderer';
    }

    initializeApp() {
        console.log('Initializing EdTech Learning Platform...');
        console.log('Environment:', this.isElectron ? 'Electron' : 'Web Browser');

        // Initialize API based on environment
        this.initializeAPI();
        
        // Show the auth container by default
        this.showAuthContainer();
        
        // Initialize other managers
        this.initializeManagers();
    }

    initializeAPI() {
        if (this.isElectron) {
            // Electron environment - use IPC
            console.log('Using Electron IPC for API calls');
        } else {
            // Web environment - use HTTP API
            console.log('Using HTTP API for web version');
            this.setupWebAPI();
        }
    }

    setupWebAPI() {
        // Create a mock electron API for web version
        window.electron = {
            ipcRenderer: {
                invoke: async (channel, ...args) => {
                    console.log(`API call: ${channel}`, args);
                    
                    try {
                        const response = await fetch(`/api/${channel.replace('-', '/')}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(args[0] || {})
                        });
                        
                        const result = await response.json();
                        return result;
                    } catch (error) {
                        console.error(`API error for ${channel}:`, error);
                        return { success: false, error: error.message };
                    }
                }
            }
        };

        // Mock electronAPI for dashboard
        window.electronAPI = {
            setUserOffline: async (userId) => {
                try {
                    const response = await fetch('/api/user/offline', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ userId })
                    });
                    return await response.json();
                } catch (error) {
                    console.error('Error setting user offline:', error);
                }
            }
        };
    }

    showAuthContainer() {
        // Ensure auth container is visible
        const authContainer = document.getElementById('auth-container');
        const dashboardContainer = document.getElementById('dashboard-container');
        
        if (authContainer) {
            authContainer.classList.remove('hidden');
        }
        if (dashboardContainer) {
            dashboardContainer.classList.add('hidden');
        }
    }

    initializeManagers() {
        // Initialize authentication manager based on environment
        if (this.isElectron) {
            if (typeof AuthManager !== 'undefined') {
                window.authManager = new AuthManager();
            }
        } else {
            if (typeof AuthManagerAPI !== 'undefined') {
                window.authManager = new AuthManagerAPI();
            }
        }

        // Initialize dashboard manager
        if (typeof DashboardManager !== 'undefined') {
            window.dashboardManager = new DashboardManager();
        }

        // Initialize wallet manager
        if (typeof WalletManager !== 'undefined') {
            window.walletManager = new WalletManager();
        }

        // Initialize study partner manager
        if (typeof StudyPartnerManager !== 'undefined') {
            window.studyPartnerManager = new StudyPartnerManager();
        }

        // Initialize WebRTC manager
        if (typeof WebRTCManager !== 'undefined') {
            window.webrtcManager = new WebRTCManager();
        }
    }

    // Global error handler
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const messageElement = document.getElementById('auth-message');
        if (messageElement) {
            messageElement.textContent = 'An error occurred. Please try again.';
            messageElement.className = 'auth-message error';
        }
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.handleError(event.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.handleError(event.reason, 'Promise Rejection');
    }
});

// Initialize the application
window.app = new App();
