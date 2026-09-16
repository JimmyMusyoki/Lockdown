const fs = require('fs');
const { execFileSync } = require('child_process');

function flushDns() {
  try {
    execFileSync('ipconfig', ['/flushdns'], { windowsHide: true, stdio: 'ignore' });
  } catch (error) {
    console.error('DNS flush failed:', error.message);
  }
}

// Windows hosts file location
const HOSTS_PATH = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
const MARKER_START = '# === LOCKDOWN-BLOCKER START (do not edit below) ===';
const MARKER_END = '# === LOCKDOWN-BLOCKER END ===';

function readHosts() {
  return fs.readFileSync(HOSTS_PATH, 'utf-8');
}

function writeHosts(content) {
  fs.writeFileSync(HOSTS_PATH, content, 'utf-8');
  const written = readHosts();
  if (written !== content) throw new Error('Windows hosts file could not be verified after writing.');
  flushDns();
}

// Strips any previous block managed by this app, returns the "clean" base file
function stripManagedBlock(content) {
  const startIdx = content.indexOf(MARKER_START);
  const endIdx = content.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1) return content;
  return (
    content.slice(0, startIdx).trimEnd() +
    '\n' +
    content.slice(endIdx + MARKER_END.length).trimStart()
  );
}

/**
 * Applies the given list of domains as blocked (redirected to 127.0.0.1).
 * Idempotent — safe to call repeatedly (e.g. every few seconds) to defeat
 * manual edits/tampering while a lock is active.
 */
function applyBlockedSites(domains) {
  const current = readHosts();
  const base = stripManagedBlock(current);

  if (!domains || domains.length === 0) {
    writeHosts(base);
    return;
  }

  const lines = [MARKER_START];
  for (const domain of domains) {
    const d = domain.trim().replace(/^https?:\/\//, '').split(/[/?#]/)[0].toLowerCase().replace(/^www\./, '');
    if (!d) continue;
    lines.push(`127.0.0.1 ${d}`);
    lines.push(`0.0.0.0 ${d}`);
    lines.push(`::1 ${d}`);
    lines.push(`127.0.0.1 www.${d}`);
    lines.push(`0.0.0.0 www.${d}`);
    lines.push(`::1 www.${d}`);
  }
  lines.push(MARKER_END);

  writeHosts(base.trimEnd() + '\n\n' + lines.join('\n') + '\n');
}

function clearBlockedSites() {
  applyBlockedSites([]);
}

module.exports = { applyBlockedSites, clearBlockedSites, HOSTS_PATH };
