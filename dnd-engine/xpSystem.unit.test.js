import { getLevel, XP_THRESHOLDS } from './src/xpSystem.js';
import assert from 'node:assert';

const testCases = [
  { xp: XP_THRESHOLDS[0], expected: 1, desc: `level 1 for XP at threshold 0 (${XP_THRESHOLDS[0]})` },
  { xp: XP_THRESHOLDS[1] - 1, expected: 1, desc: `level 1 for XP just below threshold 1 (${XP_THRESHOLDS[1] - 1})` },
  { xp: XP_THRESHOLDS[1], expected: 2, desc: `level 2 for XP at threshold 1 (${XP_THRESHOLDS[1]})` },
  { xp: XP_THRESHOLDS[2] - 1, expected: 2, desc: `level 2 for XP just below threshold 2 (${XP_THRESHOLDS[2] - 1})` },
  { xp: XP_THRESHOLDS[2], expected: 3, desc: `level 3 for XP at threshold 2 (${XP_THRESHOLDS[2]})` },
  { xp: XP_THRESHOLDS[XP_THRESHOLDS.length - 1], expected: XP_THRESHOLDS.length, desc: `max level for XP at max threshold (${XP_THRESHOLDS[XP_THRESHOLDS.length - 1]})` },
  { xp: XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + 200, expected: XP_THRESHOLDS.length, desc: 'max level for XP well above max threshold' },
  { xp: -10, expected: 1, desc: 'level 1 for negative XP' },
];

let failures = 0;

console.log('Running getLevel unit tests...');

testCases.forEach(({ xp, expected, desc }) => {
  try {
    const actual = getLevel(xp);
    assert.strictEqual(actual, expected, `Expected ${expected} but got ${actual} for ${desc}`);
    console.log(`✅ Pass: ${desc}`);
  } catch (err) {
    console.error(`❌ Fail: ${desc}`);
    console.error(`   ${err.message}`);
    failures++;
  }
});

if (failures > 0) {
  console.error(`\nTests failed with ${failures} failure(s).`);
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
}
