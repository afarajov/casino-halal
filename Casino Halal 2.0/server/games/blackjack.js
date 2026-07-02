import { rand } from './rng.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function freshShoe(decks = 4) {
  const shoe = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
  }
  // Fisher–Yates with secure RNG.
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

export function handValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 'A') {
      total += 11;
      aces++;
    } else if (['J', 'Q', 'K'].includes(c.r)) {
      total += 10;
    } else {
      total += Number(c.r);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21;
}

export function dealerPlay(shoe, dealerHand) {
  while (handValue(dealerHand) < 17) dealerHand.push(shoe.pop());
  return dealerHand;
}

// betCents already deducted on /start. resolve returns the *credit* amount (what to add back),
// and deltaCents (net change from bet) for history.
export function resolve({ betCents, playerHand, dealerHand }) {
  const p = handValue(playerHand);
  const d = handValue(dealerHand);
  const playerBJ = isBlackjack(playerHand);
  const dealerBJ = isBlackjack(dealerHand);

  // Bust = player loses bet (no credit back).
  if (p > 21) return { result: 'bust', creditCents: 0, deltaCents: -betCents };

  // Natural blackjack pays 3:2 (credit = bet * 2.5).
  if (playerBJ && !dealerBJ) {
    const credit = Math.floor(betCents * 2.5);
    return { result: 'blackjack', creditCents: credit, deltaCents: credit - betCents };
  }
  if (dealerBJ && !playerBJ) return { result: 'dealer_bj', creditCents: 0, deltaCents: -betCents };
  if (playerBJ && dealerBJ) return { result: 'push', creditCents: betCents, deltaCents: 0 };

  if (d > 21) return { result: 'dealer_bust', creditCents: betCents * 2, deltaCents: betCents };
  if (p > d) return { result: 'win', creditCents: betCents * 2, deltaCents: betCents };
  if (p < d) return { result: 'lose', creditCents: 0, deltaCents: -betCents };
  return { result: 'push', creditCents: betCents, deltaCents: 0 };
}
