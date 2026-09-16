const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DATA_DIR = app.getPath('userData');
const DATA_FILE = path.join(DATA_DIR, 'blocklist-data.json');

const DEFAULT_DATA = {
  blockedSites: [],      // e.g. ["youtube.com", "facebook.com"]
  allowedSites: [],      // domains that override the blocked list
  blockedApps: [],       // e.g. ["chrome.exe", "steam.exe"]
  schedules: [],         // [{ id, days: [1,2,3,4,5], start: "09:00", end: "17:00" }]
  lock: {
    active: false,
    unlockAt: null,      // ISO timestamp — cannot be unlocked before this
    passwordHash: null
  },
  network: {
    agentEnabled: true,
    port: 47821,
    passwordHash: '01953c479c9df40d9e2f9e4fc54c82bf04ac12a8a1288135b2a41b35589f2cae',
    adminPasswordHash: '01953c479c9df40d9e2f9e4fc54c82bf04ac12a8a1288135b2a41b35589f2cae',
    groups: []
  },
  activity: []
};

function ensureFile() {
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

module.exports = { load, save, DATA_FILE };
