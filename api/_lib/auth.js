import crypto from 'node:crypto';

const COOKIE = 'bitacora_admin';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

const isDeployed = () => !!process.env.VERCEL || process.env.NODE_ENV === 'production';

// En local (npm run dev) sin .env.local se usa "bitacora" para que puedas probar.
// En Vercel es obligatorio definir ADMIN_PASSWORD.
export function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return isDeployed() ? null : 'bitacora';
}

function secret() {
  const s = process.env.ADMIN_SECRET || adminPassword();
  if (!s) throw Object.assign(new Error('Falta configurar ADMIN_PASSWORD en Vercel.'), { status: 500 });
  return s;
}

const sign = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function checkPassword(input) {
  const real = adminPassword();
  if (!real) return false;
  const h = (x) => crypto.createHash('sha256').update(String(x ?? '')).digest();
  return crypto.timingSafeEqual(h(input), h(real));
}

export function makeToken() {
  const v = `admin.${Date.now() + MAX_AGE * 1000}`;
  return `${v}.${sign(v)}`;
}

function verifyToken(token) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const value = token.slice(0, i);
  const sig = token.slice(i + 1);
  const exp = Number(value.split('.')[1]);
  if (!exp || exp < Date.now()) return false;
  return safeEqual(sig, sign(value));
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function isAdmin(req) {
  try {
    return verifyToken(parseCookies(req)[COOKIE]);
  } catch {
    return false;
  }
}

export function sessionCookie(token) {
  const secure = isDeployed() ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const passwordConfigured = () => !!adminPassword();
export const usingDevPassword = () => !process.env.ADMIN_PASSWORD && !isDeployed();
