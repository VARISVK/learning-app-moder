// Wallet functionality
class WalletManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRechargePresets();
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
        // Recharge form
        document.getElementById('process-recharge').addEventListener('click', () => {
            this.handleRecharge();
        });

        // Recharge amount input
        document.getElementById('recharge-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleRecharge();
            }
        });

        // Amount validation
        document.getElementById('recharge-amount').addEventListener('input', (e) => {
            this.validateAmount(e.target.value);
        });
    }

    setupRechargePresets() {
        const presets = [10, 25, 50, 100, 200];
        const rechargeForm = document.querySelector('.recharge-form');
        
        // Create presets container
        const presetsContainer = document.createElement('div');
        presetsContainer.className = 'recharge-presets';
        
        presets.forEach(amount => {
            const presetBtn = document.createElement('button');
            presetBtn.className = 'preset-amount';
            presetBtn.textContent = `$${amount}`;
            presetBtn.addEventListener('click', () => {
                this.selectPreset(amount, presetBtn);
            });
            presetsContainer.appendChild(presetBtn);
        });

        // Insert presets before the input
        rechargeForm.insertBefore(presetsContainer, document.getElementById('recharge-amount'));
    }

    selectPreset(amount, button) {
        // Update input value
        document.getElementById('recharge-amount').value = amount;
        
        // Update preset buttons
        document.querySelectorAll('.preset-amount').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Validate amount
        this.validateAmount(amount.toString());
    }

    validateAmount(value) {
        const amount = parseFloat(value);
        const input = document.getElementById('recharge-amount');
        const button = document.getElementById('process-recharge');
        
        // Clear previous validation
        input.classList.remove('error', 'success');
        
        if (isNaN(amount) || amount <= 0) {
            input.classList.add('error');
            button.disabled = true;
            return false;
        } else if (amount > 1000) {
            input.classList.add('error');
            button.disabled = true;
            this.showMessage('Maximum recharge amount is $1000', 'error');
            return false;
        } else {
            input.classList.add('success');
            button.disabled = false;
            this.clearMessage();
            return true;
        }
    }

    async handleRecharge() {
        const amountInput = document.getElementById('recharge-amount');
        const amount = parseFloat(amountInput.value);

        if (!this.validateAmount(amount.toString())) {
            return;
        }

        if (!this.currentUser) {
            this.showMessage('User not authenticated', 'error');
            return;
        }

        const button = document.getElementById('process-recharge');
        this.setLoading(button, true);

        try {
            const result = await window.electron.ipcRenderer.invoke('update-wallet', this.currentUser.id, amount);
            
            if (result.success) {
                // Update user's wallet balance
                this.currentUser.walletBalance += amount;
                
                // Update UI
                this.updateWalletBalance(this.currentUser.walletBalance);
                
                // Show success message
                this.showMessage(`Successfully recharged $${amount.toFixed(2)}`, 'success');
                
                // Clear form
                amountInput.value = '';
                document.querySelectorAll('.preset-amount').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Reload transaction history
                this.loadTransactionHistory();
                
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Recharge failed. Please try again.', 'error');
        } finally {
            this.setLoading(button, false);
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

    updateWalletBalance(balance) {
        // Update header balance
        const headerBalance = document.getElementById('wallet-balance');
        if (headerBalance) {
            headerBalance.textContent = `$${balance.toFixed(2)}`;
        }
        
        // Update wallet page balance
        const pageBalance = document.getElementById('wallet-page-balance');
        if (pageBalance) {
            pageBalance.textContent = `$${balance.toFixed(2)}`;
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.wallet-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `wallet-message ${type}`;
        messageElement.textContent = message;
        
        // Insert after recharge section
        const rechargeSection = document.querySelector('.recharge-section');
        rechargeSection.insertAdjacentElement('afterend', messageElement);
        
        // Auto-remove success messages
        if (type === 'success') {
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
    }

    clearMessage() {
        const existingMessage = document.querySelector('.wallet-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    async loadTransactionHistory() {
        if (!this.currentUser) return;

        try {
            // This would typically load from the database
            // For now, we'll show mock data
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
                },
                {
                    id: 3,
                    amount: 25.00,
                    type: 'credit',
                    description: 'Wallet recharge',
                    date: new Date(Date.now() - 172800000).toISOString()
                }
            ];

            this.renderTransactions(transactions);
        } catch (error) {
            console.error('Error loading transaction history:', error);
        }
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

    setUser(user) {
        this.currentUser = user;
        this.updateWalletBalance(user.walletBalance);
        this.loadTransactionHistory();
    }
}

// Initialize wallet manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});
