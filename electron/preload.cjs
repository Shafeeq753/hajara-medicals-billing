const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getStoragePath: () => ipcRenderer.invoke('storage:getPath'),
  pickStoragePath: () => ipcRenderer.invoke('storage:pickPath'),
  loadData: () => ipcRenderer.invoke('storage:load'),
  saveData: (data) => ipcRenderer.invoke('storage:save', data),
  exportExcel: (sheets) => ipcRenderer.invoke('storage:exportExcel', sheets),
  openStorageFolder: () => ipcRenderer.invoke('storage:openFolder'),
  isElectron: true,
});
