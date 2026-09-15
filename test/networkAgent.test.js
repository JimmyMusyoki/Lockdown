const assert = require('node:assert/strict');
const test = require('node:test');
const { createRequestProof, hashPassword } = require('../src/networkAgent');

test('request proof covers command, payload, role, and request metadata', () => {
  const base = {
    nonce: 'nonce',
    timestamp: 1700000000000,
    requestId: 'request-id-12345678',
    command: 'update-sites',
    payload: ['example.com'],
    role: 'operator'
  };
  const proof = createRequestProof(hashPassword('test-password'), base);
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, command: 'shutdown', role: 'admin' }));
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, payload: ['other.example'] }));
  assert.notEqual(proof, createRequestProof(hashPassword('test-password'), { ...base, requestId: 'different-request-123' }));
});
