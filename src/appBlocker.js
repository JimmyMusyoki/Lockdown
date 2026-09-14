const { exec } = require('child_process');

let pollTimer = null;

function killProcessByName(name) {
  // /F force kill, /IM image name (e.g. "chrome.exe")
  exec(`taskkill /F /IM "${name}"`, () => {
    // Ignore errors — process may simply not be running right now
  });
}

/**
 * Starts polling running processes every `intervalMs` and kills any
 * process whose image name matches an entry in blockedAppsGetter().
 * blockedAppsGetter is a function so the caller can hot-reload the list
 * (e.g. after the user edits it) without restarting the poller.
 */
function startAppBlocking(blockedAppsGetter, intervalMs = 3000) {
  stopAppBlocking();
  pollTimer = setInterval(async () => {
    const blocked = blockedAppsGetter().map((n) => n.toLowerCase());
    if (blocked.length === 0) return;

    try {
      const psList = (await import('ps-list')).default;
      const processes = await psList();
      for (const proc of processes) {
        if (blocked.includes(proc.name.toLowerCase())) {
          killProcessByName(proc.name);
        }
      }
    } catch (err) {
      console.error('Process scan failed', err);
    }
  }, intervalMs);
}

function stopAppBlocking() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = { startAppBlocking, stopAppBlocking };
