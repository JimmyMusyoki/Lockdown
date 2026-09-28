const { spawnSync } = require('child_process');

const SERVICE_NAME = 'SharedAccess';

function runSc(args) {
  return spawnSync('sc.exe', args, {
    encoding: 'utf8',
    windowsHide: true
  });
}

function setDisabled(disabled) {
  if (process.platform !== 'win32') {
    return { supported: false, disabled: false, message: 'Hotspot sharing controls are only available on Windows.' };
  }

  const config = runSc(['config', SERVICE_NAME, 'start=', disabled ? 'disabled' : 'demand']);
  if (config.status !== 0) {
    throw new Error((config.stderr || config.stdout || 'Could not configure Internet Connection Sharing.').trim());
  }

  if (disabled) {
    const stop = runSc(['stop', SERVICE_NAME]);
    if (stop.status !== 0 && !/not started|has not been started/i.test(`${stop.stdout}\n${stop.stderr}`)) {
      throw new Error((stop.stderr || stop.stdout || 'Could not stop Internet Connection Sharing.').trim());
    }
  }

  return { supported: true, disabled };
}

function applyPreference(disabled) {
  return setDisabled(Boolean(disabled));
}

module.exports = { applyPreference };