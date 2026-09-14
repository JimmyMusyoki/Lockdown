const http = require('http');
const crypto = require('crypto');

const DEFAULT_PORT = 47821;
const DEFAULT_PASSWORD_HASH = '01953c479c9df40d9e2f9e4fc54c82bf04ac12a8a1288135b2a41b35589f2cae';

let server;
const pendingNonces = new Set();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
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

function startNetworkAgent({ getData, updateSites, updateApps, startLock, port = DEFAULT_PORT } = {}) {
  stopNetworkAgent();
  server = http.createServer(async (request, response) => {
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
      const passwordHash = getData().network?.passwordHash || DEFAULT_PASSWORD_HASH;
      const expected = crypto.createHmac('sha256', passwordHash).update(body.nonce || '').digest('hex');
      const validNonce = pendingNonces.has(body.nonce);
      if (!validNonce || !safeEqual(expected, body.proof)) {
        sendJson(response, 401, { error: 'Authentication failed' });
        return;
      }
      pendingNonces.delete(body.nonce);

      let result;
      if (body.command === 'get-data') {
        const data = getData();
        result = { blockedSites: data.blockedSites, blockedApps: data.blockedApps, lock: data.lock };
      }
      else if (body.command === 'update-sites') result = updateSites(body.payload || []);
      else if (body.command === 'update-apps') result = updateApps(body.payload || []);
      else if (body.command === 'start-lock') result = startLock(body.payload || {});
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

module.exports = { startNetworkAgent, stopNetworkAgent, hashPassword, DEFAULT_PORT, DEFAULT_PASSWORD_HASH };