import express from 'express';
import session from 'express-session';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js'; // ensure DB initialized
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import gameRoutes from './routes/games.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');
const PORT = process.env.PORT ?? 3000;

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'halal-casino-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/games', gameRoutes);

app.use(express.static(PUBLIC_DIR));

// SPA fallback: any non-API route returns index.html so the hash router can take over.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(resolve(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Casino Halal 2.0 — listening on http://localhost:${PORT}\n`);
});
