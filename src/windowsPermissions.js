const { execFile } = require('child_process');

const FIREWALL_RULE_NAME = 'Lockdown Blocker Agent';
const BOOT_TASK_NAME = 'Lockdown Blocker Background Agent';

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
  await run('netsh', ['advfirewall', 'firewall', 'delete', 'rule', `name=${FIREWALL_RULE_NAME}`]).catch(() => {});
  await run('netsh', [
    'advfirewall', 'firewall', 'add', 'rule',
    `name=${FIREWALL_RULE_NAME}`,
    'dir=in', 'action=allow', 'protocol=TCP', `localport=${port}`,
    'profile=any', 'remoteip=localsubnet', 'enable=yes'
  ]);
  return { supported: true, created: true };
}

async function ensureBootAgent(executablePath) {
  if (process.platform !== 'win32') return { supported: false };
  if (!executablePath) throw new Error('Lockdown executable path is required for the boot agent.');

  // Run at machine boot as SYSTEM before any Windows account signs in. /F refreshes
  // the executable path after an application update.
  const taskCommand = `"${executablePath}" --background-agent`;
  await run('schtasks', [
    '/Create', '/TN', BOOT_TASK_NAME, '/TR', taskCommand,
    '/SC', 'ONSTART', '/RU', 'SYSTEM', '/RL', 'HIGHEST', '/F'
  ]);
  await run('schtasks', ['/Run', '/TN', BOOT_TASK_NAME]);
  return { supported: true, created: true };
}

module.exports = { ensurePrivateNetworkAccess, ensureBootAgent, FIREWALL_RULE_NAME, BOOT_TASK_NAME };
