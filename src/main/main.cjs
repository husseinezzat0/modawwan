const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const DatabaseManager = require('./db.cjs');
const { pathToFileURL } = require('node:url');
const { validateArgs, validateBackup } = require('./validation.cjs');
const { autoUpdater } = require('electron-updater');
const { compareVersions, isStableRelease, releaseNotesText, safeUpdateError, hasTrustedPublisher } = require('./updateUtils.cjs');
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const RELEASE_PAGE = 'https://github.com/husseinezzat0/modawwan/releases/latest';
const portableBuild = Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
let updateState = { status: 'idle', currentVersion: app.getVersion(), portable: portableBuild };

let mainWindow = null;
let db = null;

// Match the installer identity for Windows taskbar and pinned shortcuts.
if (process.platform === 'win32') app.setAppUserModelId('com.modawwan.notes');

function getDatabasePath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'modawwan_notes.sqlite');
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Custom sleek titlebar
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
  });

  const contents = mainWindow.webContents;
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  contents.session.setPermissionCheckHandler(() => false);
  const openLink = url => {
    try { if (['https:', 'http:', 'mailto:'].includes(new URL(url).protocol)) shell.openExternal(url).catch(console.error); } catch {}
  };
  contents.setWindowOpenHandler(({ url }) => { openLink(url); return { action: 'deny' }; });
  contents.on('will-navigate', (event, url) => { event.preventDefault(); openLink(url); });
  contents.on('will-redirect', event => event.preventDefault());
  contents.on('will-attach-webview', event => event.preventDefault());

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  // Handle window states
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:state-changed', { isMaximized: false });
  });

  let allowClose = false;
  mainWindow.on('close', event => {
    if (!allowClose && !mainWindow.webContents.isDestroyed() && !mainWindow.webContents.isLoadingMainFrame()) { event.preventDefault(); mainWindow.webContents.send('app:before-close'); }
  });
  mainWindow.allowClose = () => { allowClose = true; mainWindow.close(); };

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App Lifecycle
app.whenReady().then(() => {
  const dbPath = getDatabasePath();
  console.log(`Database initialized at: ${dbPath}`);
  db = new DatabaseManager(dbPath);

  setupIpcHandlers();
  configureUpdater();
  createWindow();
  scheduleUpdateCheck(15000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => { if (db) db.close(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function trusted(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) return false;
  const expected = process.env.NODE_ENV === 'development' && process.env.VITE_DEV_SERVER_URL
    ? new URL('/', process.env.VITE_DEV_SERVER_URL).href
    : pathToFileURL(path.join(__dirname, '../../dist/renderer/index.html')).href;
  return event.senderFrame.url.split('#')[0] === expected;
}
function handle(channel, callback) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!trusted(event)) throw new Error('Untrusted IPC sender');
    validateArgs(channel, args);
    return callback(event, ...args);
  });
}
function on(channel, callback) {
  ipcMain.on(channel, (event, ...args) => { if (trusted(event)) callback(event, ...args); });
}
async function confirmRestore() {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning', title: 'Modawwan — Restore backup',
    message: 'Restore backup / استعادة النسخة الاحتياطية',
    detail: 'This replaces current data and preferences. A recovery backup will be saved locally. سيتم استبدال البيانات والإعدادات وحفظ نسخة استرجاع محلية.',
    buttons: ['Cancel / إلغاء', 'Restore / استعادة'], defaultId: 0, cancelId: 0, noLink: true,
  });
  return result.response === 1;
}
function recoveryBackup() {
  const file = path.join(app.getPath('userData'), `before-restore-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(db.exportBackup()), { flag: 'wx' }); return file;
}

function publishUpdateState(patch) {
  updateState = { ...updateState, ...patch, currentVersion: app.getVersion(), portable: portableBuild };
  if (mainWindow && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('updates:state', updateState);
  return updateState;
}
function configureUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.logger = { info() {}, debug() {}, warn(message) { console.warn('Update warning:', safeUpdateError(message)); }, error(message) { console.error('Update error:', safeUpdateError(message)); } };
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.channel = 'latest';
  autoUpdater.disableWebInstaller = true;
  autoUpdater.on('checking-for-update', () => publishUpdateState({ status: 'checking', error: undefined }));
  autoUpdater.on('update-available', info => publishUpdateState({
    status: 'available', version: info.version, releaseNotes: releaseNotesText(info.releaseNotes), error: undefined,
  }));
  autoUpdater.on('update-not-available', info => publishUpdateState({ status: 'not-available', version: info.version || app.getVersion(), releaseNotes: '', progress: undefined, error: undefined }));
  autoUpdater.on('download-progress', progress => publishUpdateState({ status: 'downloading', progress: Math.max(0, Math.min(100, Math.round(progress.percent))) }));
  autoUpdater.on('update-downloaded', info => publishUpdateState({ status: 'downloaded', version: info.version, releaseNotes: releaseNotesText(info.releaseNotes), progress: 100, error: undefined }));
  autoUpdater.on('error', error => publishUpdateState({ status: 'error', error: safeUpdateError(error) }));
}
async function requireUpdateSignatureVerification() {
  // electron-updater 6 otherwise silently accepts an installer without a pinned publisher.
  const config = await autoUpdater.configOnDisk.value;
  if (!hasTrustedPublisher(config)) throw new Error('Update signature verification is not configured; install the official release manually.');
}
async function checkForUpdates(force = false) {
  if (!app.isPackaged) return publishUpdateState({ status: 'error', error: 'Updates are available in the installed app.' });
  if (!force && updateState.status === 'checking') return updateState;
  const lastChecked = new Date().toISOString();
  db.setSetting('lastUpdateCheckAt', lastChecked);
  publishUpdateState({ status: 'checking', lastChecked, error: undefined, progress: undefined });
  try {
    if (portableBuild) {
      const response = await fetch('https://api.github.com/repos/husseinezzat0/modawwan/releases/latest', {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Modawwan-Update-Check' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`GitHub release check failed (${response.status})`);
      const release = await response.json();
      const version = String(release.tag_name || '').replace(/^v/i, '');
      if (isStableRelease(release) && compareVersions(version, app.getVersion()) > 0) {
        return publishUpdateState({ status: 'available', version, releaseNotes: String(release.body || ''), error: undefined });
      }
      return publishUpdateState({ status: 'not-available', version: undefined, releaseNotes: '' });
    }
    await autoUpdater.checkForUpdates();
    return updateState;
  } catch (error) {
    return publishUpdateState({ status: 'error', error: safeUpdateError(error) });
  }
}
function scheduleUpdateCheck(delay = UPDATE_INTERVAL_MS) {
  setTimeout(async () => {
    try {
      const preferences = db?.getSetting('preferences', {}) || {};
      const checkedAt = Date.parse(db?.getSetting('lastUpdateCheckAt', '') || '');
      const elapsed = Date.now() - (Number.isFinite(checkedAt) ? checkedAt : 0);
      if (preferences.autoCheckUpdates !== false && elapsed >= UPDATE_INTERVAL_MS) await checkForUpdates();
      const nextDelay = preferences.autoCheckUpdates === false ? UPDATE_INTERVAL_MS : Math.max(60000, UPDATE_INTERVAL_MS - Math.max(0, elapsed));
      scheduleUpdateCheck(nextDelay);
    } catch (error) { console.error('Scheduled update check failed:', error); scheduleUpdateCheck(UPDATE_INTERVAL_MS); }
  }, delay).unref?.();
}
// Setup IPC Handlers
function setupIpcHandlers() {
  on('app:confirm-close', () => mainWindow?.allowClose());

  // Folders
  handle('db:getFolders', () => db.getFolders());
  handle('db:createFolder', (event, folder) => db.createFolder(folder));
  handle('db:updateFolder', (event, id, updates) => db.updateFolder(id, updates));
  handle('db:deleteFolder', (event, id) => db.deleteFolder(id));

  // Notes
  handle('db:getNotes', (event, filters) => db.getNotes(filters));
  handle('db:getNoteById', (event, id) => db.getNoteById(id));
  handle('db:createNote', (event, note) => db.createNote(note));
  handle('db:updateNote', (event, id, updates) => db.updateNote(id, updates));
  handle('db:deleteNote', (event, id, permanent) => db.deleteNote(id, permanent));
  handle('db:restoreNote', (event, id) => db.restoreNote(id));
  handle('db:emptyTrash', () => db.emptyTrash());

  // Tasks
  handle('db:getTasks', (event, filters) => db.getTasks(filters));
  handle('db:createTask', (event, task) => db.createTask(task));
  handle('db:updateTask', (event, id, updates) => db.updateTask(id, updates));
  handle('db:deleteTask', (event, id) => db.deleteTask(id));
  handle('db:getTaskStats', () => db.getTaskStats());

  // Finance
  handle('db:getTransactions', (event, filters) => db.getTransactions(filters));
  handle('db:createTransaction', (event, tx) => db.createTransaction(tx));
  handle('db:updateTransaction', (event, id, updates) => db.updateTransaction(id, updates));
  handle('db:deleteTransaction', (event, id) => db.deleteTransaction(id));
  handle('db:getFinanceStats', (event, year, month) => db.getFinanceStats(year, month));

  // Backup & Restore
  handle('db:exportBackup', () => db.exportBackup());
  handle('db:importBackup', async (event, data) => {
    validateBackup(data);
    if (!await confirmRestore()) return { success: false, canceled: true };
    const recoveryPath = recoveryBackup();
    try {
      db.importBackup(data);
      return { success: true, recoveryPath };
    } catch (err) {
      console.error('Import failed, database intact/rolled back. Safety snapshot:', recoveryPath, err);
      throw err;
    }
  });

  handle('dialog:saveBackup', async () => {
    const defaultPath = path.join(app.getPath('documents'), `modawwan-backup-${new Date().toISOString().split('T')[0]}.json`);
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ نسخة احتياطية',
      defaultPath,
      filters: [{ name: 'JSON Backup', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const backupData = db.exportBackup();
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    return { success: true, filePath };
  });

  handle('dialog:restoreBackup', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'استعادة نسخة احتياطية',
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) return { success: false, canceled: true };

    if (fs.statSync(filePaths[0]).size > 32000000) throw new Error('Backup exceeds 32 MB');
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const backupData = validateBackup(JSON.parse(content));
    if (!await confirmRestore()) return { success: false, canceled: true };
    const recoveryPath = recoveryBackup();
    try { db.importBackup(backupData);
    return { success: true, filePath: filePaths[0], recoveryPath }; } catch (err) { console.error('Import failed, database intact/rolled back. Safety snapshot:', recoveryPath, err); throw err; }
  });

  handle('app:getInfo', () => ({ version: app.getVersion(), dataPath: getDatabasePath(), updatesSupported: app.isPackaged }));
  handle('updates:get-state', () => ({ ...updateState, lastChecked: db.getSetting('lastUpdateCheckAt', undefined) }));
  handle('updates:check', () => checkForUpdates(true));
  handle('updates:download', async () => {
    if (!app.isPackaged || portableBuild || updateState.status !== 'available') throw new Error('No installable update is available');
    try { await requireUpdateSignatureVerification(); await autoUpdater.downloadUpdate(); } catch (error) { publishUpdateState({ status: 'error', error: safeUpdateError(error) }); throw new Error(safeUpdateError(error)); }
  });
  on('updates:install', async () => {
    if (!app.isPackaged || portableBuild || updateState.status !== 'downloaded') return;
    try { await requireUpdateSignatureVerification(); autoUpdater.quitAndInstall(false, true); }
    catch (error) { publishUpdateState({ status: 'error', error: safeUpdateError(error) }); }
  });
  on('updates:open-release', () => shell.openExternal(RELEASE_PAGE));

  // Settings
  handle('db:getSetting', (event, key, defaultValue) => db.getSetting(key, defaultValue));
  handle('db:setSetting', (event, key, value) => db.setSetting(key, value));

  // Window Controls
  on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });
}
