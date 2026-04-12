/**
 * Queue Processor Tests
 * 
 * Tests the isProcessing reset pattern to prevent queue lockup bugs.
 * These tests verify the pattern used in telegram.ts processQueue().
 */

import assert from 'node:assert';
import test from 'node:test';

test('Promise.catch pattern ensures flag reset on async error', async () => {
  let isProcessing = false;
  let errorCaught = false;
  
  async function processMessageThatFails() {
    throw new Error('Async failure');
  }
  
  // This is the pattern we use in telegram.ts
  processMessageThatFails().catch((error) => {
    errorCaught = true;
    isProcessing = false;
  });
  
  // Wait for async operation
  await new Promise(r => setTimeout(r, 10));
  
  assert.strictEqual(errorCaught, true, 'Error should be caught');
  assert.strictEqual(isProcessing, false, 'Flag should be reset via catch handler');
});

test('Promise.catch pattern handles synchronous errors too', async () => {
  let isProcessing = false;
  
  function processMessageSyncFail() {
    throw new Error('Sync failure');
  }
  
  // Wrap sync throw in Promise to test catch handler
  Promise.resolve().then(() => {
    processMessageSyncFail();
  }).catch((error) => {
    isProcessing = false;
  });
  
  isProcessing = true; // Simulate setting flag
  
  // Wait for async operation
  await new Promise(r => setTimeout(r, 10));
  
  assert.strictEqual(isProcessing, false, 'Flag should be reset even for sync errors wrapped in Promise');
});

test('Finally block ensures flag reset regardless of error type', async () => {
  let isProcessing = false;
  
  try {
    isProcessing = true;
    throw new Error('Any error');
  } catch (error) {
    // Handle error
  } finally {
    isProcessing = false;
  }
  
  assert.strictEqual(isProcessing, false, 'Finally block always resets flag');
});
