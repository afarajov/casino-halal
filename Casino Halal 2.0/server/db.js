import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, 'data', 'casino.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    balance_cents INTEGER NOT NULL DEFAULT 0,
    last_deposit  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    game          TEXT NOT NULL,
    bet_cents     INTEGER NOT NULL,
    delta_cents   INTEGER NOT NULL,
    detail        TEXT,
    played_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_history_user ON game_history(user_id, played_at DESC);
`);

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByName(name) {
  return db.prepare('SELECT * FROM users WHERE name = ?').get(name);
}

export function createUser({ name, passwordHash }) {
  const info = db.prepare(
    'INSERT INTO users (name, password_hash) VALUES (?, ?)'
  ).run(name, passwordHash);
  return getUserById(info.lastInsertRowid);
}

export function updateUserField(id, field, value) {
  const allowed = ['name', 'password_hash', 'last_deposit'];
  if (!allowed.includes(field)) throw new Error('forbidden field');
  db.prepare(`UPDATE users SET ${field} = ? WHERE id = ?`).run(value, id);
}

export function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// Atomic balance change + history entry in one transaction.
export const recordGame = db.transaction((userId, { game, betCents, deltaCents, detail }) => {
  const row = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(userId);
  if (!row) throw new Error('user not found');
  const newBalance = row.balance_cents + deltaCents;
  if (newBalance < 0) throw new Error('insufficient funds');
  db.prepare('UPDATE users SET balance_cents = ? WHERE id = ?').run(newBalance, userId);
  db.prepare(
    'INSERT INTO game_history (user_id, game, bet_cents, delta_cents, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, game, betCents, deltaCents, detail ?? null);
  return newBalance;
});

export const applyDeposit = db.transaction((userId, depositCents, today) => {
  const row = db.prepare('SELECT balance_cents, last_deposit FROM users WHERE id = ?').get(userId);
  if (!row) throw new Error('user not found');
  if (row.last_deposit === today) throw new Error('already deposited today');
  const newBalance = row.balance_cents + depositCents;
  db.prepare('UPDATE users SET balance_cents = ?, last_deposit = ? WHERE id = ?')
    .run(newBalance, today, userId);
  return newBalance;
});

export const applyWithdraw = db.transaction((userId, amountCents) => {
  const row = db.prepare('SELECT balance_cents FROM users WHERE id = ?').get(userId);
  if (!row) throw new Error('user not found');
  if (row.balance_cents < amountCents) throw new Error('insufficient funds');
  const newBalance = row.balance_cents - amountCents;
  db.prepare('UPDATE users SET balance_cents = ? WHERE id = ?').run(newBalance, userId);
  return newBalance;
});

export function getHistory(userId, limit = 50) {
  return db.prepare(
    'SELECT game, bet_cents, delta_cents, detail, played_at FROM game_history WHERE user_id = ? ORDER BY played_at DESC LIMIT ?'
  ).all(userId, limit);
}
