const { Worker } = require('worker_threads');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Tray,
  Menu,
  nativeImage,
  dialog,
  shell,
  clipboard
} = require('electron');

const net = require('net');
const PIPE_NAME = '\\\\.\\pipe\\killswitch-single-instance';

function enforceSingleInstanceAndBecomeServer() {
  return new Promise((resolve) => {
    const client = net.connect(PIPE_NAME, () => {
      // Connected to existing instance. Tell it to quit.
      client.write('QUIT');
      // When the old instance closes its connection (dies), we take over.
      client.on('close', () => startServer(resolve));
      client.on('error', () => startServer(resolve));
    });

    client.on('error', () => {
      // No existing instance running.
      startServer(resolve);
    });
  });
}

function startServer(resolve, retries = 3) {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => {
      if (data.toString().trim() === 'QUIT') {
        socket.end();
        setTimeout(() => { app.quit(); process.exit(0); }, 200);
      }
    });
  });
  server.listen(PIPE_NAME, () => resolve());
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      // Pipe may be stale from a hard crash — wait and retry
      setTimeout(() => startServer(resolve, retries - 1), 400);
    } else {
      resolve(); // Give up and start anyway
    }
  });
}

let mainWindow;
let tray;
let worker;
let currentHotkey = 'CommandOrControl+Shift+K';
let muteOnPanic = true;
let minimizeToTray = false;
let enableRedirect = false;
let redirectUrl = 'https://google.com';
let stealthMode = false;
let stealthPasscode = 'safe';
let minimizeAll = false;
let wipeEvidence = false;
let activeGames = [];
let customGames = [];
let panicLog = [];

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    const s = JSON.parse(raw);
    if (s.hotkey) currentHotkey = s.hotkey;
    if (typeof s.muteOnPanic === 'boolean') muteOnPanic = s.muteOnPanic;
    if (typeof s.minimizeToTray === 'boolean') minimizeToTray = s.minimizeToTray;
    if (typeof s.enableRedirect === 'boolean') enableRedirect = s.enableRedirect;
    if (s.redirectUrl) redirectUrl = s.redirectUrl;
    if (typeof s.stealthMode === 'boolean') stealthMode = s.stealthMode;
    if (s.stealthPasscode) stealthPasscode = s.stealthPasscode;
    if (typeof s.minimizeAll === 'boolean') minimizeAll = s.minimizeAll;
    if (typeof s.wipeEvidence === 'boolean') wipeEvidence = s.wipeEvidence;
  } catch { /* first run, use defaults */ }
}

function saveSettings() {
  fs.writeFileSync(
    getSettingsPath(),
    JSON.stringify({ hotkey: currentHotkey, muteOnPanic, minimizeToTray, enableRedirect, redirectUrl, stealthMode, stealthPasscode, minimizeAll, wipeEvidence }, null, 2),
    'utf8'
  );
}

function getPanicLogPath() {
  return path.join(app.getPath('userData'), 'panic-log.json');
}

function loadPanicLog() {
  try {
    const raw = fs.readFileSync(getPanicLogPath(), 'utf8');
    panicLog = JSON.parse(raw);
  } catch {
    panicLog = [];
  }
}

function savePanicLog() {
  fs.writeFileSync(getPanicLogPath(), JSON.stringify(panicLog, null, 2), 'utf8');
}

function appendPanicLog(games) {
  panicLog.unshift({
    timestamp: new Date().toISOString(),
    games: games.map(g => ({ name: g.name, pid: g.pid }))
  });
  if (panicLog.length > 100) panicLog = panicLog.slice(0, 100);
  savePanicLog();
}

function showBsod(callback) {
  let unlocked = false;

  // Block system-level shortcuts while BSOD is active
  globalShortcut.register('Alt+F4', () => {});
  globalShortcut.register('Super', () => {});
  globalShortcut.register('Super+D', () => {});
  globalShortcut.register('Super+Tab', () => {});
  globalShortcut.register('Alt+Tab', () => {});

  const bsod = new BrowserWindow({
    kiosk: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'bsod-preload.js')
    }
  });

  bsod.loadFile(path.join(__dirname, '../renderer/bsod.html'));

  // Inject passcode after page loads (more reliable than query params)
  bsod.webContents.once('did-finish-load', () => {
    bsod.focus();
    const safe = stealthPasscode.replace(/'/g, "\\'");
    bsod.webContents.executeJavaScript(`window.__BSOD_PASSCODE__ = '${safe}';`);
  });

  // Hard block the close event
  bsod.on('close', (e) => {
    if (!unlocked) e.preventDefault();
  });

  function doClose() {
    unlocked = true;
    // Re-register the real hotkey and unblock system shortcuts
    globalShortcut.unregister('Alt+F4');
    globalShortcut.unregister('Super');
    globalShortcut.unregister('Super+D');
    globalShortcut.unregister('Super+Tab');
    globalShortcut.unregister('Alt+Tab');
    bsod.close();
    if (callback) callback();
  }

  ipcMain.once('bsod-unlock', doClose);
}

function getCustomGamesPath() {
  return path.join(app.getPath('userData'), 'custom-games.json');
}

function loadCustomGames() {
  try {
    const raw = fs.readFileSync(getCustomGamesPath(), 'utf8');
    customGames = JSON.parse(raw);
  } catch {
    customGames = [];
  }
}

function saveCustomGames() {
  fs.writeFileSync(getCustomGamesPath(), JSON.stringify(customGames, null, 2), 'utf8');
}

function pushCustomGamesToWorker() {
  if (worker) worker.postMessage({ type: 'custom-games', games: customGames });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    transparent: false,
    backgroundColor: '#08080c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (minimizeToTray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const trayIconPath = path.join(__dirname, '../../assets/tray.png');
  const icon = fs.existsSync(trayIconPath)
    ? nativeImage.createFromPath(trayIconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Killswitch');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Killswitch', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ])
  );
  tray.on('double-click', () => mainWindow.show());
}

function spawnWorker() {
  worker = new Worker(path.join(__dirname, 'worker.js'));

  worker.on('message', (games) => {
    activeGames = games;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('active-games', games);
    }
  });

  worker.on('error', (err) => console.error('Worker error:', err));

  worker.on('online', () => pushCustomGamesToWorker());
}

function registerHotkey(combo) {
  globalShortcut.unregisterAll();
  const ok = globalShortcut.register(combo, () => triggerPanic());
  if (ok) currentHotkey = combo;
  return ok;
}

function triggerPanic() {
  if (activeGames.length === 0) return;

  const snapshot = [...activeGames];
  appendPanicLog(snapshot);

  const exesToKill = new Set(snapshot.map(g => g.name));
  for (const exe of exesToKill) {
    exec(`taskkill /F /T /IM "${exe}"`, (err) => {
      if (err) console.error(`Kill failed for ${exe}:`, err.message);
    });
  }

  if (muteOnPanic) {
    const script = path.join(__dirname, '../../scripts/mute.ps1');
    exec(`powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "${script}"`);
  }

  if (minimizeAll) {
    exec(`powershell -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"`);
  }

  if (wipeEvidence) {
    clipboard.clear();
    exec(`powershell -Command "Remove-Item -Path $env:APPDATA\\Microsoft\\Windows\\Recent\\* -Force -Recurse -ErrorAction SilentlyContinue"`);
  }

  const doRedirect = () => {
    if (enableRedirect && redirectUrl.trim()) {
      let urlToOpen = redirectUrl.trim();
      if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://') && !urlToOpen.startsWith('file://')) {
        urlToOpen = 'https://' + urlToOpen;
      }
      shell.openExternal(urlToOpen).catch(err => console.error('Redirect failed:', err));
    }
  };

  if (stealthMode) {
    showBsod(doRedirect);
  } else {
    doRedirect();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('panic-fired', snapshot);
  }
}

app.whenReady().then(async () => {
  await enforceSingleInstanceAndBecomeServer();
  loadSettings();
  loadCustomGames();
  loadPanicLog();
  createWindow();
  createTray();
  spawnWorker();
  registerHotkey(currentHotkey);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (worker) worker.terminate();
});

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close', () => {
  if (minimizeToTray) mainWindow.hide();
  else app.quit();
});

ipcMain.handle('get-state', () => ({
  hotkey: currentHotkey,
  muteOnPanic,
  minimizeToTray,
  enableRedirect,
  redirectUrl,
  stealthMode,
  stealthPasscode,
  minimizeAll,
  wipeEvidence,
  activeGames,
  customGames
}));

ipcMain.handle('set-stealth-passcode', (_, val) => { stealthPasscode = val; saveSettings(); return true; });
ipcMain.handle('set-minimize-all', (_, val) => { minimizeAll = val; saveSettings(); return true; });
ipcMain.handle('set-wipe-evidence', (_, val) => { wipeEvidence = val; saveSettings(); return true; });

ipcMain.handle('get-panic-log', () => panicLog);
ipcMain.handle('clear-panic-log', () => { panicLog = []; savePanicLog(); return true; });

ipcMain.handle('get-custom-games', () => customGames);

ipcMain.handle('add-custom-game', (_, entry) => {
  const name = entry.name.toLowerCase().trim();
  if (!name.endsWith('.exe')) return { ok: false, error: 'Must be a .exe file name' };
  if (customGames.find(g => g.name === name)) return { ok: false, error: 'Already in list' };
  const game = { name, label: entry.label || name.replace('.exe', '') };
  customGames.push(game);
  saveCustomGames();
  pushCustomGamesToWorker();
  return { ok: true, game };
});

ipcMain.handle('remove-custom-game', (_, name) => {
  customGames = customGames.filter(g => g.name !== name);
  saveCustomGames();
  pushCustomGamesToWorker();
  return true;
});

ipcMain.handle('browse-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Game Executable',
    filters: [{ name: 'Executables', extensions: ['exe'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  return path.basename(filePath);
});

ipcMain.handle('set-hotkey', (_, combo) => {
  const ok = registerHotkey(combo);
  if (ok) saveSettings();
  return ok;
});

ipcMain.handle('set-mute-on-panic', (_, val) => { muteOnPanic = val; saveSettings(); return true; });
ipcMain.handle('set-minimize-to-tray', (_, val) => { minimizeToTray = val; saveSettings(); return true; });
ipcMain.handle('set-enable-redirect', (_, val) => { enableRedirect = val; saveSettings(); return true; });
ipcMain.handle('set-redirect-url', (_, val) => { redirectUrl = val; saveSettings(); return true; });
ipcMain.handle('set-stealth-mode', (_, val) => { stealthMode = val; saveSettings(); return true; });

ipcMain.handle('trigger-panic', () => { triggerPanic(); return true; });

ipcMain.handle('kill-game', (_, exe) => {
  exec(`taskkill /F /T /IM "${exe}"`, (err) => {
    if (err) console.error(`Kill failed for ${exe}:`, err.message);
  });
  return true;
});
