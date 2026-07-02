import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  applyDeposit,
  applyWithdraw,
  deleteUser,
  getHistory,
  getUserByName,
  updateUserField,
} from '../db.js';
import { publicUser, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const NAME_RE = /^[A-Za-z0-9_]{3,20}$/;

// Daily deposit cap: $10,000 when balance ≤ $1,000 (matches v1's softer rule),
// otherwise allowed amount == current balance (you can "double down" on what you have).
function maxDeposit(balanceCents) {
  if (balanceCents <= 100_000) return 1_000_000; // $10,000
  return balanceCents;
}

router.post('/deposit', (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
    return res.status(400).json({ error: 'Enter a positive amount up to $10,000.' });
  }
  const cents = Math.round(amount * 100);
  const max = maxDeposit(req.user.balance_cents);
  if (cents > max) {
    return res.status(400).json({ error: `Today's max deposit is $${(max / 100).toFixed(2)}.` });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (req.user.last_deposit === today) {
    return res.status(400).json({ error: "You've already deposited today. Try tomorrow." });
  }
  try {
    const newBalance = applyDeposit(req.user.id, cents, today);
    res.json({ balance_cents: newBalance });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/withdraw', (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Enter a positive amount.' });
  }
  const cents = Math.round(amount * 100);
  try {
    const newBalance = applyWithdraw(req.user.id, cents);
    res.json({ balance_cents: newBalance });
  } catch (e) {
    res.status(400).json({ error: 'Insufficient funds.' });
  }
});

router.post('/rename', (req, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return res.status(400).json({ error: 'Name must be 3–20 chars, letters/numbers/underscore only.' });
  }
  const existing = getUserByName(name);
  if (existing && existing.id !== req.user.id) {
    return res.status(409).json({ error: 'That name is taken.' });
  }
  updateUserField(req.user.id, 'name', name);
  res.json({ ok: true });
});

router.post('/change-password', async (req, res) => {
  const { current, next } = req.body ?? {};
  if (typeof current !== 'string' || typeof next !== 'string') {
    return res.status(400).json({ error: 'Both fields required.' });
  }
  if (next.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const ok = await bcrypt.compare(current, req.user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
  const hash = await bcrypt.hash(next, 10);
  updateUserField(req.user.id, 'password_hash', hash);
  res.json({ ok: true });
});

router.post('/delete', async (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string') return res.status(400).json({ error: 'Password required.' });
  const ok = await bcrypt.compare(password, req.user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Password is incorrect.' });
  deleteUser(req.user.id);
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/history', (req, res) => {
  const rows = getHistory(req.user.id, 100);
  res.json({ history: rows });
});

router.get('/limits', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    can_deposit_today: req.user.last_deposit !== today,
    max_deposit_cents: maxDeposit(req.user.balance_cents),
  });
});

export default router;
