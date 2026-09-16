const https = require('https');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const { execFile } = require('child_process');

const DEFAULT_PORT = 47821;
const DEFAULT_PASSWORD_HASH = '01953c479c9df40d9e2f9e4fc54c82bf04ac12a8a1288135b2a41b35589f2cae';
const REQUEST_CLOCK_SKEW_MS = 2 * 60 * 1000;
const REQUEST_ID_TTL_MS = 2 * 60 * 1000;
const AUTH_WINDOW_MS = 60 * 1000;
const AUTH_FAILURE_LIMIT = 5;

let server;
const pendingNonces = new Set();
const usedRequestIds = new Map();
const authFailures = new Map();

async function loadCertificate(certificateDirectory) {
  const directory = certificateDirectory || path.join(process.cwd(), '.lockdown-cert');
  const keyPath = path.join(directory, 'agent.key');
  const certPath = path.join(directory, 'agent.crt');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }
  fs.mkdirSync(directory, { recursive: true });
  const generated = await selfsigned.generate([{ name: 'commonName', value: 'Lockdown Blocker Agent' }], {
    keySize: 2048,
    days: 3650,
    algorithm: 'sha256'
  });
  fs.writeFileSync(keyPath, generated.private);
  fs.writeFileSync(certPath, generated.cert);
  return { key: generated.private, cert: generated.cert };
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function canonicalRequest({ nonce, timestamp, requestId, command, payload, role }) {
  return JSON.stringify([nonce, timestamp, requestId, command, payload, role]);
}

function createRequestProof(passwordHash, request) {
  return crypto.createHmac('sha256', passwordHash).update(canonicalRequest(request)).digest('hex');
}

function remoteAddress(request) {
  return String(request.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
}

function rememberRequestId(requestId) {
  const now = Date.now();
  for (const [id, expiresAt] of usedRequestIds) {
    if (expiresAt <= now) usedRequestIds.delete(id);
  }
  if (usedRequestIds.has(requestId)) return false;
  usedRequestIds.set(requestId, now + REQUEST_ID_TTL_MS);
  return true;
}

function allowAuthAttempt(address) {
  const now = Date.now();
  const state = authFailures.get(address);
  if (!state || state.windowStarted + AUTH_WINDOW_MS <= now) {
    authFailures.set(address, { windowStarted: now, failures: 0 });
    return true;
  }
  return state.failures < AUTH_FAILURE_LIMIT;
}

function recordAuthFailure(address) {
  const state = authFailures.get(address) || { windowStarted: Date.now(), failures: 0 };
  state.failures += 1;
  authFailures.set(address, state);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function publicLock(lock) {
  if (!lock) return null;
  return { active: Boolean(lock.active), unlockAt: lock.unlockAt || null };
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) request.destroy();
    });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function runShutdown() {
  return new Promise((resolve, reject) => {
    execFile('shutdown', ['/s', '/t', '0'], (error) => error ? reject(error) : resolve({ scheduled: true }));
  });
}

async function startNetworkAgent({ getData, updateSites, updateApps, startLock, getActivity, mergeNetworkGroup, recordActivity, certificateDirectory, port = DEFAULT_PORT } = {}) {
  stopNetworkAgent();
  const certificate = await loadCertificate(certificateDirectory);
  server = https.createServer(certificate, async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true, name: 'Lockdown Blocker Agent' });
      return;
    }

    if (request.method === 'GET' && request.url === '/challenge') {
      const nonce = crypto.randomBytes(32).toString('hex');
      pendingNonces.add(nonce);
      setTimeout(() => pendingNonces.delete(nonce), 30000);
      sendJson(response, 200, { nonce });
      return;
    }

    if (request.method !== 'POST' || request.url !== '/command') {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }

    try {
      const body = await readBody(request);
      const address = remoteAddress(request);
      if (!allowAuthAttempt(address)) {
        sendJson(response, 429, { error: 'Too many authentication failures. Try again later.' });
        return;
      }

      const network = getData().network || {};
      const requiredRole = body.command === 'shutdown' ? 'admin' : 'operator';
      if (body.role !== requiredRole) {
        sendJson(response, 403, { error: 'Insufficient authorization.' });
        return;
      }
      const passwordHash = requiredRole === 'admin'
        ? network.adminPasswordHash || network.passwordHash || DEFAULT_PASSWORD_HASH
        : network.passwordHash || DEFAULT_PASSWORD_HASH;
      if (!passwordHash) {
        sendJson(response, 503, { error: `${requiredRole} authentication is not configured.` });
        return;
      }
      const timestamp = Number(body.timestamp);
      const validTimestamp = Number.isSafeInteger(timestamp) && Math.abs(Date.now() - timestamp) <= REQUEST_CLOCK_SKEW_MS;
      const validRequestId = typeof body.requestId === 'string' && body.requestId.length >= 16 && body.requestId.length <= 100;
      const validNonce = pendingNonces.has(body.nonce);
      const expected = createRequestProof(passwordHash, body);
      const validRequest = validTimestamp && validRequestId && rememberRequestId(body.requestId);
      if (!validNonce || !validRequest || !safeEqual(expected, body.proof)) {
        recordAuthFailure(address);
        if (recordActivity) recordActivity('Agent authentication failed', address);
        sendJson(response, 401, { error: 'Authentication failed' });
        return;
      }
      pendingNonces.delete(body.nonce);
      authFailures.delete(address);

      let result;
      if (body.command === 'get-data') {
        const data = getData();
        result = { blockedSites: data.blockedSites, blockedApps: data.blockedApps, lock: publicLock(data.lock) };
      }
      else if (body.command === 'update-sites') result = updateSites(body.payload || []);
      else if (body.command === 'update-apps') result = updateApps(body.payload || []);
      else if (body.command === 'start-lock') {
        const payload = body.payload || {};
        result = startLock(payload.minutes, payload.password);
      }
      else if (body.command === 'merge-network-group') result = mergeNetworkGroup(body.payload || {});
      else if (body.command === 'get-status') result = { online: true, hostname: os.hostname(), platform: process.platform, lock: publicLock(getData().lock) };
      else if (body.command === 'get-activity') result = { hostname: os.hostname(), entries: getActivity ? getActivity() : [] };
      else if (body.command === 'shutdown') result = await runShutdown();
      else {
        sendJson(response, 400, { error: 'Unknown command' });
        return;
      }
      sendJson(response, 200, { ok: true, data: result });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });
  server.listen(port, '0.0.0.0');
  server.on('error', (error) => console.error('Network agent failed:', error.message));
  return port;
}

function stopNetworkAgent() {
  if (server) server.close();
  server = null;
}

module.exports = {
  startNetworkAgent,
  stopNetworkAgent,
  hashPassword,
  canonicalRequest,
  createRequestProof,
  loadCertificate,
  DEFAULT_PORT,
  DEFAULT_PASSWORD_HASH
};
