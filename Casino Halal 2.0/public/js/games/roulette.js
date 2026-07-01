import { api } from '../api.js';
import { h, sleep, toast } from '../ui.js';
import { setBalanceCents, fmtMoney, state } from '../state.js';
import { gameHeader, betCard, resultBanner, setBanner } from './_shared.js';

// European wheel order (clockwise from 0).
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function colorOf(n) {
  if (n === 0) return 'green';
  return RED.has(n) ? 'red' : 'black';
}

function buildWheel() {
  const wheel = h('div', { class: 'roulette-wheel' });

  // Conic background of segments (red/black/green stripes in wheel order).
  const segAngle = 360 / 37;
  const stops = WHEEL_ORDER.map((n, i) => {
    const c = colorOf(n);
    const fill = c === 'green' ? '#1f7a5a' : (c === 'red' ? '#5a1f1d' : '#13161e');
    const start = (i * segAngle).toFixed(3);
    const end = ((i + 1) * segAngle).toFixed(3);
    return `${fill} ${start}deg ${end}deg`;
  }).join(', ');

  wheel.style.background = `
    radial-gradient(circle at center, var(--surface-2) 0 28%, transparent 28%),
    conic-gradient(${stops})
  `;

  // Number labels
  const labelsLayer = h('div', { class: 'pocket-labels', style: { position: 'absolute', inset: 0 } });
  WHEEL_ORDER.forEach((n, i) => {
    const angle = i * segAngle + segAngle / 2;
    const span = h('span', { style: {
      position: 'absolute',
      top: '50%', left: '50%',
      transform: `rotate(${angle}deg) translateY(calc(var(--size) / -2 + 14px)) rotate(${-angle}deg)`,
      transformOrigin: 'center',
      fontFamily: 'Inter, sans-serif',
      fontSize: '.62rem',
      fontWeight: 700,
      color: '#f0e6c8',
    } }, String(n));
    labelsLayer.append(span);
  });
  wheel.append(labelsLayer);

  // Center hub
  wheel.append(h('div', { class: 'roulette-hub' }, '٭'));
  return wheel;
}

function angleForNumber(n) {
  const segAngle = 360 / 37;
  const idx = WHEEL_ORDER.indexOf(n);
  // Center of the segment.
  return idx * segAngle + segAngle / 2;
}

export function render() {
  const wheel = buildWheel();
  const wheelWrap = h('div', { class: 'roulette-wrap' },
    h('div', { style: { position: 'relative' } },
      h('div', { class: 'roulette-pointer' }),
      h('div', { class: 'roulette-rim' }),
      wheel,
    ),
  );

  const banner = resultBanner('Place a bet, then choose color or number.');

  // === Bet board ===
  let selectedKind = 'color';
  let selectedPick = null;

  const colorBtns = ['red', 'green', 'black'].map(c =>
    h('button', { class: `color-btn ${c}`, dataset: { c },
      onclick: (e) => {
        selectedKind = 'color';
        selectedPick = c;
        colorBtns.forEach(b => b.classList.toggle('selected', b.dataset.c === c));
        numberBtns.forEach(b => b.classList.remove('selected'));
        setBanner(banner, `Selected: ${c.toUpperCase()} (${c === 'green' ? '36x' : '2x'})`);
      },
    }, c.toUpperCase()),
  );

  const numberBtns = [];
  // Add 0 as full-width row
  const zero = h('button', { class: 'num-btn green', dataset: { n: '0' }, onclick: () => pickN(0) }, '0');
  numberBtns.push(zero);
  for (let n = 1; n <= 36; n++) {
    const c = colorOf(n);
    const btn = h('button', { class: `num-btn ${c}`, dataset: { n: String(n) }, onclick: () => pickN(n) }, String(n));
    numberBtns.push(btn);
  }

  function pickN(n) {
    selectedKind = 'number';
    selectedPick = n;
    numberBtns.forEach(b => b.classList.toggle('selected', Number(b.dataset.n) === n));
    colorBtns.forEach(b => b.classList.remove('selected'));
    setBanner(banner, `Selected: #${n} (36x)`);
  }

  const numberGrid = h('div', { class: 'number-grid' }, ...numberBtns);
  const colorGrid = h('div', { class: 'color-bets' }, ...colorBtns);

  let currentRotation = 0;

  const bet = betCard({
    helpHtml: 'Color pays <em style="color:var(--gold)">2×</em> (red/black) or <em style="color:var(--gold)">36×</em> (green). Single number pays <em style="color:var(--gold)">36×</em>.',
    onBet: async (amount) => {
      if (selectedPick === null) {
        throw new Error('Pick a color or number first.');
      }
      bet.setDisabled(true);
      setBanner(banner, 'The wheel turns...');
      try {
        const res = await api.roulette(amount, selectedKind, selectedPick);
        const targetAngle = angleForNumber(res.winning);
        // Pointer is at top (0deg). Rotate wheel so target angle ends up at top.
        // We want the wheel to rotate by some amount so that the segment at target ends at angle 0.
        // Wheel rotation r means a label at original angle a appears at a + r.
        // We want a + r ≡ 360 (mod 360), so r ≡ -a (mod 360).
        const fullSpins = 5 * 360;
        const targetRot = fullSpins - targetAngle;
        // Make sure we always spin forward (increase rotation).
        const next = currentRotation + (((targetRot - currentRotation) % 360 + 360) % 360) + fullSpins;
        currentRotation = next;
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        await sleep(4600);

        if (res.won) {
          setBanner(banner, `${res.winning} ${res.color.toUpperCase()} — you won ${fmtMoney(res.payoutCents)}!`, 'win');
          toast(`+${fmtMoney(res.deltaCents)}`, 'gold');
        } else {
          setBanner(banner, `${res.winning} ${res.color.toUpperCase()} — bet lost.`, 'lose');
        }
        setBalanceCents(res.balance_cents);
        bet.setBalance(res.balance_cents);
      } catch (e) {
        setBanner(banner, e.message ?? 'Failed', 'lose');
        bet.setError(e.message ?? 'Failed');
      } finally {
        bet.setDisabled(false);
      }
    },
  });

  return h('div', { class: 'view' },
    gameHeader({ eyebrow: 'Salon I', title: h('span', null, 'Roulette ', h('em', null, 'Européenne')), tagline: 'Thirty-six numbers and the lone green zero. Pick your color or pick your number.' }),
    h('div', { class: 'game-stage' },
      h('div', { class: 'game-table' },
        wheelWrap,
        h('div', { class: 'bet-board' },
          h('div', { class: 'gold-divider' }, 'Choose your bet'),
          colorGrid,
          h('div', { style: { height: '8px' } }),
          numberGrid,
        ),
        banner,
      ),
      h('div', { class: 'game-sidebar' },
        bet.node,
        h('div', { class: 'card', style: { fontSize: '.85rem' } },
          h('h4', { style: { marginTop: 0 } }, 'House note'),
          h('p', { style: { margin: 0 }, class: 'muted' },
            'European single-zero wheel. House edge ≈ 2.7%. Outcomes computed server-side using crypto RNG.'),
        ),
      ),
    ),
  );
}
