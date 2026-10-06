const { app, BrowserWindow, ipcMain, Menu, Tray, screen, dialog, desktopCapturer, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pipeline } = require('stream/promises');
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
const hotspotBlocker = require('./src/hotspotBlocker');
const scheduleManager = require('./src/scheduleManager');
const { normalizeList, normalizeDuration } = require('./src/inputValidation');

const appIcon = path.join(__dirname, 'renderer', 'spacecraft.png');
const isBackgroundAgent = process.argv.includes('--background-agent');
const usesBootAgent = process.platform === 'win32' && app.isPackaged;

let mainWindow;
let speedWindow;
let screenViewerWindow;
let fileSharingWindow;
let screenViewerHost;
let remoteScreenSessionId;
let remoteScreenSession;
let tray;
let stopScreenSharingMenuItem;
let watchdogTimer;
let updateTimer;
let scheduleTimer;
let isQuitting = false;
let automaticUpdates = true;
let pcFileRoot = null;
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
  if (process.platform !== 'win32' || isBackgroundAgent) return;

  const args = app.isPackaged ? ['--hidden'] : [app.getAppPath(), '--hidden'];
  try {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args, enabled: true });
  } catch (error) {
    console.warn('Current-user startup registration unavailable:', error.message);
  }

  if (usesBootAgent) return;

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
  const requestTimeoutMs = REMOTE_REQUEST_TIMEOUT_MS;
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
    request.setTimeout(requestTimeoutMs, () => {
      request.destroy(new Error(`Remote device timed out after ${requestTimeoutMs / 1000} seconds.`));
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

function validateRemoteHost(host) {
  const address = String(host || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const match = address.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/);
  if (!match || match[1].split('.').some((octet) => Number(octet) > 255) || Number(match[2] || 47821) > 65535) {
    throw new Error('Invalid remote PC address.');
  }
  return address;
}

function pinnedAgentRequest(host, method, route, { headers = {}, uploadPath, downloadPath, timeoutMs = 120000, timeoutMessage = 'File transfer timed out.' } = {}) {
  const address = validateRemoteHost(host);
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: address.split(':')[0],
      port: address.split(':')[1] || 47821,
      path: route,
      method,
      rejectUnauthorized: false,
      headers
    }, (response) => {
      if (downloadPath && response.statusCode >= 200 && response.statusCode < 300) {
        pipeline(response, fs.createWriteStream(downloadPath, { flags: 'wx' }))
          .then(() => resolve({ status: response.statusCode, body: '' }))
          .catch(reject);
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error(timeoutMessage)));
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
    if (uploadPath) {
      pipeline(fs.createReadStream(uploadPath), request).catch(reject);
    } else {
      request.end();
    }
  });
}

async function requestSharedFiles(host, method, route, options = {}) {
  const challengeResponse = await pinnedAgentRequest(host, 'GET', '/challenge');
  let challenge;
  try { challenge = JSON.parse(challengeResponse.body); } catch (_) { throw new Error('Could not get a file-sharing challenge.'); }
  if (challengeResponse.status !== 200 || typeof challenge.nonce !== 'string') throw new Error('Could not reach that PC.');
  const response = await pinnedAgentRequest(host, method, route, {
    ...options,
    headers: { ...(options.headers || {}), 'x-lockdown-nonce': challenge.nonce }
  });
  if (response.status < 200 || response.status >= 300) {
    let detail = 'File-sharing request failed.';
    try { detail = JSON.parse(response.body).error || detail; } catch (_) {}
    throw new Error(detail);
  }
  return response;
}

async function listSharedFiles(host) {
  const response = await requestSharedFiles(host, 'GET', '/files/list');
  return JSON.parse(response.body).files || [];
}

async function uploadSharedFile(host, filePath) {
  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile() || stats.size > 50 * 1024 * 1024) throw new Error('Choose a file that is 50 MB or smaller.');
  const name = path.basename(filePath);
  const response = await requestSharedFiles(host, 'POST', `/files/upload?name=${encodeURIComponent(name)}`, {
    uploadPath: filePath,
    headers: { 'Content-Length': stats.size, 'Content-Type': 'application/octet-stream' }
  });
  return JSON.parse(response.body).file;
}

async function downloadSharedFile(host, file) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save shared file',
    defaultPath: path.join(app.getPath('downloads'), path.basename(file.name))
  });
  if (result.canceled || !result.filePath) return false;
  await downloadSharedFileToPath(host, file, result.filePath);
  return true;
}

async function downloadSharedFileToPath(host, file, destinationPath) {
  const id = String(file?.id || '');
  if (!/^[\da-f-]{36}$/i.test(id)) throw new Error('Invalid shared-file ID.');
  const temporaryPath = `${destinationPath}.${crypto.randomUUID()}.download`;
  try {
    await requestSharedFiles(host, 'GET', `/files/download?id=${encodeURIComponent(id)}`, { downloadPath: temporaryPath });
    await fs.promises.rename(temporaryPath, destinationPath);
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true });
    throw error;
  }
}

async function relaySharedFile(sourceHost, file, destinationHosts) {
  const source = validateRemoteHost(sourceHost);
  const destinations = [...new Set(destinationHosts.map(validateRemoteHost))].filter((host) => host !== source);
  if (!destinations.length) throw new Error('Choose at least one destination PC other than the source.');
  const transferDirectory = path.join(app.getPath('temp'), 'Lockdown Blocker Transfers');
  await fs.promises.mkdir(transferDirectory, { recursive: true });
  const localCopy = path.join(transferDirectory, `${crypto.randomUUID()}-${path.basename(file?.name || 'shared-file')}`);
  try {
    await downloadSharedFileToPath(source, file, localCopy);
    const results = await Promise.allSettled(destinations.map((host) => uploadSharedFile(host, localCopy)));
    return results.map((result, index) => ({
      host: destinations[index],
      ok: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  } finally {
    await fs.promises.rm(localCopy, { force: true });
  }
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
  const menu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow.show() },
    { label: 'Open speed monitor', click: () => createSpeedWindow() },
    { label: 'Stop remote screen sharing', enabled: false, click: () => stopScreenView(remoteScreenSession?.id) },
    { type: 'separator' },
    { label: 'Quit Lockdown', click: () => { isQuitting = true; app.quit(); } }
  ]);
  stopScreenSharingMenuItem = menu.items.find((item) => item.label === 'Stop remote screen sharing');
  tray.setContextMenu(menu);
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

function createScreenViewer(host, name) {
  screenViewerHost = host;
  if (screenViewerWindow && !screenViewerWindow.isDestroyed()) {
    screenViewerWindow.setTitle(`Live screen · ${name}`);
    screenViewerWindow.loadFile(path.join(__dirname, 'renderer', 'screen.html'), { query: { host, name } });
    screenViewerWindow.show();
    screenViewerWindow.focus();
    return;
  }
  screenViewerWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 640,
    minHeight: 420,
    title: `Live screen · ${name}`,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  screenViewerWindow.loadFile(path.join(__dirname, 'renderer', 'screen.html'), { query: { host, name } });
  screenViewerWindow.on('closed', () => {
    screenViewerWindow = null;
    screenViewerHost = null;
    remoteScreenSessionId = null;
  });
}

function createFileSharingWindow(destinations, availableDestinations, sources, name) {
  const options = {
    destinations: JSON.stringify(destinations),
    availableDestinations: JSON.stringify(availableDestinations),
    sources: JSON.stringify(sources),
    name
  };
  if (fileSharingWindow && !fileSharingWindow.isDestroyed()) {
    fileSharingWindow.setTitle(`File sharing · ${name}`);
    fileSharingWindow.loadFile(path.join(__dirname, 'renderer', 'file-sharing.html'), { query: options });
    fileSharingWindow.show();
    fileSharingWindow.focus();
    return;
  }
  fileSharingWindow = new BrowserWindow({
    width: 760,
    height: 620,
    minWidth: 520,
    minHeight: 420,
    title: `File sharing · ${name}`,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  fileSharingWindow.loadFile(path.join(__dirname, 'renderer', 'file-sharing.html'), { query: options });
  fileSharingWindow.on('closed', () => { fileSharingWindow = null; });
}

async function authorizeScreenView(address) {
  if (isBackgroundAgent) throw new Error('Screen viewing requires an active desktop session.');
  if (remoteScreenSession && Date.now() < remoteScreenSession.expiresAt) {
    throw new Error('Another screen-view session is already active.');
  }
  remoteScreenSession = { id: crypto.randomUUID(), expiresAt: Date.now() + 5 * 60 * 1000 };
  if (stopScreenSharingMenuItem) stopScreenSharingMenuItem.enabled = true;
  recordActivity('Remote screen sharing started', address);
  return { sessionId: remoteScreenSession.id, expiresAt: remoteScreenSession.expiresAt };
}

async function captureScreenFrame(sessionId) {
  if (!remoteScreenSession || remoteScreenSession.id !== sessionId || Date.now() >= remoteScreenSession.expiresAt) {
    remoteScreenSession = null;
    if (stopScreenSharingMenuItem) stopScreenSharingMenuItem.enabled = false;
    recordActivity('Remote screen sharing ended', 'Disabled, expired, or stopped');
    throw new Error('Remote screen sharing is disabled, expired, or has been stopped.');
  }
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 960, height: 540 },
    fetchWindowIcons: false
  });
  const primaryDisplayId = String(screen.getPrimaryDisplay().id);
  const source = sources.find((item) => item.display_id === primaryDisplayId) || sources[0];
  if (!source || source.thumbnail.isEmpty()) throw new Error('No capturable display is available.');
  return { image: source.thumbnail.toJPEG(58).toString('base64'), capturedAt: Date.now() };
}

function stopScreenView(sessionId) {
  if (!remoteScreenSession || (sessionId && remoteScreenSession.id !== sessionId)) return false;
  remoteScreenSession = null;
  if (stopScreenSharingMenuItem) stopScreenSharingMenuItem.enabled = false;
  recordActivity('Remote screen sharing ended', 'Stopped from the local tray menu or viewer');
  return true;
}

// Watchdog: every few seconds, re-apply the hosts block. This defeats
// someone manually editing the hosts file back while a lock is active.
function startWatchdog() {
  clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    const data = store.load();
    const temporary = data.temporaryUnblock || {};
    if (temporary.until && Date.now() >= new Date(temporary.until).getTime()) {
      delete data.temporaryUnblock;
      store.save(data);
    }
    if (data.blockedSites.length > 0 || lockManager.isLocked(data.lock)) {
      const allowedSites = data.allowedSites || [];
      try {
        hosts.applyBlockedSites(effectiveBlockedSites(data));
      } catch (error) {
        console.error('Watchdog could not apply website blocks:', error.message);
      }
    }
    if (data.hotspotSharingDisabled) {
      try {
        hotspotBlocker.applyPreference(true);
      } catch (error) {
        console.error('Hotspot sharing could not be kept disabled:', error.message);
      }
    }
  }, 5000);
}

function updateSites(sites) {
  sites = normalizeList(sites);
  const data = store.load();
  data.blockedSites = sites;
  store.save(data);
  hosts.applyBlockedSites(effectiveBlockedSites(data));
  recordActivity('Website block list updated', `${sites.length} site${sites.length === 1 ? '' : 's'}`);
  return data;
}

function effectiveBlockedApps(data) {
  const temporary = data.temporaryUnblock || {};
  const active = temporary.until && Date.now() < new Date(temporary.until).getTime();
  const excluded = new Set(active ? (temporary.apps || []).map((app) => app.toLowerCase()) : []);
  return (data.blockedApps || []).filter((app) => !excluded.has(app.toLowerCase()));
}

function refreshScheduledRestrictions() {
  const data = store.load();
  const active = scheduleManager.activeSchedules(data.schedules || []);
  const scheduledLock = data.lock?.source === 'schedule';
  if (active.length) {
    const endDate = active.reduce((latest, item) => item.window.endDate > latest ? item.window.endDate : latest, active[0].window.endDate);
    data.lock = { active: true, unlockAt: endDate.toISOString(), source: 'schedule' };
    store.save(data);
    return;
  }
  if (scheduledLock) {
    data.lock = { active: false, unlockAt: null };
    store.save(data);
  }
}

function startScheduleWatcher() {
  clearInterval(scheduleTimer);
  refreshScheduledRestrictions();
  scheduleTimer = setInterval(refreshScheduledRestrictions, 30000);
  scheduleTimer.unref();
}

function updateAllowedSites(sites) {
  sites = normalizeList(sites);
  const data = store.load();
  data.allowedSites = sites;
  store.save(data);
  hosts.applyBlockedSites(effectiveBlockedSites(data));
  return data;
}

function effectiveBlockedSites(data) {
  const allowed = new Set((data.allowedSites || []).map((site) => site.toLowerCase()));
  const temporary = data.temporaryUnblock || {};
  const active = temporary.until && Date.now() < new Date(temporary.until).getTime();
  const excluded = new Set(active ? (temporary.sites || []).map((site) => site.toLowerCase()) : []);
  return (data.blockedSites || []).filter((site) => !allowed.has(site.toLowerCase()) && !excluded.has(site.toLowerCase()));
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
  startScheduleWatcher();

  const data = store.load();
  try {
    hosts.applyBlockedSites(effectiveBlockedSites(data));
  } catch (error) {
    reportHostsPermissionError(error);
  }
  if (data.hotspotSharingDisabled) {
    try {
      hotspotBlocker.applyPreference(true);
    } catch (error) {
      console.error('Hotspot sharing could not be disabled:', error.message);
    }
  }
  appBlocker.startAppBlocking(() => effectiveBlockedApps(store.load()));
  if (data.network?.agentEnabled !== false) {
    if (!isBackgroundAgent) {
      networkAgent.startNetworkAgent({
        getData: store.load,
        getNetworkGroups: () => store.load().network?.groups || [],
        updateSites,
        updateApps,
        getPcActivity,
        startLock,
        getActivity,
        mergeNetworkGroup,
        recordActivity,
        requestScreenView: authorizeScreenView,
        captureScreenFrame,
        stopScreenView,
        sharedFilesDirectory: path.join(store.DATA_DIR, 'shared-files'),
        certificateDirectory: path.join(store.DATA_DIR, 'agent-certificate'),
        port: data.network?.port || networkAgent.DEFAULT_PORT
      }).catch((error) => console.error('Network agent failed to start:', error.message));
    }
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

function runPowerShellJson(command) {
  if (process.platform !== 'win32') throw new Error('This PC management feature requires Windows.');
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
    maxBuffer: 2 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || 'Windows could not provide this information.').trim());
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : [];
}

function getCpuUsage(before, after) {
  const previous = before.reduce((total, cpu) => total + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
  const current = after.reduce((total, cpu) => total + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
  const idleBefore = before.reduce((total, cpu) => total + cpu.times.idle, 0);
  const idleAfter = after.reduce((total, cpu) => total + cpu.times.idle, 0);
  return current === previous ? 0 : Math.round((1 - (idleAfter - idleBefore) / (current - previous)) * 100);
}

function getPcActivity() {
  const processes = runPowerShellJson("Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 ProcessName,Id,CPU,WorkingSet64 | ConvertTo-Json -Compress");
  return Array.isArray(processes) ? processes : processes ? [processes] : [];
}

function resolvePcFile(relativePath = '') {
  if (!pcFileRoot) throw new Error('Choose a folder before browsing files.');
  const target = path.resolve(pcFileRoot, String(relativePath));
  const root = path.resolve(pcFileRoot);
  const relative = path.relative(root, target);
  if (relative && (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`))) throw new Error('That location is outside the selected folder.');
  return target;
}

ipcMain.handle('get-pc-status', async () => {
  const before = os.cpus();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const after = os.cpus();
  const disks = runPowerShellJson("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,Size,FreeSpace | ConvertTo-Json -Compress");
  const processes = getPcActivity();
  const interfaces = Object.values(os.networkInterfaces()).flat().filter((item) => item && item.family === 'IPv4' && !item.internal);
  return {
    hostname: os.hostname(),
    cpuPercent: getCpuUsage(before, after),
    cpuCount: after.length,
    memoryTotal: os.totalmem(),
    memoryFree: os.freemem(),
    uptime: os.uptime(),
    network: interfaces[0]?.address || null,
    networkCount: interfaces.length,
    disks: Array.isArray(disks) ? disks : disks ? [disks] : [],
    processes,
    sampledAt: Date.now()
  };
});

ipcMain.handle('get-installed-apps', () => {
  const command = "$paths=@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'); $apps=foreach($key in $paths){Get-ItemProperty $key -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -and -not $_.SystemComponent} | Select-Object @{n='name';e={$_.DisplayName}},@{n='version';e={$_.DisplayVersion}},@{n='publisher';e={$_.Publisher}}}; $apps | Sort-Object name -Unique | ConvertTo-Json -Compress";
  const apps = runPowerShellJson(command);
  return (Array.isArray(apps) ? apps : [apps]).filter((item) => item?.name);
});

ipcMain.handle('open-app-uninstaller', async () => {
  await shell.openExternal('ms-settings:appsfeatures');
  return true;
});

ipcMain.handle('open-windows-update', async () => {
  await shell.openExternal('ms-settings:windowsupdate');
  return true;
});

ipcMain.handle('select-pc-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths[0]) return null;
  pcFileRoot = await fs.promises.realpath(result.filePaths[0]);
  return { path: pcFileRoot, files: await listPcFiles('') };
});

async function listPcFiles(relativePath) {
  const directory = resolvePcFile(relativePath);
  const root = await fs.promises.realpath(pcFileRoot);
  const realDirectory = await fs.promises.realpath(directory);
  const relative = path.relative(root, realDirectory);
  if (relative && (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`))) throw new Error('That location is outside the selected folder.');
  const stat = await fs.promises.lstat(realDirectory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Choose a regular folder to browse.');
  const entries = await fs.promises.readdir(realDirectory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(realDirectory, entry.name);
    const info = await fs.promises.lstat(fullPath);
    return {
      name: entry.name,
      relativePath: path.relative(pcFileRoot, fullPath),
      directory: info.isDirectory() && !info.isSymbolicLink(),
      size: info.isFile() ? info.size : null,
      modifiedAt: info.mtimeMs
    };
  }));
  return files.sort((left, right) => Number(right.directory) - Number(left.directory) || left.name.localeCompare(right.name));
}

ipcMain.handle('list-pc-files', (_event, relativePath) => listPcFiles(String(relativePath || '')));

ipcMain.handle('delete-pc-file', async (_event, relativePath) => {
  const target = resolvePcFile(relativePath);
  if (target === path.resolve(pcFileRoot)) throw new Error('The selected folder itself cannot be deleted.');
  const root = await fs.promises.realpath(pcFileRoot);
  const realParent = await fs.promises.realpath(path.dirname(target));
  const relativeParent = path.relative(root, realParent);
  if (relativeParent && (path.isAbsolute(relativeParent) || relativeParent === '..' || relativeParent.startsWith(`..${path.sep}`))) throw new Error('That location is outside the selected folder.');
  const info = await fs.promises.lstat(target);
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Delete this item?',
    message: `Permanently delete “${path.basename(target)}”?`,
    detail: info.isDirectory() && !info.isSymbolicLink() ? 'This also deletes everything inside this folder.' : 'This action cannot be undone.'
  });
  if (confirmation.response !== 0) return false;
  await fs.promises.rm(target, { recursive: info.isDirectory() && !info.isSymbolicLink() });
  return true;
});

ipcMain.handle('restart-pc', async () => {
  if (process.platform !== 'win32') throw new Error('Restart is available on Windows only.');
  const confirmation = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Restart PC', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Restart this PC?',
    message: 'Windows will restart now.',
    detail: 'Save your work before continuing.'
  });
  if (confirmation.response !== 0) return false;
  spawnSync('shutdown.exe', ['/r', '/t', '0'], { windowsHide: true });
  return true;
});

ipcMain.handle('get-data', () => store.load());

ipcMain.handle('set-hotspot-sharing-disabled', (_evt, disabled) => {
  const data = store.load();
  const preference = Boolean(disabled);
  const result = hotspotBlocker.applyPreference(preference);
  data.hotspotSharingDisabled = preference;
  store.save(data);
  recordActivity(preference ? 'Hotspot sharing disabled' : 'Hotspot sharing allowed', 'Windows Internet Connection Sharing');
  return { ...result, disabled: preference };
});

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

ipcMain.handle('get-activity', () => getActivity());

ipcMain.handle('flush-dns', () => {
  const result = hosts.flushDns();
  recordActivity('DNS cache flush', result.success ? 'Windows DNS resolver cache' : result.error);
  return result;
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

ipcMain.handle('get-schedules', () => store.load().schedules || []);

ipcMain.handle('save-schedule', (_evt, schedule) => {
  const start = scheduleManager.parseTime(schedule?.start);
  const end = scheduleManager.parseTime(schedule?.end);
  const days = Array.isArray(schedule?.days) ? [...new Set(schedule.days.map(Number).filter((day) => day >= 0 && day <= 6))] : [];
  if (!schedule?.name || start === null || end === null || start === end || !days.length) {
    throw new Error('Schedule needs a name, different start/end times, and at least one day.');
  }
  const data = store.load();
  const schedules = Array.isArray(data.schedules) ? data.schedules : [];
  const cleaned = { id: schedule.id || crypto.randomUUID(), name: String(schedule.name).trim().slice(0, 50), start: schedule.start, end: schedule.end, days, enabled: schedule.enabled !== false };
  const index = schedules.findIndex((item) => item.id === cleaned.id);
  if (index >= 0) schedules[index] = cleaned;
  else schedules.push(cleaned);
  data.schedules = schedules;
  store.save(data);
  refreshScheduledRestrictions();
  return schedules;
});

ipcMain.handle('delete-schedule', (_evt, id) => {
  const data = store.load();
  data.schedules = (data.schedules || []).filter((schedule) => schedule.id !== id);
  store.save(data);
  refreshScheduledRestrictions();
  return data.schedules;
});

ipcMain.handle('temporary-unblock', (_evt, { minutes, sites, apps }) => {
  const duration = normalizeDuration(minutes);
  const data = store.load();
  data.temporaryUnblock = { until: new Date(Date.now() + duration * 60000).toISOString(), sites: normalizeList(sites || []), apps: normalizeList(apps || []).map((app) => app.toLowerCase()) };
  store.save(data);
  hosts.applyBlockedSites(effectiveBlockedSites(data));
  return data.temporaryUnblock;
});

ipcMain.handle('clear-temporary-unblock', () => {
  const data = store.load();
  delete data.temporaryUnblock;
  store.save(data);
  hosts.applyBlockedSites(effectiveBlockedSites(data));
  return true;
});

ipcMain.handle('remote-health', async (_evt, host) => {
  const response = await pinnedAgentRequest(host, 'GET', '/health', {
    timeoutMs: REMOTE_REQUEST_TIMEOUT_MS,
    timeoutMessage: 'Remote agent health check timed out.'
  });
  if (response.status !== 200) return false;
  try { return JSON.parse(response.body).ok === true; } catch (_) { return false; }
});

ipcMain.handle('remote-command', async (_evt, { host, password, command, payload, role }) => {
  const address = validateRemoteHost(host);
  const sharedPassword = password || 'no-password';
  if (command === 'shutdown' && screenViewerHost === address && remoteScreenSessionId) {
    if (screenViewerWindow && !screenViewerWindow.isDestroyed()) {
      screenViewerWindow.webContents.send('remote-screen-ending');
    }
    try {
      await remoteCommand(address, sharedPassword, 'stop-screen-view', { sessionId: remoteScreenSessionId }, 'operator');
    } catch (_) {
      // Continue shutdown if the remote screen session already expired or disconnected.
    }
    remoteScreenSessionId = null;
    if (screenViewerWindow && !screenViewerWindow.isDestroyed()) screenViewerWindow.close();
  }

  const result = await remoteCommand(address, sharedPassword, command, payload, role);
  if (command === 'start-screen-view' && result?.sessionId && screenViewerHost === address) {
    remoteScreenSessionId = result.sessionId;
  }
  if (command === 'stop-screen-view' && (!payload?.sessionId || payload.sessionId === remoteScreenSessionId)) {
    remoteScreenSessionId = null;
  }
  return result;
});

ipcMain.handle('open-screen-view', (_evt, { host, name }) => {
  const address = validateRemoteHost(host);
  createScreenViewer(address, String(name || address).slice(0, 80));
  return true;
});

ipcMain.handle('open-file-sharing', (_evt, { destinations, availableDestinations, sources }) => {
  const normalizePcs = (pcs) => {
    if (!Array.isArray(pcs) || pcs.length > 100) throw new Error('Select between one and 100 remote PCs.');
    return [...new Map(pcs.map((pc) => {
      const host = validateRemoteHost(pc?.host);
      return [host, { host, name: String(pc?.name || host).slice(0, 80) }];
    })).values()];
  };
  const targets = normalizePcs(destinations);
  const available = normalizePcs(availableDestinations);
  const sourcePcs = normalizePcs(sources);
  if (!targets.length) throw new Error('Select at least one destination PC.');
  createFileSharingWindow(targets, available, sourcePcs, targets.length === 1 ? targets[0].name : `${targets.length} PCs`);
  return true;
});

ipcMain.handle('pick-and-send-shared-files', async (_evt, hosts) => {
  if (!Array.isArray(hosts) || hosts.length < 1 || hosts.length > 100) throw new Error('Select between one and 100 remote PCs.');
  hosts = [...new Set(hosts.map(validateRemoteHost))];
  const result = await dialog.showOpenDialog(fileSharingWindow && !fileSharingWindow.isDestroyed() ? fileSharingWindow : mainWindow, {
    title: `Choose files to send to ${hosts.length} PC${hosts.length === 1 ? '' : 's'}`,
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled) return [];
  return Promise.all(result.filePaths.map(async (filePath) => {
    const uploads = await Promise.allSettled(hosts.map((host) => uploadSharedFile(host, filePath)));
    return {
      name: path.basename(filePath),
      destinations: uploads.map((upload, index) => ({
        host: hosts[index],
        ok: upload.status === 'fulfilled',
        error: upload.status === 'rejected' ? upload.reason.message : null
      }))
    };
  }));
});

ipcMain.handle('relay-shared-file', (_evt, { sourceHost, file, destinationHosts }) =>
  relaySharedFile(validateRemoteHost(sourceHost), file, destinationHosts)
);

ipcMain.handle('list-shared-files', (_evt, host) => listSharedFiles(validateRemoteHost(host)));

ipcMain.handle('download-shared-file', (_evt, { host, file }) => downloadSharedFile(validateRemoteHost(host), file));

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
