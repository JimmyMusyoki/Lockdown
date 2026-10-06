const params = new URLSearchParams(window.location.search);
const host = params.get('host');
const screenName = params.get('name') || host || 'Remote PC';
const nameElement = document.getElementById('screen-name');
const statusElement = document.getElementById('screen-status');
const frameTime = document.getElementById('frame-time');
const screenImage = document.getElementById('screen-image');
const screenMessage = document.getElementById('screen-message');
const liveIndicator = document.querySelector('.live-indicator');
const screenshotButton = document.getElementById('save-screenshot');
const fullscreenButton = document.getElementById('fullscreen-view');
let sessionId;
let stopped = false;

nameElement.textContent = screenName;

function setStatus(message, active = false) {
  statusElement.textContent = message;
  liveIndicator.classList.toggle('active', active);
}

async function captureNextFrame() {
  if (stopped || !sessionId) return;
  try {
    const frame = await window.api.remoteCommand(host, 'no-password', 'get-screen-frame', { sessionId });
    if (stopped) return;
    screenImage.src = `data:image/jpeg;base64,${frame.image}`;
    screenImage.classList.add('visible');
    screenshotButton.disabled = false;
    screenMessage.classList.add('hidden');
    frameTime.textContent = new Date(frame.capturedAt).toLocaleTimeString();
    setStatus('Live screen · enabled on host', true);
    setTimeout(captureNextFrame, 1200);
  } catch (error) {
    setStatus(error.message || 'Screen view ended');
    screenMessage.textContent = error.message || 'Screen view ended.';
    screenMessage.classList.remove('hidden');
    stopped = true;
  }
}

async function startScreenView() {
  if (!host) {
    setStatus('No remote PC selected');
    screenMessage.textContent = 'A remote PC address is required.';
    return;
  }
  try {
    const session = await window.api.remoteCommand(host, 'no-password', 'start-screen-view');
    if (!session?.sessionId) throw new Error('Remote screen session could not be started.');
    sessionId = session.sessionId;
    setStatus('Connecting to display...', true);
    captureNextFrame();
  } catch (error) {
    setStatus(error.message || 'Could not start screen view');
    screenMessage.textContent = error.message || 'Could not start screen view.';
  }
}

async function stopScreenView() {
  if (stopped) return;
  stopped = true;
  if (sessionId && host) {
    try {
      await window.api.remoteCommand(host, 'no-password', 'stop-screen-view', { sessionId });
    } catch (_) {
      // The host also expires every session automatically.
    }
  }
  setStatus('Screen viewing stopped');
  window.close();
}

document.getElementById('stop-view').addEventListener('click', stopScreenView);
screenshotButton.addEventListener('click', () => {
  if (!screenImage.src || screenshotButton.disabled) return;
  const safeName = screenName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const download = document.createElement('a');
  download.href = screenImage.src;
  download.download = `${safeName}-screenshot-${timestamp}.jpg`;
  download.click();
});
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    setStatus(error.message || 'Could not change full-screen mode');
  }
});
document.addEventListener('fullscreenchange', () => {
  const fullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.title = fullscreen ? 'Exit full screen' : 'Enter full screen';
  fullscreenButton.setAttribute('aria-label', fullscreen ? 'Exit full screen' : 'Enter full screen');
});
window.api.onRemoteScreenEnding(() => {
  stopped = true;
  setStatus('Remote PC is shutting down');
  screenMessage.textContent = 'Screen sharing ended before the remote PC shut down.';
  screenMessage.classList.remove('hidden');
});
window.addEventListener('beforeunload', () => {
  if (sessionId && !stopped) window.api.remoteCommand(host, 'no-password', 'stop-screen-view', { sessionId }).catch(() => {});
});

startScreenView();