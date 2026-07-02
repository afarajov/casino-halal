import { api } from './api.js';
import { state, setUser, subscribe, fmtMoney } from './state.js';
import { h, setView, toast } from './ui.js';

// === Routes ===
const routes = {
  '/':         () => import('./views/welcome.js').then(m => m.render()),
  '/login':    () => import('./views/login.js').then(m => m.render()),
  '/register': () => import('./views/register.js').then(m => m.render()),
  '/lobby':    () => import('./views/lobby.js').then(m => m.render()),
  '/profile':  () => import('./views/profile.js').then(m => m.render()),
  '/deposit':  () => import('./views/deposit.js').then(m => m.render()),
  '/withdraw': () => import('./views/withdraw.js').then(m => m.render()),
  '/settings': () => import('./views/settings.js').then(m => m.render()),
  '/history':  () => import('./views/history.js').then(m => m.render()),
  '/about':    () => import('./views/about.js').then(m => m.render()),
  '/games/roulette':    () => import('./games/roulette.js').then(m => m.render()),
  '/games/blackjack':   () => import('./games/blackjack.js').then(m => m.render()),
  '/games/cups':        () => import('./games/cups.js').then(m => m.render()),
  '/games/slots':       () => import('./games/slots.js').then(m => m.render()),
  '/games/higherlower': () => import('./games/higherlower.js').then(m => m.render()),
};

const publicRoutes = new Set(['/', '/login', '/register', '/about']);

async function resolveRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const route = routes[hash];

  if (!state.user && !publicRoutes.has(hash)) {
    location.hash = '/login';
    return;
  }
  if (state.user && (hash === '/' || hash === '/login' || hash === '/register')) {
    location.hash = '/lobby';
    return;
  }

  if (!route) {
    setView(h('div', { class: 'view' },
      h('div', { class: 'page-header' },
        h('h1', null, 'Lost in the gallery'),
        h('p', null, "That hall doesn't exist. Try the lobby."),
      ),
      h('a', { href: '#/lobby', class: 'btn btn-primary' }, 'Back to lobby'),
    ));
    return;
  }

  try {
    const node = await route();
    setView(node);
    updateNav();
  } catch (e) {
    console.error(e);
    toast('Failed to load page', 'error');
  }
}

// === Nav rendering ===
function updateNav() {
  const topbar = document.getElementById('topbar');
  const nav = document.getElementById('primary-nav');
  const balanceChip = document.getElementById('balance-chip');
  const balanceValue = document.getElementById('balance-value');

  if (!state.user) {
    topbar.hidden = true;
    return;
  }
  topbar.hidden = false;

  const items = [
    { label: 'Lobby',   href: '#/lobby' },
    { label: 'Profile', href: '#/profile' },
    { label: 'History', href: '#/history' },
    { label: 'About',   href: '#/about' },
  ];
  nav.replaceChildren(...items.map(i => {
    const a = h('a', { href: i.href }, i.label);
    if (window.location.hash === i.href || window.location.hash.replace(/^#/, '') === i.href.replace(/^#/, '')) {
      a.classList.add('active');
    }
    return a;
  }));

  balanceValue.textContent = fmtMoney(state.user.balance_cents);
  balanceChip.style.display = '';
}

// === Bootstrap ===
async function boot() {
  try {
    const { user } = await api.me();
    setUser(user);
  } catch {
    setUser(null);
  }
  subscribe(updateNav);
  window.addEventListener('hashchange', resolveRoute);
  resolveRoute();
}

boot();

// Expose for views to trigger nav refresh after logout etc.
window.__halal = { resolveRoute, updateNav };
