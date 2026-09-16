function normalizeList(value) {
  if (!Array.isArray(value)) throw new TypeError('Expected a list of text values.');

  return [...new Set(value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))];
}

function normalizeDuration(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60) {
    throw new RangeError('Lock duration must be between 1 and 1440 minutes.');
  }
  return Math.floor(minutes);
}

module.exports = { normalizeList, normalizeDuration };