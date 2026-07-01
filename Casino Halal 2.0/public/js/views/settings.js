import { api } from '../api.js';
import { state, setUser } from '../state.js';
import { h, toast, confirmDanger } from '../ui.js';

export function render() {
  // === Rename ===
  const nameInput = h('input', { type: 'text', value: state.user.name, minlength: '3', maxlength: '20' });
  const nameErr = h('div', { class: 'err' });
  const renameForm = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      nameErr.textContent = '';
      try {
        await api.rename(nameInput.value.trim());
        setUser({ ...state.user, name: nameInput.value.trim() });
        toast('Name updated.', 'gold');
      } catch (e) { nameErr.textContent = e.message; }
    },
  },
    h('div', { class: 'field' },
      h('label', null, 'Name'), nameInput,
      h('div', { class: 'hint' }, '3–20 chars: letters, numbers, underscore.'),
    ),
    nameErr,
    h('button', { class: 'btn btn-primary', type: 'submit' }, 'Save name'),
  );

  // === Change password ===
  const curPw = h('input', { type: 'password', autocomplete: 'current-password' });
  const newPw = h('input', { type: 'password', autocomplete: 'new-password', minlength: '8' });
  const pwErr = h('div', { class: 'err' });
  const pwForm = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      pwErr.textContent = '';
      try {
        await api.changePw(curPw.value, newPw.value);
        curPw.value = ''; newPw.value = '';
        toast('Password changed.', 'gold');
      } catch (e) { pwErr.textContent = e.message; }
    },
  },
    h('div', { class: 'field' }, h('label', null, 'Current password'), curPw),
    h('div', { class: 'field' }, h('label', null, 'New password'), newPw,
      h('div', { class: 'hint' }, 'At least 8 characters.'),
    ),
    pwErr,
    h('button', { class: 'btn btn-primary', type: 'submit' }, 'Change password'),
  );

  // === Delete account ===
  const deleteBtn = h('button', {
    class: 'btn btn-danger',
    onclick: async () => {
      const pwInput = h('input', { type: 'password', class: '', autofocus: true });
      const errEl = h('div', { class: 'err' });
      const ok = await confirmDanger({
        title: 'Delete account permanently?',
        message: h('div', null,
          h('p', null, 'This removes your account, balance, and history. There is no undo.'),
          h('div', { class: 'field' }, h('label', null, 'Enter your password to confirm'), pwInput),
          errEl,
        ),
        confirmLabel: 'Delete forever',
      });
      if (!ok) return;
      try {
        await api.deleteAcc(pwInput.value);
        setUser(null);
        toast('Account deleted.', 'gold');
        location.hash = '/';
      } catch (e) { toast(e.message, 'error'); }
    },
  }, 'Delete account');

  return h('div', { class: 'view' },
    h('div', { class: 'page-header' },
      h('div', { class: 'eyebrow' }, 'Account'),
      h('h1', null, 'Settings'),
      h('p', null, 'Update your name, change your password, or close the account.'),
    ),
    h('div', { class: 'grid cols-2' },
      h('div', { class: 'card-elevated' },
        h('h3', null, 'Name'),
        renameForm,
      ),
      h('div', { class: 'card-elevated' },
        h('h3', null, 'Password'),
        pwForm,
      ),
    ),
    h('div', { class: 'gold-divider' }, '٭'),
    h('div', { class: 'card', style: { borderColor: 'var(--danger-deep)' } },
      h('h3', { style: { color: 'var(--danger)' } }, 'Danger zone'),
      h('p', { class: 'muted' }, 'Deleting your account is permanent.'),
      deleteBtn,
    ),
  );
}
