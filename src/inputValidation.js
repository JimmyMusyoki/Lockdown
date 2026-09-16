function normalizeList(value) {
  if (!Array.isArray(value)) throw new TypeError('Expected a list of text values.');

  return [...new Set(value
    .filter((item) => typeof item === 'string')
    .map((item) => normalizeSite(item))
    .filter(Boolean))];
}

function normalizeSite(value) {
  const text = value.trim();
  if (!text) return '';
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch (_) {
    return text.toLowerCase().split('/')[0].split('?')[0].split('#')[0];
  }
}

function normalizeDuration(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60) {
    throw new RangeError('Lock duration must be between 1 and 1440 minutes.');
  }
  return Math.floor(minutes);
}

module.exports = { normalizeList, normalizeDuration, normalizeSite };