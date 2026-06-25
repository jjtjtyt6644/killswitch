const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ks', {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  getState: () => ipcRenderer.invoke('get-state'),
  setHotkey: (combo) => ipcRenderer.invoke('set-hotkey', combo),
  setMuteOnPanic: (val) => ipcRenderer.invoke('set-mute-on-panic', val),
  setMinimizeToTray: (val) => ipcRenderer.invoke('set-minimize-to-tray', val),
  setEnableRedirect: (val) => ipcRenderer.invoke('set-enable-redirect', val),
  setRedirectUrl: (val) => ipcRenderer.invoke('set-redirect-url', val),
  setStealthMode: (val) => ipcRenderer.invoke('set-stealth-mode', val),
  setStealthPasscode: (val) => ipcRenderer.invoke('set-stealth-passcode', val),
  setMinimizeAll: (val) => ipcRenderer.invoke('set-minimize-all', val),
  setWipeEvidence: (val) => ipcRenderer.invoke('set-wipe-evidence', val),
  triggerPanic: () => ipcRenderer.invoke('trigger-panic'),
  killGame: (exe) => ipcRenderer.invoke('kill-game', exe),

  getPanicLog: () => ipcRenderer.invoke('get-panic-log'),
  clearPanicLog: () => ipcRenderer.invoke('clear-panic-log'),

  getCustomGames: () => ipcRenderer.invoke('get-custom-games'),
  addCustomGame: (entry) => ipcRenderer.invoke('add-custom-game', entry),
  removeCustomGame: (name) => ipcRenderer.invoke('remove-custom-game', name),
  browseExe: () => ipcRenderer.invoke('browse-exe'),

  onActiveGames: (cb) => ipcRenderer.on('active-games', (_, games) => cb(games)),
  onPanicFired: (cb) => ipcRenderer.on('panic-fired', (_, snapshot) => cb(snapshot))
});
