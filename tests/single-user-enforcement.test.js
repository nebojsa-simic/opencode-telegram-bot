/**
 * Single-User Enforcement Tests
 * 
 * Tests that the bot properly validates and enforces single-user constraint
 */

import assert from 'node:assert';
import test from 'node:test';

// Mock config
function createMockConfig(allowlist) {
  return {
    ALLOWLIST: allowlist
  };
}

// Test helper - simulates the validation logic
function validateAllowlist(config) {
  if (config.ALLOWLIST.length === 0) {
    return { valid: false, error: 'ALLOWLIST is required' };
  }
  
  if (config.ALLOWLIST.length > 1) {
    return { 
      valid: true, 
      warning: 'Multiple IDs detected, using first: ' + config.ALLOWLIST[0] 
    };
  }
  
  return { valid: true };
}

// Test helper - simulates chat authorization check
function isChatAuthorized(chatId, config) {
  return config.ALLOWLIST[0] === chatId;
}

test('Should reject empty allowlist', () => {
  const config = createMockConfig([]);
  const result = validateAllowlist(config);
  
  assert.strictEqual(result.valid, false, 'Empty allowlist should be invalid');
  assert.ok(result.error.includes('required'), 'Error should mention requirement');
});

test('Should warn on multiple allowlist entries', () => {
  const config = createMockConfig(['123', '456']);
  const result = validateAllowlist(config);
  
  assert.strictEqual(result.valid, true, 'Should still work but warn');
  assert.ok(result.warning.includes('Multiple'), 'Should warn about multiple IDs');
});

test('Should authorize configured chat ID', () => {
  const config = createMockConfig(['724085721']);
  
  assert.strictEqual(
    isChatAuthorized('724085721', config), 
    true, 
    'Configured chat should be authorized'
  );
});

test('Should reject unauthorized chat ID', () => {
  const config = createMockConfig(['724085721']);
  
  assert.strictEqual(
    isChatAuthorized('999999999', config), 
    false, 
    'Different chat should be rejected'
  );
});
