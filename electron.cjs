const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;

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
    : `file://${path.join(__dirname, 'dist/index.html')}`; // Fichier construit pour la production

  win.loadURL(loadURL);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
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

// IPC handlers for the application
ipcMain.handle('get-products', async () => {
  // Logic to retrieve products from a database or file
  return [];
});

ipcMain.handle('save-product', async (event, product) => {
  // Logic to save a product
  console.log('Saving product:', product);
  return { success: true };
});

ipcMain.handle('delete-product', async (event, id) => {
  // Logic to delete a product
  console.log('Deleting product:', id);
  return { success: true };
});

ipcMain.handle('save-sale', async (event, sale) => {
  // Logic to save a sale
  console.log('Saving sale:', sale);
  return { success: true };
});

ipcMain.handle('get-sales', async () => {
  // Logic to retrieve sales
  return [];
});

ipcMain.handle('export-data', async () => {
  // Logic to export data
  return { products: [], sales: [] };
});

ipcMain.handle('import-data', async (event, data) => {
  // Logic to import data
  console.log('Importing data:', data);
  return { success: true };
});

ipcMain.handle('save-transaction', async (event, transaction) => {
  // Logic to save a transaction
  console.log('Transaction saved:', transaction);
  return { success: true };
});