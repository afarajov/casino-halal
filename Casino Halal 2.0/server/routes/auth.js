import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getUserById, getUserByName, createUser } from '../db.js';
import { publicUser, requireAuth } from '../middleware/auth.js';

const router = Router();

const NAME_RE = /^[A-Za-z0-9_]{3,20}$/;

router.post('/register', async (req, res) => {
  const { name, password } = req.body ?? {};
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    return res.status(400).json({ error: 'Name must be 3–20 chars, letters/numbers/underscore only.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (getUserByName(name)) {
    return res.status(409).json({ error: 'That name is taken.' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, passwordHash });
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { name, password } = req.body ?? {};
  if (typeof name !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Name and password required.' });
  }
  const user = getUserByName(name);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });
  const user = getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
});

export default router;
