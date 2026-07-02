import { Router } from 'express';
import { recordGame, getUserById } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import * as roulette from '../games/roulette.js';
import * as cups from '../games/cups.js';
import * as slots from '../games/slots.js';
import * as blackjack from '../games/blackjack.js';
import * as hilo from '../games/higherlower.js';

const router = Router();
router.use(requireAuth);

function parseBetCents(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Enter a positive bet.');
  const cents = Math.round(n * 100);
  if (cents < 1) throw new Error('Bet too small.');
  return cents;
}

function ensureFunds(user, cents) {
  if (user.balance_cents < cents) throw new Error('Insufficient funds.');
}

// ---------- ROULETTE ----------
router.post('/roulette', (req, res) => {
  try {
    const betCents = parseBetCents(req.body?.bet);
    ensureFunds(req.user, betCents);
    const { betType, pick } = req.body ?? {};
    const result = roulette.play({ betType, pick, betCents });
    const detail = JSON.stringify({ betType, pick, winning: result.winning, color: result.color });
    const newBalance = recordGame(req.user.id, {
      game: 'roulette', betCents, deltaCents: result.deltaCents, detail,
    });
    res.json({ ...result, balance_cents: newBalance });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- CUPS & BALLS ----------
router.post('/cups', (req, res) => {
  try {
    const betCents = parseBetCents(req.body?.bet);
    ensureFunds(req.user, betCents);
    const result = cups.play({ pick: req.body?.pick, betCents });
    const newBalance = recordGame(req.user.id, {
      game: 'cups', betCents, deltaCents: result.deltaCents,
      detail: JSON.stringify({ pick: req.body?.pick, ball: result.ball }),
    });
    res.json({ ...result, balance_cents: newBalance });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- SLOTS ----------
router.post('/slots', (req, res) => {
  try {
    const betCents = parseBetCents(req.body?.bet);
    ensureFunds(req.user, betCents);
    const result = slots.play({ betCents });
    const newBalance = recordGame(req.user.id, {
      game: 'slots', betCents, deltaCents: result.deltaCents,
      detail: JSON.stringify({ reels: result.reels, multiplier: result.multiplier }),
    });
    res.json({ ...result, balance_cents: newBalance });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- BLACKJACK (stateful via session) ----------
router.post('/blackjack/start', (req, res) => {
  try {
    const betCents = parseBetCents(req.body?.bet);
    ensureFunds(req.user, betCents);
    // Debit immediately so the bet is locked.
    const balance = recordGame(req.user.id, {
      game: 'blackjack', betCents, deltaCents: -betCents, detail: '{"phase":"start"}',
    });
    const shoe = blackjack.freshShoe();
    const player = [shoe.pop(), shoe.pop()];
    const dealer = [shoe.pop(), shoe.pop()];
    req.session.blackjack = { shoe, player, dealer, betCents, settled: false };

    const playerBJ = blackjack.isBlackjack(player);
    if (playerBJ) {
      // Auto-resolve naturals
      return finishBlackjack(req, res, balance);
    }

    res.json({
      player,
      dealer_up: [dealer[0]],
      player_total: blackjack.handValue(player),
      balance_cents: balance,
      phase: 'playing',
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/blackjack/hit', (req, res) => {
  const g = req.session.blackjack;
  if (!g || g.settled) return res.status(400).json({ error: 'No active game.' });
  g.player.push(g.shoe.pop());
  const total = blackjack.handValue(g.player);
  if (total >= 21) {
    return finishBlackjack(req, res);
  }
  res.json({
    player: g.player,
    player_total: total,
    phase: 'playing',
  });
});

router.post('/blackjack/stand', (req, res) => {
  const g = req.session.blackjack;
  if (!g || g.settled) return res.status(400).json({ error: 'No active game.' });
  return finishBlackjack(req, res);
});

function finishBlackjack(req, res, balanceOverride) {
  const g = req.session.blackjack;
  blackjack.dealerPlay(g.shoe, g.dealer);
  const r = blackjack.resolve({
    betCents: g.betCents,
    playerHand: g.player,
    dealerHand: g.dealer,
  });
  let balance = balanceOverride ?? getUserById(req.user.id).balance_cents;
  if (r.creditCents > 0) {
    balance = recordGame(req.user.id, {
      game: 'blackjack', betCents: g.betCents, deltaCents: r.creditCents,
      detail: JSON.stringify({ phase: 'settle', result: r.result, player: g.player, dealer: g.dealer }),
    });
  } else {
    // Log a zero-delta settle entry so history reads cleanly.
    balance = recordGame(req.user.id, {
      game: 'blackjack', betCents: g.betCents, deltaCents: 0,
      detail: JSON.stringify({ phase: 'settle', result: r.result, player: g.player, dealer: g.dealer }),
    });
  }
  g.settled = true;
  delete req.session.blackjack;
  res.json({
    player: g.player,
    dealer: g.dealer,
    player_total: blackjack.handValue(g.player),
    dealer_total: blackjack.handValue(g.dealer),
    result: r.result,
    delta_cents: r.deltaCents,
    balance_cents: balance,
    phase: 'finished',
  });
}

// ---------- HIGHER OR LOWER (stateful) ----------
router.post('/hilo/start', (req, res) => {
  try {
    const betCents = parseBetCents(req.body?.bet);
    ensureFunds(req.user, betCents);
    const balance = recordGame(req.user.id, {
      game: 'hilo', betCents, deltaCents: -betCents, detail: '{"phase":"start"}',
    });
    const current = hilo.dealCard();
    req.session.hilo = { current, betCents, streak: 0, settled: false };
    res.json({
      current,
      streak: 0,
      multiplier: hilo.multiplierAt(0),
      balance_cents: balance,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/hilo/guess', (req, res) => {
  const g = req.session.hilo;
  if (!g || g.settled) return res.status(400).json({ error: 'No active game.' });
  const guess = req.body?.guess;
  if (!['higher', 'lower'].includes(guess)) {
    return res.status(400).json({ error: 'Pick higher or lower.' });
  }
  const { next, outcome } = hilo.resolveGuess({ current: g.current, guess });

  if (outcome === 'lose') {
    g.settled = true;
    delete req.session.hilo;
    return res.json({
      next, outcome,
      streak: g.streak,
      balance_cents: req.user.balance_cents,
    });
  }

  if (outcome === 'tie') {
    // Push: refund bet, end round.
    const balance = recordGame(req.user.id, {
      game: 'hilo', betCents: g.betCents, deltaCents: g.betCents,
      detail: JSON.stringify({ phase: 'push', card: g.current, next }),
    });
    g.settled = true;
    delete req.session.hilo;
    return res.json({
      next, outcome,
      streak: g.streak,
      balance_cents: balance,
    });
  }

  // Win: advance.
  g.streak++;
  g.current = next;
  res.json({
    next, outcome,
    current: g.current,
    streak: g.streak,
    multiplier: hilo.multiplierAt(g.streak),
  });
});

router.post('/hilo/cashout', (req, res) => {
  const g = req.session.hilo;
  if (!g || g.settled) return res.status(400).json({ error: 'No active game.' });
  const mult = hilo.multiplierAt(g.streak);
  const credit = Math.floor(g.betCents * mult);
  const balance = recordGame(req.user.id, {
    game: 'hilo', betCents: g.betCents, deltaCents: credit,
    detail: JSON.stringify({ phase: 'cashout', streak: g.streak, multiplier: mult }),
  });
  g.settled = true;
  delete req.session.hilo;
  res.json({
    cashed: true,
    streak: g.streak,
    multiplier: mult,
    credit_cents: credit,
    balance_cents: balance,
  });
});

export default router;
