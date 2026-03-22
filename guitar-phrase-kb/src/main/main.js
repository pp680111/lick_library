const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const PhraseDatabase = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Log renderer errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer console:', level, message, line, sourceId);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('db:getPhrases', (event, filter) => db.getPhrases(filter));
  ipcMain.handle('db:getPhrase', (event, id) => db.getPhrase(id));
  ipcMain.handle('db:createPhrase', (event, data) => db.createPhrase(data));
  ipcMain.handle('db:updatePhrase', (event, id, data) => db.updatePhrase(id, data));
  ipcMain.handle('db:deletePhrase', (event, id) => db.deletePhrase(id));
  ipcMain.handle('db:getTags', () => db.getTags());
  ipcMain.handle('db:createTag', (event, name, type) => db.createTag(name, type));
  ipcMain.handle('db:deleteTag', (event, id) => db.deleteTag(id));
  ipcMain.handle('db:searchPhrases', (event, query) => db.searchPhrases(query));
  ipcMain.handle('app:getDataPath', () => app.getPath('userData'));
}

app.whenReady().then(async () => {
  try {
    console.log('Main process starting...');
    db = new PhraseDatabase(path.join(app.getPath('userData'), 'guitar-phrase-kb.db'));
    await db.initialize();
    console.log('Database initialized');
    registerIpcHandlers();
    console.log('IPC handlers registered');
    createWindow();
  } catch (error) {
    console.error('Main process error:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
