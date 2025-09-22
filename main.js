const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.loadFile('src/index.html');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for database operations
const Database = require('./src/database/database');

ipcMain.handle('register-user', async (event, userData) => {
  try {
    console.log('Received registration request:', userData);
    const result = await Database.registerUser(userData);
    console.log('Registration successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Registration failed in main process:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('login-user', async (event, credentials) => {
  try {
    const result = await Database.loginUser(credentials);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-profile', async (event, userId) => {
  try {
    const result = await Database.getUserProfile(userId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-wallet', async (event, userId, amount) => {
  try {
    const result = await Database.updateWallet(userId, amount);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-online-users', async (event, currentUserId) => {
  try {
    const result = await Database.getOnlineUsers(currentUserId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-user-offline', async (event, userId) => {
  try {
    const result = await Database.setUserOffline(userId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
