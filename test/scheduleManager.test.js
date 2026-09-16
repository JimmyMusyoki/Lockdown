const assert = require('node:assert/strict');
const test = require('node:test');
const { activeWindow, activeSchedules, parseTime } = require('../src/scheduleManager');

test('schedule activates during a selected weekday window', () => {
  const date = new Date(2026, 8, 14, 9, 30); // Monday
  const schedule = { days: [1], start: '09:00', end: '10:00', enabled: true };
  assert.equal(parseTime('09:30'), 570);
  assert.ok(activeWindow(schedule, date));
  assert.equal(activeSchedules([schedule], date).length, 1);
});

test('overnight schedule continues into the following day', () => {
  const schedule = { days: [1], start: '23:00', end: '01:00', enabled: true };
  assert.ok(activeWindow(schedule, new Date(2026, 8, 14, 23, 30)));
  assert.ok(activeWindow(schedule, new Date(2026, 8, 15, 0, 30)));
  assert.equal(activeWindow(schedule, new Date(2026, 8, 15, 1, 30)), null);
});

test('invalid or equal schedule times are inactive', () => {
  assert.equal(parseTime('25:00'), null);
  assert.equal(activeWindow({ days: [1], start: '09:00', end: '09:00' }, new Date(2026, 8, 14, 9, 0)), null);
});
