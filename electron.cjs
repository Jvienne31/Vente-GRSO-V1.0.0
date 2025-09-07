const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const loadURL = isDev
    ? 'http://localhost:5173' // URL du serveur de développement Vite
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Fichier construit pour la production

  win.loadURL(loadURL);

  // if (isDev) {
  //   win.webContents.openDevTools();
  // }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  createWindow();

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

// Exemples de gestionnaires IPC (à adapter selon les besoins de l'application)
ipcMain.handle('get-products', async () => {
  // Logique pour récupérer les produits depuis une base de données ou un fichier
  return [];
});

ipcMain.handle('save-transaction', async (event, transaction) => {
  // Logique pour sauvegarder une transaction
  console.log('Transaction enregistrée:', transaction);
  return { success: true };
});