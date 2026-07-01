import { api } from '../api.js';
import { setUser } from '../state.js';
import { h, toast } from '../ui.js';

export function render() {
  const errEl = h('div', { class: 'err' });
  const nameInput = h('input', { type: 'text', autocomplete: 'username', minlength: '3', maxlength: '20', required: true, autofocus: true });
  const pwInput = h('input', { type: 'password', autocomplete: 'new-password', minlength: '8', required: true });
  const pw2Input = h('input', { type: 'password', autocomplete: 'new-password', minlength: '8', required: true });

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      if (pwInput.value !== pw2Input.value) {
        errEl.textContent = "Passwords don't match.";
        return;
      }
      try {
        const { user } = await api.register(nameInput.value.trim(), pwInput.value);
        setUser(user);
        toast(`Welcome, ${user.name}. Visit Profile to make your first deposit.`, 'gold');
        location.hash = '/lobby';
      } catch (e) {
        errEl.textContent = e.message;
      }
    },
  },
    h('div', { class: 'field' },
      h('label', null, 'Name'),
      nameInput,
      h('div', { class: 'hint' }, '3–20 chars: letters, numbers, underscore.'),
    ),
    h('div', { class: 'field' },
      h('label', null, 'Password'),
      pwInput,
      h('div', { class: 'hint' }, 'At least 8 characters.'),
    ),
    h('div', { class: 'field' },
      h('label', null, 'Confirm Password'),
      pw2Input,
    ),
    errEl,
    h('button', { class: 'btn btn-primary btn-block', type: 'submit', style: { marginTop: '.5rem' } }, 'Create account'),
  );

  return h('div', { class: 'view auth-shell' },
    h('div', { class: 'card-elevated', style: { maxWidth: '440px', width: '100%' } },
      h('div', { class: 'page-header center', style: { marginBottom: '1.5rem' } },
        h('div', { class: 'eyebrow' }, 'New here'),
        h('h2', { style: { margin: 0 } }, 'Create account'),
      ),
      form,
      h('p', { class: 'muted center', style: { marginTop: '1.25rem', fontSize: '.88rem' } },
        'Already have one? ',
        h('a', { href: '#/login' }, 'Sign in'),
      ),
    ),
  );
}
