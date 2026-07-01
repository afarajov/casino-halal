import { api } from '../api.js';
import { h, sleep, toast } from '../ui.js';
import { setBalanceCents, fmtMoney } from '../state.js';
import { gameHeader, betCard, resultBanner, setBanner } from './_shared.js';

function makeCup(label, onClick) {
  const ball = h('div', { class: 'cup-ball' });
  const body = h('div', { class: 'cup-body' });
  const base = h('div', { class: 'cup-base' });
  const cap = h('div', { class: 'cup-label' }, label);
  const cup = h('div', { class: 'cup', onclick: () => onClick(cup) }, cap, ball, body, base);
  cup.dataset.label = label;
  return cup;
}

export function render() {
  const banner = resultBanner('Choose a cup to begin.');
  let phase = 'pick'; // pick | revealing
  let currentBet = null;
  let chosenIndex = null;

  const stage = h('div', { class: 'cups-stage' });
  const labels = ['I', 'II', 'III'];
  const cups = labels.map((lbl, i) => makeCup(lbl, async (cup) => {
    if (phase !== 'pick') return;
    if (currentBet === null) {
      setBanner(banner, 'Set a bet first, then place it.', 'lose');
      return;
    }
    chosenIndex = i;
    cups.forEach(c => c.style.outline = c === cup ? '2px solid var(--gold)' : '');
    setBanner(banner, `Picked ${lbl}. Press "Reveal".`);
  }));
  stage.append(...cups);

  async function shuffleVisual() {
    cups.forEach((c, i) => c.classList.add(`shuffling-${i + 1}`));
    await sleep(1700);
    cups.forEach((c, i) => c.classList.remove(`shuffling-${i + 1}`));
  }

  async function reveal() {
    if (currentBet === null) {
      setBanner(banner, 'Place a bet first.', 'lose');
      return;
    }
    if (chosenIndex === null) {
      setBanner(banner, 'Pick a cup first.', 'lose');
      return;
    }
    phase = 'revealing';
    bet.setDisabled(true);
    revealBtn.disabled = true;

    setBanner(banner, 'Shuffling...');
    await shuffleVisual();

    try {
      const res = await api.cups(currentBet, chosenIndex + 1);
      const winIdx = res.ball - 1;
      cups[winIdx].classList.add('has-ball');
      // Lift chosen first.
      cups[chosenIndex].classList.add('lifted');
      await sleep(700);
      if (winIdx !== chosenIndex) {
        cups[winIdx].classList.add('lifted');
        await sleep(500);
      }
      if (res.won) {
        setBanner(banner, `The ball was under ${labels[winIdx]} — you won ${fmtMoney(res.payoutCents)}!`, 'win');
        toast(`+${fmtMoney(res.deltaCents)}`, 'gold');
      } else {
        setBanner(banner, `The ball was under ${labels[winIdx]} — better luck next round.`, 'lose');
      }
      setBalanceCents(res.balance_cents);
      bet.setBalance(res.balance_cents);
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
    } finally {
      await sleep(1400);
      // reset
      cups.forEach(c => { c.classList.remove('lifted', 'has-ball'); c.style.outline = ''; });
      chosenIndex = null;
      currentBet = null;
      phase = 'pick';
      bet.setDisabled(false);
      revealBtn.disabled = false;
    }
  }

  const revealBtn = h('button', { class: 'btn btn-primary btn-block', onclick: reveal, style: { marginTop: '.5rem' } }, 'Reveal');

  const bet = betCard({
    helpHtml: 'Pick a cup, the ball is under one of them. Correct guess pays <em>3×</em>.',
    onBet: async (amount) => {
      currentBet = amount;
      setBanner(banner, `Bet ${fmtMoney(amount * 100)} placed. Choose a cup, then "Reveal".`);
    },
  });
  bet.button.textContent = 'Place bet';
  bet.node.append(revealBtn);

  return h('div', { class: 'view' },
    gameHeader({ eyebrow: 'Salon III', title: h('span', null, 'Cups ', h('em', null, '& Balls')), tagline: 'A single ball, three cups. Trust your eye, not your luck.' }),
    h('div', { class: 'game-stage' },
      h('div', { class: 'game-table' },
        stage,
        banner,
      ),
      h('div', { class: 'game-sidebar' },
        bet.node,
        h('div', { class: 'card', style: { fontSize: '.85rem' } },
          h('h4', { style: { marginTop: 0 } }, 'Note'),
          h('p', { style: { margin: 0 }, class: 'muted' },
            'The ball goes under a random cup each round — the shuffle is theatre. ' +
            "Server picks the position before the cups move."),
        ),
      ),
    ),
  );
}
