const { app, BrowserWindow, ipcMain, Menu, Tray, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const https = require('https');

const store = require('./src/store');
const hosts = require('./src/hostsBlocker');
const appBlocker = require('./src/appBlocker');
const lockManager = require('./src/lockManager');
const networkAgent = require('./src/networkAgent');
const crypto = require('crypto');
const networkDiscovery = require('./src/networkDiscovery');
const networkSpeedTest = require('./src/networkSpeedTest');
const windowsPermissions = require('./src/windowsPermissions');
const { normalizeList, normalizeDuration } = require('./src/inputValidation');

const appIcon = path.join(__dirname, 'renderer', 'spacecraft.png');

let mainWindow;
let speedWindow;
let tray;
let watchdogTimer;
let updateTimer;
let isQuitting = false;
let automaticUpdates = true;
const certificatePins = new Map();
const hasSingleInstanceLock = app.requestSingleInstanceLock();
let updateState = {
  status: 'idle',
  currentVersion: app.getVersion(),
  availableVersion: null,
  downloaded: false,
  progress: 0,
  message: '',
  automaticUpdates
};

function configureWindowsStartup() {
  if (process.platform !== 'win32') return;
  const args = app.isPackaged ? ['--hidden'] : [app.getAppPath(), '--hidden'];
  app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args });
}

async function remoteCommand(host, password, command, payload, role = 'operator') {
  const address = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const requestJson = (method, route, body) => new Promise((resolve, reject) => {
    const request = https.request({
      hostname: address.split(':')[0],
      port: address.split(':')[1] || 47821,
      path: route,
      method,
      rejectUnauthorized: false,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    }, (response) => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { text += chunk; });
      response.on('end', () => {
        try { resolve({ status: response.statusCode, body: JSON.parse(text) }); }
        catch (_) { reject(new Error('Invalid response from remote agent.')); }
      });
    });
    request.on('socket', (socket) => socket.once('secureConnect', () => {
      const fingerprint = socket.getPeerCertificate().fingerprint256;
      const previous = certificatePins.get(address);
      if (previous && previous !== fingerprint) {
        request.destroy(new Error('Remote certificate changed. Connection rejected.'));
        return;
      }
      if (fingerprint) certificatePins.set(address, fingerprint);
    }));
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });

  const challengeResponse = await requestJson('GET', '/challenge');
  if (challengeResponse.status !== 200) throw new Error('Could not reach that device. Check its IP and firewall.');
  const { nonce } = challengeResponse.body;
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const request = {
    nonce,
    timestamp: Date.now(),
    requestId: crypto.randomUUID(),
    command,
    payload: payload === undefined ? null : payload,
    role
  };
  const proof = networkAgent.createRequestProof(passwordHash, request);
  const response = await requestJson('POST', '/command', { ...request, proof });
  if (response.status < 200 || response.status >= 300) throw new Error(response.body.error || 'Remote command failed.');
  return response.body.data;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    icon: appIcon,
    skipTaskbar: true,
    show: !process.argv.includes('--hidden'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    mainWindow.hide();
  });
}

function sendUpdateStatus(status, details = {}) {
  updateState = { ...updateState, status, ...details };
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-status', updateState);
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    sendUpdateStatus('development', { message: 'Updates are available in packaged builds.' });
    return updateState;
  }
  sendUpdateStatus('checking', { message: 'Checking for updates...' });
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    sendUpdateStatus('error', { message: error.message });
  }
  return updateState;
}

function configureAutoUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('downloading', { availableVersion: info.version, downloaded: false, progress: 0, message: 'Downloading update automatically...' });
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('current', { availableVersion: null, downloaded: false, progress: 0, message: 'You are using the latest version.' });
  });
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', { progress: Math.round(progress.percent), message: 'Downloading update...' });
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('installing', { availableVersion: info.version, downloaded: true, progress: 100, message: 'Installing update and restarting...' });
    if (automaticUpdates) {
      isQuitting = true;
      setTimeout(() => autoUpdater.quitAndInstall(true, true), 1000);
    }
  });
  autoUpdater.on('error', (error) => {
    sendUpdateStatus('error', { message: error.message });
  });
  updateTimer = setInterval(() => {
    if (automaticUpdates) checkForUpdates();
  }, 6 * 60 * 60 * 1000);
  updateTimer.unref();
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'renderer', 'spacecraft.png'));
  tray.setToolTip('Lockdown Blocker');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open', click: () => mainWindow.show() },
      { label: 'Open speed monitor', click: () => createSpeedWindow() },
      { label: 'Quit Lockdown', click: () => { isQuitting = true; app.quit(); } }
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
    icon: appIcon,
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
      const allowedSites = data.allowedSites || [];
      hosts.applyBlockedSites(data.blockedSites.filter((site) => !allowedSites.some((allowed) => allowed.toLowerCase() === site.toLowerCase())));
    }
  }, 5000);
}

function updateSites(sites) {
  sites = normalizeList(sites);
  const data = store.load();
  data.blockedSites = sites;
  store.save(data);
  hosts.applyBlockedSites(sites.filter((site) => !(data.allowedSites || []).some((allowed) => allowed.toLowerCase() === site.toLowerCase())));
  recordActivity('Website block list updated', `${sites.length} site${sites.length === 1 ? '' : 's'}`);
  return data;
}

function updateAllowedSites(sites) {
  sites = normalizeList(sites);
  const data = store.load();
  data.allowedSites = sites;
  store.save(data);
  hosts.applyBlockedSites((data.blockedSites || []).filter((site) => !sites.some((allowed) => allowed.toLowerCase() === site.toLowerCase())));
  return data;
}

function effectiveBlockedSites(data) {
  const allowed = new Set((data.allowedSites || []).map((site) => site.toLowerCase()));
  return (data.blockedSites || []).filter((site) => !allowed.has(site.toLowerCase()));
}

function updateApps(appsList) {
  appsList = normalizeList(appsList);
  const data = store.load();
  data.blockedApps = appsList;
  store.save(data);
  recordActivity('Application block list updated', `${appsList.length} app${appsList.length === 1 ? '' : 's'}`);
  return data;
}

function startLock(minutes, password) {
  minutes = normalizeDuration(minutes);
  const data = store.load();
  data.lock = lockManager.startLock(minutes, password);
  store.save(data);
  recordActivity('Focus lock started', `${minutes} minute session`);
  return data;
}

function recordActivity(title, detail) {
  const data = store.load();
  data.activity = Array.isArray(data.activity) ? data.activity : [];
  data.activity.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), title, detail });
  data.activity = data.activity.slice(0, 100);
  store.save(data);
}

function getActivity() {
  return store.load().activity || [];
}

function mergeNetworkGroup(group) {
  if (!group || !group.id || !group.name || !Array.isArray(group.devices)) throw new Error('Invalid network group.');
  const data = store.load();
  data.network = data.network || {};
  const groups = Array.isArray(data.network.groups) ? data.network.groups : [];
  const index = groups.findIndex((item) => item.id === group.id);
  if (index === -1) groups.push(group);
  else {
    const existing = groups[index];
    const devices = new Map((existing.devices || []).map((device) => [device.mac || device.ip, device]));
    group.devices.forEach((device) => devices.set(device.mac || device.ip, { ...devices.get(device.mac || device.ip), ...device }));
    groups[index] = { ...existing, name: group.name, devices: [...devices.values()] };
  }
  data.network.groups = groups;
  store.save(data);
  return groups;
}

function setNetworkPasswords(operatorPassword, adminPassword) {
  if (typeof operatorPassword !== 'string' || operatorPassword.length < 12) {
    throw new Error('Operator password must be at least 12 characters.');
  }
  if (typeof adminPassword !== 'string' || adminPassword.length < 12) {
    throw new Error('Admin password must be at least 12 characters.');
  }
  const data = store.load();
  data.network = data.network || {};
  data.network.passwordHash = networkAgent.hashPassword(operatorPassword);
  data.network.adminPasswordHash = networkAgent.hashPassword(adminPassword);
  store.save(data);
  return { operatorConfigured: true, adminConfigured: true };
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
app.on('second-instance', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.show();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('com.jimmy.lockdownblocker');
  Menu.setApplicationMenu(null);
  configureWindowsStartup();
  createWindow();
  configureAutoUpdates();
  createTray();
  startWatchdog();

  const data = store.load();
  hosts.applyBlockedSites(effectiveBlockedSites(data));
  appBlocker.startAppBlocking(() => store.load().blockedApps);
  if (data.network?.agentEnabled !== false) {
    networkAgent.startNetworkAgent({
      getData: store.load,
      updateSites,
      updateApps,
      startLock,
      getActivity,
      mergeNetworkGroup,
      recordActivity,
      certificateDirectory: path.join(app.getPath('userData'), 'agent-certificate'),
      port: data.network?.port || networkAgent.DEFAULT_PORT
    }).catch((error) => console.error('Network agent failed to start:', error.message));
    windowsPermissions.ensurePrivateNetworkAccess(data.network?.port || networkAgent.DEFAULT_PORT)
      .then((result) => console.log(result.created ? 'Private network firewall rule created.' : 'Private network firewall rule ready.'))
      .catch((error) => console.error('Private network firewall rule unavailable:', error.message));
  }
  checkForUpdates();
});
}

app.on('window-all-closed', () => {
  // Do nothing on Windows — keep running in tray so the block persists.
});

// ---------- IPC handlers (renderer <-> main) ----------

ipcMain.handle('get-data', () => store.load());

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-update-status', () => updateState);

ipcMain.handle('set-automatic-updates', (_evt, enabled) => {
  automaticUpdates = Boolean(enabled);
  updateState.automaticUpdates = automaticUpdates;
  return updateState;
});

ipcMain.handle('check-for-updates', () => checkForUpdates());

ipcMain.handle('download-update', async () => {
  if (!app.isPackaged) return updateState;
  try {
    sendUpdateStatus('downloading', { progress: 0, message: 'Downloading update...' });
    await autoUpdater.downloadUpdate();
  } catch (error) {
    sendUpdateStatus('error', { message: error.message });
  }
  return updateState;
});

ipcMain.handle('install-update', () => {
  if (!app.isPackaged || !updateState.downloaded) return false;
  isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
  return true;
});

ipcMain.handle('update-sites', (_evt, sites) => {
  return updateSites(sites);
});

ipcMain.handle('update-apps', (_evt, appsList) => {
  return updateApps(appsList);
});

ipcMain.handle('update-allowed-sites', (_evt, sites) => updateAllowedSites(sites));

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

ipcMain.handle('get-network-auth', () => {
  const network = store.load().network || {};
  return { operatorConfigured: Boolean(network.passwordHash), adminConfigured: Boolean(network.adminPasswordHash) };
});

ipcMain.handle('set-network-passwords', (_evt, { operatorPassword, adminPassword }) =>
  setNetworkPasswords(operatorPassword, adminPassword)
);

ipcMain.handle('remote-command', (_evt, { host, password, command, payload, role }) =>
  remoteCommand(host, password, command, payload, role)
);

ipcMain.handle('discover-network', () => networkDiscovery.discoverNetwork());

ipcMain.handle('network-speed-test', (event) => networkSpeedTest.measureNetworkSpeed({
  onStage: (stage) => event.sender.send('network-speed-stage', stage)
}));

ipcMain.handle('get-network-groups', () => store.load().network?.groups || []);

ipcMain.handle('delete-network-group', (_evt, groupId) => {
  const data = store.load();
  data.network = data.network || { groups: [] };
  data.network.groups = (data.network.groups || []).filter((group) => group.id !== groupId);
  store.save(data);
  return data.network.groups;
});

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
