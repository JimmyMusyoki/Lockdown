const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ProgramData is shared by the boot-time SYSTEM agent and every signed-in user.
// Electron's userData directory would create one independent block list per account.
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.ProgramData || 'C:\\ProgramData', 'Lockdown Blocker')
  : app.getPath('userData');
const DATA_FILE = path.join(DATA_DIR, 'blocklist-data.json');
const LEGACY_DATA_FILE = path.join(app.getPath('userData'), 'blocklist-data.json');

const DEFAULT_DATA = {
  blockedSites: [],      // e.g. ["youtube.com", "facebook.com"]
  allowedSites: [],      // domains that override the blocked list
  blockedApps: [],       // e.g. ["chrome.exe", "steam.exe"]
  schedules: [],         // [{ id, days: [1,2,3,4,5], start: "09:00", end: "17:00" }]
  lock: {
    active: false,
    unlockAt: null      // ISO timestamp — cannot be unlocked before this
  },
  network: {
    agentEnabled: true,
    port: 47821,
    groups: []
  },
  activity: []
};

function ensureFile() {
  // The first packaged run upgrades an existing per-user installation without
  // dropping its lists before the machine-wide boot agent is scheduled.
  if (!fs.existsSync(DATA_FILE) && DATA_FILE !== LEGACY_DATA_FILE && fs.existsSync(LEGACY_DATA_FILE)) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.copyFileSync(LEGACY_DATA_FILE, DATA_FILE);
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function load() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed to read store, resetting to defaults', err);
    save(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

function save(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = { load, save, DATA_DIR, DATA_FILE };
