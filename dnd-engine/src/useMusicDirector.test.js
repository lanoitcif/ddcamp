import assert from 'node:assert';
import process from 'node:process';
import { normalizeDirection } from './useMusicDirector.js';

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

console.log('Running music director unit tests...');

test('preserves valid zero-valued direction fields', () => {
  const direction = normalizeDirection({
    tempoScale: 0,
    density: 0,
    tension: 0,
    restProbability: 0,
    ornamentChance: 0,
    seed: 0,
    phraseBars: 0,
    register: 'mid',
    motifShape: 'static',
    instrumentBlend: 'soft',
  });

  assert.strictEqual(direction.tempoScale, 0.7);
  assert.strictEqual(direction.density, 0.1);
  assert.strictEqual(direction.tension, 0);
  assert.strictEqual(direction.restProbability, 0.02);
  assert.strictEqual(direction.ornamentChance, 0);
  assert.strictEqual(direction.seed, 0);
  assert.strictEqual(direction.phraseBars, 2);
});

test('falls back only for missing or non-numeric direction fields', () => {
  const direction = normalizeDirection({
    tension: '',
    seed: 'not-a-number',
  });

  assert.strictEqual(direction.tension, 0.35);
  assert.strictEqual(direction.seed, 0.5);
});
