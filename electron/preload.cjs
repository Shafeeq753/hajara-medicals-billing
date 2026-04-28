const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getStoragePath: () => ipcRenderer.invoke('storage:getPath'),
  pickStoragePath: () => ipcRenderer.invoke('storage:pickPath'),
  loadData: () => ipcRenderer.invoke('storage:load'),
  saveData: (data) => ipcRenderer.invoke('storage:save', data),
  exportExcel: (sheets) => ipcRenderer.invoke('storage:exportExcel', sheets),
  openStorageFolder: () => ipcRenderer.invoke('storage:openFolder'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdateNow: () => ipcRenderer.invoke('updater:installNow'),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  openUpdateLog: () => ipcRenderer.invoke('updater:openLog'),
  onUpdaterStatus: (cb) => {
    const listener = (_e, payload) => cb(payload);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  },
  isElectron: true,
});
