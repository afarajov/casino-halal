import { api } from '../api.js';
import { state, setUser, fmtMoney } from '../state.js';
import { h, toast } from '../ui.js';

export async function render() {
  const user = state.user;
  let limits = { can_deposit_today: true, max_deposit_cents: 1_000_000 };
  try { limits = await api.limits(); } catch {}

  const today = new Date().toISOString().slice(0, 10);
  const memberSince = (user.created_at ?? '').slice(0, 10);

  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'Your Profile'),
      h('h1', null, user.name),
      h('p', null, `Member since ${memberSince}.`),
    ),

    h('div', { class: 'grid cols-3' },
      h('div', { class: 'card card-gold' },
        h('div', { class: 'eyebrow', style: { color: 'var(--muted)' } }, 'Balance'),
        h('div', { style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '2.6rem', color: 'var(--gold)', lineHeight: 1 } },
          fmtMoney(user.balance_cents)),
        h('p', { class: 'muted', style: { marginTop: '.6rem' } },
          'Play money — withdrawable up to what you have, never more than you put in net.'),
      ),
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow', style: { color: 'var(--muted)' } }, 'Today'),
        h('div', { style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--ink)' } },
          limits.can_deposit_today ? 'You can deposit today' : 'Already deposited',
        ),
        h('p', { class: 'muted', style: { marginTop: '.6rem' } },
          limits.can_deposit_today
            ? `Up to ${fmtMoney(limits.max_deposit_cents)}.`
            : 'Next top-up unlocks tomorrow.'),
        h('a', { href: '#/deposit', class: 'btn btn-primary btn-sm', style: { marginTop: '.8rem' } }, 'Deposit'),
      ),
      h('div', { class: 'card' },
        h('div', { class: 'eyebrow', style: { color: 'var(--muted)' } }, 'Last deposit'),
        h('div', { style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--ink)' } },
          user.last_deposit ?? '—',
        ),
        h('p', { class: 'muted', style: { marginTop: '.6rem' } },
          user.last_deposit === today ? 'Counts as today.' : 'Days ago.'),
        h('a', { href: '#/withdraw', class: 'btn btn-sm', style: { marginTop: '.8rem' } }, 'Withdraw'),
      ),
    ),

    h('div', { class: 'gold-divider' }, '٭'),

    h('div', { class: 'grid cols-2' },
      h('a', { href: '#/history', class: 'card', style: { textDecoration: 'none' } },
        h('h3', null, 'Play history'),
        h('p', { class: 'muted' }, 'Every bet, every payout. The receipt of the evening.'),
      ),
      h('a', { href: '#/settings', class: 'card', style: { textDecoration: 'none' } },
        h('h3', null, 'Account settings'),
        h('p', { class: 'muted' }, 'Change your name or password. Or close the account.'),
      ),
    ),

    h('div', { style: { marginTop: '2rem', textAlign: 'center' } },
      h('button', {
        class: 'btn btn-ghost',
        onclick: async () => {
          try {
            await api.logout();
            setUser(null);
            toast('Logged out', 'gold');
            location.hash = '/';
          } catch (e) { toast(e.message, 'error'); }
        },
      }, 'Log out'),
    ),
  );
}
