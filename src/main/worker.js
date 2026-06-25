const { parentPort } = require('worker_threads');
const { execFile } = require('child_process');

const BUILTIN_GAMES = new Set([
  'csgo.exe', 'cs2.exe', 'valorant.exe', 'valorant-win64-shipping.exe',
  'gta5.exe', 'gtav.exe', 'rdr2.exe', 'eldenring.exe', 'sekiro.exe',
  'cyberpunk2077.exe', 'witcher3.exe', 'minecraft.exe', 'javaw.exe',
  'overwatch.exe', 'overwatch2.exe', 'cod.exe', 'modernwarfare.exe',
  'warzone.exe', 'fortniteclient-win64-shipping.exe', 'tslgame.exe',
  'r5apex.exe', 'destiny2.exe', 'leagueclient.exe', 'league of legends.exe',
  'dota2.exe', 'steam.exe', 'steamwebhelper.exe', 'epicgameslauncher.exe',
  'riotclientservices.exe', 'battlenet.exe', 'bf2042.exe', 'bf1.exe',
  'hl2.exe', 'terraria.exe', 'stardewvalley.exe', 'hades.exe',
  'rocketleague.exe', 'paladins.exe', 'pathofexile.exe',
  'rainbow6.exe', 'siege.exe', 'r6.exe', 'pubg.exe', 'rocketleague.exe',
]);

let customGameSet = new Set();

function getTargets() {
  return new Set([...BUILTIN_GAMES, ...customGameSet]);
}

parentPort.on('message', (msg) => {
  if (msg.type === 'custom-games') {
    customGameSet = new Set(msg.games.map(g => g.name.toLowerCase()));
  }
});

let lastHash = '';

function parseTasklist(stdout) {
  const lines = stdout.trim().split('\n');
  const processes = [];
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const name = parts[0].replace(/"/g, '').trim().toLowerCase();
    const pid = parseInt(parts[1].replace(/"/g, '').trim(), 10);
    if (!isNaN(pid)) processes.push({ name, pid });
  }
  return processes;
}

function scan() {
  execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true }, (err, stdout) => {
    if (!err && stdout) {
      const targets = getTargets();
      const all = parseTasklist(stdout);
      const games = all.filter(p => targets.has(p.name));
      const hash = games.map(g => `${g.name}:${g.pid}`).join('|');

      if (hash !== lastHash) {
        lastHash = hash;
        parentPort.postMessage(games);
      }
    }
    setTimeout(scan, 1000);
  });
}

scan();
