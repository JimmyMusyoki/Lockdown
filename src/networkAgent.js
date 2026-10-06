const https = require('https');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const { execFile } = require('child_process');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

const DEFAULT_PORT = 47821;
const SHUTDOWN_RESPONSE_DELAY_MS = 1500;
const REQUEST_CLOCK_SKEW_MS = 2 * 60 * 1000;
const REQUEST_ID_TTL_MS = 2 * 60 * 1000;
const MAX_SHARED_FILE_BYTES = 50 * 1024 * 1024;
let server;
const pendingNonces = new Set();
const usedRequestIds = new Map();

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
  if (typeof password !== 'string' || password.length < 12) return null;
  return `scrypt:${crypto.scryptSync(password, 'lockdown-agent-v1', 32).toString('hex')}`;
}

function canonicalRequest({ nonce, timestamp, requestId, command, payload, role }) {
  return JSON.stringify([nonce, timestamp, requestId, command, payload, role]);
}

function createRequestProof(passwordHash, request) {
  return crypto.createHmac('sha256', passwordHash || 'no-password').update(canonicalRequest(request)).digest('hex');
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

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function safeSharedFileName(value) {
  const name = path.basename(String(value || '')).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim().slice(0, 160);
  if (!name || name === '.' || name === '..') throw new Error('A valid file name is required.');
  return name;
}

async function listSharedFiles(directory) {
  await fs.promises.mkdir(directory, { recursive: true });
  const entries = await fs.promises.readdir(directory);
  const files = await Promise.all(entries.filter((entry) => /^[\da-f-]{36}\.json$/i.test(entry)).map(async (entry) => {
    try {
      const metadata = JSON.parse(await fs.promises.readFile(path.join(directory, entry), 'utf8'));
      const expectedId = entry.slice(0, -5);
      if (metadata.id !== expectedId) return null;
      const stats = await fs.promises.stat(path.join(directory, `${metadata.id}.data`));
      return { id: metadata.id, name: safeSharedFileName(metadata.name), size: stats.size, addedAt: metadata.addedAt };
    } catch (_) {
      return null;
    }
  }));
  return files.filter(Boolean).sort((left, right) => right.addedAt.localeCompare(left.addedAt));
}

async function handleSharedFileRequest(request, response, url, directory) {
  const nonce = request.headers['x-lockdown-nonce'] || url.searchParams.get('nonce');
  if (!nonce || !pendingNonces.has(nonce)) {
    sendJson(response, 401, { error: 'A fresh device challenge is required.' });
    return;
  }
  pendingNonces.delete(nonce);
  await fs.promises.mkdir(directory, { recursive: true });

  if (request.method === 'GET' && url.pathname === '/files/list') {
    sendJson(response, 200, { ok: true, files: await listSharedFiles(directory) });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/files/upload') {
    const contentLength = Number(request.headers['content-length']);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_SHARED_FILE_BYTES) {
      sendJson(response, 413, { error: 'Files must be 50 MB or smaller.' });
      return;
    }
    const name = safeSharedFileName(url.searchParams.get('name'));
    const id = crypto.randomUUID();
    const dataPath = path.join(directory, `${id}.data`);
    let received = 0;
    const limit = new Transform({
      transform(chunk, _encoding, callback) {
        received += chunk.length;
        callback(received > MAX_SHARED_FILE_BYTES ? new Error('Files must be 50 MB or smaller.') : null, chunk);
      }
    });
    try {
      await pipeline(request, limit, fs.createWriteStream(dataPath, { flags: 'wx' }));
      if (received !== contentLength) throw new Error('Uploaded file size did not match its declared size.');
      await fs.promises.writeFile(path.join(directory, `${id}.json`), JSON.stringify({ id, name, addedAt: new Date().toISOString() }), { flag: 'wx' });
      sendJson(response, 201, { ok: true, file: { id, name, size: received } });
    } catch (error) {
      await fs.promises.rm(dataPath, { force: true });
      if (!response.headersSent && !response.destroyed) sendJson(response, error.message.includes('50 MB') ? 413 : 400, { error: error.message });
    }
    return;
  }

  if (request.method === 'GET' && url.pathname === '/files/download') {
    const id = url.searchParams.get('id') || '';
    if (!/^[\da-f-]{36}$/i.test(id)) {
      sendJson(response, 400, { error: 'Invalid shared-file ID.' });
      return;
    }
    try {
      const metadata = JSON.parse(await fs.promises.readFile(path.join(directory, `${id}.json`), 'utf8'));
      if (metadata.id !== id) throw new Error('Invalid shared-file metadata.');
      const name = safeSharedFileName(metadata.name);
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': (await fs.promises.stat(path.join(directory, `${id}.data`))).size,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
      });
      await pipeline(fs.createReadStream(path.join(directory, `${id}.data`)), response);
    } catch (error) {
      if (!response.headersSent) sendJson(response, 404, { error: 'That shared file is no longer available.' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Unknown file-sharing route.' });
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
    const systemRoot = process.env.SystemRoot || process.env.windir || 'C:\\Windows';
    const shutdownPath = path.join(systemRoot, 'System32', 'shutdown.exe');
    execFile(shutdownPath, ['/s', '/f', '/t', '5'], { windowsHide: true }, (error, stdout, stderr) => {
      if (!error) {
        resolve({ scheduled: true, delaySeconds: 5 });
        return;
      }
      const detail = String(stderr || stdout || error.message || '').trim();
      reject(new Error(detail || `Windows shutdown failed with code ${error.code || 'unknown'}.`));
    });
  });
}

async function startNetworkAgent({ getData, getNetworkGroups, updateSites, updateApps, getPcActivity, getPcAttention, startWindowsUpdateInstall, getWindowsUpdateInstallStatus, startLock, getActivity, mergeNetworkGroup, recordActivity, requestScreenView, captureScreenFrame, stopScreenView, sharedFilesDirectory, scheduleShutdown, certificateDirectory, port = DEFAULT_PORT } = {}) {
  stopNetworkAgent();
  const certificate = await loadCertificate(certificateDirectory);
  server = https.createServer(certificate, async (request, response) => {
    const url = new URL(request.url, 'https://localhost');
    if (url.pathname.startsWith('/files/')) {
      try {
        await handleSharedFileRequest(request, response, url, sharedFilesDirectory || path.join(process.cwd(), '.lockdown-shared-files'));
      } catch (error) {
        if (!response.headersSent) sendJson(response, 500, { error: error.message });
      }
      return;
    }
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { ok: true, name: 'Lockdown Blocker Agent' });
      return;
    }

    if (request.method === 'GET' && request.url === '/challenge') {
      const nonce = crypto.randomBytes(32).toString('hex');
      pendingNonces.add(nonce);
      setTimeout(() => pendingNonces.delete(nonce), 30000).unref();
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

      const timestamp = Number(body.timestamp);
      const validTimestamp = Number.isSafeInteger(timestamp) && Math.abs(Date.now() - timestamp) <= REQUEST_CLOCK_SKEW_MS;
      const validRequestId = typeof body.requestId === 'string' && body.requestId.length >= 16 && body.requestId.length <= 100;
      const validNonce = pendingNonces.has(body.nonce);
      const validRequest = validTimestamp && validRequestId && rememberRequestId(body.requestId);
      if (!validNonce || !validRequest) {
        if (recordActivity) recordActivity('Agent request rejected', address);
        sendJson(response, 401, { error: 'Request validation failed' });
        return;
      }
      pendingNonces.delete(body.nonce);
      if (recordActivity) recordActivity('LAN client request', `${address} ${request.method} ${url.pathname} · ${body.command}`);

      if (body.command === 'shutdown') {
        if (stopScreenView) stopScreenView();
        sendJson(response, 202, { ok: true, data: { scheduled: true, delaySeconds: 5 } });
        response.once('finish', () => {
          setTimeout(() => {
            const shutdown = scheduleShutdown || (() => runShutdown());
            Promise.resolve(shutdown()).catch((error) => {
              if (recordActivity) recordActivity(`Shutdown failed: ${error.message}`);
            });
          }, SHUTDOWN_RESPONSE_DELAY_MS).unref();
        });
        return;
      }

      let result;
      if (body.command === 'get-data') {
        const data = getData();
        result = { blockedSites: data.blockedSites, blockedApps: data.blockedApps, lock: publicLock(data.lock) };
      }
      else if (body.command === 'start-screen-view' && requestScreenView) result = await requestScreenView(address);
      else if (body.command === 'get-screen-frame' && captureScreenFrame) result = await captureScreenFrame(body.payload?.sessionId);
      else if (body.command === 'stop-screen-view' && stopScreenView) result = stopScreenView(body.payload?.sessionId);
      else if (body.command === 'get-network-groups') result = getNetworkGroups ? getNetworkGroups() : [];
      else if (body.command === 'update-sites') result = updateSites(body.payload || []);
      else if (body.command === 'update-apps') result = updateApps(body.payload || []);
      else if (body.command === 'start-lock') {
        const payload = body.payload || {};
        result = startLock(payload.minutes, payload.password);
      }
      else if (body.command === 'merge-network-group') result = mergeNetworkGroup(body.payload || {});
      else if (body.command === 'get-status') result = { online: true, hostname: os.hostname(), platform: process.platform, lock: publicLock(getData().lock) };
      else if (body.command === 'get-activity') result = { hostname: os.hostname(), entries: getActivity ? getActivity() : [] };
      else if (body.command === 'get-pc-activity') result = getPcActivity ? getPcActivity() : [];
      else if (body.command === 'get-pc-attention') result = getPcAttention ? await getPcAttention() : null;
      else if (body.command === 'install-windows-updates' && body.role === 'admin') result = startWindowsUpdateInstall ? startWindowsUpdateInstall() : { status: 'unsupported' };
      else if (body.command === 'get-windows-update-install-status' && body.role === 'admin') result = getWindowsUpdateInstallStatus ? getWindowsUpdateInstallStatus(body.payload?.jobId) : { status: 'unsupported' };
      else {
        sendJson(response, 400, { error: 'Unknown command' });
        return;
      }
      sendJson(response, 200, { ok: true, data: result });
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
    server.listen(port, '0.0.0.0');
  }).catch((error) => {
    server = null;
    throw new Error(`Network agent could not listen on port ${port}: ${error.message}`);
  });
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
  DEFAULT_PORT
};
