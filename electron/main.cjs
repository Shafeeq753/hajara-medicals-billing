const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
const DATA_FILENAME = 'hajara-data.json';

let mainWindow = null;

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

function dataFilePath() {
  const cfg = readConfig();
  if (!cfg.storageDir) return null;
  return path.join(cfg.storageDir, DATA_FILENAME);
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Shafeeq753',
    repo: 'hajara-medicals-billing',
  });

  autoUpdater.on('checking-for-update', () => send('updater:status', { state: 'checking' }));
  autoUpdater.on('update-available', info => send('updater:status', { state: 'available', version: info?.version }));
  autoUpdater.on('update-not-available', () => send('updater:status', { state: 'none' }));
  autoUpdater.on('download-progress', p => send('updater:status', { state: 'downloading', percent: p?.percent }));
  autoUpdater.on('update-downloaded', info => send('updater:status', { state: 'ready', version: info?.version }));
  autoUpdater.on('error', err => send('updater:status', { state: 'error', message: err?.message || String(err) }));

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.warn('Auto-update check failed:', err?.message || err);
    });
  }, 4000);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: 'Hajara Medicals',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  setupAutoUpdater();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('storage:getPath', () => {
  const cfg = readConfig();
  return cfg.storageDir || null;
});

ipcMain.handle('storage:pickPath', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose where to save Hajara Medicals data',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Use this folder',
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const newDir = result.filePaths[0];
  const oldCfg = readConfig();
  const oldFile = oldCfg.storageDir ? path.join(oldCfg.storageDir, DATA_FILENAME) : null;
  const newFile = path.join(newDir, DATA_FILENAME);

  if (oldFile && oldFile !== newFile && fs.existsSync(oldFile) && !fs.existsSync(newFile)) {
    try {
      await fsp.copyFile(oldFile, newFile);
    } catch (err) {
      console.error('Failed to migrate data file:', err);
    }
  }

  writeConfig({ ...oldCfg, storageDir: newDir });
  return newDir;
});

ipcMain.handle('storage:load', async () => {
  const file = dataFilePath();
  if (!file || !fs.existsSync(file)) return null;
  try {
    const raw = await fsp.readFile(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read data file:', err);
    return { __error: String(err) };
  }
});

ipcMain.handle('storage:save', async (_e, data) => {
  const file = dataFilePath();
  if (!file) throw new Error('Storage location not configured');
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fsp.rename(tmp, file);
  return true;
});

ipcMain.handle('storage:exportExcel', async (_e, sheets) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export data as Excel',
    defaultPath: `hajara-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  });
  if (result.canceled || !result.filePath) return null;

  const XLSX = require('xlsx');
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(Array.isArray(rows) ? rows : []);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, result.filePath);
  return result.filePath;
});

ipcMain.handle('storage:openFolder', async () => {
  const cfg = readConfig();
  if (cfg.storageDir) await shell.openPath(cfg.storageDir);
  return true;
});

ipcMain.handle('updater:check', async () => {
  if (isDev) return { state: 'dev' };
  try {
    const result = await autoUpdater.checkForUpdates();
    return { state: 'checked', version: result?.updateInfo?.version || null };
  } catch (err) {
    return { state: 'error', message: err?.message || String(err) };
  }
});

ipcMain.handle('updater:installNow', async () => {
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return true;
});

ipcMain.handle('app:getVersion', () => app.getVersion());
