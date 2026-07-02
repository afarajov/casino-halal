import { rand } from './rng.js';

// Symbol weights per reel (higher = more common). Three identical reels.
const REEL = [
  { sym: 'diamond',  weight: 3  },
  { sym: 'crescent', weight: 8  },
  { sym: 'star',     weight: 14 },
  { sym: 'gem',      weight: 25 },
  { sym: 'coin',     weight: 50 },
];

const PAYOUT_3X = {
  diamond:  100,
  crescent: 40,
  star:     20,
  gem:      10,
  coin:     5,
};

const TOTAL_WEIGHT = REEL.reduce((a, b) => a + b.weight, 0);

function spinReel() {
  let r = rand(TOTAL_WEIGHT);
  for (const s of REEL) {
    if (r < s.weight) return s.sym;
    r -= s.weight;
  }
  return REEL[REEL.length - 1].sym;
}

export function play({ betCents }) {
  const reels = [spinReel(), spinReel(), spinReel()];
  let multiplier = 0;

  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    multiplier = PAYOUT_3X[reels[0]] ?? 0;
  } else if (reels.filter(r => r === 'diamond').length === 2) {
    multiplier = 5;
  } else {
    // Any other two matching (non-diamond) gets 2x.
    const counts = {};
    for (const s of reels) counts[s] = (counts[s] ?? 0) + 1;
    const pair = Object.entries(counts).find(([, c]) => c === 2);
    if (pair) multiplier = 2;
  }

  const won = multiplier > 0;
  return {
    reels,
    won,
    multiplier,
    deltaCents: won ? betCents * (multiplier - 1) : -betCents,
    payoutCents: won ? betCents * multiplier : 0,
  };
}
