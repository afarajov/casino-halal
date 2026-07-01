// Tiny event-bus + reactive state for the current user/balance.
const subs = new Set();

export const state = {
  user: null,
};

export function setUser(user) {
  state.user = user;
  emit();
}

export function setBalanceCents(cents) {
  if (!state.user) return;
  state.user = { ...state.user, balance_cents: cents };
  emit();
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

function emit() {
  for (const fn of subs) fn(state);
}

export function fmtMoney(cents) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
