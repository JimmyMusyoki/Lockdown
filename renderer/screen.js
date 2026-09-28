const params = new URLSearchParams(window.location.search);
const host = params.get('host');
const screenName = params.get('name') || host || 'Remote PC';
const nameElement = document.getElementById('screen-name');
const statusElement = document.getElementById('screen-status');
const frameTime = document.getElementById('frame-time');
const screenImage = document.getElementById('screen-image');
const screenMessage = document.getElementById('screen-message');
const liveIndicator = document.querySelector('.live-indicator');
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
    screenMessage.classList.add('hidden');
    frameTime.textContent = new Date(frame.capturedAt).toLocaleTimeString();
    setStatus('Live screen · enabled on host', true);
    setTimeout(captureNextFrame, 900);
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
    if (!session?.sessionId) throw new Error('Remote screen viewing is not enabled on this PC.');
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
window.addEventListener('beforeunload', () => {
  if (sessionId && !stopped) window.api.remoteCommand(host, 'no-password', 'stop-screen-view', { sessionId }).catch(() => {});
});

startScreenView();