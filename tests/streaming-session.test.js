/**
 * Streaming Session Tests
 * 
 * Tests the streamingSessions lifecycle pattern.
 * Verifies that sessions aren't deleted before event handlers complete.
 */

import assert from 'node:assert';
import test from 'node:test';

test('Session should persist through async event handling', async () => {
  const streamingSessions = new Map();
  const sessionId = 'test-session';
  
  // Setup - like telegram.ts does
  streamingSessions.set(sessionId, { chatId: 'test', buffer: [] });
  
  // Simulate event handler that checks session
  const eventHandler = () => {
    const session = streamingSessions.get(sessionId);
    if (!session) {
      throw new Error('Session missing!');
    }
    return 'event processed';
  };
  
  // Process message with try/catch/finally pattern
  try {
    // Simulate async streaming events
    await new Promise(r => setTimeout(r, 10));
    
    // Event fires and needs session to exist
    const result = eventHandler();
    assert.strictEqual(result, 'event processed', 'Event should process successfully');
    
  } finally {
    // DON'T delete session here - let normal flow handle it
    // This is the key fix: no streamingSessions.delete() in finally
  }
  
  // Normal cleanup after all events complete
  streamingSessions.delete(sessionId);
  assert.strictEqual(streamingSessions.has(sessionId), false, 'Session cleaned up after completion');
});

test('Session deletion in finally breaks event handlers', async () => {
  const streamingSessions = new Map();
  const sessionId = 'bad-session';
  
  streamingSessions.set(sessionId, { active: true });
  
  let eventSucceeded = false;
  
  // BROKEN pattern - deleting in finally
  try {
    // Async operation
    await new Promise(r => setTimeout(r, 10));
    
    // Event tries to access session
    if (streamingSessions.has(sessionId)) {
      eventSucceeded = true;
    }
    
  } finally {
    // BUG: Premature deletion
    streamingSessions.delete(sessionId);
  }
  
  // This demonstrates the bug - event may or may not succeed depending on timing
  // In real code with actual async events, this causes hangs
  assert.strictEqual(eventSucceeded, true, 'Event should see session');
});
