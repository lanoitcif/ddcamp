import assert from 'node:assert';
import process from 'node:process';
import {
  DEFAULT_NARRATION_DURATION_MS,
  normalizeNarrationDuration,
} from './narrationUtils.js';

function test(name, fn) {
  try {
    fn();
    console.log(`Pass: ${name}`);
  } catch (err) {
    console.error(`Fail: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('Running narration utility tests...');

test('uses default duration only when omitted', () => {
  assert.strictEqual(normalizeNarrationDuration(undefined), DEFAULT_NARRATION_DURATION_MS);
  assert.strictEqual(normalizeNarrationDuration(null), DEFAULT_NARRATION_DURATION_MS);
});

test('preserves explicit finite and infinite durations', () => {
  assert.strictEqual(normalizeNarrationDuration(10000), 10000);
  assert.strictEqual(normalizeNarrationDuration(0), 0);
});

test('uses default duration for invalid persisted values', () => {
  assert.strictEqual(normalizeNarrationDuration(''), DEFAULT_NARRATION_DURATION_MS);
  assert.strictEqual(normalizeNarrationDuration('not-a-number'), DEFAULT_NARRATION_DURATION_MS);
});
