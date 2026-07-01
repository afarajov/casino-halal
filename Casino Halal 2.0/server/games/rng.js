import { randomInt } from 'node:crypto';

// Cryptographically secure random integer in [0, max).
export function rand(max) {
  return randomInt(0, max);
}

export function pick(arr) {
  return arr[rand(arr.length)];
}
