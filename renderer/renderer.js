const sitesInput = document.getElementById('sites-input');
const allowedSitesInput = document.getElementById('allowed-sites-input');
const appsInput = document.getElementById('apps-input');
const saveSitesBtn = document.getElementById('save-sites');
const saveAppsBtn = document.getElementById('save-apps');
const lockMinutesInput = document.getElementById('lock-minutes');
const startLockBtn = document.getElementById('start-lock');
const gamingMode = document.getElementById('gaming-mode');
const lockStatusEl = document.getElementById('lock-status');
const temporaryUnblockMinutes = document.getElementById('temporary-unblock-minutes');
const temporaryUnblockBtn = document.getElementById('temporary-unblock');
const clearTemporaryUnblockBtn = document.getElementById('clear-temporary-unblock');
const scheduleNameInput = document.getElementById('schedule-name');
const scheduleStartInput = document.getElementById('schedule-start');
const scheduleEndInput = document.getElementById('schedule-end');
const saveScheduleBtn = document.getElementById('save-schedule');
const scheduleList = document.getElementById('schedule-list');
const lockBanner = document.getElementById('lock-banner');
const sitesCount = document.getElementById('sites-count');
const appsCount = document.getElementById('apps-count');
const protectionState = document.getElementById('protection-state');
const protectionDetail = document.getElementById('protection-detail');
const toast = document.getElementById('toast');
const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.getElementById('sidebar-toggle');
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
const deviceStepRulesBtn = document.getElementById('device-step-rules');
const activeGroupName = document.getElementById('active-group-name');
const activeGroupCount = document.getElementById('active-group-count');
const groupSelectionHelp = document.getElementById('group-selection-help');
const focusSelectedBtn = document.getElementById('focus-selected');
const blockWebsitesSelectedBtn = document.getElementById('block-websites-selected');
const blockAppsSelectedBtn = document.getElementById('block-apps-selected');
const blockUsbSelectedBtn = document.getElementById('block-usb-selected');
const allowUsbSelectedBtn = document.getElementById('allow-usb-selected');
const shutdownSelectedBtn = document.getElementById('shutdown-selected');
const usbStorageToggle = document.getElementById('usb-storage-blocked');
const usbStorageStatus = document.getElementById('usb-storage-status');
const viewSelectedScreenBtn = document.getElementById('view-selected-screen');
const openSelectedFileSharingBtn = document.getElementById('open-selected-file-sharing');
const remoteToolsHint = document.getElementById('remote-tools-hint');
const openLocalRulesBtn = document.getElementById('open-local-rules');
const groupSitesBtn = document.getElementById('group-sites');
const groupAppsBtn = document.getElementById('group-apps');
const groupLockBtn = document.getElementById('group-lock');
const groupStatus = document.getElementById('group-status');
const savedPcCount = document.getElementById('saved-pc-count');
const syncSavedPcsBtn = document.getElementById('sync-saved-pcs');
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
const hotspotSharingDisabled = document.getElementById('hotspot-sharing-disabled');
const hotspotSharingStatus = document.getElementById('hotspot-sharing-status');
const flushDnsBtn = document.getElementById('flush-dns');
const dnsStatus = document.getElementById('dns-status');
const activityList = document.getElementById('activity-list');
const refreshActivityBtn = document.getElementById('refresh-activity');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const alertsToggle = document.getElementById('alerts-toggle');
const alertsPopover = document.getElementById('alerts-popover');
const alertsList = document.getElementById('alerts-list');
const alertCount = document.getElementById('alert-count');
const pcUpdateAction = document.getElementById('pc-update-action');
let pcStatusSnapshot = null;
const remotePcAttention = new Map();
let installedAppsSnapshot = [];
let pcCurrentRelativePath = '';
let pcSelectedRoot = '';
let pcAppsLoaded = false;
let pcRefreshTimer;
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
const gamingSites = [
  'steampowered.com', 'store.steampowered.com', 'help.steampowered.com', 'steamcommunity.com', 'steamstatic.com',
  'steamcontent.com', 'steamgames.com', 'steam-chat.com', 'steamserver.net', 'steamusercontent.com', 'steam.tv',
  'epicgames.com', 'store.epicgames.com', 'epicgames.dev', 'riotgames.com', 'leagueoflegends.com', 'valorant.com',
  'playvalorant.com', 'riotcdn.net', 'pvp.net', 'battle.net', 'us.battle.net', 'eu.battle.net', 'blizzard.com', 'blizzard.net',
  'roblox.com', 'web.roblox.com', 'games.roblox.com', 'auth.roblox.com', 'api.roblox.com', 'robloxcdn.com', 'rbxcdn.com',
  'minecraft.net', 'minecraft-services.net', 'mojang.com', 'xbox.com', 'xboxlive.com', 'playstation.com', 'store.playstation.com',
  'playstation.net', 'sonyentertainmentnetwork.com', 'nintendo.com', 'nintendo.net',
  'twitch.tv', 'kick.com', 'poki.com', 'crazygames.com', 'kongregate.com', 'miniclip.com', 'itch.io',
  'newgrounds.com', 'armorgames.com', 'y8.com', 'coolmathgames.com', 'addictinggames.com', 'gamesgames.com', 'gameflare.com'
];

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

function remoteFailureMessage(error, device) {
  const detail = String(error?.message || error || '').replace(/^Error:\s*/i, '');
  const address = device?.name || device?.ip || 'remote device';
  if (/ETIMEDOUT|timed out|ENETUNREACH|EHOSTUNREACH/i.test(detail)) {
    return `${address} is unreachable. Check that it is powered on and connected to the same network.`;
  }
  if (/ECONNREFUSED|Could not reach/i.test(detail)) {
    return `${address} is online, but its Lockdown agent is not running or port 47821 is blocked.`;
  }
  return `${address}: ${detail || 'Remote command failed.'}`;
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
  const discoveredByMac = new Map(devices.map((device) => [normalizedMac(device.mac), device]).filter(([mac]) => mac));
  const discoveredByIp = new Map(devices.map((device) => [device.ip, device]));
  const updatedGroups = networkGroups.map((group) => ({
    ...group,
    devices: group.devices.reduce((reconciled, savedDevice) => {
      const savedMac = normalizedMac(savedDevice.mac);
      const match = (savedMac && discoveredByMac.get(savedMac)) || discoveredByIp.get(savedDevice.ip);
      const updated = match ? { ...savedDevice, ...match, mac: match.mac || savedDevice.mac } : savedDevice;
      const identity = normalizedMac(updated.mac) || updated.ip;
      const duplicateIndex = reconciled.findIndex((device) => (normalizedMac(device.mac) || device.ip) === identity);
      if (duplicateIndex >= 0) {
        reconciled[duplicateIndex] = { ...reconciled[duplicateIndex], ...updated };
        changed = true;
      } else {
        reconciled.push(updated);
      }
      if (JSON.stringify(updated) !== JSON.stringify(savedDevice)) changed = true;
      return reconciled;
    }, [])
  }));

  if (!changed) return;
  for (const group of updatedGroups) await window.api.saveNetworkGroup(group);
  networkGroups = updatedGroups;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

async function openRemotePcActivity(ip, name) {
  try {
    await window.api.openRemotePcWindow(`${ip}:47821`, name || ip);
  } catch (error) {
    showToast(error.message || 'Could not open this PC window.');
  }
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
    return `<div class="device-list-entry"><div class="device-row ${device.online === false ? 'offline-device' : ''}"><input type="checkbox" data-device-ip="${escapeHtml(device.ip)}"><span class="device-state ${device.online !== false ? 'local' : ''}"></span><span class="device-details"><strong>${displayName}<em>${nameNote} · ${escapeHtml(device.type || 'unknown')} · ${device.online === false ? 'Offline' : 'Online'}</em></strong><small>IP ${escapeHtml(device.ip)} · MAC ${escapeHtml(device.mac || 'unavailable')}${device.local ? ' · This computer' : ''}</small></span><button type="button" data-device-activity="${escapeHtml(device.ip)}">View activity</button></div></div>`;
  }).join('');
  deviceList.querySelectorAll('[data-device-activity]').forEach((button) => button.addEventListener('click', () => {
    const device = discoveredDevices.find((item) => item.ip === button.dataset.deviceActivity);
    openRemotePcActivity(button.dataset.deviceActivity, device?.name || button.dataset.deviceActivity);
  }));
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
  savedPcCards.innerHTML = devices.map((device) => {
    const attention = remotePcAttentionAlerts(device);
    const description = attention.map((item) => `${item.title}: ${item.detail}`).join('\n');
    const usbBlocked = remotePcAttention.get(device.ip)?.health?.usbStorageBlocked;
    const usbLabel = usbBlocked === true ? 'Allow USB storage' : usbBlocked === false ? 'Block USB storage' : 'USB storage';
    return `<article class="saved-pc-card" data-saved-card="${escapeHtml(device.ip)}"><div class="saved-card-top"><label><input type="checkbox" data-saved-select="${escapeHtml(savedDeviceKey(device))}"${selectedSavedKeys.has(savedDeviceKey(device)) ? ' checked' : ''}> Select PC</label><span class="device-state"></span><span class="saved-card-status">Checking...</span><span class="saved-card-attention ${attention.length ? '' : 'hidden'}" role="img" aria-label="${escapeHtml(description || 'No attention items')}" title="${escapeHtml(description)}"><span class="attention-icon icon-glyph" aria-hidden="true"></span><span>${attention.length}</span></span></div><h3>${escapeHtml(device.name || `Device ${device.ip}`)}</h3><p>${escapeHtml(device.ip)} · ${escapeHtml(device.mac || 'MAC unavailable')} · ${escapeHtml(device.type || 'unknown')}</p><div class="saved-card-groups">${device.groups.map((group) => `<span>${escapeHtml(group)}</span>`).join('')}</div><div class="saved-card-actions"><button data-card-activity="${escapeHtml(device.ip)}">View activity</button><button data-card-sites="${escapeHtml(device.ip)}">Block websites</button><button data-card-apps="${escapeHtml(device.ip)}">Block apps</button><button data-card-lock="${escapeHtml(device.ip)}">Focus lock</button><button data-card-usb="${escapeHtml(device.ip)}">${usbLabel}</button>${isCurrentDevice(device) ? '' : `<button class="danger-button" data-card-shutdown="${escapeHtml(device.ip)}">Shut down</button>`}</div></article>`;
  }).join('');
  savedPcCards.querySelectorAll('[data-card-activity]').forEach((button) => button.addEventListener('click', () => {
    const device = savedDevices().find((item) => item.ip === button.dataset.cardActivity);
    openRemotePcActivity(button.dataset.cardActivity, device?.name || button.dataset.cardActivity);
  }));
  savedPcCards.querySelectorAll('[data-card-sites]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardSites, 'update-sites')));
  savedPcCards.querySelectorAll('[data-card-apps]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardApps, 'update-apps')));
  savedPcCards.querySelectorAll('[data-card-lock]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardLock, 'start-lock')));
  savedPcCards.querySelectorAll('[data-card-usb]').forEach((button) => button.addEventListener('click', () => toggleSavedUsbStorage(button.dataset.cardUsb)));
  savedPcCards.querySelectorAll('[data-card-shutdown]').forEach((button) => button.addEventListener('click', () => runSavedDeviceTask(button.dataset.cardShutdown, 'shutdown')));
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => input.addEventListener('change', updateSavedSelectionState));
  updateSavedSelectionState();
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

function updateSavedSelectionState() {
  const inputs = [...savedPcCards.querySelectorAll('[data-saved-select]')];
  selectedSavedKeys = new Set(inputs.filter((input) => input.checked).map((input) => input.dataset.savedSelect));
  const selected = inputs.filter((input) => input.checked).length;
  selectAllSaved.checked = inputs.length > 0 && selected === inputs.length;
  selectAllSaved.indeterminate = selected > 0 && selected < inputs.length;
  const selectedDevices = selectedSavedDevices();
  const remoteSelectedCount = selectedDevices.filter((device) => !isCurrentDevice(device)).length;
  viewSelectedScreenBtn.disabled = selected !== 1 || remoteSelectedCount !== 1;
  openSelectedFileSharingBtn.disabled = remoteSelectedCount === 0;
  remoteToolsHint.textContent = selected === 1
    ? 'One PC selected'
    : selected > 1 ? `${remoteSelectedCount} remote PCs selected` : 'Select one or more PCs to continue';
  groupSelectionHelp.textContent = selected
    ? `${selected} PC${selected === 1 ? '' : 's'} selected — choose an action below.`
    : 'Select one PC, several PCs, or every PC in this group.';
  [focusSelectedBtn, blockWebsitesSelectedBtn, blockAppsSelectedBtn, shutdownSelectedBtn].forEach((button) => { button.disabled = selected === 0; });
  [blockUsbSelectedBtn, allowUsbSelectedBtn].forEach((button) => { button.disabled = selected === 0; });
}

async function refreshSavedPcStatuses(devices) {
  await Promise.all(devices.map(async (device) => {
    const card = savedPcCards.querySelector(`[data-saved-card="${device.ip}"]`);
    const discoveredOnline = discoveredDevices.some((item) => item.online && devicesMatch(item, device));
    try {
      const agentOnline = await window.api.remoteHealth(`${device.ip}:47821`);
      if (card) {
        card.querySelector('.saved-card-status').textContent = agentOnline ? 'Online' : discoveredOnline ? 'Agent unavailable' : 'Offline';
        card.querySelector('.device-state').classList.toggle('local', agentOnline || discoveredOnline);
      }
      let health = remotePcAttention.get(device.ip)?.health || null;
      if (agentOnline) {
        try {
          health = await window.api.remoteCommand(`${device.ip}:47821`, agentSessionPassword(), 'get-pc-attention', null, 'operator');
        } catch (_) {
          // Older agents remain online; retain their last known attention data.
        }
      }
      remotePcAttention.set(device.ip, { online: agentOnline || discoveredOnline, agentAvailable: agentOnline, health });
    } catch (_) {
      if (card) {
        card.querySelector('.saved-card-status').textContent = discoveredOnline ? 'Agent unavailable' : 'Offline';
        card.querySelector('.device-state').classList.toggle('local', discoveredOnline);
      }
      remotePcAttention.set(device.ip, {
        online: discoveredOnline,
        agentAvailable: false,
        health: remotePcAttention.get(device.ip)?.health || null
      });
    }
  }));
  devices.forEach((device) => updateSavedCardAttention(savedPcCards.querySelector(`[data-saved-card="${device.ip}"]`), device));
  devices.forEach((device) => updateSavedCardUsbButton(savedPcCards.querySelector(`[data-saved-card="${device.ip}"]`), device));
  renderPcAlerts();
}

function updateSavedCardUsbButton(card, device) {
  const button = card?.querySelector('[data-card-usb]');
  if (!button) return;
  const blocked = remotePcAttention.get(device.ip)?.health?.usbStorageBlocked;
  button.textContent = blocked === true ? 'Allow USB storage' : blocked === false ? 'Block USB storage' : 'USB storage';
}

async function toggleSavedUsbStorage(ip) {
  const device = savedDevices().find((item) => item.ip === ip);
  if (!device) return;
  const local = isCurrentDevice(device);
  try {
    const blocked = local
      ? await window.api.getUsbStorageBlocked()
      : await window.api.remoteCommand(`${ip}:47821`, agentSessionPassword(), 'get-usb-storage-state', null, 'operator');
    const result = local
      ? await window.api.setUsbStorageBlocked(!blocked)
      : await window.api.remoteCommand(`${ip}:47821`, agentSessionPassword(), 'set-usb-storage-blocked', { blocked: !blocked }, 'admin');
    showToast(`${result.blocked ? 'USB storage blocked' : 'USB storage allowed'} on ${device.name || ip}. Reconnect USB drives to apply.`);
    await refreshSavedPcStatuses([device]);
  } catch (error) {
    showToast(remoteFailureMessage(error, device));
  }
}

async function setUsbStorageForDevices(devices, blocked) {
  if (!devices.length) return showToast('Select at least one PC.');
  const results = await Promise.allSettled(devices.map((device) => isCurrentDevice(device)
    ? window.api.setUsbStorageBlocked(blocked)
    : window.api.remoteCommand(`${device.ip}:47821`, agentSessionPassword(), 'set-usb-storage-blocked', { blocked }, 'admin')));
  const succeeded = results.filter((result) => result.status === 'fulfilled').length;
  const failure = results.find((result) => result.status === 'rejected');
  const failedDevice = failure ? devices[results.findIndex((result) => result.status === 'rejected')] : null;
  showToast(succeeded
    ? `${blocked ? 'USB storage blocked' : 'USB storage allowed'} on ${succeeded}/${devices.length} PC${devices.length === 1 ? '' : 's'}. Reconnect USB drives to apply.${failure ? ` ${remoteFailureMessage(failure.reason, failedDevice)}` : ''}`
    : remoteFailureMessage(failure?.reason, failedDevice));
  await refreshSavedPcStatuses(devices);
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
  let unreachableCount = 0;
  if (command === 'shutdown') {
    const checks = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, 'get-status', null, 'operator')));
    const reachable = devices.filter((_device, index) => checks[index].status === 'fulfilled');
    unreachableCount = devices.length - reachable.length;
    if (!reachable.length) {
      const failed = checks.find((result) => result.status === 'rejected');
      showToast(remoteFailureMessage(failed?.reason, devices[0]));
      return;
    }
    devices = reachable;
  }
  const payload = command === 'update-sites' ? sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'update-apps' ? appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean) : command === 'start-lock' ? { minutes: parseInt(lockMinutesInput.value, 10) || 60 } : null;
  [focusSelectedBtn, blockWebsitesSelectedBtn, blockAppsSelectedBtn, shutdownSelectedBtn].forEach((button) => { button.disabled = true; });
  const results = await Promise.allSettled(devices.map((device) => window.api.remoteCommand(`${device.ip}:47821`, password, command, payload, isAdmin ? 'admin' : 'operator')));
  const success = results.filter((result) => result.status === 'fulfilled').length;
  updateSavedSelectionState();
  const failure = results.find((result) => result.status === 'rejected');
  const failureIndex = results.findIndex((result) => result.status === 'rejected');
  const failedDevice = failureIndex >= 0 ? devices[failureIndex] : null;
  const failureMessage = failedDevice
    ? remoteFailureMessage(failure?.reason, failedDevice)
    : 'Task failed';
  showToast(success
    ? `${message} on ${success}/${devices.length} saved PC${devices.length === 1 ? '' : 's'}${unreachableCount ? `; ${unreachableCount} unreachable` : ''}${failure ? `; ${failureMessage}` : ''}`
    : failureMessage);
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
    await refreshSavedPcStatuses(savedDevices());
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
    await refreshSavedPcStatuses(savedDevices());
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
    await refreshSavedPcStatuses(savedDevices());
    renderGroups();
    showToast('Saved PC status refreshed');
  } catch (error) {
    showToast(`Refresh failed: ${error?.message || 'Check your network connection.'}`);
  } finally {
    refreshSavedPcsBtn.disabled = false;
    refreshSavedPcsBtn.firstElementChild.textContent = 'Refresh';
  }
}

async function syncSavedPcs() {
  if (!window.api?.discoverNetwork || !syncSavedPcsBtn) return;
  syncSavedPcsBtn.disabled = true;
  syncSavedPcsBtn.firstElementChild.textContent = 'Syncing...';
  try {
    const devices = await window.api.discoverNetwork();
    discoveredDevices = devices;
    renderDashboardDevices(devices);
    await reconcileNetworkGroups(devices);
    await synchronizeNetworkGroups();
    renderDevices(devices);
    await refreshSavedPcStatuses(savedDevices());
    renderGroups();
    showToast('Saved PCs synchronized');
  } catch (error) {
    showToast(`Sync failed: ${error?.message || 'Check the network and try again.'}`);
  } finally {
    syncSavedPcsBtn.disabled = false;
    syncSavedPcsBtn.firstElementChild.textContent = 'Sync PCs';
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
  const synced = await syncNetworkGroup(networkGroups.find((item) => item.id === group.id));
  renderGroups();
  groupStatus.textContent = `${devices.length} device${devices.length === 1 ? '' : 's'} saved to ${group.name}.`;
  showToast(`Devices saved; synced to ${synced.success}/${synced.total} other PC${synced.total === 1 ? '' : 's'}`);
}

async function syncNetworkGroup(group) {
  if (!group || !group.devices.length) return { success: 0, total: 0 };
  const password = await agentSessionPassword();
  if (!password) return { success: 0, total: 0 };
  const peers = networkPeers();
  const results = await Promise.allSettled(peers.map((device) => window.api.remoteCommand(
    `${device.ip}:47821`, password, 'merge-network-group', group, 'operator'
  )));
  return { success: results.filter((result) => result.status === 'fulfilled').length, total: peers.length };
}

function networkPeers() {
  const peersByKey = new Map();
  savedDevices().forEach((device) => {
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
  if (hotspotSharingDisabled) {
    hotspotSharingDisabled.checked = data.hotspotSharingDisabled === true;
    hotspotSharingStatus.textContent = hotspotSharingDisabled.checked ? 'Hotspot sharing is disabled.' : 'Hotspot sharing is allowed.';
  }
  gamingMode.checked = gamingApps.every((app) => data.blockedApps.some((blockedApp) => blockedApp.toLowerCase() === app));
  updateCounts();
  await refreshLockStatus();
  await loadSchedules();
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

function renderSchedules(schedules) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  scheduleList.innerHTML = schedules.length
    ? schedules.map((schedule) => `<div class="schedule-row"><span><strong>${escapeHtml(schedule.name)}</strong><small>${schedule.start}–${schedule.end} · ${(schedule.days || []).sort().map((day) => dayNames[day]).join(', ')}</small></span><button class="secondary-button" data-schedule-delete="${escapeHtml(schedule.id)}">Delete</button></div>`).join('')
    : '<span class="field-note">No schedules configured.</span>';
  scheduleList.querySelectorAll('[data-schedule-delete]').forEach((button) => button.addEventListener('click', async () => {
    renderSchedules(await window.api.deleteSchedule(button.dataset.scheduleDelete));
  }));
}

async function loadSchedules() {
  if (window.api?.getSchedules) renderSchedules(await window.api.getSchedules());
}

function renderUpdateStatus(state) {
  if (!state) return;
  window.__lockdownUpdateState = state;
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
  if (pcUpdateAction) {
    pcUpdateAction.classList.toggle('hidden', !['available', 'downloaded'].includes(state.status));
    pcUpdateAction.disabled = state.status === 'downloading';
    pcUpdateAction.textContent = state.status === 'downloaded' ? 'Restart and install' : 'Download update';
  }
  const pcUpdateMessage = document.getElementById('pc-update-message');
  if (pcUpdateMessage) pcUpdateMessage.textContent = state.message || 'Check for a Lockdown Blocker update or restart Windows.';
  renderPcAlerts();
  if (checkUpdatesBtn) checkUpdatesBtn.disabled = state.status === 'checking' || state.status === 'downloading';
}

function markUpdateCheck() {
  if (lastUpdateCheck) lastUpdateCheck.textContent = `Last checked: ${new Date().toLocaleString()}`;
}

function setActiveTab(id) {
  activeTab = id;
  const pages = {
    overview: ['Dashboard', 'A live view of protection, network health, and connected devices.'],
    pc: ['This PC', 'System health, installed software, and local files.'],
    network: ['Network', 'Discover and manage computers on your local network.'],
    devices: ['Devices', 'Manage saved computers, groups, and focus rules.'],
    about: ['About', 'Version and update information for Lockdown Blocker.']
  };
  if (pageTitle) pageTitle.textContent = pages[id]?.[0] || 'Lockdown Blocker';
  if (pageSubtitle) pageSubtitle.textContent = pages[id]?.[1] || '';
  document.querySelectorAll('[data-tab-section]').forEach((section) => {
    section.classList.toggle('tab-visible', section.dataset.tabSection === activeTab);
  });
  document.querySelectorAll('.nav-item').forEach((item) => {
    const navId = item.getAttribute('href').slice(1);
    item.classList.toggle('active', navId === activeTab);
  });
  clearInterval(speedRefreshTimer);
  clearInterval(pcRefreshTimer);
  if (activeTab === 'pc') {
    refreshPcStatus();
    if (!pcAppsLoaded) refreshInstalledApps();
    pcRefreshTimer = setInterval(refreshPcStatus, 15000);
  }
  if (activeTab === 'network') refreshActivity();
  if (activeTab === 'network') scanNetworkBtn.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (activeTab === 'devices') {
    setDeviceStep('groups');
    savedPcsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function refreshActivity() {
  if (!activityList || !window.api?.getActivity) return;
  try {
    const entries = await window.api.getActivity();
    activityList.innerHTML = entries.length
      ? entries.slice(0, 50).map((entry) => `<div class="activity-row"><span class="activity-dot"></span><span><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.detail || '')}</small></span><time>${escapeHtml(new Date(entry.timestamp).toLocaleString())}</time></div>`).join('')
      : '<span class="field-note">No LAN requests recorded.</span>';
  } catch (error) {
    activityList.textContent = error.message || 'Could not load the LAN request log.';
  }
}

function formatPcBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${bytes} B`;
}

function remotePcAttentionAlerts(device) {
  const snapshot = remotePcAttention.get(device.ip);
  const alerts = [];
  const name = snapshot?.health?.hostname || device.name || device.ip;
  if (snapshot && !snapshot.online) {
    alerts.push({ title: `${name} is offline`, detail: 'The saved PC is not reachable on the network.', tone: 'warning' });
    return alerts;
  }
  if (snapshot && snapshot.online && !snapshot.agentAvailable) {
    alerts.push({ title: `${name} agent unavailable`, detail: 'The PC is online, but remote tools cannot reach its Lockdown agent.', tone: 'warning' });
  }
  const health = snapshot?.health;
  (health?.disks || []).forEach((disk) => {
    const size = Number(disk.Size || 0);
    const free = Number(disk.FreeSpace || 0);
    if (size && free / size < 0.1) {
      alerts.push({ title: `Low storage on ${name} (${disk.DeviceID || 'drive'})`, detail: `${formatPcBytes(free)} free`, tone: 'warning' });
    }
  });
  if (Number(health?.uptime) >= 30 * 24 * 60 * 60) {
    const days = Math.floor(health.uptime / (24 * 60 * 60));
    alerts.push({ title: `${name} has not restarted recently`, detail: `Running for ${days} days`, tone: 'info' });
  }
  if (['available', 'downloaded'].includes(health?.updateStatus?.status)) {
    const version = health.updateStatus.availableVersion;
    alerts.push({
      title: `${name}: Lockdown Blocker update available`,
      detail: version ? `Version ${version} is ready.` : health.updateStatus.message || 'A newer app version is available.',
      tone: 'info'
    });
  }
  if (health?.windowsUpdate?.status === 'available') {
    const titles = (health.windowsUpdate.titles || []).slice(0, 2).join(', ');
    const extraCount = Math.max(0, Number(health.windowsUpdate.count || 0) - 2);
    alerts.push({
      title: `${name}: Windows updates available`,
      detail: titles ? `${titles}${extraCount ? ` and ${extraCount} more` : ''}` : `${health.windowsUpdate.count} update${health.windowsUpdate.count === 1 ? '' : 's'} ready to install.`,
      tone: 'info'
    });
  }
  return alerts;
}

function updateSavedCardAttention(card, device) {
  const badge = card?.querySelector('.saved-card-attention');
  if (!badge) return;
  const alerts = remotePcAttentionAlerts(device);
  const description = alerts.map((item) => `${item.title}: ${item.detail}`).join('\n');
  badge.classList.toggle('hidden', alerts.length === 0);
  badge.title = description;
  badge.setAttribute('aria-label', description || 'No attention items');
  badge.querySelector('span:last-child').textContent = String(alerts.length);
}

function renderPcAlerts() {
  if (!alertsList || !alertCount) return;
  const alerts = [];
  if (pcStatusSnapshot?.disks) {
    pcStatusSnapshot.disks.forEach((disk) => {
      const size = Number(disk.Size || 0);
      const free = Number(disk.FreeSpace || 0);
      if (size && free / size < 0.1) alerts.push({ title: `Low storage on This PC (${disk.DeviceID})`, detail: `${formatPcBytes(free)} remaining`, tone: 'warning' });
    });
  }
  if (pcStatusSnapshot?.cpuPercent >= 90) alerts.push({ title: 'High CPU usage', detail: `CPU is at ${pcStatusSnapshot.cpuPercent}%`, tone: 'warning' });
  if (Number(pcStatusSnapshot?.uptime) >= 30 * 24 * 60 * 60) {
    const days = Math.floor(pcStatusSnapshot.uptime / (24 * 60 * 60));
    alerts.push({ title: 'This PC has not restarted recently', detail: `Running for ${days} days`, tone: 'info' });
  }
  if (pcStatusSnapshot?.windowsUpdate?.status === 'available') {
    const count = Number(pcStatusSnapshot.windowsUpdate.count) || 0;
    alerts.push({ title: 'Windows updates available on This PC', detail: `${count} update${count === 1 ? '' : 's'} ready to install.`, tone: 'info' });
  }
  savedDevices().filter((device) => !device.local).forEach((device) => alerts.push(...remotePcAttentionAlerts(device)));
  const updateState = window.__lockdownUpdateState;
  if (updateState?.status === 'available') alerts.push({ title: 'Update available', detail: updateState.message || 'A newer version is ready to download.', tone: 'info' });
  if (updateState?.status === 'downloaded') alerts.push({ title: 'Restart to finish update', detail: 'The update is downloaded and ready to install.', tone: 'info' });
  if (updateState?.status === 'error') alerts.push({ title: 'Update check failed', detail: updateState.message || 'Check your connection and try again.', tone: 'warning' });
  alertCount.textContent = String(alerts.length);
  alertCount.classList.toggle('hidden', alerts.length === 0);
  alertsList.innerHTML = alerts.length
    ? alerts.map((item) => `<div class="alert-row ${item.tone}"><span class="alert-indicator"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></div>`).join('')
    : '<div class="alerts-empty">No active alerts.</div>';
}

async function refreshPcStatus() {
  const updated = document.getElementById('pc-last-updated');
  try {
    const status = await window.api.getPcStatus();
    pcStatusSnapshot = status;
    if (usbStorageToggle) usbStorageToggle.checked = status.usbStorageBlocked === true;
    if (usbStorageStatus) usbStorageStatus.textContent = status.usbStorageBlocked
      ? 'USB storage is blocked. Reconnect drives after changing this setting.'
      : 'USB keyboards and mice are not affected.';
    document.getElementById('pc-hostname').textContent = status.hostname || 'This PC';
    document.getElementById('pc-cpu').textContent = `${status.cpuPercent}%`;
    document.getElementById('pc-cpu-detail').textContent = `${status.cpuCount} logical processors`;
    const memoryUsed = status.memoryTotal - status.memoryFree;
    document.getElementById('pc-memory').textContent = formatPcBytes(memoryUsed);
    document.getElementById('pc-memory-detail').textContent = `${formatPcBytes(status.memoryFree)} available of ${formatPcBytes(status.memoryTotal)}`;
    document.getElementById('pc-network').textContent = status.network || 'Offline';
    document.getElementById('pc-network-detail').textContent = status.network ? `${status.networkCount} active network address${status.networkCount === 1 ? '' : 'es'}` : 'No active network adapter';
    const uptimeHours = Math.floor(status.uptime / 3600);
    document.getElementById('pc-uptime').textContent = uptimeHours >= 24 ? `${Math.floor(uptimeHours / 24)}d ${uptimeHours % 24}h` : `${uptimeHours}h ${Math.floor((status.uptime % 3600) / 60)}m`;
    document.getElementById('pc-storage').innerHTML = status.disks.length ? status.disks.map((disk) => {
      const size = Number(disk.Size || 0);
      const free = Number(disk.FreeSpace || 0);
      const usedPercent = size ? Math.round((size - free) / size * 100) : 0;
      return `<div class="pc-drive"><div><strong>${escapeHtml(disk.DeviceID || 'Drive')}</strong><span>${formatPcBytes(free)} free of ${formatPcBytes(size)}</span></div><div class="pc-drive-bar"><i style="width:${Math.min(100, Math.max(0, usedPercent))}%"></i></div></div>`;
    }).join('') : '<span class="field-note">No fixed drives reported.</span>';
    document.getElementById('pc-processes').innerHTML = status.processes.length ? status.processes.map((process) => `<div class="pc-process-row"><span><strong>${escapeHtml(process.ProcessName || 'Process')}</strong><small>PID ${escapeHtml(process.Id)} · CPU ${Number(process.CPU || 0).toFixed(1)}s</small></span><span>${formatPcBytes(process.WorkingSet64)} RAM</span></div>`).join('') : '<span class="field-note">No process data available.</span>';
    if (updated) updated.textContent = `Updated ${new Date(status.sampledAt).toLocaleTimeString()}`;
    renderPcAlerts();
  } catch (error) {
    if (updated) updated.textContent = error.message || 'Status unavailable';
    document.getElementById('pc-storage').textContent = 'Could not load drive information.';
    document.getElementById('pc-processes').textContent = 'Could not load process activity.';
  }
}

function renderInstalledApps() {
  const container = document.getElementById('installed-apps');
  const search = document.getElementById('installed-app-search').value.trim().toLowerCase();
  const apps = installedAppsSnapshot.filter((item) => `${item.name} ${item.publisher || ''} ${item.version || ''}`.toLowerCase().includes(search));
  container.innerHTML = apps.length ? apps.map((item) => `<div class="installed-app-row"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml([item.publisher, item.version].filter(Boolean).join(' · ') || 'Publisher or version not listed')}</small></span><button class="secondary-button" type="button" data-uninstall-app="${escapeHtml(item.name)}" title="Open Windows uninstall settings">Uninstall</button></div>`).join('') : '<span class="field-note">No matching installed apps.</span>';
  container.querySelectorAll('[data-uninstall-app]').forEach((button) => button.addEventListener('click', openWindowsUninstaller));
}

async function refreshInstalledApps() {
  const container = document.getElementById('installed-apps');
  container.textContent = 'Loading installed apps...';
  try {
    installedAppsSnapshot = await window.api.getInstalledApps();
    pcAppsLoaded = true;
    renderInstalledApps();
  } catch (error) {
    container.textContent = error.message || 'Could not load installed apps.';
  }
}

async function openWindowsUninstaller() {
  try {
    await window.api.openAppUninstaller();
    showToast('Windows app settings opened. Select the app there to uninstall it.');
  } catch (error) {
    showToast(error.message || 'Could not open Windows app settings.');
  }
}

function renderPcFiles(files) {
  const browser = document.getElementById('pc-file-browser');
  const currentName = pcCurrentRelativePath.split(/[\\/]/).filter(Boolean).pop() || pcSelectedRoot;
  const parentPath = pcCurrentRelativePath.split(/[\\/]/).filter(Boolean).slice(0, -1).join(pathSeparator());
  browser.innerHTML = `<div class="pc-file-toolbar"><div><strong>${escapeHtml(currentName)}</strong><small>${escapeHtml(pcSelectedRoot)}${pcCurrentRelativePath ? `\\${escapeHtml(pcCurrentRelativePath)}` : ''}</small></div><button id="pc-file-up" class="secondary-button" type="button" ${pcCurrentRelativePath ? '' : 'disabled'}>Up</button></div><div class="pc-file-list">${files.length ? files.map((entry) => `<div class="pc-file-row"><button class="pc-file-name" type="button" data-file-open="${escapeHtml(entry.relativePath)}" ${entry.directory ? '' : 'disabled'}><span>${entry.directory ? '▰' : '▤'}</span><strong>${escapeHtml(entry.name)}</strong></button><span>${entry.directory ? 'Folder' : formatPcBytes(entry.size)}</span><time>${escapeHtml(new Date(entry.modifiedAt).toLocaleDateString())}</time><button class="icon-action pc-file-delete" type="button" title="Delete ${escapeHtml(entry.name)}" aria-label="Delete ${escapeHtml(entry.name)}" data-file-delete="${escapeHtml(entry.relativePath)}">×</button></div>`).join('') : '<div class="alerts-empty">This folder is empty.</div>'}</div>`;
  document.getElementById('pc-file-up').addEventListener('click', async () => openPcDirectory(parentPath));
  browser.querySelectorAll('[data-file-open]').forEach((button) => button.addEventListener('click', () => openPcDirectory(button.dataset.fileOpen)));
  browser.querySelectorAll('[data-file-delete]').forEach((button) => button.addEventListener('click', async () => {
    try {
      const deleted = await window.api.deletePcFile(button.dataset.fileDelete);
      if (deleted) {
        showToast('Item deleted.');
        await openPcDirectory(pcCurrentRelativePath);
      }
    } catch (error) {
      showToast(error.message || 'Could not delete this item.');
    }
  }));
}

function pathSeparator() {
  return pcSelectedRoot.includes('\\') ? '\\' : '/';
}

async function openPcDirectory(relativePath) {
  try {
    pcCurrentRelativePath = relativePath;
    renderPcFiles(await window.api.listPcFiles(relativePath));
  } catch (error) {
    document.getElementById('pc-file-browser').textContent = error.message || 'Could not open this folder.';
  }
}

async function choosePcFolder() {
  try {
    const selection = await window.api.selectPcFolder();
    if (!selection) return;
    pcSelectedRoot = selection.path;
    pcCurrentRelativePath = '';
    renderPcFiles(selection.files);
  } catch (error) {
    showToast(error.message || 'Could not open that folder.');
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

temporaryUnblockBtn.addEventListener('click', async () => {
  try {
    await window.api.temporaryUnblock(
      parseInt(temporaryUnblockMinutes.value, 10) || 15,
      sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean),
      appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean)
    );
    showToast('Rules temporarily paused');
  } catch (error) {
    showToast(error.message);
  }
});

clearTemporaryUnblockBtn.addEventListener('click', async () => {
  await window.api.clearTemporaryUnblock();
  showToast('Rules restored');
});

saveScheduleBtn.addEventListener('click', async () => {
  const days = [...document.querySelectorAll('.schedule-days input:checked')].map((input) => Number(input.value));
  try {
    const schedules = await window.api.saveSchedule({
      name: scheduleNameInput.value.trim(),
      start: scheduleStartInput.value,
      end: scheduleEndInput.value,
      days
    });
    renderSchedules(schedules);
    scheduleNameInput.value = '';
    showToast('Schedule saved');
  } catch (error) {
    showToast(error.message);
  }
});

sitesInput.addEventListener('input', updateCounts);
appsInput.addEventListener('input', updateCounts);
gamingMode.addEventListener('change', async () => {
  await requireAuthentication();
  const apps = appsInput.value.split('\n').map((item) => item.trim()).filter(Boolean);
  const sites = sitesInput.value.split('\n').map((item) => item.trim()).filter(Boolean);
  const enabled = gamingMode.checked;
  const updatedApps = enabled
    ? [...new Set([...apps, ...gamingApps])]
    : apps.filter((app) => !gamingApps.includes(app.toLowerCase()));
  const updatedSites = enabled
    ? [...new Set([...sites, ...gamingSites])]
    : sites.filter((site) => !gamingSites.includes(site.toLowerCase().replace(/^www\./, '')));
  try {
    await window.api.updateSites(updatedSites);
    await window.api.updateApps(updatedApps);
    sitesInput.value = updatedSites.join('\n');
    appsInput.value = updatedApps.join('\n');
    updateCounts();
    showToast(enabled ? 'Gaming apps and popular gaming sites are now blocked' : 'Gaming app and site blocking disabled');
  } catch (error) {
    gamingMode.checked = !enabled;
    showToast(error.message || 'Could not update gaming blocks');
  }
});
hotspotSharingDisabled?.addEventListener('change', async () => {
  const requestedState = hotspotSharingDisabled.checked;
  hotspotSharingDisabled.disabled = true;
  try {
    const result = await window.api.setHotspotSharingDisabled(requestedState);
    hotspotSharingStatus.textContent = requestedState ? 'Hotspot sharing is disabled.' : 'Hotspot sharing is allowed.';
    showToast(result.supported === false ? result.message : requestedState ? 'Hotspot sharing disabled' : 'Hotspot sharing allowed');
  } catch (error) {
    hotspotSharingDisabled.checked = !requestedState;
    hotspotSharingStatus.textContent = requestedState ? 'Hotspot sharing is allowed.' : 'Hotspot sharing is disabled.';
    showToast(error.message || 'Could not update hotspot sharing');
  } finally {
    hotspotSharingDisabled.disabled = false;
  }
});
flushDnsBtn?.addEventListener('click', async () => {
  flushDnsBtn.disabled = true;
  try {
    const result = await window.api.flushDns();
    dnsStatus.textContent = result.success ? 'Windows DNS cache flushed.' : `DNS cache flush failed: ${result.error}`;
    showToast(result.success ? 'DNS cache flushed' : 'Could not flush DNS cache');
  } catch (error) {
    dnsStatus.textContent = error.message || 'Could not flush DNS cache.';
    showToast(dnsStatus.textContent);
  } finally {
    flushDnsBtn.disabled = false;
  }
});
refreshActivityBtn?.addEventListener('click', refreshActivity);
document.getElementById('refresh-pc')?.addEventListener('click', refreshPcStatus);
document.getElementById('refresh-installed-apps')?.addEventListener('click', refreshInstalledApps);
document.getElementById('installed-app-search')?.addEventListener('input', renderInstalledApps);
document.getElementById('choose-pc-folder')?.addEventListener('click', choosePcFolder);
document.getElementById('open-uninstaller')?.addEventListener('click', openWindowsUninstaller);
document.getElementById('install-windows-updates')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const defaultLabel = 'Install Windows updates';
  button.disabled = true;
  button.textContent = 'Starting update...';
  document.getElementById('pc-update-message').textContent = 'Searching, downloading, and installing available Windows updates...';
  try {
    const job = await window.api.installWindowsUpdates();
    const poll = async () => {
      try {
        const status = await window.api.getWindowsUpdateInstallStatus(job.jobId);
        document.getElementById('pc-update-message').textContent = status.message;
        if (status.status === 'running') {
          button.textContent = 'Installing...';
          setTimeout(poll, 2500);
          return;
        }
        button.disabled = false;
        button.textContent = defaultLabel;
        showToast(status.message);
      } catch (error) {
        button.disabled = false;
        button.textContent = defaultLabel;
        document.getElementById('pc-update-message').textContent = error.message || 'Could not read Windows Update status.';
      }
    };
    poll();
  } catch (error) {
    button.disabled = false;
    button.textContent = defaultLabel;
    document.getElementById('pc-update-message').textContent = error.message || 'Could not start Windows Update.';
  }
});
document.getElementById('pc-check-updates')?.addEventListener('click', async () => {
  document.getElementById('pc-update-message').textContent = 'Checking for updates...';
  await window.api.checkForUpdates();
});
pcUpdateAction?.addEventListener('click', async () => {
  if (window.__lockdownUpdateState?.status === 'downloaded') await window.api.installUpdate();
  else await window.api.downloadUpdate();
});
document.getElementById('restart-pc')?.addEventListener('click', async () => {
  try {
    await window.api.restartPc();
  } catch (error) {
    showToast(error.message || 'Could not restart this PC.');
  }
});
usbStorageToggle?.addEventListener('change', async () => {
  const requested = usbStorageToggle.checked;
  usbStorageToggle.disabled = true;
  try {
    const result = await window.api.setUsbStorageBlocked(requested);
    usbStorageToggle.checked = result.blocked;
    usbStorageStatus.textContent = `${result.blocked ? 'USB storage is blocked.' : 'USB storage is allowed.'} Reconnect drives after changing this setting.`;
    showToast(result.message || usbStorageStatus.textContent);
  } catch (error) {
    usbStorageToggle.checked = !requested;
    usbStorageStatus.textContent = error.message || 'Could not change USB storage access.';
    showToast(usbStorageStatus.textContent);
  } finally {
    usbStorageToggle.disabled = false;
  }
});
alertsToggle?.addEventListener('click', () => {
  const opening = alertsPopover.hidden;
  alertsPopover.hidden = !opening;
  alertsToggle.setAttribute('aria-expanded', String(opening));
});
document.getElementById('alerts-close')?.addEventListener('click', () => {
  alertsPopover.hidden = true;
  alertsToggle.setAttribute('aria-expanded', 'false');
});
document.addEventListener('click', (event) => {
  if (alertsPopover && !alertsPopover.hidden && !event.target.closest('.alert-anchor')) {
    alertsPopover.hidden = true;
    alertsToggle.setAttribute('aria-expanded', 'false');
  }
});
scanNetworkBtn.addEventListener('click', scanNetwork);
syncSavedPcsBtn?.addEventListener('click', syncSavedPcs);
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
deviceStepRulesBtn.addEventListener('click', () => {
  setActiveTab('devices');
  setDeviceStep('local');
  document.getElementById('websites')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
blockUsbSelectedBtn.addEventListener('click', () => setUsbStorageForDevices(selectedSavedDevices(), true));
allowUsbSelectedBtn.addEventListener('click', () => setUsbStorageForDevices(selectedSavedDevices(), false));
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
  sitesInput.focus();
});
selectAllSaved.addEventListener('change', () => {
  savedPcCards.querySelectorAll('[data-saved-select]').forEach((input) => { input.checked = selectAllSaved.checked; });
  updateSavedSelectionState();
});
viewSelectedScreenBtn.addEventListener('click', async () => {
  const [device] = selectedSavedDevices();
  if (!device || isCurrentDevice(device)) return showToast('Select one remote PC first');
  viewSelectedScreenBtn.disabled = true;
  try {
    await window.api.openScreenView(`${device.ip}:47821`, device.name || device.ip);
  } catch (error) {
    showToast(error.message || 'Could not open the screen viewer');
  } finally {
    updateSavedSelectionState();
  }
});
openSelectedFileSharingBtn.addEventListener('click', async () => {
  const destinations = selectedSavedDevices().filter((device) => !isCurrentDevice(device));
  if (!destinations.length) return showToast('Select at least one remote PC first');
  const availableDestinations = savedDevices().filter((device) => !isCurrentDevice(device));
  const toRemotePc = (device) => ({ host: `${device.ip}:47821`, name: device.name || device.ip });
  openSelectedFileSharingBtn.disabled = true;
  try {
    await window.api.openFileSharing(destinations.map(toRemotePc), availableDestinations.map(toRemotePc), availableDestinations.map(toRemotePc));
  } catch (error) {
    showToast(error.message || 'Could not open file sharing');
  } finally {
    updateSavedSelectionState();
  }
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
  renderPcAlerts();
});
window.api?.onWindowsUpdateStatus?.((status) => {
  if (pcStatusSnapshot) pcStatusSnapshot.windowsUpdate = status;
  renderPcAlerts();
  for (const device of savedDevices()) {
    updateSavedCardAttention(savedPcCards.querySelector(`[data-saved-card="${device.ip}"]`), device);
  }
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
function syncSidebarToggle() {
  const isMobile = window.matchMedia('(max-width: 620px)').matches;
  const isExpanded = isMobile
    ? appShell.classList.contains('mobile-nav-open')
    : !appShell.classList.contains('sidebar-collapsed');
  sidebarToggle.setAttribute('aria-expanded', String(isExpanded));
  sidebarToggle.setAttribute('aria-label', `${isExpanded ? 'Hide' : 'Show'} navigation`);
  sidebarToggle.title = `${isExpanded ? 'Hide' : 'Show'} navigation`;
}
sidebarToggle.addEventListener('click', () => {
  const isMobile = window.matchMedia('(max-width: 620px)').matches;
  const className = isMobile ? 'mobile-nav-open' : 'sidebar-collapsed';
  appShell.classList.toggle(className);
  if (!isMobile) {
    try {
      window.localStorage.setItem('lockdown-sidebar-collapsed', String(appShell.classList.contains('sidebar-collapsed')));
    } catch (_) {
      // Keep the toggle usable if local storage is unavailable.
    }
  }
  syncSidebarToggle();
});
window.matchMedia('(max-width: 620px)').addEventListener('change', syncSidebarToggle);
try {
  if (window.localStorage.getItem('lockdown-sidebar-collapsed') === 'true') appShell.classList.add('sidebar-collapsed');
} catch (_) {
  // Keep the default expanded layout if local storage is unavailable.
}
syncSidebarToggle();
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', (event) => {
  event.preventDefault();
  const navId = item.getAttribute('href').slice(1);
  setActiveTab(navId);
  if (window.matchMedia('(max-width: 620px)').matches) {
    appShell.classList.remove('mobile-nav-open');
    syncSidebarToggle();
  }
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
refreshSavedNetwork();
setInterval(refreshLockStatus, 1000);
setInterval(refreshSavedNetwork, 30000);
updateAgentSessionStatus();
