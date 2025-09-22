const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // User authentication
  registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
  loginUser: (credentials) => ipcRenderer.invoke('login-user', credentials),
  getUserProfile: (userId) => ipcRenderer.invoke('get-user-profile', userId),
  
  // Wallet management
  updateWallet: (userId, amount) => ipcRenderer.invoke('update-wallet', userId, amount),
  
  // User management
  getOnlineUsers: (currentUserId) => ipcRenderer.invoke('get-online-users', currentUserId),
  setUserOffline: (userId) => ipcRenderer.invoke('set-user-offline', userId),
  
  // App events
  onAppClose: (callback) => ipcRenderer.on('app-close', callback),
  onUserUpdate: (callback) => ipcRenderer.on('user-update', callback)
});
