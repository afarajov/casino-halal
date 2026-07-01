import { api } from '../api.js';
import { h, sleep, toast } from '../ui.js';
import { setBalanceCents, fmtMoney } from '../state.js';
import { gameHeader, betCard, resultBanner, setBanner } from './_shared.js';

function bigCardEl(card) {
  const red = card.s === '♥' || card.s === '♦';
  return h('div', { class: `card-face hilo-card ${red ? 'suit-red' : 'suit-black'} card-deal` },
    h('div', { class: 'corner tl' }, h('span', null, card.r), h('span', null, card.s)),
    h('div', { class: 'pip' }, card.s),
    h('div', { class: 'corner br' }, h('span', null, card.r), h('span', null, card.s)),
  );
}

export function render() {
  const cardSlot = h('div', { style: { minHeight: '232px', display: 'grid', placeItems: 'center' } },
    h('div', { class: 'card-back hilo-card', style: { width: '160px', height: '232px' } }),
  );

  const streakNum = h('div', { class: 'num' }, '0');
  const multBadge = h('div', { class: 'pill gold' }, '×1.00');
  const streakBlock = h('div', { class: 'hilo-streak' },
    streakNum,
    h('div', { class: 'lbl' }, 'streak'),
    h('div', { style: { marginTop: '.4rem' } }, multBadge),
  );

  const higherBtn = h('button', { class: 'btn btn-primary', disabled: true, onclick: () => guess('higher') }, '▲ Higher');
  const lowerBtn  = h('button', { class: 'btn btn-primary', disabled: true, onclick: () => guess('lower') }, '▼ Lower');
  const cashoutBtn = h('button', { class: 'btn btn-emerald btn-block', disabled: true, onclick: cashout }, 'Cash out');

  const actions = h('div', { class: 'hilo-actions' }, lowerBtn, higherBtn);

  const banner = resultBanner('Place a bet to draw the first card.');

  const stage = h('div', { class: 'hilo-stage' },
    streakBlock,
    cardSlot,
    actions,
  );

  let active = false;

  function setControls({ play, cash }) {
    higherBtn.disabled = !play;
    lowerBtn.disabled = !play;
    cashoutBtn.disabled = !cash;
  }

  async function start(amount) {
    bet.setDisabled(true);
    setControls({ play: false, cash: false });
    setBanner(banner, 'Drawing...');
    try {
      const r = await api.hiloStart(amount);
      setBalanceCents(r.balance_cents);
      bet.setBalance(r.balance_cents);
      streakNum.textContent = '0';
      multBadge.textContent = `×${r.multiplier.toFixed(2)}`;
      cardSlot.replaceChildren(bigCardEl(r.current));
      setBanner(banner, 'Higher or lower than this one?');
      active = true;
      setControls({ play: true, cash: false });
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setDisabled(false);
    }
  }

  async function guess(dir) {
    if (!active) return;
    setControls({ play: false, cash: false });
    try {
      const r = await api.hiloGuess(dir);
      // Flip in the new card animation-wise: simple replace with deal animation.
      await sleep(150);
      cardSlot.replaceChildren(bigCardEl(r.next));
      await sleep(280);

      if (r.outcome === 'lose') {
        setBanner(banner, `Wrong. Streak of ${r.streak} lost.`, 'lose');
        active = false;
        setBalanceCents(r.balance_cents);
        bet.setBalance(r.balance_cents);
        bet.setDisabled(false);
        return;
      }
      if (r.outcome === 'tie') {
        setBanner(banner, `Same rank — push. Bet refunded.`, 'push');
        active = false;
        setBalanceCents(r.balance_cents);
        bet.setBalance(r.balance_cents);
        bet.setDisabled(false);
        return;
      }
      // win
      streakNum.textContent = r.streak;
      multBadge.textContent = `×${r.multiplier.toFixed(2)}`;
      setBanner(banner, `Correct! Cash out for ${(r.multiplier).toFixed(2)}× or keep going.`, 'win');
      setControls({ play: true, cash: true });
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setDisabled(false);
    }
  }

  async function cashout() {
    if (!active) return;
    setControls({ play: false, cash: false });
    try {
      const r = await api.hiloCashout();
      setBalanceCents(r.balance_cents);
      bet.setBalance(r.balance_cents);
      setBanner(banner, `Cashed out at ×${r.multiplier.toFixed(2)} — ${fmtMoney(r.credit_cents)}!`, 'win');
      toast(`+${fmtMoney(r.credit_cents)}`, 'gold');
      active = false;
      bet.setDisabled(false);
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setDisabled(false);
    }
  }

  const bet = betCard({
    helpHtml: 'Each correct guess builds your multiplier. Ties refund your bet. Cash out any time.',
    onBet: (amount) => start(amount),
  });
  bet.button.textContent = 'Draw card';
  bet.node.append(cashoutBtn);

  return h('div', { class: 'view' },
    gameHeader({ eyebrow: 'Salon V', title: h('span', null, 'Higher or ', h('em', null, 'Lower')), tagline: 'A simple question, asked again and again, until you bow out or get it wrong.' }),
    h('div', { class: 'game-stage' },
      h('div', { class: 'game-table' },
        stage,
        banner,
      ),
      h('div', { class: 'game-sidebar' },
        bet.node,
        h('div', { class: 'card', style: { fontSize: '.85rem' } },
          h('h4', { style: { marginTop: 0 } }, 'Multipliers'),
          h('p', { class: 'muted', style: { margin: 0 } },
            '1: 1.5× · 2: 2.25× · 3: 3.5× · 4: 5× · 5: 8× · 6: 12× · 7: 20× · 8: 32× · 9+: 50×'),
        ),
      ),
    ),
  );
}
