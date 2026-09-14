const TEST_URL = 'https://speed.cloudflare.com/__down?bytes=5000000';
const UPLOAD_URL = 'https://speed.cloudflare.com/__up';

async function measureDownloadSpeed({ fetchImpl = fetch, now = Date.now } = {}) {
  const started = now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetchImpl(TEST_URL, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok || !response.body) throw new Error('Speed test server did not respond.');

    let bytes = 0;
    for await (const chunk of response.body) bytes += chunk.length;
    const elapsedMs = Math.max(now() - started, 1);
    const megabitsPerSecond = (bytes * 8) / (elapsedMs / 1000) / 1000000;

    return { latencyMs: elapsedMs, downloadMbps: Math.round(megabitsPerSecond * 10) / 10, bytes, elapsedMs };
  } finally {
    clearTimeout(timeout);
  }
}

async function measureUploadSpeed({ fetchImpl = fetch, now = Date.now } = {}) {
  const started = now();
  const controller = new AbortController();
  const payload = new Uint8Array(1000000);
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetchImpl(UPLOAD_URL, { method: 'POST', body: payload, signal: controller.signal });
    if (!response.ok) throw new Error('Upload test server did not respond.');
    const elapsedMs = Math.max(now() - started, 1);
    return { uploadMbps: Math.round((payload.byteLength * 8) / (elapsedMs / 1000) / 1000000 * 10) / 10 };
  } finally {
    clearTimeout(timeout);
  }
}

async function measureNetworkSpeed({ fetchImpl = fetch, now = Date.now, onStage } = {}) {
  onStage?.('download');
  const download = await measureDownloadSpeed({ fetchImpl, now });
  onStage?.('upload');
  const upload = await measureUploadSpeed({ fetchImpl, now });
  return { ...download, ...upload };
}

module.exports = { measureNetworkSpeed, measureDownloadSpeed, measureUploadSpeed, TEST_URL, UPLOAD_URL };