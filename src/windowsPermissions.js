const { execFile } = require('child_process');

const FIREWALL_RULE_NAME = 'Lockdown Blocker Agent';

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    });
  });
}

async function ensurePrivateNetworkAccess(port) {
  if (process.platform !== 'win32') return { supported: false };
  try {
    const existing = await run('netsh', ['advfirewall', 'firewall', 'show', 'rule', `name=${FIREWALL_RULE_NAME}`]);
    if (existing.includes(FIREWALL_RULE_NAME)) return { supported: true, created: false };
  } catch (_) {
    // The rule is missing or Windows denied the query; try to create it below.
  }

  await run('netsh', [
    'advfirewall', 'firewall', 'add', 'rule',
    `name=${FIREWALL_RULE_NAME}`,
    'dir=in', 'action=allow', 'protocol=TCP', `localport=${port}`,
    'profile=private', 'enable=yes'
  ]);
  return { supported: true, created: true };
}

module.exports = { ensurePrivateNetworkAccess, FIREWALL_RULE_NAME };