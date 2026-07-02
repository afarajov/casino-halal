import { h } from '../ui.js';
import { state, fmtMoney } from '../state.js';

const GAMES = [
  { id: 'roulette',    glyph: '◉', name: 'Roulette',         desc: 'Pockets of red, black, and the lone green. Color or single number.',  meta: ['35:1 single', '2:1 color'] },
  { id: 'blackjack',   glyph: '♠', name: 'Blackjack',        desc: 'Beat the dealer to twenty-one. Aces count as one or eleven.',         meta: ['3:2 natural', '17 stand'] },
  { id: 'cups',        glyph: '◈', name: 'Cups & Balls',     desc: 'A single ball under three cups. Trust your eye, not your luck.',      meta: ['3x payout'] },
  { id: 'slots',       glyph: '✦', name: 'Slots',            desc: 'Three reels, jeweled symbols. Three diamonds pays the full house.',   meta: ['100x top'] },
  { id: 'higherlower', glyph: '♣', name: 'Higher or Lower',  desc: 'Will the next card be higher or lower? Cash out, or press on.',       meta: ['Streak x50'] },
];

export function render() {
  const user = state.user;
  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, `Welcome, ${user?.name ?? ''}`),
      h('h1', null, 'The Game ', h('em', null, 'Hall')),
      h('p', null, `Your balance: ${fmtMoney(user?.balance_cents)}. Five rooms await — each one fully simulated.`),
    ),
    h('div', { class: 'grid cols-3' },
      ...GAMES.map(g =>
        h('a', { href: `#/games/${g.id}`, class: 'game-card' },
          h('div', { class: 'glyph' }, g.glyph),
          h('h3', null, g.name),
          h('p', null, g.desc),
          h('div', { class: 'meta' },
            ...g.meta.map(m => h('span', { class: 'pill gold' }, m)),
          ),
        )
      ),
    ),
    h('div', { class: 'gold-divider' }, '٭'),
    h('p', { class: 'muted center', style: { fontSize: '.88rem' } },
      'All games run on the server. RNG is cryptographically secure. ',
      h('a', { href: '#/about' }, 'How does the halal rule work?'),
    ),
  );
}
