# 🎰 Halal Casino (v1.0 & v2.0)

> A casino simulator with no real money and no real betting — started as a
> terminal Python script two years ago, and reimagined as a full web app as
> part of my journey learning backend development.

## About

This project started as one of my first serious backend builds — a fully
terminal-based casino simulator with no real money or real betting involved
(no gambling, purely a coding/logic exercise).
It's a snapshot of where I was as a developer 2 years ago, and this v2.0 is a cleanup and refactor of that original codebase.

**Note:** This is a simulation for educational purposes only — no real currency,
no real wagering, no gambling functionality.

## What it does

- **Roulette** — bet on a colour or a single number on a European single-zero wheel
- **Blackjack** — hit or stand against a dealer who stands on 17
- **Cups & Balls** — guess which of three cups hides the ball
- **Slots** *(new in v2.0)* — three-reel, single-payline machine with jewelled symbols
- **Higher or Lower** *(new in v2.0)* — guess the next card; a winning streak builds your multiplier
- **Full account system** — register / log in, a once-a-day capped deposit, withdraw, change name or password, delete account, and *(v2.0)* a logged play history
- **Two front-ends** — v1.0 is a text menu you navigate in the terminal; v2.0 is a browser SPA with animated tables, wheels and cards

## Why I built it (then and now)

It was Summer 2024. I was taking a short internship in an ERP business company, and at the same time hoping to code and learn together with my friends, who are also interested in python. Decided to encourage them, at first it started with some basic terminal-based cart simulators and little games, but later on I came up with the idea of creating a casino game with no real gambling - we called it Casino 'Halal'. So the goal back then, as i mentioned, was not trying to build something new, huge, monetizable at all - but to encourage and help my friends to learn python, and at the same time mastering python. Working together on the whole project, coming up with new ideas, and using new skills combined with the logic of every function and feature - we all learnt something new.

It was my way of learning Python fundamentals — classes and methods, dictionaries
and lists, control flow, hashing, and persisting state to disk with JSON.
Revisiting it now, in v2.0 I rebuilt it from the ground up as a client–server web
app: moved every game outcome to the server, replaced the single JSON file with
atomic SQLite transactions, swapped unsalted SHA-1 passwords for bcrypt, fixed the
blackjack scoring bugs, replaced the recursive menu navigation with an
event-driven single-page app, switched to a cryptographically secure RNG, and
moved all money to integer cents to kill float-rounding errors.

## Tech stack

- **v1.0 — Python 3**, standard library only (`json`, `hashlib`, `random`, `datetime`) — no external dependencies
- **v2.0 — Node.js + Express** back end with **better-sqlite3**, **bcryptjs** and **express-session**; **vanilla HTML/CSS/JS** front end (hash-routed SPA, no build step)

## What I'd do differently today

A short, honest note — this is what makes it read as growth, not just an old dump:
- I'd never drive menu navigation with recursion — in v1 every choice calls another method, so the call stack just keeps growing; a simple input loop is the right tool (fixed in v2.0)
- I'd never store passwords as unsalted SHA-1, or rewrite the entire JSON file on every balance change — a real password hash and a database with transactions are safer (both fixed in v2.0)
- I'd add automated tests, which I didn't know how to write back then

## Running it

**v1.0 — the terminal version (Python 3, no dependencies):**

```bash
git clone https://github.com/<your-username>/casino-halal.git
cd "casino-halal/Casino Halal 1.0"
python3 halal_casino.py
```

**v2.0 — the web app (needs Node.js 18+):**

```bash
cd "casino-halal/Casino Halal 2.0"
npm install
npm start
# then open http://localhost:3000
```

## Status

This is a portfolio/learning project, not actively maintained for production use.
My current focus is on my chess-review project *(link coming soon)*.

---
*Part of my journey learning applied software & AI engineering.*
