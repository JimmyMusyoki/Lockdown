function isLocked(lockState) {
  if (!lockState || !lockState.active) return false;
  if (!lockState.unlockAt) return true; // locked indefinitely until manually cleared
  return new Date() < new Date(lockState.unlockAt);
}

/**
 * Starts a lock for `durationMinutes`. The lock keeps blocking active until
 * unlockAt passes, while the block lists remain editable.
 */
function startLock(durationMinutes) {
  const unlockAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  return {
    active: true,
    unlockAt
  };
}

function timeRemainingMs(lockState) {
  if (!lockState || !lockState.unlockAt) return 0;
  return Math.max(0, new Date(lockState.unlockAt) - new Date());
}

module.exports = { isLocked, startLock, timeRemainingMs };
