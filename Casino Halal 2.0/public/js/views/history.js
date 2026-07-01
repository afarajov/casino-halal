import { api } from '../api.js';
import { fmtMoney } from '../state.js';
import { h } from '../ui.js';

const GAME_LABEL = {
  roulette: 'Roulette',
  blackjack: 'Blackjack',
  cups: 'Cups & Balls',
  slots: 'Slots',
  hilo: 'Higher or Lower',
};

function detailSummary(game, detailRaw) {
  if (!detailRaw) return '—';
  try {
    const d = JSON.parse(detailRaw);
    if (game === 'roulette') return `${d.betType === 'color' ? d.pick : '#' + d.pick} → ${d.winning} ${d.color}`;
    if (game === 'cups') return `Picked ${d.pick}, ball was ${d.ball}`;
    if (game === 'slots') return `${(d.reels ?? []).join(' · ')} ${d.multiplier ? `×${d.multiplier}` : ''}`;
    if (game === 'blackjack') return d.phase === 'start' ? 'Bet placed' : (d.result ?? '');
    if (game === 'hilo') return d.phase === 'start' ? 'Bet placed' : (d.phase === 'cashout' ? `Cashed ×${d.multiplier}` : (d.phase === 'push' ? 'Push' : ''));
  } catch {}
  return '—';
}

export async function render() {
  let rows = [];
  try { ({ history: rows } = await api.history()); } catch {}

  const body = rows.length === 0
    ? h('div', { class: 'empty' },
        h('div', { class: 'glyph' }, '◈'),
        h('h3', null, 'No plays yet'),
        h('p', null, 'Visit the lobby to make your first move.'),
        h('a', { href: '#/lobby', class: 'btn btn-primary' }, 'Open the lobby'),
      )
    : h('table', { class: 'table' },
        h('thead', null, h('tr', null,
          h('th', null, 'When'),
          h('th', null, 'Game'),
          h('th', null, 'Bet'),
          h('th', null, 'Change'),
          h('th', null, 'Detail'),
        )),
        h('tbody', null,
          ...rows.map(r => {
            const when = (r.played_at ?? '').replace('T', ' ').slice(0, 16);
            const cls = r.delta_cents > 0 ? 'gold' : r.delta_cents < 0 ? 'muted' : '';
            return h('tr', null,
              h('td', null, when),
              h('td', null, GAME_LABEL[r.game] ?? r.game),
              h('td', null, fmtMoney(r.bet_cents)),
              h('td', { style: { color: r.delta_cents > 0 ? 'var(--gold)' : r.delta_cents < 0 ? 'var(--danger)' : 'var(--muted)' } },
                (r.delta_cents > 0 ? '+' : '') + fmtMoney(r.delta_cents)),
              h('td', { style: { color: 'var(--muted)' } }, detailSummary(r.game, r.detail)),
            );
          }),
        ),
      );

  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'History'),
      h('h1', null, 'Your ', h('em', null, 'plays')),
      h('p', null, 'The last 100 rounds, freshest first.'),
    ),
    body,
  );
}
