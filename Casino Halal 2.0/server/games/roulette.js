import { rand } from './rng.js';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const BLACK = new Set([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35]);

export function colorOf(n) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

// betType: 'color' | 'number'
// pick: 'red'|'black'|'green' | 0..36
export function play({ betType, pick: choice, betCents }) {
  const winning = rand(37);
  const color = colorOf(winning);
  let multiplier = 0; // multiplier on the bet for the return; net = (mult - 1) * bet on win, -bet on loss
  let won = false;

  if (betType === 'color') {
    if (!['red', 'black', 'green'].includes(choice)) throw new Error('bad pick');
    if (choice === color) {
      won = true;
      multiplier = choice === 'green' ? 36 : 2;
    }
  } else if (betType === 'number') {
    const n = Number(choice);
    if (!Number.isInteger(n) || n < 0 || n > 36) throw new Error('bad pick');
    if (n === winning) {
      won = true;
      multiplier = 36;
    }
  } else {
    throw new Error('bad betType');
  }

  const deltaCents = won ? betCents * (multiplier - 1) : -betCents;
  return {
    winning,
    color,
    won,
    multiplier,
    deltaCents,
    payoutCents: won ? betCents * multiplier : 0,
  };
}
