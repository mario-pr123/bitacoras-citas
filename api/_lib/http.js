export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function getQuery(req) {
  const u = new URL(req.url || '/', 'http://localhost');
  return Object.fromEntries(u.searchParams);
}

// Works both on Vercel (req.body already parsed) and in the Vite dev server (raw stream).
export async function readJson(req, limit = 6 * 1024 * 1024) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  if (typeof b === 'string') return b ? JSON.parse(b) : {};
  if (Buffer.isBuffer(b)) return b.length ? JSON.parse(b.toString('utf8')) : {};
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw httpError(413, 'El archivo es demasiado grande.');
    chunks.push(c);
  }
  const s = Buffer.concat(chunks).toString('utf8');
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    throw httpError(400, 'Solicitud inválida.');
  }
}

export function handleError(res, e) {
  const status = e.status || 500;
  if (status >= 500) console.error(e);
  send(res, status, { error: e.message || 'Error inesperado.' }, { 'Cache-Control': 'no-store' });
}
