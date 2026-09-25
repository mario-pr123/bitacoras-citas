import { getQuery, handleError } from './_lib/http.js';
import { readLocalImage } from './_lib/store.js';

// Solo se usa en tu computador (modo local). En Vercel las fotos se sirven desde Vercel Blob.
export default async function handler(req, res) {
  try {
    const { buf, type } = await readLocalImage(getQuery(req).p || '');
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(buf);
  } catch (e) {
    handleError(res, e);
  }
}
