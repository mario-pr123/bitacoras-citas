async function parse(r) {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.error || `Error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  publicData: () => fetch('/api/data').then(parse),
  adminData: () => fetch('/api/data?admin=1', { cache: 'no-store' }).then(parse),
  save: (data) => fetch('/api/data?admin=1', json('PUT', data)).then(parse),
  session: () => fetch('/api/session', { cache: 'no-store' }).then(parse),
  login: (password) => fetch('/api/session', json('POST', { password })).then(parse),
  logout: () => fetch('/api/session', { method: 'DELETE' }).then(parse),
  upload: (payload) => fetch('/api/upload', json('POST', payload)).then(parse),
};
