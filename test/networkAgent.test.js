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
