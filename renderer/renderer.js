const sitesInput = document.getElementById('sites-input');
const appsInput = document.getElementById('apps-input');
const saveSitesBtn = document.getElementById('save-sites');
const saveAppsBtn = document.getElementById('save-apps');
const lockMinutesInput = document.getElementById('lock-minutes');
const lockPasswordInput = document.getElementById('lock-password');
const startLockBtn = document.getElementById('start-lock');
const lockStatusEl = document.getElementById('lock-status');
const lockBanner = document.getElementById('lock-banner');
const sitesCount = document.getElementById('sites-count');
const appsCount = document.getElementById('apps-count');
const protectionState = document.getElementById('protection-state');
const protectionDetail = document.getElementById('protection-detail');
const toast = document.getElementById('toast');
const remoteHostInput = document.getElementById('remote-host');
const remotePasswordInput = document.getElementById('remote-password');
const remoteSitesBtn = document.getElementById('remote-sites');
const remoteAppsBtn = document.getElementById('remote-apps');
const remoteLockBtn = document.getElementById('remote-lock');
const remoteConnectBtn = document.getElementById('remote-connect');
const remoteStatus = document.getElementById('remote-status');
const scanNetworkBtn = document.getElementById('scan-network');
const deviceList = document.getElementById('device-list');
const deviceCount = document.getElementById('device-count');
const groupNameInput = document.getElementById('group-name');
const saveGroupBtn = document.getElementById('save-group');
const groupSelect = document.getElementById('group-select');
const loadGroupBtn = document.getElementById('load-group');
const groupSitesBtn = document.getElementById('group-sites');
const groupAppsBtn = document.getElementById('group-apps');
const groupLockBtn = document.getElementById('group-lock');
const groupStatus = document.getElementById('group-status');
const speedTestBtn = document.getElementById('speed-test');
const speedDownload = document.getElementById('speed-download');
const speedLatency = document.getElementById('speed-latency');
const governorTestBtn = document.getElementById('governor-test');
const governorValue = document.getElementById('governor-value');
const governorDownload = document.getElementById('governor-download');
const governorUpload = document.getElementById('governor-upload');
const governorLatency = document.getElementById('governor-latency');
const governorTime = document.getElementById('governor-time');
const governorTitle = document.getElementById('governor-title');
const governorMessage = document.getElementById('governor-message');
const speedLiveState = document.getElementById('speed-live-state');
const governorPointer = document.getElementById('governor-pointer');
const governorPhase = document.getElementById('governor-phase');
const progressLabel = document.getElementById('progress-label');
const progressBar = document.getElementById('progress-bar');
const dialTicks = document.getElementById('dial-ticks');
let speedRefreshTimer;
let discoveredDevices = [];
let networkGroups = [];

for (let index = 0; index <= 50; index += 1) {
  const tick = document.createElement('i');
  tick.style.transform = `rotate(${-135 + index * 5.4}deg)`;
  tick.className = index % 5 === 0 ? 'major-tick' : 'minor-tick';
  dialTicks.appendChild(tick);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2600);
}

function updateCounts() {
  sitesCount.textContent = sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean).length;
  appsCount.textContent = appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean).length;
}

function selectedDevices() {
  return discoveredDevices.filter((device) => document.querySelector(`[data-device-ip="${device.ip}"]`)?.checked);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderDevices(devices) {
  discoveredDevices = devices;
  deviceCount.textContent = `${devices.length} device${devices.length === 1 ? '' : 's'} found`;
  if (!devices.length) {
    deviceList.innerHTML = '<div class="empty-devices">No devices were found in the current network table.</div>';
    return;
  }
  deviceList.innerHTML = devices.map((device) => {
    const displayName = device.nameAvailable ? escapeHtml(device.name) : 'Name unavailable';
    const nameNote = device.nameAvailable ? 'PC name' : 'Enable Network Discovery on this PC';
    return `<label class="device-row"><input type="checkbox" data-device-ip="${escapeHtml(device.ip)}"><span class="device-state ${device.local ? 'local' : ''}"></span><span class="device-details"><strong>${displayName}<em>${nameNote}</em></strong><small>IP ${escapeHtml(device.ip)} · MAC ${escapeHtml(device.mac || 'unavailable')}${device.local ? ' · This computer' : ''}</small></span><span class="agent-badge">${device.local ? 'Local' : 'Select'}</span></label>`;
  }).join('');
}

function renderGroups() {
  groupSelect.innerHTML = '<option value="">Choose a saved group</option>' + networkGroups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)} (${group.devices.length})</option>`).join('');
}

async function scanNetwork() {
  scanNetworkBtn.disabled = true;
  scanNetworkBtn.firstElementChild.textContent = 'Scanning...';
  try {
    renderDevices(await window.api.discoverNetwork());
    showToast('Network scan complete');
  } catch (error) {
    showToast(`Network scan failed: ${error.message}`);
  } finally {
    scanNetworkBtn.disabled = false;
    scanNetworkBtn.firstElementChild.textContent = 'Scan network';
  }
}

async function runSpeedTest() {
  speedTestBtn.disabled = true;
  speedTestBtn.firstElementChild.textContent = 'Testing...';
  try {
    const result = await window.api.networkSpeedTest();
    speedDownload.textContent = result.downloadMbps;
    speedLatency.textContent = result.latencyMs;
    showToast('Internet speed test complete');
  } catch (error) {
    showToast(`Speed test failed: ${error.message}`);
  } finally {
    speedTestBtn.disabled = false;
    speedTestBtn.firstElementChild.textContent = 'Run speed test';
  }
}

async function runGovernorTest() {
  governorTestBtn.disabled = true;
  governorTestBtn.firstElementChild.textContent = 'Measuring...';
  speedLiveState.textContent = 'TESTING';
  governorPhase.textContent = 'DOWNLOAD';
  progressLabel.textContent = 'MEASURING DOWNLOAD';
  progressBar.style.width = '42%';
  governorTitle.textContent = 'Measuring connection';
  governorMessage.textContent = 'Reading download throughput and network response time...';
  try {
    const result = await window.api.networkSpeedTest();
    governorValue.textContent = result.downloadMbps;
    const pointerAngle = -135 + Math.min(Math.max(result.downloadMbps, 0), 1000) * 0.27;
    governorPointer.style.transform = `rotate(${pointerAngle}deg)`;
    governorDownload.textContent = `${result.downloadMbps} Mbps`;
    governorUpload.textContent = `${result.uploadMbps} Mbps`;
    governorLatency.textContent = `${result.latencyMs} ms`;
    governorTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    governorPhase.textContent = 'COMPLETE';
    progressLabel.textContent = 'TEST COMPLETE';
    progressBar.style.width = '100%';
    governorTitle.textContent = 'Connection test complete';
    governorMessage.textContent = 'Your network telemetry is ready.';
    speedLiveState.textContent = 'CONNECTED';
  } catch (error) {
    speedLiveState.textContent = 'UNAVAILABLE';
    governorPhase.textContent = 'ERROR';
    progressLabel.textContent = 'TEST FAILED';
    progressBar.style.width = '0';
    governorTitle.textContent = 'Test could not complete';
    governorMessage.textContent = error.message;
  } finally {
    governorTestBtn.disabled = false;
    governorTestBtn.firstElementChild.textContent = 'Run live test';
  }
}

window.api.onNetworkSpeedStage((stage) => {
  if (stage === 'upload') {
    governorPhase.textContent = 'UPLOAD';
    progressLabel.textContent = 'MEASURING UPLOAD';
    progressBar.style.width = '72%';
    governorTitle.textContent = 'Checking upload response';
    governorMessage.textContent = 'Switching direction and measuring upstream throughput...';
  }
});

async function saveGroup() {
  const devices = selectedDevices();
  const name = groupNameInput.value.trim();
  if (!name || !devices.length) {
    showToast('Enter a group name and select at least one device');
    return;
  }
  networkGroups = await window.api.saveNetworkGroup({ name, devices });
  renderGroups();
  groupNameInput.value = '';
  showToast(`Group “${name}” saved`);
}

function applyGroupSelection() {
  const group = networkGroups.find((item) => item.id === groupSelect.value);
  if (!group) return;
  document.querySelectorAll('[data-device-ip]').forEach((checkbox) => { checkbox.checked = group.devices.some((device) => device.ip === checkbox.dataset.deviceIp); });
  groupStatus.textContent = `${group.devices.length} devices selected`;
}

async function sendGroup(command, payload, message) {
  const devices = selectedDevices();
  const password = remotePasswordInput.value;
  if (!devices.length || !password) {
    showToast('Select devices and enter the agent password first');
    return;
  }
  groupStatus.textContent = `Sending to ${devices.length} device${devices.length === 1 ? '' : 's'}...`;
  const results = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, command, payload)));
  const success = results.filter((result) => result.status === 'fulfilled').length;
  groupStatus.textContent = `${success}/${devices.length} devices accepted the command`;
  showToast(`${message} on ${success} device${success === 1 ? '' : 's'}`);
}

async function sendRemote(command, payload, successMessage) {
  const host = remoteHostInput.value.trim();
  const password = remotePasswordInput.value;
  if (!host || !password) {
    showToast('Enter the remote address and password first');
    return;
  }
  const buttons = [remoteSitesBtn, remoteAppsBtn, remoteLockBtn, remoteConnectBtn];
  buttons.forEach((button) => { button.disabled = true; });
  remoteStatus.textContent = 'Sending...';
  try {
    await window.api.remoteCommand(host, password, command, payload);
    remoteStatus.textContent = 'Connected';
    remoteStatus.classList.add('connected');
    showToast(successMessage);
  } catch (error) {
    remoteStatus.textContent = 'Connection failed';
    remoteStatus.classList.remove('connected');
    showToast(error.message);
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function loadData() {
  const data = await window.api.getData();
  sitesInput.value = data.blockedSites.join('\n');
  appsInput.value = data.blockedApps.join('\n');
  updateCounts();
  await refreshLockStatus();
}

async function refreshLockStatus() {
  const { locked, remainingMs } = await window.api.getLockStatus();
  if (locked) {
    const mins = Math.ceil(remainingMs / 60000);
    lockBanner.textContent = `🔒 Locked — ${mins} minute(s) remaining. Block list can still be edited.`;
    lockBanner.classList.remove('hidden');
    protectionState.textContent = 'Locked';
    protectionDetail.textContent = `${mins} minute(s) remaining`;
  } else {
    lockBanner.classList.add('hidden');
    protectionState.textContent = 'Ready';
    protectionDetail.textContent = 'No active lock';
  }
}

saveSitesBtn.addEventListener('click', async () => {
  const sites = sitesInput.value.split('\n').map((s) => s.trim()).filter(Boolean);
  try {
    await window.api.updateSites(sites);
    updateCounts();
    showToast('Website block list saved');
  } catch (err) {
    showToast(err.message);
  }
});

saveAppsBtn.addEventListener('click', async () => {
  const apps = appsInput.value.split('\n').map((s) => s.trim()).filter(Boolean);
  try {
    await window.api.updateApps(apps);
    updateCounts();
    showToast('Application block list saved');
  } catch (err) {
    showToast(err.message);
  }
});

startLockBtn.addEventListener('click', async () => {
  const minutes = parseInt(lockMinutesInput.value, 10) || 60;
  const password = lockPasswordInput.value || null;
  if (!confirm(`Lock the block list for ${minutes} minutes? You will NOT be able to undo this early.`)) return;
  await window.api.startLock(minutes, password);
  await refreshLockStatus();
  showToast('Focus session started');
});

sitesInput.addEventListener('input', updateCounts);
appsInput.addEventListener('input', updateCounts);
remoteSitesBtn.addEventListener('click', () => sendRemote('update-sites', sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean), 'Website list sent'));
remoteAppsBtn.addEventListener('click', () => sendRemote('update-apps', appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean), 'App list sent'));
remoteLockBtn.addEventListener('click', () => sendRemote('start-lock', { minutes: parseInt(lockMinutesInput.value, 10) || 60 }, 'Remote lock started'));
remoteConnectBtn.addEventListener('click', () => sendRemote('get-data', null, 'Remote computer connected'));
scanNetworkBtn.addEventListener('click', scanNetwork);
saveGroupBtn.addEventListener('click', saveGroup);
loadGroupBtn.addEventListener('click', applyGroupSelection);
groupSitesBtn.addEventListener('click', () => sendGroup('update-sites', sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean), 'Website list sent'));
groupAppsBtn.addEventListener('click', () => sendGroup('update-apps', appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean), 'App list sent'));
groupLockBtn.addEventListener('click', () => sendGroup('start-lock', { minutes: parseInt(lockMinutesInput.value, 10) || 60 }, 'Group lock started'));
speedTestBtn.addEventListener('click', runSpeedTest);
governorTestBtn.addEventListener('click', runGovernorTest);
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'));
  item.classList.add('active');
  if (item.getAttribute('href') === '#speed-view') {
    clearInterval(speedRefreshTimer);
    runGovernorTest();
    speedRefreshTimer = setInterval(runGovernorTest, 30000);
  } else {
    clearInterval(speedRefreshTimer);
  }
}));
window.api.getNetworkGroups().then((groups) => { networkGroups = groups; renderGroups(); });
loadData();
setInterval(refreshLockStatus, 5000);
