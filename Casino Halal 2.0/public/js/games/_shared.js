import { h } from '../ui.js';
import { state, fmtMoney } from '../state.js';

export function gameHeader({ eyebrow, title, tagline }) {
  return h('div', { class: 'page-header' },
    h('div', { class: 'eyebrow' }, eyebrow),
    h('h1', null, title),
    tagline ? h('p', null, tagline) : null,
  );
}

export function betCard({ defaultBet = 1, onBet, helpHtml }) {
  const input = h('input', { type: 'number', step: '0.01', min: '0.01', value: defaultBet });
  const balanceEl = h('div', { class: 'balance-display', style: { fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--gold)' } },
    fmtMoney(state.user?.balance_cents));
  const errEl = h('div', { class: 'err' });

  const chips = h('div', { class: 'chip-row', style: { marginTop: '.6rem' } },
    ...[1, 5, 10, 25, 100].map(v =>
      h('button', { type: 'button', class: 'chip-btn', onclick: () => { input.value = v; } }, `$${v}`)
    ),
    h('button', { type: 'button', class: 'chip-btn', onclick: () => {
      input.value = ((state.user?.balance_cents ?? 0) / 100).toFixed(2);
    } }, 'All in'),
  );

  const placeBet = async () => {
    errEl.textContent = '';
    const bet = Number(input.value);
    if (!Number.isFinite(bet) || bet <= 0) {
      errEl.textContent = 'Enter a positive bet.';
      return;
    }
    try {
      await onBet(bet);
    } catch (e) {
      errEl.textContent = e.message ?? 'Failed';
    }
  };

  const button = h('button', { class: 'btn btn-primary btn-block', onclick: placeBet }, 'Place bet');

  const node = h('div', { class: 'card' },
    h('div', { class: 'eyebrow' }, 'Balance'),
    balanceEl,
    h('div', { class: 'divider' }),
    h('div', { class: 'field' },
      h('label', null, 'Bet amount'),
      h('div', { class: 'bet-input' },
        h('span', { class: 'dollar' }, '$'),
        input,
      ),
    ),
    chips,
    helpHtml ? h('p', { class: 'muted', style: { fontSize: '.82rem', marginTop: '1rem' }, html: helpHtml }) : null,
    errEl,
    h('div', { style: { marginTop: '1rem' } }, button),
  );

  function setBalance(cents) {
    balanceEl.textContent = fmtMoney(cents);
  }
  function setDisabled(d) {
    button.disabled = d;
    input.disabled = d;
  }
  function getBet() {
    return Number(input.value);
  }
  function clearError() { errEl.textContent = ''; }
  function setError(msg) { errEl.textContent = msg; }
  return { node, setBalance, setDisabled, getBet, clearError, setError, button };
}

export function resultBanner(text = ' ', kind = '') {
  const el = h('div', { class: `result-banner ${kind}` }, text);
  return el;
}

export function setBanner(el, text, kind = '') {
  el.className = `result-banner ${kind}`;
  el.textContent = text;
  if (kind === 'win') {
    el.classList.add('win-flash');
    el.addEventListener('animationend', () => el.classList.remove('win-flash'), { once: true });
  }
}
