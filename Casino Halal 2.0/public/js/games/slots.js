import { api } from '../api.js';
import { h, sleep, toast } from '../ui.js';
import { setBalanceCents, fmtMoney } from '../state.js';
import { gameHeader, betCard, resultBanner, setBanner } from './_shared.js';

const SYM = {
  diamond:  '◆',
  crescent: '☾',
  star:     '✦',
  gem:      '❖',
  coin:     '◉',
};
const SYM_ORDER = ['diamond', 'crescent', 'star', 'gem', 'coin'];

function reelEl() {
  const strip = h('div', { class: 'reel-strip' });
  return { reel: h('div', { class: 'reel' }, strip), strip };
}

function buildStripFor(finalSym) {
  // Build a strip with random symbols then the final symbol at the bottom of the visible area.
  // We'll animate by translating the strip up by N*100px.
  const strip = h('div', { class: 'reel-strip' });
  const FILLERS = 24;
  for (let i = 0; i < FILLERS; i++) {
    const s = SYM_ORDER[Math.floor(Math.random() * SYM_ORDER.length)];
    strip.append(h('div', { class: 'reel-symbol' }, SYM[s]));
  }
  strip.append(h('div', { class: 'reel-symbol' }, SYM[finalSym]));
  return strip;
}

export function render() {
  const reels = [reelEl(), reelEl(), reelEl()];
  reels.forEach(({ strip }) => strip.append(h('div', { class: 'reel-symbol' }, SYM.coin)));

  const reelRow = h('div', { class: 'slot-reels' }, ...reels.map(r => r.reel));

  const banner = resultBanner('Pull the lever to spin.');

  const cabinet = h('div', { class: 'slot-cabinet' },
    h('div', { class: 'slot-title' }, 'Three of a Kind'),
    reelRow,
  );

  async function spin(amount) {
    bet.setDisabled(true);
    setBanner(banner, 'The reels turn...');
    try {
      const res = await api.slots(amount);
      // Replace each reel's strip with a fresh one ending in the result symbol, then animate.
      const stripHeight = 100;
      const newStrips = res.reels.map(buildStripFor);
      reels.forEach(({ reel }, i) => {
        const newStrip = newStrips[i];
        newStrip.style.transform = 'translateY(0)';
        // Reset transition by detaching+attaching.
        reel.replaceChildren(newStrip);
        // Force reflow before applying transform.
        void newStrip.offsetHeight;
        const symbols = newStrip.children.length;
        const targetY = -(symbols - 1) * stripHeight;
        newStrip.style.transition = `transform ${1.2 + i * 0.3}s cubic-bezier(.15,.7,.1,1)`;
        newStrip.style.transform = `translateY(${targetY}px)`;
      });
      await sleep(2100);

      if (res.won) {
        // Flash winning reels (any matching pair/triple at the bottom)
        reels.forEach(({ reel }) => reel.classList.add('win'));
        setTimeout(() => reels.forEach(({ reel }) => reel.classList.remove('win')), 1000);
        setBanner(banner, `${res.multiplier}× — ${fmtMoney(res.payoutCents)}!`, 'win');
        toast(`+${fmtMoney(res.deltaCents)}`, 'gold');
      } else {
        setBanner(banner, 'No match. Try again.', 'lose');
      }
      setBalanceCents(res.balance_cents);
      bet.setBalance(res.balance_cents);
    } catch (e) {
      setBanner(banner, e.message ?? 'Failed', 'lose');
    } finally {
      bet.setDisabled(false);
    }
  }

  const bet = betCard({
    helpHtml: 'Three matching symbols pay big. Two matching pay <em>2×</em>. Two diamonds pay <em>5×</em>.',
    onBet: (amount) => spin(amount),
  });
  bet.button.textContent = 'Spin';

  const paytable = h('div', { class: 'slot-paytable' },
    h('h4', null, 'Paytable'),
    h('div', { class: 'row' }, h('span', null, `${SYM.diamond} ${SYM.diamond} ${SYM.diamond}`), h('span', { style: { color: 'var(--gold)' } }, '×100')),
    h('div', { class: 'row' }, h('span', null, `${SYM.crescent} ${SYM.crescent} ${SYM.crescent}`), h('span', null, '×40')),
    h('div', { class: 'row' }, h('span', null, `${SYM.star} ${SYM.star} ${SYM.star}`), h('span', null, '×20')),
    h('div', { class: 'row' }, h('span', null, `${SYM.gem} ${SYM.gem} ${SYM.gem}`), h('span', null, '×10')),
    h('div', { class: 'row' }, h('span', null, `${SYM.coin} ${SYM.coin} ${SYM.coin}`), h('span', null, '×5')),
    h('div', { class: 'row' }, h('span', null, `${SYM.diamond} ${SYM.diamond} ·`), h('span', null, '×5')),
    h('div', { class: 'row' }, h('span', null, 'Any pair'), h('span', null, '×2')),
  );

  return h('div', { class: 'view' },
    gameHeader({ eyebrow: 'Salon IV', title: h('span', null, 'Slots'), tagline: 'A single payline. Jewels in threes, crescents in pairs.' }),
    h('div', { class: 'game-stage' },
      h('div', { class: 'game-table' },
        cabinet,
        banner,
      ),
      h('div', { class: 'game-sidebar' },
        bet.node,
        paytable,
      ),
    ),
  );
}
