import { api } from '../api.js';
import { h, sleep, toast } from '../ui.js';
import { setBalanceCents, fmtMoney } from '../state.js';
import { gameHeader, betCard, resultBanner, setBanner } from './_shared.js';

function cardEl(card, { hidden = false } = {}) {
  if (hidden) return h('div', { class: 'card-back card-deal' });
  const red = card.s === '♥' || card.s === '♦';
  return h('div', { class: `card-face card-deal ${red ? 'suit-red' : 'suit-black'}` },
    h('div', { class: 'corner tl' }, h('span', null, card.r), h('span', null, card.s)),
    h('div', { class: 'pip' }, card.s),
    h('div', { class: 'corner br' }, h('span', null, card.r), h('span', null, card.s)),
  );
}

function handValueClient(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.r === 'A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(c.r)) total += 10;
    else total += Number(c.r);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

const RESULT_TEXT = {
  blackjack:   ['Blackjack! Paid 3:2.', 'win'],
  win:         ['You win.', 'win'],
  dealer_bust: ['Dealer busts. You win.', 'win'],
  push:        ['Push. Bet returned.', 'push'],
  lose:        ['Dealer wins.', 'lose'],
  bust:        ['Bust. Dealer wins.', 'lose'],
  dealer_bj:   ['Dealer blackjack.', 'lose'],
};

export function render() {
  const dealerHand = h('div', { class: 'bj-hand' });
  const dealerTotal = h('span', { class: 'bj-total' }, '—');
  const playerHand = h('div', { class: 'bj-hand' });
  const playerTotal = h('span', { class: 'bj-total' }, '—');

  const board = h('div', { class: 'bj-board' },
    h('div', { class: 'bj-row' },
      h('div', { class: 'bj-row-label' }, 'Dealer ', dealerTotal),
      dealerHand,
    ),
    h('div', { class: 'bj-row' },
      h('div', { class: 'bj-row-label' }, 'You ', playerTotal),
      playerHand,
    ),
  );

  const banner = resultBanner('Place a bet to begin.');
  let phase = 'idle'; // idle | playing

  const hitBtn = h('button', { class: 'btn', disabled: true, onclick: hit }, 'Hit');
  const standBtn = h('button', { class: 'btn btn-primary', disabled: true, onclick: stand }, 'Stand');
  const actions = h('div', { class: 'row', style: { gap: '.75rem', marginTop: '1rem' } }, hitBtn, standBtn);

  async function renderDealer(cards, totalKnown) {
    dealerHand.replaceChildren();
    for (const c of cards) {
      dealerHand.append(cardEl(c));
      await sleep(180);
    }
    dealerTotal.textContent = totalKnown != null ? totalKnown : '?';
  }

  async function renderPlayer(cards) {
    playerHand.replaceChildren();
    for (const c of cards) {
      playerHand.append(cardEl(c));
      await sleep(180);
    }
    playerTotal.textContent = handValueClient(cards);
  }

  async function start(amount) {
    bet.setDisabled(true);
    setBanner(banner, 'Dealing...');
    dealerHand.replaceChildren();
    playerHand.replaceChildren();
    dealerTotal.textContent = '—';
    playerTotal.textContent = '—';
    try {
      const r = await api.bjStart(amount);
      setBalanceCents(r.balance_cents);
      bet.setBalance(r.balance_cents);

      if (r.phase === 'finished') {
        // Natural blackjack auto-resolved.
        await renderPlayer(r.player);
        await sleep(200);
        await renderDealer(r.dealer, r.dealer_total);
        const [txt, kind] = RESULT_TEXT[r.result] ?? [r.result, ''];
        setBanner(banner, txt, kind);
        if (r.delta_cents > 0) toast(`+${fmtMoney(r.delta_cents)}`, 'gold');
        setBalanceCents(r.balance_cents);
        bet.setBalance(r.balance_cents);
        bet.setDisabled(false);
        return;
      }

      // Render initial cards
      await renderPlayer(r.player);
      dealerHand.replaceChildren();
      dealerHand.append(cardEl(r.dealer_up[0]));
      await sleep(180);
      dealerHand.append(cardEl({}, { hidden: true }));
      dealerTotal.textContent = '?';
      setBanner(banner, 'Hit or stand.');
      phase = 'playing';
      hitBtn.disabled = false;
      standBtn.disabled = false;
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setError(e.message ?? 'Failed');
      bet.setDisabled(false);
    }
  }

  async function hit() {
    if (phase !== 'playing') return;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    try {
      const r = await api.bjHit();
      if (r.phase === 'playing') {
        await renderPlayer(r.player);
        setBanner(banner, 'Hit or stand.');
        hitBtn.disabled = false;
        standBtn.disabled = false;
        return;
      }
      // phase === 'finished' (bust or 21)
      await finishFromResult(r);
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setDisabled(false);
    }
  }

  async function stand() {
    if (phase !== 'playing') return;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    try {
      const r = await api.bjStand();
      await finishFromResult(r);
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
      bet.setDisabled(false);
    }
  }

  async function finishFromResult(r) {
    await renderPlayer(r.player);
    // Reveal dealer's full hand, one card at a time.
    dealerHand.replaceChildren();
    for (const c of r.dealer) {
      dealerHand.append(cardEl(c));
      await sleep(280);
    }
    dealerTotal.textContent = r.dealer_total;
    const [txt, kind] = RESULT_TEXT[r.result] ?? [r.result, ''];
    setBanner(banner, txt, kind);
    if (r.delta_cents > 0) toast(`+${fmtMoney(r.delta_cents)}`, 'gold');
    setBalanceCents(r.balance_cents);
    bet.setBalance(r.balance_cents);
    phase = 'idle';
    bet.setDisabled(false);
  }

  const bet = betCard({
    helpHtml: 'Standard rules. Dealer stands on <em>17+</em>. Blackjack pays <em>3:2</em>.',
    onBet: (amount) => start(amount),
  });

  // Put hit/stand into bet card sidebar
  bet.node.append(actions);

  return h('div', { class: 'view' },
    gameHeader({ eyebrow: 'Salon II', title: h('span', null, 'Black', h('em', null, 'jack')), tagline: 'Beat the dealer to twenty-one. Aces count as one or eleven, whichever suits you.' }),
    h('div', { class: 'game-stage' },
      h('div', { class: 'game-table' },
        board,
        banner,
      ),
      h('div', { class: 'game-sidebar' },
        bet.node,
        h('div', { class: 'card', style: { fontSize: '.85rem' } },
          h('h4', { style: { marginTop: 0 } }, 'House rules'),
          h('p', { style: { margin: 0 }, class: 'muted' },
            'Dealer hits on soft 17? No — stands on all 17s. 4-deck shoe, reshuffled each round.'),
        ),
      ),
    ),
  );
}
