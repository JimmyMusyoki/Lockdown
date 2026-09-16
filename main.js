const { app, BrowserWindow, ipcMain, Menu, Tray, screen, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawnSync } = require('child_process');
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
const isBackgroundAgent = process.argv.includes('--background-agent');
const usesBootAgent = process.platform === 'win32' && app.isPackaged;

let mainWindow;
let speedWindow;
let tray;
let watchdogTimer;
let updateTimer;
let isQuitting = false;
let automaticUpdates = true;
const certificatePins = new Map();
const REMOTE_REQUEST_TIMEOUT_MS = 8000;
// The SYSTEM boot agent must not claim the interactive user's single-instance
// lock; otherwise the administrator console could be prevented from opening.
const hasSingleInstanceLock = isBackgroundAgent || app.requestSingleInstanceLock();
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
  if (process.platform !== 'win32' || isBackgroundAgent || usesBootAgent) return;

  const args = app.isPackaged ? ['--hidden'] : [app.getAppPath(), '--hidden'];
  try {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args, enabled: true });
  } catch (error) {
    console.warn('Current-user startup registration unavailable:', error.message);
  }

  try {
    const command = `"${process.execPath}" --hidden`;
    spawnSync('reg', [
      'add',
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      '/v',
      'Lockdown Blocker',
      '/t',
      'REG_SZ',
      '/d',
      command,
      '/f'
    ], { stdio: 'ignore', windowsHide: true });
  } catch (error) {
    console.warn('Machine-wide startup registration unavailable:', error.message);
  }
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
    request.setTimeout(REMOTE_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`Remote device timed out after ${REMOTE_REQUEST_TIMEOUT_MS / 1000} seconds.`));
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
  const request = {
    nonce,
    timestamp: Date.now(),
    requestId: crypto.randomUUID(),
    command,
    payload: payload === undefined ? null : payload,
    role
  };
  const response = await requestJson('POST', '/command', request);
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
  const savedPreference = store.load().updates?.automatic;
  automaticUpdates = savedPreference !== false;
  updateState.automaticUpdates = automaticUpdates;
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
  setTimeout(() => {
    if (automaticUpdates) checkForUpdates();
  }, 5000).unref();
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
      try {
        hosts.applyBlockedSites(data.blockedSites.filter((site) => !allowedSites.some((allowed) => allowed.toLowerCase() === site.toLowerCase())));
      } catch (error) {
        console.error('Watchdog could not apply website blocks:', error.message);
      }
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

function reportHostsPermissionError(error) {
  console.error('Website blocking requires Administrator permission:', error.message);
  if (!isBackgroundAgent && mainWindow && !mainWindow.isDestroyed()) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Administrator permission required',
      message: 'Website blocking is not active.',
      detail: 'Run the terminal as Administrator and start the app again, or use the installed version which requests Administrator permission.'
    });
  }
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

function normalizedDeviceMac(mac) {
  const value = String(mac || '').replace(/[:-]/g, '').toLowerCase();
  return /^[\da-f]{12}$/.test(value) ? value : null;
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
    const deviceKey = (device) => normalizedDeviceMac(device.mac) || device.ip;
    const devices = new Map((existing.devices || []).map((device) => [deviceKey(device), device]));
    group.devices.forEach((device) => devices.set(deviceKey(device), { ...devices.get(deviceKey(device)), ...device }));
    groups[index] = { ...existing, name: group.name, devices: [...devices.values()] };
  }
  data.network.groups = groups;
  store.save(data);
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('network-groups-updated');
  return groups;
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
  if (!isBackgroundAgent) {
    createWindow();
    configureAutoUpdates();
    createTray();
  }
  startWatchdog();

  const data = store.load();
  try {
    hosts.applyBlockedSites(effectiveBlockedSites(data));
  } catch (error) {
    reportHostsPermissionError(error);
  }
  appBlocker.startAppBlocking(() => store.load().blockedApps);
  if (data.network?.agentEnabled !== false) {
    networkAgent.startNetworkAgent({
      getData: store.load,
      getNetworkGroups: () => store.load().network?.groups || [],
      updateSites,
      updateApps,
      startLock,
      getActivity,
      mergeNetworkGroup,
      recordActivity,
      certificateDirectory: path.join(store.DATA_DIR, 'agent-certificate'),
      port: data.network?.port || networkAgent.DEFAULT_PORT
    }).catch((error) => console.error('Network agent failed to start:', error.message));
    windowsPermissions.ensurePrivateNetworkAccess(data.network?.port || networkAgent.DEFAULT_PORT)
      .then((result) => console.log(result.created ? 'Private network firewall rule created.' : 'Private network firewall rule ready.'))
      .catch((error) => console.error('Private network firewall rule unavailable:', error.message));
  }
  if (!isBackgroundAgent) {
    if (usesBootAgent) {
      windowsPermissions.ensureBootAgent(process.execPath)
        .then(() => console.log('Boot-time background agent is ready.'))
        .catch((error) => console.error('Boot-time background agent unavailable:', error.message));
    }
  }
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
  const data = store.load();
  data.updates = { ...(data.updates || {}), automatic: automaticUpdates };
  store.save(data);
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

ipcMain.handle('remote-command', (_evt, { host, password, command, payload, role }) =>
  remoteCommand(host, password || 'no-password', command, payload, role)
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
