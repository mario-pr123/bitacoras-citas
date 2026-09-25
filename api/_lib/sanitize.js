const str = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
const id = (v) => str(v, 60).replace(/[^\w-]/g, '') || Math.random().toString(36).slice(2, 10);
const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const num = (v) => (Number.isFinite(v) && v > 0 && v < 100000 ? Math.round(v) : null);

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

const url = (v) => {
  const s = str(v, 1000);
  return /^(https:\/\/|\/api\/file\?p=)/.test(s) ? s : '';
};

// Deja solo los campos esperados y con tamaños razonables.
export function sanitizeData(input) {
  const d = input && typeof input === 'object' ? input : {};
  const s = d.settings || {};
  const lists = (Array.isArray(d.lists) ? d.lists : []).slice(0, 100).map((l) => ({
    id: id(l.id),
    name: str(l.name, 80) || 'Lista sin nombre',
    description: str(l.description, 400),
  }));
  const listIds = new Set(lists.map((l) => l.id));
  const usedSlugs = new Set();

  const citas = (Array.isArray(d.citas) ? d.citas : []).slice(0, 500).map((c) => {
    let slug = slugify(c.slug || c.title);
    let base = slug;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
    usedSlugs.add(slug);
    const photos = (Array.isArray(c.photos) ? c.photos : [])
      .slice(0, 300)
      .map((p) => ({
        id: id(p.id),
        url: url(p.url),
        width: num(p.width),
        height: num(p.height),
        description: str(p.description, 2000),
      }))
      .filter((p) => p.url);
    const book = c.book || {};
    return {
      id: id(c.id),
      ...(c.demo ? { demo: true } : {}),
      slug,
      title: str(c.title, 140) || 'Cita sin título',
      date: date(c.date),
      place: str(c.place, 140),
      with: str(c.with, 100),
      listId: listIds.has(c.listId) ? c.listId : '',
      published: !!c.published,
      coverPhotoId: photos.some((p) => p.id === c.coverPhotoId) ? c.coverPhotoId : photos[0]?.id || '',
      summary: str(c.summary, 6000),
      photos,
      book: {
        title: str(book.title, 140),
        synopsis: str(book.synopsis, 2000),
        chapters: (Array.isArray(book.chapters) ? book.chapters : []).slice(0, 200).map((ch) => ({
          id: id(ch.id),
          title: str(ch.title, 140),
          body: str(ch.body, 120000),
        })),
      },
    };
  });

  return {
    version: 1,
    settings: {
      siteName: str(s.siteName, 60) || 'Bitácora',
      author: str(s.author, 80),
      statement: str(s.statement, 300),
      intro: str(s.intro, 1200),
      grayscale: s.grayscale !== false,
    },
    lists,
    citas,
    updatedAt: new Date().toISOString(),
  };
}

export function publicView(data) {
  return { ...data, citas: data.citas.filter((c) => c.published) };
}

export const photoUrls = (data) => new Set(data.citas.flatMap((c) => c.photos.map((p) => p.url)));
