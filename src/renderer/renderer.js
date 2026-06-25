const GAME_NAMES = {
  'cs2.exe': 'Counter-Strike 2',
  'csgo.exe': 'CS:GO',
  'valorant.exe': 'VALORANT',
  'valorant-win64-shipping.exe': 'VALORANT',
  'gta5.exe': 'GTA V',
  'gtav.exe': 'GTA V',
  'rdr2.exe': 'Red Dead Redemption 2',
  'eldenring.exe': 'Elden Ring',
  'sekiro.exe': 'Sekiro',
  'cyberpunk2077.exe': 'Cyberpunk 2077',
  'witcher3.exe': 'The Witcher 3',
  'minecraft.exe': 'Minecraft',
  'javaw.exe': 'Minecraft (Java)',
  'overwatch.exe': 'Overwatch',
  'overwatch2.exe': 'Overwatch 2',
  'fortniteclient-win64-shipping.exe': 'Fortnite',
  'tslgame.exe': 'PUBG',
  'r5apex.exe': 'Apex Legends',
  'destiny2.exe': 'Destiny 2',
  'leagueclient.exe': 'League of Legends',
  'league of legends.exe': 'League of Legends',
  'dota2.exe': 'Dota 2',
  'steam.exe': 'Steam',
  'epicgameslauncher.exe': 'Epic Games',
  'riotclientservices.exe': 'Riot Client',
  'battlenet.exe': 'Battle.net',
  'rocketleague.exe': 'Rocket League',
  'pathofexile.exe': 'Path of Exile',
  'hades.exe': 'Hades',
  'hl2.exe': 'Source Engine Game',
  'warzone.exe': 'Warzone',
  'modernwarfare.exe': 'Modern Warfare',
  'bf2042.exe': 'Battlefield 2042',
  'bf1.exe': 'Battlefield 1',
  'rainbow6.exe': 'Rainbow Six Siege',
  'siege.exe': 'Rainbow Six Siege',
  'r6.exe': 'Rainbow Six Siege',
};

const GAME_ICONS = {
  'cs2.exe': '🎯', 'csgo.exe': '🎯',
  'valorant.exe': '🔫', 'valorant-win64-shipping.exe': '🔫',
  'gta5.exe': '🚗', 'gtav.exe': '🚗', 'rdr2.exe': '🤠',
  'eldenring.exe': '⚔️', 'sekiro.exe': '🗡️',
  'cyberpunk2077.exe': '🌆', 'witcher3.exe': '🧙',
  'minecraft.exe': '⛏️', 'javaw.exe': '⛏️',
  'overwatch.exe': '🦸', 'overwatch2.exe': '🦸',
  'fortniteclient-win64-shipping.exe': '🏆',
  'tslgame.exe': '🪂', 'r5apex.exe': '🦊',
  'destiny2.exe': '🚀', 'leagueclient.exe': '⚡',
  'league of legends.exe': '⚡', 'dota2.exe': '🧿',
  'steam.exe': '🎮', 'epicgameslauncher.exe': '🎮',
  'riotclientservices.exe': '🎮', 'battlenet.exe': '🎮',
  'rocketleague.exe': '🏎️', 'pathofexile.exe': '🌀',
  'hades.exe': '🔱', 'hl2.exe': '🔬',
  'warzone.exe': '💣', 'modernwarfare.exe': '🎖️',
  'bf2042.exe': '🪖', 'bf1.exe': '🪖',
  'rainbow6.exe': '🛡️', 'siege.exe': '🛡️', 'r6.exe': '🛡️',
};



let state = {
  activeGames: [],
  hotkey: '',
};

const gameGrid = document.getElementById('game-grid');
const gameCount = document.getElementById('game-count');
const noGames = document.getElementById('no-games');
const hotkeyDisplay = document.getElementById('hotkey-display');
const panicFlash = document.getElementById('panic-flash');

function formatHotkey(combo) {
  if (!combo) return '–';
  return combo
    .replace('CommandOrControl', 'Ctrl')
    .replace(/\+/g, ' + ');
}

function getDisplayName(game) {
  return GAME_NAMES[game.name] || game.name.replace('.exe', '').replace(/[-_]/g, ' ');
}

function getIcon(game) {
  return GAME_ICONS[game.name] || '🎮';
}

function renderGames(games) {
  state.activeGames = games;
  gameCount.textContent = games.length;

  const existing = gameGrid.querySelectorAll('.game-card');
  const existingMap = {};
  existing.forEach(el => { existingMap[el.dataset.name] = el; });

  const newNames = new Set(games.map(g => g.name));

  Object.keys(existingMap).forEach(name => {
    if (!newNames.has(name)) existingMap[name].remove();
  });

  noGames.style.display = games.length === 0 ? 'flex' : 'none';

  games.forEach(game => {
    if (existingMap[game.name]) {
      const card = existingMap[game.name];
      card.querySelector('.card-pid span:last-child').textContent = `PID ${game.pid}`;
      return;
    }

    const displayName = getDisplayName(game);
    const icon = getIcon(game);

    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.name = game.name;
    card.innerHTML = `
      <div class="card-overlay">
        <button class="btn-manual-kill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          KILL GAME
        </button>
      </div>
      <div class="card-top">
        <div class="card-icon">${icon}</div>
        <div class="card-info">
          <div class="card-name">${displayName}</div>
          <div class="card-exe">${game.name}</div>
        </div>
      </div>
      <div class="card-status">
        <span class="status-dot"></span>
        <span>Running</span>
      </div>
      <div class="card-pid">
        <span>Process ID</span>
        <span>PID ${game.pid}</span>
      </div>
    `;

    card.querySelector('.btn-manual-kill').addEventListener('click', () => {
      window.ks.killGame(game.name);
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
    });

    gameGrid.appendChild(card);
  });
}

function triggerPanicVisual() {
  panicFlash.classList.remove('flash');
  void panicFlash.offsetWidth;
  panicFlash.classList.add('flash');
  renderGames(state.activeGames);
}

async function init() {
  const appState = await window.ks.getState();
  state.hotkey = appState.hotkey;
  state.activeGames = appState.activeGames || [];

  hotkeyDisplay.textContent = formatHotkey(state.hotkey);
  document.getElementById('hotkey-recorder-text').textContent = formatHotkey(state.hotkey);
  document.getElementById('toggle-mute').checked = appState.muteOnPanic;
  document.getElementById('toggle-tray').checked = appState.minimizeToTray;

  const toggleRedirect = document.getElementById('toggle-redirect');
  const redirectWrap = document.getElementById('redirect-url-wrap');
  const redirectUrlInput = document.getElementById('redirect-url');
  toggleRedirect.checked = appState.enableRedirect;
  redirectUrlInput.value = appState.redirectUrl || '';
  redirectWrap.style.display = appState.enableRedirect ? 'block' : 'none';

  const toggleStealth = document.getElementById('toggle-stealth');
  const passcodeInput = document.getElementById('stealth-passcode');
  toggleStealth.checked = appState.stealthMode || false;
  passcodeInput.value = appState.stealthPasscode || '';

  document.getElementById('toggle-minimize').checked = appState.minimizeAll || false;
  document.getElementById('toggle-wipe').checked = appState.wipeEvidence || false;

  const panicLog = await window.ks.getPanicLog();
  renderPanicLog(panicLog);

  renderGames(state.activeGames);
  renderCustomGames(appState.customGames || []);
  renderCustomGames(appState.customGames || []);

  window.ks.onActiveGames(games => renderGames(games));
  window.ks.onPanicFired(snapshot => {
    triggerPanicVisual();
    if (snapshot && snapshot.length) prependLogEntry(snapshot);
  });
}

function renderCustomGames(list) {
  const container = document.getElementById('custom-games-list');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div id="custom-games-empty">No custom games added yet</div>';
    return;
  }

  list.forEach(game => {
    const row = document.createElement('div');
    row.className = 'custom-game-row';
    row.dataset.name = game.name;
    row.innerHTML = `
      <div class="custom-game-icon">🎮</div>
      <div class="custom-game-info">
        <div class="custom-game-label">${game.label}</div>
        <div class="custom-game-exe">${game.name}</div>
      </div>
      <span class="custom-game-badge">CUSTOM</span>
      <button class="btn-remove-game" title="Remove">&#x2715;</button>
    `;
    row.querySelector('.btn-remove-game').addEventListener('click', () => removeCustomGame(game.name, row));
    container.appendChild(row);
  });
}

function renderPanicLog(log) {
  const container = document.getElementById('panic-log-list');
  container.innerHTML = '';
  if (!log || log.length === 0) {
    container.appendChild(createNoHistoryEl());
    return;
  }
  log.forEach(entry => container.appendChild(createLogEntry(entry)));
}

function prependLogEntry(snapshot) {
  const container = document.getElementById('panic-log-list');
  const noHistory = container.querySelector('#no-history');
  if (noHistory) noHistory.remove();
  const entry = { timestamp: new Date().toISOString(), games: snapshot.map(g => ({ name: g.name, pid: g.pid })) };
  container.insertBefore(createLogEntry(entry), container.firstChild);
}

function createNoHistoryEl() {
  const el = document.createElement('div');
  el.id = 'no-history';
  el.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
      <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
    </svg>
    <p>No panics triggered yet</p>
    <span>Your kill history will appear here</span>
  `;
  return el;
}

function createLogEntry(entry) {
  const d = new Date(entry.timestamp);
  const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const gameNames = entry.games.map(g => {
    const display = GAME_NAMES[g.name] || g.name.replace('.exe','').replace(/[-_]/g,' ');
    return `<span class="log-game-tag">${GAME_ICONS[g.name] || '🎮'} ${display}</span>`;
  }).join('');
  const el = document.createElement('div');
  el.className = 'log-entry';
  el.innerHTML = `
    <div class="log-entry-time">
      <span class="log-date">${dateStr}</span>
      <span class="log-time">${timeStr}</span>
    </div>
    <div class="log-entry-body">
      <div class="log-label">Killed ${entry.games.length} process${entry.games.length !== 1 ? 'es' : ''}</div>
      <div class="log-games">${gameNames}</div>
    </div>
    <div class="log-entry-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#ef4444"/>
      </svg>
    </div>
  `;
  return el;
}

async function removeCustomGame(name, rowEl) {
  rowEl.style.opacity = '0.4';
  rowEl.style.pointerEvents = 'none';
  await window.ks.removeCustomGame(name);
  rowEl.remove();
  const container = document.getElementById('custom-games-list');
  if (!container.children.length) {
    container.innerHTML = '<div id="custom-games-empty">No custom games added yet</div>';
  }
}

async function addCustomGame() {
  const nameInput = document.getElementById('custom-game-name');
  const exeInput = document.getElementById('custom-game-exe');
  const errorEl = document.getElementById('custom-game-error');

  const label = nameInput.value.trim();
  const exeRaw = exeInput.value.trim();

  errorEl.textContent = '';

  if (!exeRaw) {
    errorEl.textContent = 'Executable name is required (e.g. mygame.exe)';
    exeInput.focus();
    return;
  }

  const exe = exeRaw.toLowerCase().endsWith('.exe') ? exeRaw.toLowerCase() : exeRaw.toLowerCase() + '.exe';
  const result = await window.ks.addCustomGame({ name: exe, label: label || exe.replace('.exe', '') });

  if (!result.ok) {
    errorEl.textContent = result.error;
    return;
  }

  nameInput.value = '';
  exeInput.value = '';

  const container = document.getElementById('custom-games-list');
  const empty = container.querySelector('#custom-games-empty');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = 'custom-game-row';
  row.dataset.name = result.game.name;
  row.innerHTML = `
    <div class="custom-game-icon">🎮</div>
    <div class="custom-game-info">
      <div class="custom-game-label">${result.game.label}</div>
      <div class="custom-game-exe">${result.game.name}</div>
    </div>
    <span class="custom-game-badge">CUSTOM</span>
    <button class="btn-remove-game" title="Remove">&#x2715;</button>
  `;
  row.querySelector('.btn-remove-game').addEventListener('click', () => removeCustomGame(result.game.name, row));
  container.appendChild(row);
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`page-${btn.dataset.page}`).classList.add('active');
  });
});

document.getElementById('btn-minimize').addEventListener('click', () => window.ks.minimize());
document.getElementById('btn-close').addEventListener('click', () => window.ks.close());

let recordingHotkey = false;

const recorder = document.getElementById('hotkey-recorder');
const recorderText = document.getElementById('hotkey-recorder-text');

recorder.addEventListener('focus', () => {
  recordingHotkey = true;
  recorder.classList.add('recording');
  recorderText.textContent = 'Press a key combination...';
});

recorder.addEventListener('blur', () => {
  recordingHotkey = false;
  recorder.classList.remove('recording');
  if (!recorder.dataset.dirty) {
    recorderText.textContent = formatHotkey(state.hotkey);
  }
});

recorder.addEventListener('keydown', async (e) => {
  if (!recordingHotkey) return;
  e.preventDefault();

  if (e.key === 'Escape') { recorder.blur(); return; }

  const mods = [];
  if (e.ctrlKey) mods.push('CommandOrControl');
  if (e.metaKey) mods.push('Super');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');

  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

  const combo = [...mods, e.key.toUpperCase()].join('+');
  const ok = await window.ks.setHotkey(combo);

  if (ok) {
    state.hotkey = combo;
    recorderText.textContent = formatHotkey(combo);
    hotkeyDisplay.textContent = formatHotkey(combo);
    delete recorder.dataset.dirty;
  } else {
    recorderText.textContent = 'Conflict! Try another combo';
    recorder.dataset.dirty = '1';
  }

  recorder.blur();
});

document.getElementById('hotkey-clear').addEventListener('click', async () => {
  const ok = await window.ks.setHotkey('CommandOrControl+Shift+K');
  if (ok) {
    state.hotkey = 'CommandOrControl+Shift+K';
    recorderText.textContent = formatHotkey(state.hotkey);
    hotkeyDisplay.textContent = formatHotkey(state.hotkey);
  }
});

document.getElementById('toggle-mute').addEventListener('change', (e) => {
  window.ks.setMuteOnPanic(e.target.checked);
});

document.getElementById('toggle-tray').addEventListener('change', (e) => {
  window.ks.setMinimizeToTray(e.target.checked);
});

document.getElementById('toggle-redirect').addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  window.ks.setEnableRedirect(isEnabled);
  document.getElementById('redirect-url-wrap').style.display = isEnabled ? 'block' : 'none';
});

document.getElementById('redirect-url').addEventListener('input', (e) => {
  window.ks.setRedirectUrl(e.target.value);
});

document.getElementById('toggle-stealth').addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  const passcodeInput = document.getElementById('stealth-passcode');
  const passcodeWrap = document.getElementById('stealth-passcode-wrap');
  const passcodeError = document.getElementById('stealth-passcode-error');

  if (isEnabled && !passcodeInput.value.trim()) {
    // Block the toggle and show error
    e.target.checked = false;
    passcodeWrap.style.display = 'block';
    passcodeInput.focus();
    if (passcodeError) {
      passcodeError.textContent = 'Set a passcode first before enabling Stealth Mode.';
      passcodeError.style.display = 'block';
      setTimeout(() => { passcodeError.style.display = 'none'; }, 3000);
    }
    return;
  }

  window.ks.setStealthMode(isEnabled);
  passcodeWrap.style.display = isEnabled ? 'block' : 'none';
  if (passcodeError) passcodeError.style.display = 'none';
});

document.getElementById('stealth-passcode').addEventListener('input', (e) => {
  const val = e.target.value;
  window.ks.setStealthPasscode(val);
  const passcodeError = document.getElementById('stealth-passcode-error');
  if (passcodeError && val.trim()) passcodeError.style.display = 'none';
});

document.getElementById('toggle-minimize').addEventListener('change', (e) => {
  window.ks.setMinimizeAll(e.target.checked);
});

document.getElementById('toggle-wipe').addEventListener('change', (e) => {
  window.ks.setWipeEvidence(e.target.checked);
});

document.getElementById('btn-clear-log').addEventListener('click', async () => {
  await window.ks.clearPanicLog();
  renderPanicLog([]);
});

document.getElementById('btn-browse-exe').addEventListener('click', async () => {
  const fileName = await window.ks.browseExe();
  if (fileName) {
    document.getElementById('custom-game-exe').value = fileName;
    const nameInput = document.getElementById('custom-game-name');
    if (!nameInput.value.trim()) {
      nameInput.value = fileName.replace('.exe', '').replace(/[-_]/g, ' ');
    }
  }
});

document.getElementById('btn-add-game').addEventListener('click', addCustomGame);

document.getElementById('custom-game-exe').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addCustomGame();
});

init();


