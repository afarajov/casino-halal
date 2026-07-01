import { api } from '../api.js';
import { state, setBalanceCents, fmtMoney } from '../state.js';
import { h, toast } from '../ui.js';

export function render() {
  const errEl = h('div', { class: 'err' });
  const amountInput = h('input', { type: 'number', step: '0.01', min: '0.01', required: true, autofocus: true });

  const balanceDollars = (state.user.balance_cents / 100).toFixed(2);

  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'Withdraw'),
      h('h1', null, 'Cash out'),
      h('p', null, "Withdraw from your balance. You can pull up to whatever you have."),
    ),
    h('div', { class: 'card-elevated', style: { maxWidth: '560px' } },
      h('div', { style: { marginBottom: '1.5rem' } },
        h('div', { class: 'eyebrow' }, 'Current balance'),
        h('div', { style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: 'var(--gold)' } },
          fmtMoney(state.user.balance_cents)),
      ),
      h('form', {
        onsubmit: async (e) => {
          e.preventDefault();
          errEl.textContent = '';
          try {
            const { balance_cents } = await api.withdraw(Number(amountInput.value));
            setBalanceCents(balance_cents);
            toast('Withdrawal complete.', 'gold');
            location.hash = '/profile';
          } catch (e) { errEl.textContent = e.message; }
        },
      },
        h('div', { class: 'field' },
          h('label', null, 'Amount (USD)'),
          h('div', { class: 'bet-input' },
            h('span', { class: 'dollar' }, '$'),
            amountInput,
          ),
          h('div', { class: 'hint' }, `Max: ${fmtMoney(state.user.balance_cents)}.`),
        ),
        h('div', { class: 'chip-row' },
          ...[10, 25, 100, 'All'].map(v =>
            h('button', { type: 'button', class: 'chip-btn', onclick: () => {
              amountInput.value = v === 'All' ? balanceDollars : v;
            } }, v === 'All' ? 'All' : `$${v}`)
          ),
        ),
        h('div', { style: { marginTop: '1.2rem' } }, errEl),
        h('div', { class: 'row', style: { marginTop: '1.2rem' } },
          h('button', { class: 'btn btn-primary', type: 'submit', disabled: state.user.balance_cents <= 0 }, 'Confirm withdrawal'),
          h('a', { href: '#/profile', class: 'btn btn-ghost' }, 'Cancel'),
        ),
      ),
    ),
  );
}
