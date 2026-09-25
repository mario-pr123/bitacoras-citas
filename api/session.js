import { send, readJson, handleError, httpError } from './_lib/http.js';
import {
  isAdmin,
  checkPassword,
  makeToken,
  sessionCookie,
  clearCookie,
  passwordConfigured,
  usingDevPassword,
} from './_lib/auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  try {
    const noStore = { 'Cache-Control': 'no-store' };

    if (req.method === 'GET') {
      return send(
        res,
        200,
        { admin: isAdmin(req), configured: passwordConfigured(), devPassword: usingDevPassword() },
        noStore,
      );
    }

    if (req.method === 'POST') {
      if (!passwordConfigured()) throw httpError(500, 'Falta configurar ADMIN_PASSWORD en Vercel.');
      const { password } = await readJson(req, 10_000);
      if (!checkPassword(password)) {
        await sleep(900); // frena intentos repetidos
        throw httpError(401, 'Contraseña incorrecta.');
      }
      return send(res, 200, { admin: true }, { ...noStore, 'Set-Cookie': sessionCookie(makeToken()) });
    }

    if (req.method === 'DELETE') {
      return send(res, 200, { admin: false }, { ...noStore, 'Set-Cookie': clearCookie() });
    }

    throw httpError(405, 'Método no permitido.');
  } catch (e) {
    handleError(res, e);
  }
}
