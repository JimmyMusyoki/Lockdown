const sitesInput = document.getElementById('sites-input');
const allowedSitesInput = document.getElementById('allowed-sites-input');
const appsInput = document.getElementById('apps-input');
const saveSitesBtn = document.getElementById('save-sites');
const saveAppsBtn = document.getElementById('save-apps');
const lockMinutesInput = document.getElementById('lock-minutes');
const startLockBtn = document.getElementById('start-lock');
const gamingMode = document.getElementById('gaming-mode');
const lockStatusEl = document.getElementById('lock-status');
const lockBanner = document.getElementById('lock-banner');
const sitesCount = document.getElementById('sites-count');
const appsCount = document.getElementById('apps-count');
const protectionState = document.getElementById('protection-state');
const protectionDetail = document.getElementById('protection-detail');
const toast = document.getElementById('toast');
const updateStatus = document.getElementById('update-status');
const lastUpdateCheck = document.getElementById('last-update-check');
const automaticUpdates = document.getElementById('automatic-updates');
const automaticUpdatesSidebar = document.getElementById('automatic-updates-sidebar');
const automaticUpdatesAbout = document.getElementById('automatic-updates-about');
const themeToggleSidebar = document.getElementById('theme-toggle-sidebar');
const themeToggleLabel = document.getElementById('theme-toggle-label');
const appVersionSidebar = document.getElementById('app-version-sidebar');
const appVersionAbout = document.getElementById('app-version-about');
const aboutUpdateStatus = document.getElementById('about-update-status');
const aboutSidebarStatus = document.getElementById('about-sidebar-status');
const checkUpdatesBtn = document.getElementById('check-updates');
const updateActionBtn = document.getElementById('update-action');
const updateProgress = document.getElementById('update-progress');
const updateProgressBar = document.getElementById('update-progress-bar');
const updateProgressLabel = document.getElementById('update-progress-label');
const agentSessionStatus = document.getElementById('agent-session-status');
const scanNetworkBtn = document.getElementById('scan-network');
const deviceList = document.getElementById('device-list');
const deviceCount = document.getElementById('device-count');
const groupNameInput = document.getElementById('group-name');
const saveGroupBtn = document.getElementById('save-group');
const addGroupBtn = document.getElementById('add-group');
const groupSelect = document.getElementById('group-select');
const deviceGroupSelect = document.getElementById('device-group-select');
const assignDevicesBtn = document.getElementById('assign-devices');
const loadGroupBtn = document.getElementById('load-group');
const deleteGroupBtn = document.getElementById('delete-group');
const groupList = document.getElementById('group-list');
const groupDialog = document.getElementById('group-dialog');
const groupDialogCancel = document.getElementById('group-dialog-cancel');
const groupDevicesHeader = document.getElementById('group-devices-header');
const backToGroupsBtn = document.getElementById('back-to-groups');
const deviceStepGroupsBtn = document.getElementById('device-step-groups');
const deviceStepDevicesBtn = document.getElementById('device-step-devices');
const deviceStepLocalBtn = document.getElementById('device-step-local');
const activeGroupName = document.getElementById('active-group-name');
const activeGroupCount = document.getElementById('active-group-count');
const groupSelectionHelp = document.getElementById('group-selection-help');
const focusSelectedBtn = document.getElementById('focus-selected');
const blockWebsitesSelectedBtn = document.getElementById('block-websites-selected');
const blockAppsSelectedBtn = document.getElementById('block-apps-selected');
const shutdownSelectedBtn = document.getElementById('shutdown-selected');
const openLocalRulesBtn = document.getElementById('open-local-rules');
const groupSitesBtn = document.getElementById('group-sites');
const groupAppsBtn = document.getElementById('group-apps');
const groupLockBtn = document.getElementById('group-lock');
const groupStatus = document.getElementById('group-status');
const savedPcCount = document.getElementById('saved-pc-count');
const refreshSavedPcsBtn = document.getElementById('refresh-saved-pcs');
const savedPcsView = document.getElementById('saved-pcs');
const savedPcCards = document.getElementById('saved-pc-cards');
const selectAllSaved = document.getElementById('select-all-saved');
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
const usageChart = document.getElementById('usage-chart');
const usageEmpty = document.getElementById('usage-empty');
const usageCurrent = document.getElementById('usage-current');
const usageUpdated = document.getElementById('usage-updated');
const dashboardOnline = document.getElementById('dashboard-online');
const dashboardOffline = document.getElementById('dashboard-offline');
const dashboardDeviceList = document.getElementById('dashboard-device-list');
let speedRefreshTimer;
let discoveredDevices = [];
let usageReadings = [];
let networkGroups = [];
let activeTab = 'overview';
let agentSessionExpiresAt = 0;
let savedNetworkRefreshRunning = false;
let selectedSavedKeys = new Set();
let editingGroupId = null;
let visibleGroupId = null;
const gamingApps = ['steam.exe', 'epicgameslauncher.exe', 'riotclientservices.exe', 'battle.net.exe'];

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

function applyTheme(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.body.dataset.theme = selectedTheme;
  if (themeToggleSidebar) {
    themeToggleSidebar.checked = selectedTheme === 'dark';
    themeToggleSidebar.setAttribute('aria-label', selectedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (themeToggleLabel) themeToggleLabel.textContent = selectedTheme === 'dark' ? 'Dark mode' : 'Light mode';
  try {
    window.localStorage.setItem('lockdown-theme', selectedTheme);
  } catch (_) {
    // ignore storage issues in restricted contexts
  }
}

function agentSessionPassword() {
  return 'no-password';
}

async function unlockAgentSession() {
  return true;
}

function updateAgentSessionStatus() {
  if (!agentSessionStatus) return;
  agentSessionStatus.textContent = 'Authenticated';
  agentSessionStatus.classList.add('connected');
}

async function requireAuthentication() {
  return true;
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
  renderDashboardDevices(devices);
  deviceCount.textContent = `${devices.length} device${devices.length === 1 ? '' : 's'} found`;
  if (!devices.length) {
    deviceList.innerHTML = '<div class="empty-devices">No devices were found in the current network table.</div>';
    return;
  }
  deviceList.innerHTML = devices.map((device) => {
    const displayName = device.nameAvailable ? escapeHtml(device.name) : 'Name unavailable';
    const nameNote = device.nameAvailable ? 'PC name' : 'Enable Network Discovery on this PC';
    return `<div class="device-row ${device.online === false ? 'offline-device' : ''}"><input type="checkbox" data-device-ip="${escapeHtml(device.ip)}"><span class="device-state ${device.online !== false ? 'local' : ''}"></span><span class="device-details"><strong>${displayName}<em>${nameNote} · ${escapeHtml(device.type || 'unknown')} · ${device.online === false ? 'Offline' : 'Online'}</em></strong><small>IP ${escapeHtml(device.ip)} · MAC ${escapeHtml(device.mac || 'unavailable')}${device.local ? ' · This computer' : ''}</small></span></div>`;
  }).join('');
}

function renderDashboardDevices(devices) {
  const online = devices.filter((device) => device.online !== false).length;
  dashboardOnline.textContent = online;
  dashboardOffline.textContent = Math.max(0, devices.length - online);
  if (!devices.length) {
    dashboardDeviceList.innerHTML = '<span class="chart-empty">Scan Network to see devices here.</span>';
    return;
  }
  dashboardDeviceList.innerHTML = devices.slice(0, 4).map((device) => `<div class="dashboard-device"><span class="device-state ${device.online !== false ? 'local' : ''}"></span><strong>${escapeHtml(device.name || device.ip)}</strong><span>${device.online !== false ? 'Online' : 'Offline'}</span></div>`).join('');
}

function drawUsageChart() {
  const context = usageChart.getContext('2d');
  const width = usageChart.width;
  const height = usageChart.height;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = '#e1e8e2';
  context.lineWidth = 1;
  for (let index = 1; index < 4; index += 1) {
    const y = (height / 4) * index;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  if (!usageReadings.length) return;
  const max = Math.max(10, ...usageReadings.flatMap((reading) => [reading.download, reading.upload]));
  const point = (index, value) => ({ x: (index / Math.max(usageReadings.length - 1, 1)) * width, y: height - (value / max) * (height - 18) - 8 });
  [['download', '#4775b7'], ['upload', '#1f8063']].forEach(([key, color]) => {
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    usageReadings.forEach((reading, index) => {
      const position = point(index, reading[key]);
      if (index === 0) context.moveTo(position.x, position.y);
      else context.lineTo(position.x, position.y);
    });
    context.stroke();
  });
  usageEmpty.classList.add('hidden');
}

function recordUsage(result) {
  usageReadings = [...usageReadings, { download: Number(result.downloadMbps) || 0, upload: Number(result.uploadMbps) || 0 }].slice(-12);
  usageCurrent.textContent = `${result.downloadMbps} Mbps`;
  usageUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  drawUsageChart();
}

function renderGroups() {
  const options = '<option value="">Choose a saved group</option>' + networkGroups.map((group) => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)} (${group.devices.length})</option>`).join('');
  groupSelect.innerHTML = options;
  deviceGroupSelect.innerHTML = options;
  if (visibleGroupId && !networkGroups.some((group) => group.id === visibleGroupId)) visibleGroupId = null;
  groupList.innerHTML = networkGroups.length
    ? networkGroups.map((group) => `<article class="group-card"><div><strong>${escapeHtml(group.name)}</strong><span>${group.devices.length} device${group.devices.length === 1 ? '' : 's'}</span></div><div class="group-card-actions"><button data-group-view="${escapeHtml(group.id)}">Manage devices</button><button data-group-edit="${escapeHtml(group.id)}">Edit name</button><button class="danger-button" data-group-delete="${escapeHtml(group.id)}">Delete</button></div></article>`).join('')
    : '<div class="empty-devices">No groups created yet. Add a group to begin.</div>';
  const selectedGroup = networkGroups.find((group) => group.id === visibleGroupId);
  const deviceWorkspace = document.querySelector('#saved-pcs .bulk-panel');
  groupList.classList.toggle('hidden', Boolean(selectedGroup));
  groupDevicesHeader.classList.toggle('hidden', !selectedGroup);
  deviceWorkspace.classList.toggle('hidden', !selectedGroup);
  if (selectedGroup) {
    activeGroupName.textContent = selectedGroup.name;
    activeGroupCount.textContent = `${selectedGroup.devices.length} device${selectedGroup.devices.length === 1 ? '' : 's'}`;
    groupSelectionHelp.textContent = 'Select one PC, several PCs, or every PC in this group.';
  } else {
    groupSelectionHelp.textContent = 'Open a group to manage its devices.';
  }
  groupList.querySelectorAll('[data-group-view]').forEach((button) => button.addEventListener('click', () => viewGroupDevices(button.dataset.groupView)));
  groupList.querySelectorAll('[data-group-edit]').forEach((button) => button.addEventListener('click', () => editGroup(button.dataset.groupEdit)));
  groupList.querySelectorAll('[data-group-delete]').forEach((button) => button.addEventListener('click', () => deleteGroupById(button.dataset.groupDelete)));
  renderSavedPcCards();
}

function savedDevices() {
  const devices = new Map();
  networkGroups.forEach((group) => group.devices.forEach((device) => {
    const key = device.local ? 'local-device' : normalizedMac(device.mac) || device.ip;
    const current = devices.get(key) || { ...device, groups: [] };
    if (!current.name && device.name) current.name = device.name;
    if (!current.groups.includes(group.name)) current.groups.push(group.name);
    devices.set(key, current);
  }));
  return [...devices.values()];
}

function savedDeviceKey(device) {
  return encodeURIComponent(device.local ? 'local-device' : normalizedMac(device.mac) || device.ip);
}

function isCurrentDevice(device) {
  return discoveredDevices.some((item) => item.local && devicesMatch(item, device));
}

function selectedSavedDevices() {
  const selectedKeys = new Set([...savedPcCards.querySelectorAll('[data-saved-select]:checked')].map((input) => input.dataset.savedSelect));
  const selectedGroup = networkGroups.find((group) => group.id === visibleGroupId);
  return (selectedGroup?.devices || []).filter((device) => selectedKeys.has(savedDeviceKey(device)));
}

function renderSavedPcCards() {
  const selectedGroup = networkGroups.find((group) => group.id === visibleGroupId);
  const devices = selectedGroup ? selectedGroup.devices.map((device) => ({
    ...device,
    groups: device.groups?.length ? device.groups : [selectedGroup.name]
  })) : [];
  savedPcCount.textContent = `${networkGroups.length} group${networkGroups.length === 1 ? '' : 's'}`;
  if (!devices.length) {
    savedPcCards.innerHTML = '<div class="empty-devices">This group has no devices yet. Go to Network to scan and add devices.</div>';
    return;
  }
  savedPcCards.innerHTML = devices.map((device) => `<article class="saved-pc-card" data-saved-card="${escapeHtml(device.ip)}"><div class="saved-card-top"><label><input type="checkbox" data-saved-select="${escapeHtml(savedDeviceKey(device))}"${selectedSavedKeys.has(savedDeviceKey(device)) ? ' checked' : ''}> Select PC</label><span class="device-state"></span><span class="saved-card-status">Checking...</span></div><h3>${escapeHtml(device.name || `Device ${device.ip}`)}</h3><p>${escapeHtml(device.ip)} · ${escapeHtml(device.mac || 'MAC unavailable')} · ${escapeHtml(device.type || 'unknown')}</p><div class="saved-card-groups">${device.groups.map((group) => `<span>${escapeHtml(group)}</span>`).join('')}</div><div class="saved-card-actions"><button data-card-sites="${escapeHtml(device.ip)}">Block websites</button><button data-card-apps="${escapeHtml(device.ip)}">Block apps</button><button data-card-lock="${escapeHtml(device.ip)}">Focus lock</button>${isCurrentDevice(device) ? '' : `<button class="danger-button" data-card-shutdown="${escapeHtml(device.ip)}">Shut down</button>`}</div></article>`).join('');
  savedPcCards.querySelectorAll('[data-card-sites]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardSites, 'update-sites')));
  savedPcCards.querySelectorAll('[data-card-apps]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardApps, 'update-apps')));
  savedPcCards.querySelectorAll('[data-card-lock]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardLock, 'start-lock')));
  savedPcCards.querySelectorAll('[data-card-shutdown]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardShutdown, 'shutdown')));
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => input.addEventListener('change', updateSavedSelectionState));
  updateSavedSelectionState();
  updateSavedDiscoveryStatuses(devices);
  refreshSavedPcStatuses(devices);
}

function viewGroupDevices(groupId) {
  visibleGroupId = groupId;
  setDeviceStep('devices');
  renderGroups();
  savedPcCards.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setDeviceStep(step) {
  document.querySelector('.content-shell').dataset.deviceStep = step;
  [deviceStepGroupsBtn, deviceStepDevicesBtn, deviceStepLocalBtn].forEach((button) => button.classList.toggle('active', button.id === `device-step-${step}`));
}

function closeGroupEditor() {
  groupDialog.hidden = true;
}

function editGroup(groupId) {
  groupSelect.value = groupId;
  applyGroupSelection();
  groupDialog.hidden = false;
  groupNameInput.focus();
}

async function deleteGroupById(groupId) {
  groupSelect.value = groupId;
  await deleteSelectedGroup();
}

function updateSavedDiscoveryStatuses(devices) {
  devices.forEach((device) => {
    const card = savedPcCards.querySelector(`[data-saved-card="${CSS.escape(device.ip)}"]`);
    if (!card) return;
    const discovered = discoveredDevices.find((item) => devicesMatch(item, device));
    card.querySelector('.saved-card-status').textContent = discovered?.online ? 'Online' : 'Offline';
    card.querySelector('.device-state').classList.toggle('local', Boolean(discovered?.online));
  });
}

function updateSavedSelectionState() {
  const inputs = [...savedPcCards.querySelectorAll('[data-saved-select]')];
  selectedSavedKeys = new Set(inputs.filter((input) => input.checked).map((input) => input.dataset.savedSelect));
  const selected = inputs.filter((input) => input.checked).length;
  selectAllSaved.checked = inputs.length > 0 && selected === inputs.length;
  selectAllSaved.indeterminate = selected > 0 && selected < inputs.length;
  groupSelectionHelp.textContent = selected
    ? `${selected} PC${selected === 1 ? '' : 's'} selected — choose an action below.`
    : 'Select one PC, several PCs, or every PC in this group.';
  [focusSelectedBtn, blockWebsitesSelectedBtn, blockAppsSelectedBtn, shutdownSelectedBtn].forEach((button) => { button.disabled = selected === 0; });
}

async function refreshSavedPcStatuses(devices) {
  const password = agentSessionPassword();
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
  if (command === 'shutdown' && isCurrentDevice(device)) {
    showToast('This computer cannot be shut down remotely.');
    return;
  }
  if (command === 'shutdown' && !confirm(`Shut down ${device.name || device.ip}?`)) return;
  await runBulkCommand([device], command, command === 'shutdown' ? 'Shutdown sent' : 'Task sent');
}

async function runBulkCommand(devices, command, message) {
  if (command === 'shutdown') devices = devices.filter((device) => !isCurrentDevice(device));
  if (!devices.length) {
    showToast('No remote PCs are selected for shutdown');
    return;
  }
  const isAdmin = command === 'shutdown';
  const password = agentSessionPassword();
  const payload = command === 'update-sites' ? sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'update-apps' ? appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'start-lock' ? { minutes: parseInt(lockMinutesInput.value, 10) || 60 } : null;
  [focusSelectedBtn, blockWebsitesSelectedBtn, blockAppsSelectedBtn, shutdownSelectedBtn].forEach((button) => { button.disabled = true; });
  const results = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, command, payload, isAdmin ? 'admin' : 'operator')));
  const success = results.filter((result) => result.status === 'fulfilled').length;
  updateSavedSelectionState();
  const failure = results.find((result) => result.status === 'rejected');
  const failureIndex = results.findIndex((result) => result.status === 'rejected');
  const failedDevice = failureIndex >= 0 ? devices[failureIndex] : null;
  const failureMessage = failedDevice
    ? `${failedDevice.name || failedDevice.ip}: ${failure?.reason?.message || 'Task failed'}`
    : 'Task failed';
  showToast(success ? `${message} on ${success}/${devices.length} saved PC${devices.length === 1 ? '' : 's'}` : failureMessage);
  if (command !== 'shutdown') refreshSavedPcStatuses(devices);
}

async function refreshSavedNetwork() {
  const latestGroups = await window.api.getNetworkGroups();
  if (JSON.stringify(latestGroups) !== JSON.stringify(networkGroups)) {
    networkGroups = latestGroups;
    renderGroups();
  }
  if (savedNetworkRefreshRunning) return;
  savedNetworkRefreshRunning = true;
  try {
    const devices = await window.api.discoverNetwork();
    discoveredDevices = devices;
    renderDashboardDevices(devices);
    await reconcileNetworkGroups(devices);
    await synchronizeNetworkGroups();
    renderGroups();
  } catch (_) {
    refreshSavedPcStatuses(savedDevices());
  } finally {
    savedNetworkRefreshRunning = false;
  }
}

async function scanNetwork() {
  if (!window.api?.discoverNetwork) {
    showToast('Network scan is only available in the Electron app.');
    return;
  }
  scanNetworkBtn.disabled = true;
  scanNetworkBtn.firstElementChild.textContent = 'Scanning...';
  try {
    const devices = await window.api.discoverNetwork();
    await reconcileNetworkGroups(devices);
    renderDevices(devices);
    await synchronizeNetworkGroups();
    renderGroups();
    showToast('Network scan complete');
  } catch (error) {
    showToast(`Network scan failed: ${error?.message || 'Check your network connection and try again.'}`);
  } finally {
    scanNetworkBtn.disabled = false;
    scanNetworkBtn.firstElementChild.textContent = 'Scan network';
  }
}

async function refreshSavedPcs() {
  if (!window.api?.discoverNetwork || !refreshSavedPcsBtn) return;
  refreshSavedPcsBtn.disabled = true;
  refreshSavedPcsBtn.firstElementChild.textContent = 'Checking...';
  try {
    const devices = await window.api.discoverNetwork();
    discoveredDevices = devices;
    renderDashboardDevices(devices);
    await reconcileNetworkGroups(devices);
    await synchronizeNetworkGroups();
    renderDevices(devices);
    renderGroups();
    showToast('Saved PC status refreshed');
  } catch (error) {
    showToast(`Refresh failed: ${error?.message || 'Check your network connection.'}`);
  } finally {
    refreshSavedPcsBtn.disabled = false;
    refreshSavedPcsBtn.firstElementChild.textContent = 'Refresh';
  }
}

async function runSpeedTest() {
  speedTestBtn.disabled = true;
  speedTestBtn.firstElementChild.textContent = 'Testing...';
  try {
    const result = await window.api.networkSpeedTest();
    speedDownload.textContent = result.downloadMbps;
    speedLatency.textContent = result.latencyMs;
    recordUsage(result);
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
    recordUsage(result);
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

window.api?.onNetworkSpeedStage?.((stage) => {
  if (stage === 'upload') {
    governorPhase.textContent = 'UPLOAD';
    progressLabel.textContent = 'MEASURING UPLOAD';
    progressBar.style.width = '72%';
    governorTitle.textContent = 'Checking upload response';
    governorMessage.textContent = 'Switching direction and measuring upstream throughput...';
  }
});

async function saveGroup() {
  await requireAuthentication();
  const name = groupNameInput.value.trim();
  const existingGroup = networkGroups.find((group) => group.id === editingGroupId);
  const devices = existingGroup ? existingGroup.devices : [];
  if (!name) {
    showToast('Enter a group name');
    return;
  }
  const groupId = editingGroupId || undefined;
  networkGroups = await window.api.saveNetworkGroup({ id: groupId, name, devices });
  await syncNetworkGroup(networkGroups.find((group) => group.id === groupId) || networkGroups[networkGroups.length - 1]);
  renderGroups();
  groupNameInput.value = '';
  editingGroupId = null;
  saveGroupBtn.textContent = 'Add group';
  closeGroupEditor();
  showToast(`Group “${name}” saved`);
}

async function assignSelectedDevices() {
  await requireAuthentication();
  const devices = selectedDevices();
  const group = networkGroups.find((item) => item.id === deviceGroupSelect.value);
  if (!devices.length || !group) {
    showToast('Select devices and choose a group first');
    return;
  }
  const existing = new Map(group.devices.map((device) => [normalizedMac(device.mac) || device.ip, device]));
  devices.forEach((device) => existing.set(normalizedMac(device.mac) || device.ip, device));
  networkGroups = await window.api.saveNetworkGroup({ ...group, devices: [...existing.values()] });
  await syncNetworkGroup(networkGroups.find((item) => item.id === group.id));
  renderGroups();
  groupStatus.textContent = `${devices.length} device${devices.length === 1 ? '' : 's'} saved to ${group.name}.`;
  showToast('Devices added to group');
}

async function syncNetworkGroup(group) {
  if (!group || !group.devices.length) return;
  const password = await agentSessionPassword();
  if (!password) return;
  const peers = networkPeers();
  const results = await Promise.allSettled(peers.map((device) => window.api.remoteCommand(
    `${device.ip}:47821`, password, 'merge-network-group', group, 'operator'
  )));
  return results.filter((result) => result.status === 'fulfilled').length;
}

function networkPeers() {
  const peersByKey = new Map();
  [...discoveredDevices, ...savedDevices()].forEach((device) => {
    if (device.local) return;
    const key = normalizedMac(device.mac) || device.ip;
    if (key) peersByKey.set(key, { ...peersByKey.get(key), ...device });
  });
  return [...peersByKey.values()];
}

function mergeGroupDevices(left, right) {
  const devices = new Map((left.devices || []).map((device) => [normalizedMac(device.mac) || device.ip, device]));
  (right.devices || []).forEach((device) => {
    const key = normalizedMac(device.mac) || device.ip;
    if (key) devices.set(key, { ...devices.get(key), ...device });
  });
  return { ...left, ...right, devices: [...devices.values()] };
}

async function synchronizeNetworkGroups() {
  const peers = networkPeers();
  if (!peers.length) return;
  const password = agentSessionPassword();
  if (!password) return;
  const pulled = await Promise.allSettled(peers.map((device) => window.api.remoteCommand(
    `${device.ip}:47821`, password, 'get-network-groups', null, 'operator'
  )));
  const mergedGroups = new Map(networkGroups.map((group) => [group.id, group]));
  pulled.forEach((result) => {
    if (result.status !== 'fulfilled' || !Array.isArray(result.value)) return;
    result.value.forEach((group) => {
      if (!group?.id || !Array.isArray(group.devices)) return;
      mergedGroups.set(group.id, mergedGroups.has(group.id)
        ? mergeGroupDevices(mergedGroups.get(group.id), group)
        : group);
    });
  });
  const merged = [...mergedGroups.values()];
  if (JSON.stringify(merged) !== JSON.stringify(networkGroups)) {
    for (const group of merged) await window.api.saveNetworkGroup(group);
    networkGroups = await window.api.getNetworkGroups();
  }
  await Promise.allSettled(merged.map((group) => syncNetworkGroup(group)));
}

function applyGroupSelection() {
  const group = networkGroups.find((item) => item.id === groupSelect.value);
  if (!group) return;
  editingGroupId = group.id;
  groupNameInput.value = group.name;
  saveGroupBtn.textContent = 'Save group changes';
  const knownIps = new Set(discoveredDevices.map((device) => device.ip));
  const missingDevices = group.devices.filter((device) => !knownIps.has(device.ip));
  if (missingDevices.length) renderDevices([...discoveredDevices, ...missingDevices]);
  document.querySelectorAll('[data-device-ip]').forEach((checkbox) => {
    const device = discoveredDevices.find((item) => item.ip === checkbox.dataset.deviceIp);
    checkbox.checked = Boolean(device && group.devices.some((savedDevice) => devicesMatch(savedDevice, device)));
  });
  groupStatus.textContent = `${group.devices.length} devices selected`;
}

async function deleteSelectedGroup() {
  await requireAuthentication();
  const group = networkGroups.find((item) => item.id === groupSelect.value);
  if (!group) {
    showToast('Choose a group to delete');
    return;
  }
  if (!confirm(`Delete group “${group.name}”?`)) return;
  networkGroups = await window.api.deleteNetworkGroup(group.id);
  groupNameInput.value = '';
  editingGroupId = null;
  saveGroupBtn.textContent = 'Add group';
  closeGroupEditor();
  renderGroups();
  showToast('Group deleted');
}

async function sendGroup(command, payload, message) {
  const devices = selectedDevices();
  const password = agentSessionPassword();
  if (!devices.length) {
    showToast('Select devices first');
    return;
  }
  groupStatus.textContent = `Sending to ${devices.length} device${devices.length === 1 ? '' : 's'}...`;
  const role = command === 'shutdown' ? 'admin' : 'operator';
  const results = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, command, payload, role)));
  const success = results.filter((result) => result.status === 'fulfilled').length;
  groupStatus.textContent = `${success}/${devices.length} devices accepted the command`;
  const failure = results.find((result) => result.status === 'rejected');
  showToast(success ? `${message} on ${success} device${success === 1 ? '' : 's'}` : failure?.reason?.message || 'Task failed');
}
async function loadData() {
  const data = await window.api.getData();
  sitesInput.value = data.blockedSites.join('\n');
  allowedSitesInput.value = (data.allowedSites || []).join('\n');
  appsInput.value = data.blockedApps.join('\n');
  gamingMode.checked = gamingApps.every((app) => data.blockedApps.some((blockedApp) => blockedApp.toLowerCase() === app));
  updateCounts();
  await refreshLockStatus();
}

async function refreshLockStatus() {
  if (!window.api?.getLockStatus) return;
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
  const currentVersion = state.currentVersion || '--';
  if (appVersionSidebar) appVersionSidebar.textContent = `v${currentVersion}`;
  if (appVersionAbout) appVersionAbout.textContent = `v${currentVersion}`;
  if (aboutSidebarStatus) aboutSidebarStatus.textContent = state.message || 'Ready';
  const isAutomatic = state.automaticUpdates !== false;
  if (automaticUpdates) automaticUpdates.checked = isAutomatic;
  if (automaticUpdatesSidebar) automaticUpdatesSidebar.checked = isAutomatic;
  if (automaticUpdatesAbout) automaticUpdatesAbout.checked = isAutomatic;
  if (updateStatus) updateStatus.textContent = state.message || 'Ready to check for updates.';
  if (aboutUpdateStatus) aboutUpdateStatus.textContent = state.message || 'Ready to check for updates.';
  if (updateProgressBar) updateProgressBar.style.width = `${state.progress || 0}%`;
  if (updateProgressLabel) updateProgressLabel.textContent = `${state.progress || 0}%`;
  if (updateProgress) updateProgress.classList.toggle('hidden', !['downloading', 'downloaded'].includes(state.status));
  if (updateActionBtn) {
    updateActionBtn.classList.add('hidden');
    updateActionBtn.disabled = false;
    if (state.status === 'available') updateActionBtn.textContent = 'Update Now';
    if (state.status === 'available' || state.status === 'downloaded') updateActionBtn.classList.remove('hidden');
    if (state.status === 'downloaded') updateActionBtn.textContent = 'Restart and Install';
    if (state.status === 'downloading') updateActionBtn.disabled = true;
  }
  if (checkUpdatesBtn) checkUpdatesBtn.disabled = state.status === 'checking' || state.status === 'downloading';
}

function markUpdateCheck() {
  if (lastUpdateCheck) lastUpdateCheck.textContent = `Last checked: ${new Date().toLocaleString()}`;
}

function setActiveTab(id) {
  activeTab = id;
  document.querySelectorAll('[data-tab-section]').forEach((section) => {
    section.classList.toggle('tab-visible', section.dataset.tabSection === activeTab);
  });
  document.querySelectorAll('.nav-item').forEach((item) => {
    const navId = item.getAttribute('href').slice(1);
    item.classList.toggle('active', navId === activeTab);
  });
  clearInterval(speedRefreshTimer);
  if (activeTab === 'network') scanNetworkBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (activeTab === 'devices') {
    setDeviceStep('groups');
    savedPcsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

saveSitesBtn.addEventListener('click', async () => {
  await requireAuthentication();
  const sites = sitesInput.value.split('\n').map((s) => s.trim()).filter(Boolean);
  const allowedSites = allowedSitesInput.value.split('\n').map((s) => s.trim()).filter(Boolean);
  try {
    await window.api.updateSites(sites);
    await window.api.updateAllowedSites(allowedSites);
    updateCounts();
    showToast('Website block list saved');
  } catch (err) {
    showToast(err.message);
  }
});

saveAppsBtn.addEventListener('click', async () => {
  await requireAuthentication();
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
  await requireAuthentication();
  const minutes = parseInt(lockMinutesInput.value, 10) || 60;
  if (!confirm(`Lock the block list for ${minutes} minutes? You will NOT be able to undo this early.`)) return;
  await window.api.startLock(minutes);
  await refreshLockStatus();
  showToast('Focus session started');
});

sitesInput.addEventListener('input', updateCounts);
appsInput.addEventListener('input', updateCounts);
gamingMode.addEventListener('change', async () => {
  await requireAuthentication();
  const apps = appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean);
  const updatedApps = gamingMode.checked
    ? [...new Set([...apps, ...gamingApps])]
    : apps.filter((app) => !gamingApps.includes(app.toLowerCase()));
  appsInput.value = updatedApps.join('\n');
  await window.api.updateApps(updatedApps);
  updateCounts();
  showToast(gamingMode.checked ? 'Gaming apps are now blocked' : 'Gaming app blocking disabled');
});
scanNetworkBtn.addEventListener('click', scanNetwork);
refreshSavedPcsBtn?.addEventListener('click', refreshSavedPcs);
addGroupBtn.addEventListener('click', () => {
  editingGroupId = null;
  groupSelect.value = '';
  groupNameInput.value = '';
  saveGroupBtn.textContent = 'Add group';
  groupDialog.hidden = false;
  groupNameInput.focus();
});
saveGroupBtn.addEventListener('click', saveGroup);
assignDevicesBtn.addEventListener('click', assignSelectedDevices);
loadGroupBtn.addEventListener('click', applyGroupSelection);
deleteGroupBtn.addEventListener('click', deleteSelectedGroup);
groupDialogCancel.addEventListener('click', closeGroupEditor);
backToGroupsBtn.addEventListener('click', () => { visibleGroupId = null; setDeviceStep('groups'); renderGroups(); });
deviceStepGroupsBtn.addEventListener('click', () => { visibleGroupId = null; setDeviceStep('groups'); renderGroups(); });
deviceStepDevicesBtn.addEventListener('click', () => {
  if (!visibleGroupId) return showToast('Choose a group first');
  setDeviceStep('devices');
  renderGroups();
});
deviceStepLocalBtn.addEventListener('click', () => {
  setDeviceStep('local');
  savedPcsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
focusSelectedBtn.addEventListener('click', () => {
  const devices = selectedSavedDevices();
  if (!devices.length) return showToast('Select at least one device');
  runBulkCommand(devices, 'start-lock', 'Focus started');
});
blockWebsitesSelectedBtn.addEventListener('click', () => {
  const devices = selectedSavedDevices();
  if (!devices.length) return showToast('Select at least one device');
  runBulkCommand(devices, 'update-sites', 'Website block sent');
});
blockAppsSelectedBtn.addEventListener('click', () => {
  const devices = selectedSavedDevices();
  if (!devices.length) return showToast('Select at least one device');
  runBulkCommand(devices, 'update-apps', 'Application block sent');
});
shutdownSelectedBtn.addEventListener('click', () => {
  const devices = selectedSavedDevices();
  if (!devices.length) {
    showToast('Select at least one saved PC');
    return;
  }
  if (!confirm(`Shut down ${devices.length} selected PC${devices.length === 1 ? '' : 's'}? Unsaved work on those computers may be lost.`)) return;
  runBulkCommand(devices, 'shutdown', 'Shutdown sent');
});
openLocalRulesBtn.addEventListener('click', () => {
  setDeviceStep('local');
  document.getElementById('websites').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
selectAllSaved.addEventListener('change', () => {
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => { input.checked = selectAllSaved.checked; });
  updateSavedSelectionState();
});
speedTestBtn.addEventListener('click', runSpeedTest);
document.querySelectorAll('[data-go-tab]').forEach((button) => button.addEventListener('click', () => setActiveTab(button.dataset.goTab)));
governorTestBtn.addEventListener('click', runGovernorTest);
checkUpdatesBtn?.addEventListener('click', async () => {
  markUpdateCheck();
  await window.api.checkForUpdates();
});
document.getElementById('check-updates-sidebar')?.addEventListener('click', async () => {
  markUpdateCheck();
  await window.api.checkForUpdates();
});
document.getElementById('check-updates-about')?.addEventListener('click', async () => {
  markUpdateCheck();
  await window.api.checkForUpdates();
});
updateActionBtn?.addEventListener('click', async () => {
  if (updateActionBtn.textContent === 'Restart and Install') {
    await window.api.installUpdate();
    return;
  }
  await window.api.downloadUpdate();
});
[automaticUpdates, automaticUpdatesSidebar, automaticUpdatesAbout].forEach((toggle) => {
  if (!toggle) return;
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    window.localStorage.setItem('lockdown-automatic-updates', enabled ? 'on' : 'off');
    [automaticUpdates, automaticUpdatesSidebar, automaticUpdatesAbout].forEach((checkbox) => {
      if (checkbox) checkbox.checked = enabled;
    });
    window.api?.setAutomaticUpdates?.(enabled);
  });
});
window.api?.onUpdateStatus?.((state) => {
  if (state.status === 'checking' || state.status === 'current' || state.status === 'available' || state.status === 'error') markUpdateCheck();
  renderUpdateStatus(state);
});
window.api?.onNetworkGroupsUpdated?.(async () => {
  networkGroups = await window.api.getNetworkGroups();
  renderGroups();
});
if (themeToggleSidebar) {
  themeToggleSidebar.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  const navId = item.getAttribute('href').slice(1);
  setActiveTab(navId);
}));
setActiveTab('overview');
const savedTheme = (() => {
  try {
    return window.localStorage.getItem('lockdown-theme');
  } catch (_) {
    return null;
  }
})();
applyTheme(savedTheme || 'dark');
const savedAutoUpdatePreference = window.localStorage.getItem('lockdown-automatic-updates');
const automaticPreference = savedAutoUpdatePreference !== 'off';
if (automaticUpdates) automaticUpdates.checked = automaticPreference;
if (automaticUpdatesSidebar) automaticUpdatesSidebar.checked = automaticPreference;
if (automaticUpdatesAbout) automaticUpdatesAbout.checked = automaticPreference;
window.api?.setAutomaticUpdates?.(automaticPreference);
window.api?.getAppVersion?.().then((version) => {
  const formattedVersion = `v${version}`;
  if (appVersionSidebar) appVersionSidebar.textContent = formattedVersion;
  if (appVersionAbout) appVersionAbout.textContent = formattedVersion;
});
window.api?.getUpdateStatus?.().then(renderUpdateStatus);
window.api?.getNetworkGroups?.().then((groups) => { networkGroups = groups; renderGroups(); });
if (window.api?.getData) loadData();
setInterval(refreshLockStatus, 1000);
setInterval(refreshSavedNetwork, 30000);
updateAgentSessionStatus();
