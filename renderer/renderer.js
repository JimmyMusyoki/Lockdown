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
const appVersion = document.getElementById('app-version');
const updateStatus = document.getElementById('update-status');
const lastUpdateCheck = document.getElementById('last-update-check');
const automaticUpdates = document.getElementById('automatic-updates');
const checkUpdatesBtn = document.getElementById('check-updates');
const updateActionBtn = document.getElementById('update-action');
const updateProgress = document.getElementById('update-progress');
const updateProgressBar = document.getElementById('update-progress-bar');
const updateProgressLabel = document.getElementById('update-progress-label');
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
const savedPcCount = document.getElementById('saved-pc-count');
const savedPcCards = document.getElementById('saved-pc-cards');
const selectAllSaved = document.getElementById('select-all-saved');
const bulkTask = document.getElementById('bulk-task');
const runBulkTaskBtn = document.getElementById('run-bulk-task');
const deviceDetail = document.getElementById('device-detail');
const detailName = document.getElementById('detail-name');
const detailAddress = document.getElementById('detail-address');
const detailOnlineDot = document.getElementById('detail-online-dot');
const detailOnline = document.getElementById('detail-online');
const detailPlatform = document.getElementById('detail-platform');
const detailActivity = document.getElementById('detail-activity');
const detailSitesBtn = document.getElementById('detail-sites');
const detailRefreshBtn = document.getElementById('detail-refresh');
const detailShutdownBtn = document.getElementById('detail-shutdown');
const closeDetailBtn = document.getElementById('close-device-detail');
let selectedDevice = null;
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
let activeTab = 'overview';
let agentSessionExpiresAt = 0;
let savedNetworkRefreshRunning = false;
let selectedSavedKeys = new Set();

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

function agentSessionPassword(promptForPassword = true) {
  if (Date.now() >= agentSessionExpiresAt) {
    agentSessionExpiresAt = 0;
    remotePasswordInput.value = '';
  }
  if (!remotePasswordInput.value && promptForPassword) {
    const password = window.prompt('Enter the agent password. This session lasts two minutes.');
    if (!password) return null;
    remotePasswordInput.value = password;
    agentSessionExpiresAt = Date.now() + 2 * 60 * 1000;
  }
  return remotePasswordInput.value || null;
}

function updateCounts() {
  sitesCount.textContent = sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean).length;
  appsCount.textContent = appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean).length;
}

function selectedDevices() {
  return discoveredDevices.filter((device) => document.querySelector(`[data-device-ip="${device.ip}"]`)?.checked);
}

function normalizedMac(mac) {
  if (!mac || mac === 'local' || mac === 'Detected on LAN') return null;
  const value = String(mac).replace(/[:-]/g, '').toLowerCase();
  return /^[\da-f]{12}$/.test(value) ? value : null;
}

function devicesMatch(left, right) {
  const leftMac = normalizedMac(left.mac);
  const rightMac = normalizedMac(right.mac);
  return (leftMac && rightMac && leftMac === rightMac) || left.ip === right.ip;
}

async function reconcileNetworkGroups(devices) {
  let changed = false;
  const updatedGroups = networkGroups.map((group) => ({
    ...group,
    devices: group.devices.map((savedDevice) => {
      const savedMac = normalizedMac(savedDevice.mac);
      const match = devices.find((device) => savedMac
        ? normalizedMac(device.mac) === savedMac
        : device.ip === savedDevice.ip);
      if (!match) return savedDevice;
      const updated = { ...savedDevice, ...match };
      if (JSON.stringify(updated) !== JSON.stringify(savedDevice)) changed = true;
      return updated;
    })
  }));

  if (!changed) return;
  for (const group of updatedGroups) await window.api.saveNetworkGroup(group);
  networkGroups = updatedGroups;
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
    return `<div class="device-row"><input type="checkbox" data-device-ip="${escapeHtml(device.ip)}"><span class="device-state ${device.local ? 'local' : ''}"></span><button class="device-open" data-open-device="${escapeHtml(device.ip)}"><span class="device-details"><strong>${displayName}<em>${nameNote}</em></strong><small>IP ${escapeHtml(device.ip)} · MAC ${escapeHtml(device.mac || 'unavailable')}${device.local ? ' · This computer' : ''}</small></span><span class="agent-badge">View details →</span></button></div>`;
  }).join('');
  deviceList.querySelectorAll('[data-open-device]').forEach((button) => button.addEventListener('click', () => openDeviceDetails(button.dataset.openDevice)));
}

async function openDeviceDetails(ip) {
  selectedDevice = discoveredDevices.find((device) => device.ip === ip);
  if (!selectedDevice) return;
  detailName.textContent = selectedDevice.name || `Device ${selectedDevice.ip}`;
  detailAddress.textContent = `${selectedDevice.ip} · ${selectedDevice.mac || 'MAC unavailable'}`;
  deviceDetail.classList.remove('hidden');
  await refreshDeviceDetails();
  deviceDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function refreshDeviceDetails() {
  if (!selectedDevice) return;
  const password = agentSessionPassword(false);
  if (!password) {
    detailOnline.textContent = 'Enter the agent password above';
    return;
  }
  try {
    const status = await window.api.remoteCommand(`${selectedDevice.ip}:47821`, password, 'get-status');
    detailOnline.textContent = status.online ? 'Online' : 'Offline';
    detailOnlineDot.classList.toggle('local', status.online);
    detailPlatform.textContent = `${status.hostname} · ${status.platform}`;
    const activity = await window.api.remoteCommand(`${selectedDevice.ip}:47821`, password, 'get-activity');
    renderActivity(activity.entries || []);
  } catch (error) {
    detailOnline.textContent = 'Offline or unreachable';
    detailOnlineDot.classList.remove('local');
    detailPlatform.textContent = '';
    detailActivity.innerHTML = '<div class="empty-devices">The agent could not be reached. Check the IP, password, and firewall.</div>';
  }
}

function renderActivity(entries) {
  if (!entries.length) {
    detailActivity.innerHTML = '<div class="empty-devices">No Lockdown activity has been recorded yet.</div>';
    return;
  }
  detailActivity.innerHTML = entries.map((entry) => `<div class="activity-row"><span class="activity-dot"></span><div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.detail || '')}</small></div><time>${new Date(entry.timestamp).toLocaleString()}</time></div>`).join('');
}

function renderGroups() {
  groupSelect.innerHTML = '<option value="">Choose a saved group</option>' + networkGroups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)} (${group.devices.length})</option>`).join('');
  renderSavedPcCards();
}

function savedDevices() {
  const devices = new Map();
  networkGroups.forEach((group) => group.devices.forEach((device) => {
    const key = normalizedMac(device.mac) || device.ip;
    const current = devices.get(key) || { ...device, groups: [] };
    if (!current.name && device.name) current.name = device.name;
    if (!current.groups.includes(group.name)) current.groups.push(group.name);
    devices.set(key, current);
  }));
  return [...devices.values()];
}

function savedDeviceKey(device) {
  return encodeURIComponent(normalizedMac(device.mac) || device.ip);
}

function selectedSavedDevices() {
  const selectedKeys = new Set([...savedPcCards.querySelectorAll('[data-saved-select]:checked')].map((input) => input.dataset.savedSelect));
  return savedDevices().filter((device) => selectedKeys.has(savedDeviceKey(device)));
}

function renderSavedPcCards() {
  const devices = savedDevices();
  savedPcCount.textContent = `${devices.length} saved`;
  if (!devices.length) {
    savedPcCards.innerHTML = '<div class="empty-devices">Save a group to see its PCs here.</div>';
    return;
  }
  savedPcCards.innerHTML = devices.map((device) => `<article class="saved-pc-card" data-saved-card="${escapeHtml(device.ip)}"><div class="saved-card-top"><label><input type="checkbox" data-saved-select="${escapeHtml(savedDeviceKey(device))}"${selectedSavedKeys.has(savedDeviceKey(device)) ? ' checked' : ''}> Select</label><span class="device-state"></span><span class="saved-card-status">Checking...</span></div><h3>${escapeHtml(device.name || `Device ${device.ip}`)}</h3><p>${escapeHtml(device.ip)} · ${escapeHtml(device.mac || 'MAC unavailable')}</p><div class="saved-card-groups">${device.groups.map((group) => `<span>${escapeHtml(group)}</span>`).join('')}</div><div class="saved-card-actions"><button data-card-view="${escapeHtml(device.ip)}">View activity</button><button data-card-sites="${escapeHtml(device.ip)}">Lock sites</button><button data-card-lock="${escapeHtml(device.ip)}">Lock PC</button><button class="danger-button" data-card-shutdown="${escapeHtml(device.ip)}">Shut down</button></div></article>`).join('');
  savedPcCards.querySelectorAll('[data-card-view]').forEach((button) => button.addEventListener('click', () => openSavedDevice(button.dataset.cardView)));
  savedPcCards.querySelectorAll('[data-card-sites]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardSites, 'update-sites')));
  savedPcCards.querySelectorAll('[data-card-lock]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardLock, 'start-lock')));
  savedPcCards.querySelectorAll('[data-card-shutdown]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardShutdown, 'shutdown')));
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => input.addEventListener('change', updateSavedSelectionState));
  updateSavedSelectionState();
  updateSavedDiscoveryStatuses(devices);
  refreshSavedPcStatuses(devices);
}

function updateSavedDiscoveryStatuses(devices) {
  devices.forEach((device) => {
    const card = savedPcCards.querySelector(`[data-saved-card="${CSS.escape(device.ip)}"]`);
    if (!card) return;
    const discovered = discoveredDevices.some((item) => devicesMatch(item, device));
    card.querySelector('.saved-card-status').textContent = discovered ? 'Online' : 'Offline';
    card.querySelector('.device-state').classList.toggle('local', discovered);
  });
}

function updateSavedSelectionState() {
  const inputs = [...savedPcCards.querySelectorAll('[data-saved-select]')];
  selectedSavedKeys = new Set(inputs.filter((input) => input.checked).map((input) => input.dataset.savedSelect));
  const selected = inputs.filter((input) => input.checked).length;
  selectAllSaved.checked = inputs.length > 0 && selected === inputs.length;
  selectAllSaved.indeterminate = selected > 0 && selected < inputs.length;
  runBulkTaskBtn.textContent = selected ? `Run task on ${selected} selected` : 'Run task on selected';
}

function openSavedDevice(ip) {
  const device = savedDevices().find((item) => item.ip === ip);
  if (!device) return;
  if (!discoveredDevices.some((item) => item.ip === ip)) discoveredDevices.push(device);
  openDeviceDetails(ip);
}

async function refreshSavedPcStatuses(devices) {
  const password = agentSessionPassword(false);
  if (!password) return;
  await Promise.all(devices.map(async (device) => {
    const card = savedPcCards.querySelector(`[data-saved-card="${device.ip}"]`);
    try {
      await window.api.remoteCommand(`${device.ip}:47821`, password, 'get-status');
      card.querySelector('.saved-card-status').textContent = 'Online';
      card.querySelector('.device-state').classList.add('local');
    } catch (_) {
      card.querySelector('.saved-card-status').textContent = 'Offline';
    }
  }));
}

async function runSavedDeviceTask(ip, command) {
  const device = savedDevices().find((item) => item.ip === ip);
  if (!device) return;
  if (command === 'shutdown' && !confirm(`Shut down ${device.name || device.ip}?`)) return;
  await runBulkCommand([device], command, command === 'shutdown' ? 'Shutdown sent' : 'Task sent');
}

async function runBulkCommand(devices, command, message) {
  const isAdmin = command === 'shutdown';
  const password = agentSessionPassword();
  if (!devices.length || !password) {
    showToast('Enter the agent password first');
    return;
  }
  const payload = command === 'update-sites' ? sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'update-apps' ? appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'start-lock' ? { minutes: parseInt(lockMinutesInput.value, 10) || 60 } : null;
  runBulkTaskBtn.disabled = true;
  const results = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, command, payload, isAdmin ? 'admin' : 'operator')));
  const success = results.filter((result) => result.status === 'fulfilled').length;
  runBulkTaskBtn.disabled = false;
  showToast(`${message} on ${success}/${devices.length} saved PC${devices.length === 1 ? '' : 's'}`);
  refreshSavedPcStatuses(devices);
}

async function refreshSavedNetwork() {
  const latestGroups = await window.api.getNetworkGroups();
  if (JSON.stringify(latestGroups) !== JSON.stringify(networkGroups)) {
    networkGroups = latestGroups;
    renderGroups();
  }
  if (savedNetworkRefreshRunning || !networkGroups.length) return;
  savedNetworkRefreshRunning = true;
  try {
    const devices = await window.api.discoverNetwork();
    discoveredDevices = devices;
    await reconcileNetworkGroups(devices);
    renderGroups();
  } catch (_) {
    refreshSavedPcStatuses(savedDevices());
  } finally {
    savedNetworkRefreshRunning = false;
  }
}

async function scanNetwork() {
  scanNetworkBtn.disabled = true;
  scanNetworkBtn.firstElementChild.textContent = 'Scanning...';
  try {
    const devices = await window.api.discoverNetwork();
    await reconcileNetworkGroups(devices);
    renderDevices(devices);
    renderGroups();
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
  await syncNetworkGroup(networkGroups[networkGroups.length - 1]);
  renderGroups();
  groupNameInput.value = '';
  showToast(`Group “${name}” saved`);
}

async function syncNetworkGroup(group) {
  const password = agentSessionPassword();
  if (!password || !group) return;
  const peers = discoveredDevices.filter((device) => !device.local);
  await Promise.allSettled(peers.map((device) => window.api.remoteCommand(
    `${device.ip}:47821`, password, 'merge-network-group', group, 'operator'
  )));
}

function applyGroupSelection() {
  const group = networkGroups.find((item) => item.id === groupSelect.value);
  if (!group) return;
  const knownIps = new Set(discoveredDevices.map((device) => device.ip));
  const missingDevices = group.devices.filter((device) => !knownIps.has(device.ip));
  if (missingDevices.length) renderDevices([...discoveredDevices, ...missingDevices]);
  document.querySelectorAll('[data-device-ip]').forEach((checkbox) => {
    const device = discoveredDevices.find((item) => item.ip === checkbox.dataset.deviceIp);
    checkbox.checked = Boolean(device && group.devices.some((savedDevice) => devicesMatch(savedDevice, device)));
  });
  groupStatus.textContent = `${group.devices.length} devices selected`;
}

async function sendGroup(command, payload, message) {
  const devices = selectedDevices();
  const password = agentSessionPassword();
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
async function sendSingleDevice(command, payload, message) {
  const isAdmin = command === 'shutdown';
  const password = agentSessionPassword();
  if (!selectedDevice || !password) {
    showToast('Select a device and enter the agent password first');
    return;
  }
  detailSitesBtn.disabled = true;
  detailShutdownBtn.disabled = true;
  try {
    await window.api.remoteCommand(`${selectedDevice.ip}:47821`, password, command, payload, isAdmin ? 'admin' : 'operator');
    showToast(message);
    await refreshDeviceDetails();
  } catch (error) {
    showToast(error.message);
  } finally {
    detailSitesBtn.disabled = false;
    detailShutdownBtn.disabled = false;
  }
}

async function sendRemote(command, payload, successMessage) {
  const host = remoteHostInput.value.trim();
  const password = agentSessionPassword();
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

function renderUpdateStatus(state) {
  if (!state) return;
  appVersion.textContent = `v${state.currentVersion || '--'}`;
  automaticUpdates.checked = state.automaticUpdates !== false;
  updateStatus.textContent = state.message || 'Ready to check for updates.';
  updateProgressBar.style.width = `${state.progress || 0}%`;
  updateProgressLabel.textContent = `${state.progress || 0}%`;
  updateProgress.classList.toggle('hidden', !['downloading', 'downloaded'].includes(state.status));
  updateActionBtn.classList.add('hidden');
  updateActionBtn.disabled = false;
  if (state.status === 'available') updateActionBtn.textContent = 'Update Now';
  if (state.status === 'available' || state.status === 'downloaded') updateActionBtn.classList.remove('hidden');
  if (state.status === 'downloaded') updateActionBtn.textContent = 'Restart and Install';
  if (state.status === 'downloading') updateActionBtn.disabled = true;
  checkUpdatesBtn.disabled = state.status === 'checking' || state.status === 'downloading';
}

function markUpdateCheck() {
  lastUpdateCheck.textContent = `Last checked: ${new Date().toLocaleString()}`;
}

function setActiveTab(id) {
  activeTab = id;
  document.querySelectorAll('[data-tab-section]').forEach((section) => {
    section.classList.toggle('tab-visible', section.dataset.tabSection === activeTab);
  });
  document.querySelectorAll('.nav-item').forEach((item) => {
    const navId = item.getAttribute('href').slice(1);
    const mappedId = navId === 'apps' ? 'applications' : navId === 'speed-view' ? 'speed-test' : navId;
    item.classList.toggle('active', mappedId === activeTab);
  });
  if (activeTab === 'speed-test') {
    clearInterval(speedRefreshTimer);
    runGovernorTest();
    speedRefreshTimer = setInterval(runGovernorTest, 30000);
  } else {
    clearInterval(speedRefreshTimer);
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
runBulkTaskBtn.addEventListener('click', () => {
  const devices = selectedSavedDevices();
  if (!devices.length) {
    showToast('Select at least one saved PC');
    return;
  }
  if (bulkTask.value === 'shutdown' && !confirm(`Shut down all ${devices.length} saved PCs?`)) return;
  runBulkCommand(devices, bulkTask.value, 'Task completed');
});
selectAllSaved.addEventListener('change', () => {
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => { input.checked = selectAllSaved.checked; });
  updateSavedSelectionState();
});
closeDetailBtn.addEventListener('click', () => { deviceDetail.classList.add('hidden'); selectedDevice = null; });
detailRefreshBtn.addEventListener('click', refreshDeviceDetails);
detailSitesBtn.addEventListener('click', async () => {
  if (!selectedDevice) return;
  await sendSingleDevice('update-sites', sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean), 'Website list sent to this PC');
});
detailShutdownBtn.addEventListener('click', async () => {
  if (!selectedDevice || !confirm(`Shut down ${selectedDevice.name || selectedDevice.ip}?`)) return;
  await sendSingleDevice('shutdown', null, 'Shutdown command sent');
});
speedTestBtn.addEventListener('click', runSpeedTest);
governorTestBtn.addEventListener('click', runGovernorTest);
checkUpdatesBtn.addEventListener('click', async () => {
  markUpdateCheck();
  await window.api.checkForUpdates();
});
updateActionBtn.addEventListener('click', async () => {
  if (updateActionBtn.textContent === 'Restart and Install') {
    await window.api.installUpdate();
    return;
  }
  await window.api.downloadUpdate();
});
automaticUpdates.addEventListener('change', () => {
  window.localStorage.setItem('lockdown-automatic-updates', automaticUpdates.checked ? 'on' : 'off');
  window.api.setAutomaticUpdates(automaticUpdates.checked);
});
window.api.onUpdateStatus((state) => {
  if (state.status === 'checking' || state.status === 'current' || state.status === 'available' || state.status === 'error') markUpdateCheck();
  renderUpdateStatus(state);
});
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  const navId = item.getAttribute('href').slice(1);
  const tabId = navId === 'apps' ? 'applications' : navId === 'speed-view' ? 'speed-test' : navId;
  setActiveTab(tabId);
}));
setActiveTab('overview');
automaticUpdates.checked = window.localStorage.getItem('lockdown-automatic-updates') !== 'off';
window.api.setAutomaticUpdates(automaticUpdates.checked);
window.api.getAppVersion().then((version) => { appVersion.textContent = `v${version}`; });
window.api.getUpdateStatus().then(renderUpdateStatus);
window.api.getNetworkGroups().then((groups) => { networkGroups = groups; renderGroups(); });
loadData();
setInterval(refreshLockStatus, 5000);
setInterval(refreshSavedNetwork, 30000);
