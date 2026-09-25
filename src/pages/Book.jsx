import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext.jsx';
import { StatusScreen } from '../components/Chrome.jsx';
import BookText from '../components/BookText.jsx';
import NotFound from './NotFound.jsx';
import { coverOf, longDate, readingMinutes, bookText, storageGet, storageSet, pad2 } from '../lib/utils.js';

const THEMES = [
  { id: 'claro', name: 'Claro' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'noche', name: 'Noche' },
];

export default function Book() {
  const { slug, cap } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useData();
  const [prefs, setPrefs] = useState(() => storageGet('bitacora-lectura', { theme: 'claro', size: 20 }));
  const [panel, setPanel] = useState(null); // 'toc' | 'aa' | null
  const [progress, setProgress] = useState(0);

  const cita = data?.citas.find((c) => c.slug === slug);
  const chapters = cita?.book?.chapters || [];
  const n = cap ? Number(cap) : 0;
  const chapter = n >= 1 ? chapters[n - 1] : null;
  const bookTitle = cita?.book?.title || cita?.title || '';
  const savedKey = `bitacora-libro-${slug}`;
  const lastRead = useMemo(() => storageGet(savedKey, 0), [savedKey, n]);

  useEffect(() => storageSet('bitacora-lectura', prefs), [prefs]);
  useEffect(() => {
    if (chapter) storageSet(savedKey, n);
  }, [chapter, n, savedKey]);
  useEffect(() => {
    if (cita) document.title = chapter ? `${chapter.title || `Capítulo ${n}`} — ${bookTitle}` : bookTitle;
  }, [cita, chapter, n, bookTitle]);
  useEffect(() => setPanel(null), [n]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [n, cita]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === 'ArrowRight' && n < chapters.length) navigate(`/cita/${slug}/libro/${n + 1}`);
      if (e.key === 'ArrowLeft' && n > 0) navigate(n === 1 ? `/cita/${slug}/libro` : `/cita/${slug}/libro/${n - 1}`);
      if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n, chapters.length, slug, navigate]);

  if (!data) return <StatusScreen loading={loading} error={error} />;
  if (!cita || !chapters.length || (n > 0 && !chapter)) return <NotFound />;

  const cover = coverOf(cita);
  const g = data.settings.grayscale;
  const author = data.settings.author;
  const chapterHref = (i) => `/cita/${slug}/libro/${i}`;

  return (
    <div className={`book theme-${prefs.theme}`} style={{ '--read-size': `${prefs.size}px` }}>
      <header className="book-bar">
        <Link to={`/cita/${slug}`} className="book-back">
          ← Cita
        </Link>
        <Link to={`/cita/${slug}/libro`} className="book-bar-title">
          {bookTitle}
        </Link>
        <div className="book-bar-actions">
          <button type="button" className="aa" aria-expanded={panel === 'aa'} onClick={() => setPanel(panel === 'aa' ? null : 'aa')} aria-label="Ajustes de lectura">
            Aa
          </button>
          <button type="button" aria-expanded={panel === 'toc'} onClick={() => setPanel(panel === 'toc' ? null : 'toc')}>
            Capítulos
          </button>
        </div>
        <div className="book-progress" style={{ transform: `scaleX(${chapter ? progress : 0})` }} />
      </header>

      {panel === 'aa' && (
        <div className="book-popover" role="dialog" aria-label="Ajustes de lectura">
          <p className="label">Tamaño de letra</p>
          <div className="aa-size">
            <button type="button" onClick={() => setPrefs((p) => ({ ...p, size: Math.max(15, p.size - 1) }))} aria-label="Letra más pequeña">
              A−
            </button>
            <span>{prefs.size}px</span>
            <button type="button" onClick={() => setPrefs((p) => ({ ...p, size: Math.min(28, p.size + 1) }))} aria-label="Letra más grande">
              A+
            </button>
          </div>
          <p className="label">Fondo</p>
          <div className="aa-themes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`swatch swatch-${t.id}`}
                aria-pressed={prefs.theme === t.id}
                onClick={() => setPrefs((p) => ({ ...p, theme: t.id }))}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'toc' && (
        <div className="book-popover toc" role="dialog" aria-label="Capítulos">
          <p className="label">Índice</p>
          <ol>
            {chapters.map((c, i) => (
              <li key={c.id}>
                <Link to={chapterHref(i + 1)} aria-current={n === i + 1 ? 'page' : undefined}>
                  <span className="toc-n">{pad2(i + 1)}</span>
                  <span>{c.title || `Capítulo ${i + 1}`}</span>
                  <span className="toc-min">{readingMinutes(c.body)} min</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!chapter ? (
        <main className="book-cover">
          {cover && (
            <div className="cover-photo">
              <img src={cover.url} alt="" className={g ? 'bw-soft' : ''} />
            </div>
          )}
          <div className="cover-text">
            <p className="label">Una cita contada como libro</p>
            <h1 className="cover-title">{bookTitle}</h1>
            {author && <p className="cover-author">por {author}</p>}
            {cita.book.synopsis && <p className="cover-synopsis">{cita.book.synopsis}</p>}
            <p className="label mute">
              {longDate(cita.date)} · {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'} · {readingMinutes(bookText(cita))} min de lectura
            </p>
            <div className="cover-actions">
              <Link to={chapterHref(1)} className="read-btn">
                Comenzar a leer
              </Link>
              {lastRead > 1 && lastRead <= chapters.length && (
                <Link to={chapterHref(lastRead)} className="read-btn ghost">
                  Seguir en el capítulo {lastRead}
                </Link>
              )}
            </div>
            <ol className="cover-toc">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <Link to={chapterHref(i + 1)}>
                    <span className="toc-n">{pad2(i + 1)}</span>
                    <span>{c.title || `Capítulo ${i + 1}`}</span>
                    <span className="toc-min">{readingMinutes(c.body)} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </main>
      ) : (
        <main className="book-chapter">
          <article>
            <p className="label chapter-kicker">
              Capítulo {n} de {chapters.length}
            </p>
            <h1 className="chapter-title">{chapter.title || `Capítulo ${n}`}</h1>
            <div className="chapter-body">
              <BookText body={chapter.body} photos={cita.photos} grayscale={g} />
            </div>
          </article>
          <nav className="chapter-nav" aria-label="Capítulos">
            {n < chapters.length ? (
              <Link to={chapterHref(n + 1)} className="next-chapter">
                <span className="label">Siguiente capítulo</span>
                <span className="next-title">{chapters[n].title || `Capítulo ${n + 1}`} →</span>
              </Link>
            ) : (
              <div className="the-end">
                <p className="end-mark">Fin</p>
                <Link to={`/cita/${slug}`} className="read-btn">
                  Volver a las fotografías
                </Link>
              </div>
            )}
            <div className="chapter-nav-small">
              <Link to={n === 1 ? `/cita/${slug}/libro` : chapterHref(n - 1)}>← {n === 1 ? 'Portada' : 'Capítulo anterior'}</Link>
              <span className="label mute">
                {n} / {chapters.length}
              </span>
            </div>
          </nav>
        </main>
      )}
    </div>
  );
}
