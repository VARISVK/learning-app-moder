// Authentication functionality using API calls
class AuthManagerAPI {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = window.location.origin; // Use the same domain as the app
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Form validation
        this.setupFormValidation();
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');

        // Clear messages
        this.clearMessage();
    }

    setupFormValidation() {
        // Real-time validation for register form
        const registerForm = document.getElementById('register-form');
        const inputs = registerForm.querySelectorAll('input');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'username':
                if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'Username must be at least 3 characters long';
                } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Username can only contain letters, numbers, and underscores';
                } else if (value.length > 20) {
                    isValid = false;
                    errorMessage = 'Username must be less than 20 characters';
                }
                break;

            case 'email':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Email address is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address (e.g., user@example.com)';
                }
                break;

            case 'password':
                if (value.length < 6) {
                    isValid = false;
                    errorMessage = 'Password must be at least 6 characters long';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = 'Password must be less than 50 characters';
                } else if (!/(?=.*[a-zA-Z])/.test(value)) {
                    isValid = false;
                    errorMessage = 'Password must contain at least one letter';
                }
                break;

            case 'confirmPassword':
                const password = document.getElementById('register-password').value;
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please confirm your password';
                } else if (value !== password) {
                    isValid = false;
                    errorMessage = 'Passwords do not match';
                }
                break;

            case 'fullName':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Full name must be at least 2 characters long';
                } else if (value.length > 50) {
                    isValid = false;
                    errorMessage = 'Full name must be less than 50 characters';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Full name can only contain letters and spaces';
                }
                break;
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message') || this.createErrorElement(formGroup);

        field.classList.remove('error', 'success');
        errorElement.classList.remove('show');

        if (!isValid) {
            field.classList.add('error');
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        } else if (field.value.trim()) {
            field.classList.add('success');
        }
    }

    createErrorElement(formGroup) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
        return errorElement;
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        field.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    async handleLogin() {
        const form = document.getElementById('login-form');
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        if (!credentials.username || !credentials.password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setLoading(submitBtn, true);

        try {
            console.log('Attempting login with:', credentials);
            
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();
            console.log('Login response:', result);
            
            if (result.success) {
                this.currentUser = result.data;
                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    this.showDashboard();
                }, 1500);
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Login failed. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister() {
        const form = document.getElementById('register-form');
        const formData = new FormData(form);
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate all fields
        const inputs = form.querySelectorAll('input[required]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showMessage('Please fix the errors above', 'error');
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setLoading(submitBtn, true);

        try {
            console.log('Attempting registration with data:', userData);
            
            const response = await fetch(`${this.apiBaseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            console.log('Registration response:', result);
            
            if (result.success) {
                this.showMessage('Registration successful! Please login with your credentials.', 'success');
                setTimeout(() => {
                    this.switchTab('login');
                    form.reset();
                }, 2000);
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Registration failed. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = message;
        messageElement.className = `auth-message ${type}`;
    }

    clearMessage() {
        const messageElement = document.getElementById('auth-message');
        messageElement.className = 'auth-message';
    }

    showDashboard() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        
        // Initialize dashboard with user data
        if (window.dashboardManager) {
            window.dashboardManager.setUser(this.currentUser);
        }
    }

    checkAuthState() {
        // Check if user is already logged in (for app restart scenarios)
        // This would typically check localStorage or a token
        // For now, we'll start with the auth screen
    }

    logout() {
        this.currentUser = null;
        document.getElementById('dashboard-container').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        
        // Clear forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        this.clearMessage();
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManagerAPI();
});

