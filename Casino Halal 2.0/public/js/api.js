async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  me:        ()              => request('GET',  '/api/auth/me'),
  register:  (name, password) => request('POST', '/api/auth/register', { name, password }),
  login:     (name, password) => request('POST', '/api/auth/login', { name, password }),
  logout:    ()              => request('POST', '/api/auth/logout'),

  // account
  deposit:   (amount)   => request('POST', '/api/account/deposit', { amount }),
  withdraw:  (amount)   => request('POST', '/api/account/withdraw', { amount }),
  rename:    (name)     => request('POST', '/api/account/rename', { name }),
  changePw:  (cur, nxt) => request('POST', '/api/account/change-password', { current: cur, next: nxt }),
  deleteAcc: (password) => request('POST', '/api/account/delete', { password }),
  history:   ()         => request('GET',  '/api/account/history'),
  limits:    ()         => request('GET',  '/api/account/limits'),

  // games
  roulette:   (bet, betType, pick) => request('POST', '/api/games/roulette', { bet, betType, pick }),
  cups:       (bet, pick)          => request('POST', '/api/games/cups', { bet, pick }),
  slots:      (bet)                => request('POST', '/api/games/slots', { bet }),
  bjStart:    (bet)                => request('POST', '/api/games/blackjack/start', { bet }),
  bjHit:      ()                   => request('POST', '/api/games/blackjack/hit'),
  bjStand:    ()                   => request('POST', '/api/games/blackjack/stand'),
  hiloStart:  (bet)                => request('POST', '/api/games/hilo/start', { bet }),
  hiloGuess:  (guess)              => request('POST', '/api/games/hilo/guess', { guess }),
  hiloCashout: ()                  => request('POST', '/api/games/hilo/cashout'),
};
