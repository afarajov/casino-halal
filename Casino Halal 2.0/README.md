# Casino Halal — v2.0

A halal-spirited casino simulator: self-funded virtual coins, no real money in or out, no system enriched by your losses. The original Python CLI (v1) reimagined as a web app — fixed bugs, smoother UX, real persistence, all five rooms.

```
   Casino Halal 2.0/
   ├── server/          ← Express + SQLite backend
   │   ├── server.js
   │   ├── db.js
   │   ├── middleware/auth.js
   │   ├── routes/      (auth, account, games)
   │   └── games/       (server-authoritative game logic)
   └── public/          ← Vanilla HTML/CSS/JS frontend
       ├── index.html   (SPA shell)
       ├── css/         (base, layout, components, games, animations)
       └── js/          (api, state, ui, app, views/, games/)
```

## Run it

You need **Node.js 18+**. Install from [nodejs.org](https://nodejs.org).

```bash
cd "Casino Halal 2.0"
npm install
npm start
```

Open <http://localhost:3000>.

For autoreload during development:

```bash
npm run dev
```

The first run creates `server/data/casino.db`. Delete that file to wipe all accounts.

## What's in it

**Five game rooms**:

| Room | Mechanic | Payouts |
| ---- | -------- | ------- |
| Roulette | European single-zero wheel, color or single number | 2× color, 36× number |
| Blackjack | Hit/stand vs dealer, dealer stands on 17, 4-deck shoe | 3:2 natural, 2× regular win |
| Cups & Balls | Pick one of three cups | 3× correct |
| Slots | 3 reels, single payline, jeweled symbols | up to 100× (3 diamonds) |
| Higher or Lower | Guess next card, streak builds multiplier | up to 50× |

**Account features (v1 parity)**: register, log in, daily-capped deposit, withdraw, change name, change password, delete account, play history.

## Halal model

- **Self-funded only** — your balance starts at zero. Top up from your own pocket once per day.
- **No system winnings** — money you lose simply leaves your simulated balance; no one profits.
- **No real withdrawals** — the "withdraw" button moves play money out of the simulation. It does not send dollars anywhere.
- **Server-authoritative** — every spin, deal, and shuffle is computed on the server using a cryptographically secure RNG. Nothing in the browser can change a result.

The "About" page (in the app) explains this in more detail.

## What's improved from v1

- **No recursion-based menus** — proper event-driven SPA
- **Atomic balance updates** — every game outcome is one DB transaction (was: rewrite JSON file)
- **Bcrypt password hashing** — was SHA-1 unsalted
- **Proper blackjack** — fixed the fall-through bugs that could double-pay or double-charge a hand; ace=1/11 logic actually works
- **HTTP-only session cookies** — was: global `current_user` dict
- **Cryptographic RNG** — `crypto.randomInt` server-side, not `random.randrange`
- **Money in integer cents** — no float rounding bugs
- **Game history** — every bet logged

## Tech

- **Backend**: Node.js + Express 4 + better-sqlite3 + bcryptjs + express-session
- **Frontend**: vanilla HTML/CSS/JS modules, hash-based SPA router, no build step
- **Fonts**: Cormorant Garamond (serif headings) + Inter (body), from Google Fonts

## Project layout in one paragraph

`server/server.js` mounts three routers (`/api/auth`, `/api/account`, `/api/games`) and serves the SPA shell from `public/`. Game outcomes live in `server/games/*.js` (pure functions). The frontend boots `public/js/app.js`, which calls `/api/auth/me`, sets up hash routing, and lazily imports view modules from `js/views/*` (pages) and `js/games/*` (game UIs). Each game UI hits a single `/api/games/<game>` endpoint per round — the server is the source of truth.
