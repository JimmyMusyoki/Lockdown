const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const path = require('path');

const store = require('./src/store');
const hosts = require('./src/hostsBlocker');
const appBlocker = require('./src/appBlocker');
const lockManager = require('./src/lockManager');
const networkAgent = require('./src/networkAgent');
const crypto = require('crypto');
const networkDiscovery = require('./src/networkDiscovery');
const networkSpeedTest = require('./src/networkSpeedTest');

let mainWindow;
let speedWindow;
let tray;
let watchdogTimer;

async function remoteCommand(host, password, command, payload) {
  const baseUrl = `http://${host.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  const challengeResponse = await fetch(`${baseUrl}/challenge`);
  if (!challengeResponse.ok) throw new Error('Could not reach that device. Check its IP and firewall.');
  const { nonce } = await challengeResponse.json();
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const proof = crypto.createHmac('sha256', passwordHash).update(nonce).digest('hex');
  const response = await fetch(`${baseUrl}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce, proof, command, payload })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Remote command failed.');
  return result.data;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Minimize to tray instead of closing — Cold Turkey does this so the
  // blocker can't be killed just by closing the window.
  mainWindow.on('close', (e) => {
    const data = store.load();
    if (lockManager.isLocked(data.lock)) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'renderer', 'icon.png'));
  tray.setToolTip('Lockdown Blocker');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open', click: () => mainWindow.show() },
      { label: 'Open speed monitor', click: () => createSpeedWindow() },
      { label: 'Quit', click: () => app.exit(0) }
    ])
  );
}

function createSpeedWindow() {
  if (speedWindow && !speedWindow.isDestroyed()) {
    speedWindow.show();
    speedWindow.focus();
    return;
  }
  const { workArea } = screen.getPrimaryDisplay();
  speedWindow = new BrowserWindow({
    width: 310,
    height: 210,
    x: workArea.x + workArea.width - 326,
    y: workArea.y + 18,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  speedWindow.loadFile(path.join(__dirname, 'renderer', 'speed.html'));
  speedWindow.on('closed', () => { speedWindow = null; });
}

// Watchdog: every few seconds, re-apply the hosts block. This defeats
// someone manually editing the hosts file back while a lock is active.
function startWatchdog() {
  clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    const data = store.load();
    if (data.blockedSites.length > 0 || lockManager.isLocked(data.lock)) {
      hosts.applyBlockedSites(data.blockedSites);
    }
  }, 5000);
}

function updateSites(sites) {
  const data = store.load();
  data.blockedSites = sites;
  store.save(data);
  hosts.applyBlockedSites(sites);
  return data;
}

function updateApps(appsList) {
  const data = store.load();
  data.blockedApps = appsList;
  store.save(data);
  return data;
}

function startLock(minutes, password) {
  const data = store.load();
  data.lock = lockManager.startLock(minutes, password);
  store.save(data);
  return data;
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startWatchdog();

  const data = store.load();
  hosts.applyBlockedSites(data.blockedSites);
  appBlocker.startAppBlocking(() => store.load().blockedApps);
  if (data.network?.agentEnabled !== false) {
    networkAgent.startNetworkAgent({
      getData: store.load,
      updateSites,
      updateApps,
      startLock,
      port: data.network?.port || networkAgent.DEFAULT_PORT
    });
  }
});

app.on('window-all-closed', () => {
  // Do nothing on Windows — keep running in tray so the block persists.
});

// ---------- IPC handlers (renderer <-> main) ----------

ipcMain.handle('get-data', () => store.load());

ipcMain.handle('update-sites', (_evt, sites) => {
  return updateSites(sites);
});

ipcMain.handle('update-apps', (_evt, appsList) => {
  return updateApps(appsList);
});

ipcMain.handle('start-lock', (_evt, { minutes, password }) => {
  return startLock(minutes, password);
});

ipcMain.handle('get-lock-status', () => {
  const data = store.load();
  return {
    locked: lockManager.isLocked(data.lock),
    remainingMs: lockManager.timeRemainingMs(data.lock)
  };
});

ipcMain.handle('remote-command', (_evt, { host, password, command, payload }) =>
  remoteCommand(host, password, command, payload)
);

ipcMain.handle('discover-network', () => networkDiscovery.discoverNetwork());

ipcMain.handle('network-speed-test', (event) => networkSpeedTest.measureNetworkSpeed({
  onStage: (stage) => event.sender.send('network-speed-stage', stage)
}));

ipcMain.handle('get-network-groups', () => store.load().network?.groups || []);

ipcMain.handle('save-network-group', (_evt, group) => {
  const data = store.load();
  data.network = data.network || { groups: [] };
  const groups = data.network?.groups || [];
  const cleaned = {
    id: group.id || crypto.randomUUID(),
    name: String(group.name || '').trim().slice(0, 50),
    devices: Array.isArray(group.devices) ? group.devices : []
  };
  if (!cleaned.name) throw new Error('Group name is required.');
  const existing = groups.findIndex((item) => item.id === cleaned.id);
  if (existing >= 0) groups[existing] = cleaned;
  else groups.push(cleaned);
  data.network.groups = groups;
  store.save(data);
  return groups;
});
