// Tiny DOM helper.
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'dataset') {
        Object.assign(el.dataset, v);
      } else {
        el.setAttribute(k, v);
      }
    }
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// === Toasts ===
const toastStack = () => document.getElementById('toast-stack');

export function toast(msg, kind = '') {
  const t = h('div', { class: `toast ${kind}` }, msg);
  toastStack().append(t);
  setTimeout(() => {
    t.classList.add('leaving');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, 3200);
}

// === Modals ===
export function modal({ title, body, confirmLabel = 'Confirm', confirmKind = 'btn-primary', cancelLabel = 'Cancel', onConfirm }) {
  return new Promise(resolve => {
    const root = document.getElementById('modal-root');
    const close = (val) => {
      backdrop.remove();
      resolve(val);
    };
    const confirmBtn = h('button', {
      class: `btn ${confirmKind}`,
      onclick: async () => {
        if (onConfirm) {
          try { await onConfirm(); } catch (e) { toast(e.message ?? 'Failed', 'error'); return; }
        }
        close(true);
      },
    }, confirmLabel);

    const backdrop = h('div', {
      class: 'modal-backdrop',
      onclick: (e) => { if (e.target === backdrop) close(false); },
    },
      h('div', { class: 'modal' },
        title ? h('h3', null, title) : null,
        body,
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn btn-ghost', onclick: () => close(false) }, cancelLabel),
          confirmBtn,
        ),
      ),
    );
    root.append(backdrop);
  });
}

export function confirmDanger({ title, message, confirmLabel = 'Yes, do it' }) {
  return modal({
    title,
    body: h('p', { class: 'muted' }, message),
    confirmLabel,
    confirmKind: 'btn-danger',
  });
}

export function setView(node) {
  const view = document.getElementById('view');
  view.replaceChildren(node);
  view.classList.remove('view-fade-in');
  // Reflow to restart animation.
  void view.offsetWidth;
  view.classList.add('view-fade-in');
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
