import { getUserById } from '../db.js';

export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'auth required' });
  }
  const user = getUserById(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'auth required' });
  }
  req.user = user;
  next();
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    balance_cents: user.balance_cents,
    last_deposit: user.last_deposit,
    created_at: user.created_at,
  };
}
