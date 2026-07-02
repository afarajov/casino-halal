import { api } from '../api.js';
import { state, setBalanceCents, fmtMoney } from '../state.js';
import { h, toast } from '../ui.js';

export async function render() {
  let limits = { can_deposit_today: true, max_deposit_cents: 1_000_000 };
  try { limits = await api.limits(); } catch {}

  const errEl = h('div', { class: 'err' });
  const amountInput = h('input', { type: 'number', step: '0.01', min: '0.01', required: true, autofocus: true });

  const quickRow = h('div', { class: 'chip-row' },
    ...[100, 250, 500, 1000, 5000].filter(v => v * 100 <= limits.max_deposit_cents).map(v =>
      h('button', { type: 'button', class: 'chip-btn', onclick: () => { amountInput.value = v; } }, `$${v}`)
    ),
  );

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      try {
        const { balance_cents } = await api.deposit(Number(amountInput.value));
        setBalanceCents(balance_cents);
        toast('Deposit complete.', 'gold');
        location.hash = '/profile';
      } catch (e) {
        errEl.textContent = e.message;
      }
    },
  },
    h('div', { class: 'field' },
      h('label', null, 'Amount (USD)'),
      h('div', { class: 'bet-input' },
        h('span', { class: 'dollar' }, '$'),
        amountInput,
      ),
      h('div', { class: 'hint' }, `Today's max: ${fmtMoney(limits.max_deposit_cents)}.`),
    ),
    quickRow,
    h('div', { style: { marginTop: '1.2rem' } }, errEl),
    h('div', { class: 'row', style: { marginTop: '1.2rem' } },
      h('button', {
        class: 'btn btn-primary',
        type: 'submit',
        disabled: !limits.can_deposit_today,
      }, 'Confirm deposit'),
      h('a', { href: '#/profile', class: 'btn btn-ghost' }, 'Cancel'),
    ),
  );

  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'Top up'),
      h('h1', null, 'Deposit'),
      h('p', null, 'Add play money to your balance. One deposit per calendar day.'),
    ),
    h('div', { class: 'card-elevated', style: { maxWidth: '560px' } },
      h('div', { style: { marginBottom: '1.5rem' } },
        h('div', { class: 'eyebrow' }, 'Current balance'),
        h('div', { style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: 'var(--gold)' } },
          fmtMoney(state.user.balance_cents)),
      ),
      limits.can_deposit_today
        ? form
        : h('div', { class: 'empty' },
            h('div', { class: 'glyph' }, '✦'),
            h('h3', null, "Already deposited today"),
            h('p', null, 'Come back tomorrow for your next top-up.'),
            h('a', { href: '#/lobby', class: 'btn' }, 'Back to games'),
          ),
    ),
  );
}
