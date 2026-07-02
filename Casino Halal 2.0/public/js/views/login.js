import { api } from '../api.js';
import { setUser } from '../state.js';
import { h, toast } from '../ui.js';

export function render() {
  const errEl = h('div', { class: 'err' });
  const nameInput = h('input', { type: 'text', autocomplete: 'username', required: true, autofocus: true });
  const pwInput = h('input', { type: 'password', autocomplete: 'current-password', required: true });

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      try {
        const { user } = await api.login(nameInput.value.trim(), pwInput.value);
        setUser(user);
        toast(`Welcome back, ${user.name}.`, 'gold');
        location.hash = '/lobby';
      } catch (e) {
        errEl.textContent = e.message;
      }
    },
  },
    h('div', { class: 'field' }, h('label', null, 'Name'), nameInput),
    h('div', { class: 'field' }, h('label', null, 'Password'), pwInput),
    errEl,
    h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: { marginTop: '.5rem' } }, 'Sign in'),
  );

  return h('div', { class: 'view auth-shell' },
    h('div', { class: 'card-elevated', style: { maxWidth: '420px', width: '100%' } },
      h('div', { class: 'page-header center', style: { marginBottom: '1.5rem' } },
        h('div', { class: 'eyebrow' }, 'Welcome back'),
        h('h2', { style: { margin: 0 } }, 'Sign in'),
      ),
      form,
      h('p', { class: 'muted center', style: { marginTop: '1.25rem', fontSize: '.88rem' } },
        'No account? ',
        h('a', { href: '#/register' }, 'Create one'),
        ' · ',
        h('a', { href: '#/' }, 'Home'),
      ),
    ),
  );
}
