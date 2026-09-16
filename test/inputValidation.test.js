const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeList, normalizeDuration } = require('../src/inputValidation');

test('normalizeList removes blank, non-text, and duplicate entries', () => {
  assert.deepEqual(normalizeList([' https://www.youtube.com/shorts ', '', 'youtube.com', null, 'reddit.com']), [
    'youtube.com',
    'reddit.com'
  ]);
});

test('normalizeList rejects non-lists', () => {
  assert.throws(() => normalizeList('youtube.com'), /Expected a list/);
});

test('normalizeDuration accepts whole minutes in the MVP range', () => {
  assert.equal(normalizeDuration('15.9'), 15);
});

test('normalizeDuration rejects invalid or excessive values', () => {
  assert.throws(() => normalizeDuration(0), /between 1 and 1440/);
  assert.throws(() => normalizeDuration(1441), /between 1 and 1440/);
});