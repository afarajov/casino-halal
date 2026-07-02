import { rand } from './rng.js';

// 3 cups, ball hidden in one. Pick correctly => 3x your bet (net 2x).
export function play({ pick, betCents }) {
  const n = Number(pick);
  if (!Number.isInteger(n) || n < 1 || n > 3) throw new Error('bad pick');
  const ball = rand(3) + 1; // 1..3
  const won = n === ball;
  const multiplier = won ? 3 : 0;
  return {
    ball,
    won,
    multiplier,
    deltaCents: won ? betCents * 2 : -betCents,
    payoutCents: won ? betCents * 3 : 0,
  };
}
