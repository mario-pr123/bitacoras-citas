import { send, readJson, getQuery, handleError, httpError } from './_lib/http.js';
import { isAdmin } from './_lib/auth.js';
import { readData, writeData, deleteImages, storageMode } from './_lib/store.js';
import { sanitizeData, publicView, photoUrls } from './_lib/sanitize.js';

export default async function handler(req, res) {
  try {
    const wantsAdmin = getQuery(req).admin === '1';

    if (req.method === 'GET') {
      const data = await readData();
      if (wantsAdmin) {
        if (!isAdmin(req)) throw httpError(401, 'Inicia sesión para ver el panel.');
        return send(res, 200, { ...data, storage: storageMode() }, { 'Cache-Control': 'no-store' });
      }
      return send(res, 200, publicView(data), {
        'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=60',
      });
    }

    if (req.method === 'PUT') {
      if (!isAdmin(req)) throw httpError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');
      const incoming = sanitizeData(await readJson(req));
      const previous = await readData();
      await writeData(incoming);
      // Borra del almacenamiento las fotos que ya no usa ninguna cita.
      const keep = photoUrls(incoming);
      const removed = [...photoUrls(sanitizeData(previous))].filter((u) => !keep.has(u));
      if (removed.length) await deleteImages(removed).catch((e) => console.error(e));
      return send(res, 200, { ...incoming, storage: storageMode() }, { 'Cache-Control': 'no-store' });
    }

    res.setHeader('Allow', 'GET, PUT');
    throw httpError(405, 'Método no permitido.');
  } catch (e) {
    handleError(res, e);
  }
}
