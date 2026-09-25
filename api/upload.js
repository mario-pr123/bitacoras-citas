import { send, readJson, handleError, httpError } from './_lib/http.js';
import { isAdmin } from './_lib/auth.js';
import { saveImage } from './_lib/store.js';

// Recibe una foto ya comprimida por el navegador (base64) y la guarda.
// Vercel limita cada solicitud a 4.5 MB, por eso el panel reduce las fotos antes de enviarlas.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') throw httpError(405, 'Método no permitido.');
    if (!isAdmin(req)) throw httpError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');
    const { data, type } = await readJson(req, 5 * 1024 * 1024);
    if (typeof data !== 'string' || !data) throw httpError(400, 'No llegó ninguna imagen.');
    const buffer = Buffer.from(data, 'base64');
    if (buffer.length > 4 * 1024 * 1024) throw httpError(413, 'La foto pesa demasiado después de comprimirla.');
    const url = await saveImage(buffer, type);
    send(res, 200, { url }, { 'Cache-Control': 'no-store' });
  } catch (e) {
    handleError(res, e);
  }
}
