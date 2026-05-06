/**
 * Generates a cryptographically secure random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function secureRandomInt(min, max) {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Simulates a dice roll with the specified number of sides.
 * @param {number} sides
 * @returns {number}
 */
export function secureRoll(sides) {
  return secureRandomInt(1, sides);
}

/**
 * Generates a cryptographically secure random string of specified length.
 * @param {number} length
 * @returns {string}
 */
export function secureRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  globalThis.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

/**
 * Generates a cryptographically secure random float between 0 (inclusive) and 1 (exclusive).
 * @returns {number}
 */
export function secureRandomFloat() {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
}
