import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../lib/DataContext.jsx';
import { SiteHeader, SiteFooter, Label, StatusScreen } from '../components/Chrome.jsx';
import PhotoGrid from '../components/PhotoGrid.jsx';
import Lightbox from '../components/Lightbox.jsx';
import NotFound from './NotFound.jsx';
import { orderedCitas, coverOf, longDate, pad2, bookText, readingMinutes } from '../lib/utils.js';

export default function CitaPage() {
  const { slug } = useParams();
  const { data, loading, error } = useData();
  const [lb, setLb] = useState(null);

  const citas = useMemo(() => (data ? orderedCitas(data.citas) : []), [data]);
  const idx = citas.findIndex((c) => c.slug === slug);
  const cita = citas[idx];

  useEffect(() => {
    if (cita) document.title = `${cita.title} — ${data.settings.siteName}`;
  }, [cita, data]);

  if (!data) return <StatusScreen loading={loading} error={error} />;
  if (!cita) return <NotFound />;

  const s = data.settings;
  const list = data.lists.find((l) => l.id === cita.listId);
  const cover = coverOf(cita);
  const chapters = cita.book?.chapters || [];
  const items = cita.photos.map((p, i) => ({ photo: p, number: i + 1, cita }));
  const newer = citas[idx - 1];
  const older = citas[idx + 1];

  return (
    <div className="site">
      <SiteHeader right={<Link to="/">← Todas las citas</Link>} />

      <section className="cita-hero">
        <p className="label cita-kicker">
          <span>Cita Nº {pad2(cita.number)}</span>
          {list && <Link to={`/?lista=${list.id}#citas`}>Lista: {list.name}</Link>}
          <span>{cita.photos.length} fotografías</span>
          {!cita.published && <span className="draft-tag">Borrador, solo tú la ves</span>}
        </p>
        <h1 className="display cita-h1">{cita.title}</h1>
        <p className="cita-sub">
          {longDate(cita.date)}
          {cita.place && <> — {cita.place}</>}
          {cita.with && <> — con {cita.with}</>}
        </p>
      </section>

      {cita.summary && (
        <section className="section two-col">
          <Label>+Mi perspectiva</Label>
          <div className="perspective">
            {cita.summary.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {chapters.length > 0 && (
        <section className="section">
          <Link to={`/cita/${cita.slug}/libro`} className="book-cta">
            {cover && <img src={cover.url} alt="" className="bw" />}
            <span className="book-cta-text">
              <span className="label">+Modo libro</span>
              <span className="display book-cta-title">Leer la cita como un libro →</span>
              <span className="label mute">
                {cita.book.title || cita.title} — {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'} ·{' '}
                {readingMinutes(bookText(cita))} min de lectura
              </span>
            </span>
          </Link>
        </section>
      )}

      {items.length > 0 && (
        <section className="section">
          <div className="section-head">
            <Label>+Fotografías</Label>
            <p className="label mute">Toca una foto para leer su descripción</p>
          </div>
          <PhotoGrid
            grayscale={s.grayscale}
            items={items.map((it, i) => ({ key: it.photo.id, photo: it.photo, number: it.number, date: cita.date, onClick: () => setLb(i) }))}
          />
        </section>
      )}

      <nav className="cita-pager" aria-label="Otras citas">
        {older ? (
          <Link to={`/cita/${older.slug}`}>
            <span className="label mute">← Anterior</span>
            <span className="display">{older.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link to={`/cita/${newer.slug}`} className="right">
            <span className="label mute">Siguiente →</span>
            <span className="display">{newer.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <SiteFooter />
      {lb !== null && <Lightbox items={items} index={lb} onChange={setLb} onClose={() => setLb(null)} grayscale={s.grayscale} />}
    </div>
  );
}
