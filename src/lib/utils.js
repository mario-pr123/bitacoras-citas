export const uid = (p = '') => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function longDate(s) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha';
}

export function dotDate(s) {
  const d = parseDate(s);
  if (!d) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export const shortYear = (s) => (s ? `’${s.slice(2, 4)}` : '');

export const imgLabel = (n) => `IMG_${String(n).padStart(3, '0')}_JPG`;

export const pad2 = (n) => String(n).padStart(2, '0');

export function slugify(s) {
  return (
    String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'cita'
  );
}

export const wordCount = (t) => (String(t || '').match(/[\p{L}\p{N}’'-]+/gu) || []).length;
export const readingMinutes = (t) => Math.max(1, Math.round(wordCount(t) / 220));

export function bookText(cita) {
  return (cita.book?.chapters || []).map((c) => c.body).join('\n\n');
}

export const coverOf = (cita) => cita.photos.find((p) => p.id === cita.coverPhotoId) || cita.photos[0] || null;

// Citas ordenadas de la más reciente a la más antigua, con su número cronológico (la primera cita es Nº 01).
export function orderedCitas(citas) {
  const asc = [...citas].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const num = new Map(asc.map((c, i) => [c.id, i + 1]));
  return [...citas]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((c) => ({ ...c, number: num.get(c.id) }));
}

export function storageGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento disponible */
  }
}
