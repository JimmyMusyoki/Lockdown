const assert = require('node:assert/strict');
const test = require('node:test');

const lockManager = require('../src/lockManager');
const { seedTestData, TEST_PASSWORD } = require('./seedTest');

test('seedTestData creates a safe sample configuration', () => {
  const data = seedTestData();

  assert.deepEqual(data.blockedSites, ['example.com', 'social.test']);
  assert.deepEqual(data.blockedApps, ['focus-test.exe']);
  assert.equal(data.lock.active, false);
  assert.deepEqual(data.network.groups, []);
  assert.equal(data.network.passwordHash, null);
});

test('seedTestData supports isolated overrides', () => {
  const data = seedTestData({ blockedSites: ['override.test'] });

  assert.deepEqual(data.blockedSites, ['override.test']);
  assert.deepEqual(seedTestData().blockedSites, ['example.com', 'social.test']);
});

test('startLock creates an active timed lock without storing password data', () => {
  const before = Date.now();
  const lock = lockManager.startLock(5);
  const after = Date.now();

  assert.equal(lock.active, true);
  assert.equal(lock.passwordHash, undefined);
  assert.ok(new Date(lock.unlockAt).getTime() >= before + 5 * 60 * 1000);
  assert.ok(new Date(lock.unlockAt).getTime() <= after + 5 * 60 * 1000);
  assert.equal(lockManager.isLocked(lock), true);
});

test('expired locks are no longer active', () => {
  const lock = { active: true, unlockAt: new Date(Date.now() - 1000).toISOString() };

  assert.equal(lockManager.isLocked(lock), false);
  assert.equal(lockManager.timeRemainingMs(lock), 0);
});