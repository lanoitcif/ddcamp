import assert from 'node:assert';
import { webcrypto } from 'node:crypto';
import { secureRoll, secureRandomString, secureRandomInt, secureRandomFloat } from './cryptoUtils.js';

// Polyfill global crypto for Node.js test environment if needed
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

console.log('Starting Security Verification Tests...');

// Test secureRandomInt
console.log('Testing secureRandomInt...');
for (let i = 0; i < 1000; i++) {
    const val = secureRandomInt(5, 10);
    assert(val >= 5 && val <= 10, `Value ${val} out of range [5, 10]`);
}
console.log('✅ secureRandomInt passed');

// Test secureRoll
console.log('Testing secureRoll...');
const sides = 20;
const results = new Set();
for (let i = 0; i < 1000; i++) {
    const roll = secureRoll(sides);
    assert(roll >= 1 && roll <= sides, `Roll ${roll} out of range [1, ${sides}]`);
    results.add(roll);
}
assert(results.size > 1, 'secureRoll should produce multiple values');
console.log('✅ secureRoll passed');

// Test secureRandomString
console.log('Testing secureRandomString...');
const len = 10;
const str = secureRandomString(len);
assert.strictEqual(str.length, len, `String length should be ${len}`);
const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
for (const char of str) {
    assert(charset.includes(char), `Character ${char} not in charset`);
}

const str2 = secureRandomString(len);
assert.notStrictEqual(str, str2, 'Consecutive secureRandomString calls should produce different results');
console.log('✅ secureRandomString passed');

// Test secureRandomFloat
console.log('Testing secureRandomFloat...');
for (let i = 0; i < 1000; i++) {
    const val = secureRandomFloat();
    assert(val >= 0 && val < 1, `Value ${val} out of range [0, 1)`);
}
console.log('✅ secureRandomFloat passed');

console.log('All security tests passed! 🚀');
