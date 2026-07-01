import { h } from '../ui.js';

export function render() {
  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'Why "Halal"'),
      h('h1', null, 'The ', h('em', null, 'spirit'), ' of the room'),
      h('p', null, 'A short note on what makes this casino different from the real ones.'),
    ),

    h('div', { class: 'grid cols-2' },
      h('div', { class: 'card-elevated' },
        h('h3', null, 'Self-funded only'),
        h('p', null,
          "Your balance starts at zero. You add play money from your own pocket — there's no welcome bonus, " +
          "no comp coins, no advertised jackpots. You can only ever cash out what you put in, minus what you lost in play."),
        h('p', { class: 'muted' },
          'A daily deposit cap keeps things gentle. When you have less than ten in the bank, ' +
          "you can top up to ten thousand a day. After that, you can match what you have — but only once per day."),
      ),
      h('div', { class: 'card-elevated' },
        h('h3', null, 'No house against you'),
        h('p', null,
          "The mechanics are pure casino — odds favor the house, payouts are real ratios — " +
          "but the house doesn't keep anything. Money you lose is money that simply leaves your simulated balance. " +
          "No one is enriched by your losses."),
        h('p', { class: 'muted' },
          'Think of it as a single-player practice room. You can learn the rhythm of blackjack, ' +
          'see how often green hits in roulette, without ever risking real harm.'),
      ),
      h('div', { class: 'card-elevated' },
        h('h3', null, 'Server-authoritative'),
        h('p', null,
          'Every spin, deal, and shuffle happens on the server using a cryptographically secure RNG. ' +
          'Outcomes are computed before they reach your screen — animations only reveal what already happened. ' +
          'Nothing you do in the browser can change a result.'),
      ),
      h('div', { class: 'card-elevated' },
        h('h3', null, 'You decide'),
        h('p', null,
          "We don't argue theology. Different traditions read the boundaries of qimar (gambling) differently. " +
          "This project takes the most generous reading: if no real wealth changes hands and no one's harmed, " +
          "the games are theatre, not gambling. If your conscience says otherwise, that's the right answer for you."),
      ),
    ),

    h('div', { class: 'gold-divider' }, '٭'),
    h('p', { class: 'muted center', style: { fontSize: '.88rem' } },
      'Casino Halal v2 · A learner project, kept honest.'
    ),
  );
}
