import { rand } from './rng.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function rankValue(r) {
  const i = RANKS.indexOf(r);
  return i + 2; // 2..14
}

export function dealCard() {
  return { r: RANKS[rand(13)], s: SUITS[rand(4)] };
}

// Streak multipliers (applied to bet on cash-out).
const MULTIPLIERS = [1, 1.5, 2.25, 3.5, 5, 8, 12, 20, 32, 50];

export function multiplierAt(streak) {
  return MULTIPLIERS[Math.min(streak, MULTIPLIERS.length - 1)];
}

export function resolveGuess({ current, guess }) {
  const next = dealCard();
  const a = rankValue(current.r);
  const b = rankValue(next.r);

  let outcome;
  if (a === b) outcome = 'tie';
  else if ((guess === 'higher' && b > a) || (guess === 'lower' && b < a)) outcome = 'win';
  else outcome = 'lose';

  return { next, outcome };
}
