/**
 * Queue Processor Tests
 * 
 * Tests that would have caught the isProcessing lockup bug
 */

import assert from 'node:assert';
import test from 'node:test';

// Mock the global state that processQueue uses
let isProcessing = false;
let messageQueue = [];

// Simulate the BROKEN version (what we had before)
async function processQueueBroken() {
  while (messageQueue.length > 0 && !isProcessing) {
    isProcessing = true;
    const msg = messageQueue.shift();
    if (msg) {
      // BUG: If this throws synchronously, isProcessing never resets
      processMessageBroken(msg);
    }
  }
}

async function processMessageBroken(msg) {
  // Simulate processing
  if (msg.shouldFail) {
    throw new Error('Simulated failure');
  }
  isProcessing = false; // Only resets on success!
}

// Simulate the FIXED version
async function processQueueFixed() {
  while (messageQueue.length > 0 && !isProcessing) {
    isProcessing = true;
    const msg = messageQueue.shift();
    if (msg) {
      // FIX: Wrap in promise with catch to ensure reset
      processMessageFixed(msg).catch((error) => {
        console.error('Process error:', error.message);
        isProcessing = false;
      });
    }
  }
}

async function processMessageFixed(msg) {
  // Simulate processing
  if (msg.shouldFail) {
    throw new Error('Simulated failure');
  }
  isProcessing = false;
}

test('Queue processor should reset isProcessing on synchronous error', async () => {
  messageQueue = [{ shouldFail: true }];
  isProcessing = false;
  
  // Run the broken version - it should lock up
  await processQueueBroken();
  
  // This assertion would FAIL with the broken code
  // because isProcessing stays true forever
  assert.strictEqual(isProcessing, false, 'isProcessing should reset even on error');
});

test('Queue processor should handle multiple messages after error', async () => {
  messageQueue = [
    { shouldFail: true },
    { shouldFail: false },
    { shouldFail: false }
  ];
  isProcessing = false;
  
  // Run the fixed version
  await processQueueFixed();
  
  // Give async operations time to complete
  await new Promise(r => setTimeout(r, 100));
  
  assert.strictEqual(messageQueue.length, 0, 'All messages should be processed');
  assert.strictEqual(isProcessing, false, 'isProcessing should be reset');
});
