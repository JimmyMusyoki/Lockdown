const params = new URLSearchParams(window.location.search);
const hostParam = params.get('host') || '';
const host = /:\d+$/.test(hostParam) ? hostParam : `${hostParam}:47821`;
const remoteName = params.get('name') || hostParam || 'Remote PC';
const processList = document.getElementById('process-list');
const activityUpdated = document.getElementById('activity-updated');
const message = document.getElementById('remote-message');
const refreshButton = document.getElementById('refresh-remote');
const sitesInput = document.getElementById('blocked-sites');
const appsInput = document.getElementById('blocked-apps');
const lockStatus = document.getElementById('lock-status');
const usbStorageToggle = document.getElementById('usb-storage-blocked');
const usbStorageStatus = document.getElementById('usb-storage-status');
const remotePc = { host, name: remoteName };

document.getElementById('remote-name').textContent = remoteName;
document.getElementById('remote-host').textContent = host;
document.title = `Remote PC · ${remoteName}`;

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${bytes} B`;
}

async function command(name, payload = null, role = 'operator') {
  return window.api.remoteCommand(host, 'no-password', name, payload, role);
}

async function refreshProcesses() {
  try {
    const processes = await command('get-pc-activity');
    processList.innerHTML = processes.length
      ? processes.map((process) => `<div class="process-row"><span><strong>${escapeHtml(process.ProcessName || 'Process')}</strong><small>PID ${escapeHtml(process.Id)} · CPU ${Number(process.CPU || 0).toFixed(1)}s</small></span><span class="process-memory">${formatBytes(process.WorkingSet64)} RAM</span></div>`).join('')
      : '<p class="muted">No process data was returned.</p>';
    activityUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    processList.textContent = error.message || 'Could not load process activity.';
    activityUpdated.textContent = 'Unavailable';
  }
}

async function loadRemoteData() {
  refreshButton.disabled = true;
  showMessage('Loading remote PC data...');
  try {
    const data = await command('get-data');
    sitesInput.value = (data.blockedSites || []).join('\n');
    appsInput.value = (data.blockedApps || []).join('\n');
    lockStatus.textContent = data.lock?.active
      ? `Locked until ${data.lock.unlockAt ? new Date(data.lock.unlockAt).toLocaleString() : 'timer ends'}`
      : 'No active focus lock';
    try {
      usbStorageToggle.checked = await command('get-usb-storage-state');
      usbStorageStatus.textContent = usbStorageToggle.checked
        ? 'USB storage is blocked. Reconnect drives after changing this setting.'
        : 'USB keyboards and mice are not affected.';
    } catch (error) {
      usbStorageStatus.textContent = error.message || 'USB storage status is unavailable on this PC.';
    }
    await refreshProcesses();
    showMessage('Connected to remote PC.');
  } catch (error) {
    showMessage(error.message || 'Could not connect to the remote PC.', true);
  } finally {
    refreshButton.disabled = false;
  }
}

async function saveRules(input, action, successMessage) {
  const rules = input.value.split('\n').map((item) => item.trim()).filter(Boolean);
  try {
    await command(action, rules);
    showMessage(successMessage);
  } catch (error) {
    showMessage(error.message || 'Could not save remote rules.', true);
  }
}

document.getElementById('save-sites').addEventListener('click', () => saveRules(sitesInput, 'update-sites', 'Website rules saved on this PC.'));
document.getElementById('save-apps').addEventListener('click', () => saveRules(appsInput, 'update-apps', 'Application rules saved on this PC.'));
document.getElementById('start-lock').addEventListener('click', async () => {
  const minutes = Number(document.getElementById('lock-minutes').value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    showMessage('Enter a lock duration from 1 to 1440 minutes.', true);
    return;
  }
  try {
    await command('start-lock', { minutes });
    lockStatus.textContent = `Locked for ${minutes} minute${minutes === 1 ? '' : 's'}`;
    showMessage('Focus lock started on this PC.');
  } catch (error) {
    showMessage(error.message || 'Could not start the focus lock.', true);
  }
});
document.getElementById('install-windows-updates').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const statusLabel = document.getElementById('windows-update-status');
  button.disabled = true;
  button.textContent = 'Starting update...';
  statusLabel.textContent = 'Searching, downloading, and installing available Windows updates...';
  try {
    const job = await command('install-windows-updates', null, 'admin');
    const poll = async () => {
      try {
        const status = await command('get-windows-update-install-status', { jobId: job.jobId }, 'admin');
        statusLabel.textContent = status.message;
        if (status.status === 'running') {
          button.textContent = 'Installing...';
          setTimeout(poll, 2500);
          return;
        }
        button.disabled = false;
        button.textContent = 'Install Windows updates';
        showMessage(status.message, status.status === 'error');
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Install Windows updates';
        showMessage(error.message || 'Could not read remote update status.', true);
      }
    };
    poll();
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Install Windows updates';
    statusLabel.textContent = error.message || 'Could not start Windows Update.';
    showMessage(statusLabel.textContent, true);
  }
});
usbStorageToggle.addEventListener('change', async () => {
  const requested = usbStorageToggle.checked;
  usbStorageToggle.disabled = true;
  try {
    const result = await command('set-usb-storage-blocked', { blocked: requested }, 'admin');
    usbStorageToggle.checked = result.blocked;
    usbStorageStatus.textContent = `${result.blocked ? 'USB storage is blocked.' : 'USB storage is allowed.'} Reconnect drives after changing this setting.`;
    showMessage(result.message || usbStorageStatus.textContent);
  } catch (error) {
    usbStorageToggle.checked = !requested;
    usbStorageStatus.textContent = error.message || 'Could not change USB storage access.';
    showMessage(usbStorageStatus.textContent, true);
  } finally {
    usbStorageToggle.disabled = false;
  }
});
document.getElementById('lock-workstation').addEventListener('click', async () => {
  try {
    await command('lock-workstation', null, 'admin');
    showMessage(`Windows lock sent to ${remoteName}.`);
  } catch (error) {
    showMessage(error.message || 'Could not lock this PC.', true);
  }
});
document.getElementById('restart-pc').addEventListener('click', async () => {
  if (!window.confirm(`Restart ${remoteName}? Save your work first.`)) return;
  try {
    await command('restart', null, 'admin');
    showMessage(`Restart scheduled for ${remoteName}.`);
  } catch (error) {
    showMessage(error.message || 'Could not restart this PC.', true);
  }
});
document.getElementById('shutdown').addEventListener('click', async () => {
  if (!window.confirm(`Shut down ${remoteName}? Unsaved work may be lost.`)) return;
  try {
    await command('shutdown', null, 'admin');
    showMessage('Shutdown command sent.');
  } catch (error) {
    showMessage(error.message || 'Could not shut down this PC.', true);
  }
});
document.getElementById('view-screen').addEventListener('click', async () => {
  try {
    await window.api.openScreenView(host, remoteName);
  } catch (error) {
    showMessage(error.message || 'Could not open the screen viewer.', true);
  }
});
document.getElementById('open-files').addEventListener('click', async () => {
  try {
    await window.api.openFileSharing([remotePc], [remotePc], [remotePc]);
  } catch (error) {
    showMessage(error.message || 'Could not open file sharing.', true);
  }
});
refreshButton.addEventListener('click', loadRemoteData);

loadRemoteData();
setInterval(refreshProcesses, 15000);