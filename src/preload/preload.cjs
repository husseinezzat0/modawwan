const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Folders
  getFolders: () => ipcRenderer.invoke('db:getFolders'),
  createFolder: (folder) => ipcRenderer.invoke('db:createFolder', folder),
  updateFolder: (id, updates) => ipcRenderer.invoke('db:updateFolder', id, updates),
  deleteFolder: (id) => ipcRenderer.invoke('db:deleteFolder', id),

  // Notes
  getNotes: (filters) => ipcRenderer.invoke('db:getNotes', filters),
  getNoteById: (id) => ipcRenderer.invoke('db:getNoteById', id),
  createNote: (note) => ipcRenderer.invoke('db:createNote', note),
  updateNote: (id, updates) => ipcRenderer.invoke('db:updateNote', id, updates),
  deleteNote: (id, permanent) => ipcRenderer.invoke('db:deleteNote', id, permanent),
  restoreNote: (id) => ipcRenderer.invoke('db:restoreNote', id),
  emptyTrash: () => ipcRenderer.invoke('db:emptyTrash'),

  // Tasks
  getTasks: (filters) => ipcRenderer.invoke('db:getTasks', filters),
  createTask: (task) => ipcRenderer.invoke('db:createTask', task),
  updateTask: (id, updates) => ipcRenderer.invoke('db:updateTask', id, updates),
  deleteTask: (id) => ipcRenderer.invoke('db:deleteTask', id),
  getTaskStats: () => ipcRenderer.invoke('db:getTaskStats'),

  // Finance
  getTransactions: (filters) => ipcRenderer.invoke('db:getTransactions', filters),
  createTransaction: (tx) => ipcRenderer.invoke('db:createTransaction', tx),
  updateTransaction: (id, updates) => ipcRenderer.invoke('db:updateTransaction', id, updates),
  deleteTransaction: (id) => ipcRenderer.invoke('db:deleteTransaction', id),
  getFinanceStats: (year, month) => ipcRenderer.invoke('db:getFinanceStats', year, month),

  // Backup & Restore
  exportBackup: () => ipcRenderer.invoke('db:exportBackup'),
  importBackup: (data) => ipcRenderer.invoke('db:importBackup', data),
  saveBackupToFile: () => ipcRenderer.invoke('dialog:saveBackup'),
  restoreBackupFromFile: () => ipcRenderer.invoke('dialog:restoreBackup'),

  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getUpdateState: () => ipcRenderer.invoke('updates:get-state'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.send('updates:install'),
  openReleasePage: () => ipcRenderer.send('updates:open-release'),
  onUpdateState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('updates:state', listener);
    return () => ipcRenderer.removeListener('updates:state', listener);
  },
  onBeforeClose: callback => {
    const listener = () => callback();
    ipcRenderer.on('app:before-close', listener);
    return () => ipcRenderer.removeListener('app:before-close', listener);
  },
  confirmClose: () => ipcRenderer.send('app:confirm-close'),

  // Settings
  getSetting: (key, defaultValue) => ipcRenderer.invoke('db:getSetting', key, defaultValue),
  setSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowStateChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('window:state-changed', listener);
    return () => ipcRenderer.removeListener('window:state-changed', listener);
  },
});
