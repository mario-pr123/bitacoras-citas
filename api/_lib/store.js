import { put, list, del } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { seedData } from './seed.js';
import { httpError } from './http.js';

// Almacenamiento:
//  - En Vercel: Vercel Blob (necesita BLOB_READ_WRITE_TOKEN, que Vercel agrega al conectar un Blob store).
//  - En tu computador sin token: carpeta .data/ del proyecto.
const LOCAL_DIR = path.join(process.cwd(), '.data');
const DB_PREFIX = 'db/';
const KEEP_VERSIONS = 15; // copias anteriores de la base de datos que se conservan como respaldo

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export function storageMode() {
  if (hasBlob()) return 'blob';
  return process.env.VERCEL ? 'missing' : 'local';
}

function assertStorage() {
  if (storageMode() === 'missing') {
    throw httpError(500, 'Falta conectar un Blob store al proyecto en Vercel (Storage → Blob).');
  }
}

async function dbVersions() {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: DB_PREFIX, limit: 1000, cursor });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  // El nombre empieza con la fecha en milisegundos: ordenar por nombre = ordenar por fecha.
  return blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

export async function readData() {
  assertStorage();
  if (hasBlob()) {
    const versions = await dbVersions();
    if (!versions.length) return seedData();
    const r = await fetch(versions[0].url, { cache: 'no-store' });
    if (!r.ok) throw httpError(502, 'No se pudo leer la base de datos.');
    return r.json();
  }
  try {
    return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, 'db.json'), 'utf8'));
  } catch {
    return seedData();
  }
}

export async function writeData(data) {
  assertStorage();
  const body = JSON.stringify(data);
  if (hasBlob()) {
    await put(`${DB_PREFIX}${Date.now()}.json`, body, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
    const versions = await dbVersions();
    const old = versions.slice(KEEP_VERSIONS).map((b) => b.url);
    if (old.length) await del(old).catch(() => {});
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, 'db.json'), body);
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function saveImage(buffer, contentType) {
  assertStorage();
  const ext = EXT[contentType];
  if (!ext) throw httpError(415, 'Formato no permitido. Usa JPG, PNG o WebP.');
  const name = `fotos/${Date.now()}-${crypto.randomBytes(5).toString('hex')}.${ext}`;
  if (hasBlob()) {
    const b = await put(name, buffer, { access: 'public', addRandomSuffix: true, contentType });
    return b.url;
  }
  await fs.mkdir(path.join(LOCAL_DIR, 'fotos'), { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, name), buffer);
  return `/api/file?p=${encodeURIComponent(name)}`;
}

const isOwnBlob = (u) => /^https:\/\/[^/]+\.blob\.vercel-storage\.com\/fotos\//.test(u);
const isLocal = (u) => u.startsWith('/api/file?p=');

export async function deleteImages(urls) {
  const blobUrls = urls.filter(isOwnBlob);
  if (hasBlob() && blobUrls.length) await del(blobUrls);
  for (const u of urls.filter(isLocal)) {
    const p = decodeURIComponent(u.slice('/api/file?p='.length));
    if (/^fotos\/[\w.-]+$/.test(p)) await fs.unlink(path.join(LOCAL_DIR, p)).catch(() => {});
  }
}

export async function readLocalImage(p) {
  if (!/^fotos\/[\w.-]+$/.test(p)) throw httpError(404, 'No encontrado.');
  const buf = await fs.readFile(path.join(LOCAL_DIR, p)).catch(() => null);
  if (!buf) throw httpError(404, 'No encontrado.');
  const ext = p.split('.').pop();
  const type = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] || 'application/octet-stream';
  return { buf, type };
}
