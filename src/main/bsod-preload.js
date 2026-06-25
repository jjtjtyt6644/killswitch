const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bsod', {
  unlock: () => ipcRenderer.send('bsod-unlock')
});
