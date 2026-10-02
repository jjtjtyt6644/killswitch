# Killswitch


## NOTICE

**COUNTLESS BUGS ARE PRESENT IN THIS PROJECT, only in the stealth screen and bsod screen, other func remain functional.**

One hotkey to kill every game on your screen, instantly.

Built with Electron. Runs in your system tray. Does exactly what it says.

---

## What it does

Press your panic hotkey and Killswitch kills all detected game processes in one shot. No confirmations, no delays. If you've got Stealth Mode on, it throws up a fake Windows BSOD first so nobody sees what was open. Everything disappears before anyone can look over your shoulder.

You can also hover over a running game card in the dashboard and manually close just that one.

---

## Features

- **Panic hotkey** — bind any key combo, fires globally even when the app is minimized
- **Auto game detection** — picks up CS2, Valorant, Fortnite, League, and 30+ others automatically
- **Custom games** — add any .exe you want monitored
- **Stealth Mode** — fullscreen fake BSOD on panic, locked with a passcode only you know
- **Safe page redirect** — opens a URL or app right after the kill
- **Auto-minimize everything** — hides all open windows (Win+D) before anything else
- **Wipe evidence** — clears clipboard and Windows Recent Files on panic
- **Mute audio on panic** — silences everything immediately
- **Panic history** — log of every time it fired and what got killed
- **Single instance** — opening a second copy kills the old one, no duplicates in tray
- **Minimize to tray** — stays running silently in the background

---

## Running from source

```bash
npm install
npm start
```

Requires Node.js and npm.

## Building the installer

```bash
npm run build
```

Output goes to `dist/`. You'll get a standard Windows NSIS installer.

---

## Passcode unlock (BSOD mode)

When Stealth Mode is on, the BSOD screen is completely locked — Alt+F4, Windows key, nothing works. To close it you just type your passcode anywhere. You don't need to click anything first, just type. It uses a rolling buffer so if your password is `safe` and you mash `asdfasafe` it still unlocks. No prompt on screen, no indicator, it just closes.

Set your passcode in Settings before enabling Stealth Mode or it won't let you turn it on.

---

## Settings are saved

Everything persists between sessions — hotkey, toggles, custom games, redirect URL, passcode. Stored locally in your app data folder, nothing leaves your machine.

---

## Stack

- Electron
- Vanilla JS / HTML / CSS
- PowerShell (audio muting, evidence wiping)
- Node worker threads (background process scanning)
