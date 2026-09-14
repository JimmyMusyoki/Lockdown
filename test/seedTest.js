const TEST_PASSWORD = 'seed-test-password';

function seedTestData(overrides = {}) {
  return {
    blockedSites: ['example.com', 'social.test'],
    blockedApps: ['focus-test.exe'],
    schedules: [],
    lock: {
      active: false,
      unlockAt: null,
      passwordHash: null
    },
    network: {
      agentEnabled: true,
      port: 47821,
      passwordHash: null,
      groups: []
    },
    ...overrides
  };
}

module.exports = { seedTestData, TEST_PASSWORD };