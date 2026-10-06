const assert = require('node:assert/strict');
const test = require('node:test');
const https = require('node:https');
const net = require('node:net');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRequestProof, hashPassword, startNetworkAgent, stopNetworkAgent } = require('../src/networkAgent');

function requestAgent(port, route, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: '127.0.0.1', port, path: route, method, headers, rejectUnauthorized: false }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function getChallenge(port) {
  const response = await requestAgent(port, '/challenge');
  return JSON.parse(response.body.toString()).nonce;
}

test('request proof covers command, payload, role, and request metadata', () => {
  const base = {
    nonce: 'nonce',
    timestamp: 1700000000000,
    requestId: 'request-id-12345678',
    command: 'update-sites',
    payload: ['example.com'],
    role: 'operator'
  };
  const proof = createRequestProof(hashPassword('test-password'), base);
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, command: 'shutdown', role: 'admin' }));
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, payload: ['other.example'] }));
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, requestId: 'different-request-123' }));
});

test('remote PC activity command returns the agent process snapshot', async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lockdown-pc-activity-'));
  const portReservation = net.createServer();
  await new Promise((resolve) => portReservation.listen(0, '127.0.0.1', resolve));
  const { port } = portReservation.address();
  await new Promise((resolve) => portReservation.close(resolve));
  const processes = [{ ProcessName: 'study-app', Id: 42, CPU: 12.5, WorkingSet64: 4096 }];
  const attention = {
    hostname: 'study-pc',
    uptime: 30 * 24 * 60 * 60,
    disks: [{ DeviceID: 'C:', Size: 1000, FreeSpace: 50 }],
    updateStatus: { status: 'available', availableVersion: '1.2.0' },
    usbStorageBlocked: false
  };
  let usbStorageBlocked = false;

  try {
    await startNetworkAgent({
      getData: () => ({ blockedSites: [], blockedApps: [], lock: null }),
      getPcActivity: () => processes,
      getPcAttention: () => attention,
      getUsbStorageBlocked: () => usbStorageBlocked,
      setUsbStorageBlocked: (blocked) => {
        usbStorageBlocked = Boolean(blocked);
        return { blocked: usbStorageBlocked, requiresReconnect: true };
      },
      startWindowsUpdateInstall: () => ({ jobId: 'update-job-1', status: 'running' }),
      getWindowsUpdateInstallStatus: (jobId) => ({ jobId, status: 'complete', message: '2 updates installed.' }),
      scheduleRestart: () => ({ scheduled: true, delaySeconds: 10 }),
      scheduleWorkstationLock: () => ({ locked: true }),
      certificateDirectory: path.join(temporaryDirectory, 'certificates'),
      port
    });

    const nonce = await getChallenge(port);
    const response = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce,
        timestamp: Date.now(),
        requestId: 'pc-activity-request-123456',
        command: 'get-pc-activity',
        payload: null,
        role: 'operator'
      })
    });

    assert.equal(response.status, 200);
    assert.deepEqual(JSON.parse(response.body.toString()).data, processes);

    const attentionNonce = await getChallenge(port);
    const attentionResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: attentionNonce,
        timestamp: Date.now(),
        requestId: 'pc-attention-request-123456',
        command: 'get-pc-attention',
        payload: null,
        role: 'operator'
      })
    });
    assert.equal(attentionResponse.status, 200);
    assert.deepEqual(JSON.parse(attentionResponse.body.toString()).data, attention);

    const updateNonce = await getChallenge(port);
    const updateResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: updateNonce,
        timestamp: Date.now(),
        requestId: 'windows-update-start-123456',
        command: 'install-windows-updates',
        payload: null,
        role: 'admin'
      })
    });
    assert.equal(updateResponse.status, 200);
    assert.deepEqual(JSON.parse(updateResponse.body.toString()).data, { jobId: 'update-job-1', status: 'running' });

    const statusNonce = await getChallenge(port);
    const statusResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: statusNonce,
        timestamp: Date.now(),
        requestId: 'windows-update-status-123456',
        command: 'get-windows-update-install-status',
        payload: { jobId: 'update-job-1' },
        role: 'admin'
      })
    });
    assert.equal(statusResponse.status, 200);
    assert.deepEqual(JSON.parse(statusResponse.body.toString()).data, {
      jobId: 'update-job-1', status: 'complete', message: '2 updates installed.'
    });

    const unauthorizedNonce = await getChallenge(port);
    const unauthorizedResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: unauthorizedNonce,
        timestamp: Date.now(),
        requestId: 'windows-update-operator-123456',
        command: 'install-windows-updates',
        payload: null,
        role: 'operator'
      })
    });
    assert.equal(unauthorizedResponse.status, 400);

    const usbStateNonce = await getChallenge(port);
    const usbStateResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: usbStateNonce,
        timestamp: Date.now(),
        requestId: 'usb-state-request-12345678',
        command: 'get-usb-storage-state',
        payload: null,
        role: 'operator'
      })
    });
    assert.equal(usbStateResponse.status, 200);
    assert.equal(JSON.parse(usbStateResponse.body.toString()).data, false);

    const usbBlockNonce = await getChallenge(port);
    const usbBlockResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: usbBlockNonce,
        timestamp: Date.now(),
        requestId: 'usb-block-request-12345678',
        command: 'set-usb-storage-blocked',
        payload: { blocked: true },
        role: 'admin'
      })
    });
    assert.equal(usbBlockResponse.status, 200);
    assert.deepEqual(JSON.parse(usbBlockResponse.body.toString()).data, { blocked: true, requiresReconnect: true });
    assert.equal(usbStorageBlocked, true);

    const restartNonce = await getChallenge(port);
    const restartResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: restartNonce,
        timestamp: Date.now(),
        requestId: 'restart-pc-request-12345678',
        command: 'restart',
        payload: null,
        role: 'admin'
      })
    });
    assert.equal(restartResponse.status, 202);

    const lockNonce = await getChallenge(port);
    const lockResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: lockNonce,
        timestamp: Date.now(),
        requestId: 'workstation-lock-request-123456',
        command: 'lock-workstation',
        payload: null,
        role: 'admin'
      })
    });
    assert.equal(lockResponse.status, 202);

    const unauthorizedLockNonce = await getChallenge(port);
    const unauthorizedLockResponse = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce: unauthorizedLockNonce,
        timestamp: Date.now(),
        requestId: 'workstation-lock-operator-123456',
        command: 'lock-workstation',
        payload: null,
        role: 'operator'
      })
    });
    assert.equal(unauthorizedLockResponse.status, 403);
  } finally {
    stopNetworkAgent();
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('shared files transfer through a one-use challenge without target-side opt-in', async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lockdown-file-share-'));
  const portReservation = net.createServer();
  await new Promise((resolve) => portReservation.listen(0, '127.0.0.1', resolve));
  const { port } = portReservation.address();
  await new Promise((resolve) => portReservation.close(resolve));
  try {
    await startNetworkAgent({
      getData: () => ({ blockedSites: [], blockedApps: [], lock: null }),
      sharedFilesDirectory: path.join(temporaryDirectory, 'shared'),
      certificateDirectory: path.join(temporaryDirectory, 'certificates'),
      port
    });

    const listNonce = await getChallenge(port);
    const initialList = await requestAgent(port, '/files/list', { headers: { 'x-lockdown-nonce': listNonce } });
    assert.deepEqual(JSON.parse(initialList.body.toString()).files, []);
    assert.equal((await requestAgent(port, '/files/list', { headers: { 'x-lockdown-nonce': listNonce } })).status, 401);

    const content = Buffer.from('shared content');
    const uploadNonce = await getChallenge(port);
    const upload = await requestAgent(port, '/files/upload?name=report.txt', {
      method: 'POST',
      headers: { 'x-lockdown-nonce': uploadNonce, 'content-length': content.length },
      body: content
    });
    assert.equal(upload.status, 201);
    const sharedFile = JSON.parse(upload.body.toString()).file;

    const downloadNonce = await getChallenge(port);
    const download = await requestAgent(port, `/files/download?id=${sharedFile.id}`, { headers: { 'x-lockdown-nonce': downloadNonce } });
    assert.equal(download.status, 200);
    assert.deepEqual(download.body, content);
  } finally {
    stopNetworkAgent();
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('shutdown ends screen sharing before acknowledging the shutdown request', async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lockdown-shutdown-'));
  const portReservation = net.createServer();
  await new Promise((resolve) => portReservation.listen(0, '127.0.0.1', resolve));
  const { port } = portReservation.address();
  await new Promise((resolve) => portReservation.close(resolve));
  let screenStopped = false;
  const activity = [];

  try {
    await startNetworkAgent({
      getData: () => ({ blockedSites: [], blockedApps: [], lock: null }),
      stopScreenView: () => { screenStopped = true; },
      recordActivity: (title, detail) => activity.push({ title, detail }),
      scheduleShutdown: () => {},
      certificateDirectory: path.join(temporaryDirectory, 'certificates'),
      port
    });

    const nonce = await getChallenge(port);
    const response = await requestAgent(port, '/command', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nonce,
        timestamp: Date.now(),
        requestId: 'shutdown-request-12345678',
        command: 'shutdown',
        payload: null,
        role: 'admin'
      })
    });
    assert.equal(response.status, 202);
    assert.equal(screenStopped, true);
    assert.deepEqual(activity, [{ title: 'LAN client request', detail: '127.0.0.1 POST /command · shutdown' }]);
  } finally {
    stopNetworkAgent();
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
