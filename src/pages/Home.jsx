import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/DataContext.jsx';
import { SiteHeader, SiteFooter, Label, StatusScreen } from '../components/Chrome.jsx';
import PhotoGrid from '../components/PhotoGrid.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { orderedCitas, coverOf, dotDate, pad2, bookText, readingMinutes } from '../lib/utils.js';

export default function Home() {
  const { data, loading, error } = useData();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const [lb, setLb] = useState(null);
  const activeList = params.get('lista') || '';

  useEffect(() => {
    document.title = data?.settings?.siteName || 'Bitácora';
  }, [data]);

  useEffect(() => {
    if (hash && data) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, data]);

  const citas = useMemo(() => (data ? orderedCitas(data.citas) : []), [data]);
  const shown = activeList ? citas.filter((c) => c.listId === activeList) : citas;

  const archive = useMemo(() => {
    const out = [];
    let n = 0;
    for (const c of shown) for (const p of c.photos) out.push({ photo: p, number: ++n, cita: c, showCitaLink: true });
    return out.slice(0, 40);
  }, [shown]);

  if (!data) return <StatusScreen loading={loading} error={error} />;
  const s = data.settings;
  const heroCita = citas.find((c) => coverOf(c));
  const hero = heroCita ? coverOf(heroCita) : null;
  const list = data.lists.find((l) => l.id === activeList);
  const setList = (id) => setParams(id ? { lista: id } : {}, { replace: true });

  return (
    <div className="site">
      <SiteHeader />

      <section className="hero">
        <div className="hero-intro">
          <Label>+Sobre esta bitácora</Label>
          <p>{s.intro}</p>
          <p className="label mute">
            {citas.length} {citas.length === 1 ? 'cita' : 'citas'} — {data.lists.length} listas
          </p>
        </div>
        {hero && (
          <Link to={`/cita/${heroCita.slug}`} className="hero-photo" aria-label={`Abrir ${heroCita.title}`}>
            <img src={hero.url} alt="" className="bw" />
          </Link>
        )}
        <h1 className="hero-statement display">{s.statement}</h1>
      </section>

      <section className="section" id="listas">
        <div className="section-head">
          <Label>+Listas</Label>
          {list?.description && <p className="section-note">{list.description}</p>}
        </div>
        <div className="chips" role="group" aria-label="Filtrar por lista">
          <button type="button" className="chip" aria-pressed={!activeList} onClick={() => setList('')}>
            Todas <sup>{citas.length}</sup>
          </button>
          {data.lists.map((l) => (
            <button key={l.id} type="button" className="chip" aria-pressed={activeList === l.id} onClick={() => setList(l.id)}>
              {l.name} <sup>{citas.filter((c) => c.listId === l.id).length}</sup>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="citas">
        <div className="section-head">
          <Label>+Citas</Label>
          <p className="label mute">{shown.length} en esta lista</p>
        </div>
        {shown.length ? (
          <ol className="cita-index">
            {shown.map((c) => {
              const cover = coverOf(c);
              const chapters = c.book?.chapters?.length || 0;
              return (
                <li key={c.id}>
                  <Link to={`/cita/${c.slug}`} className="cita-row">
                    <span className="cita-num">{pad2(c.number)}</span>
                    <span className="cita-title display">
                      {c.title}
                      {!c.published && <em className="draft-tag">Borrador</em>}
                    </span>
                    <span className="cita-meta">
                      <span>{dotDate(c.date)}</span>
                      <span>{c.place}</span>
                      <span>
                        {c.photos.length} fotos{chapters ? ` · libro, ${readingMinutes(bookText(c))} min` : ''}
                      </span>
                    </span>
                    <span className="cita-thumb">{cover && <img src={cover.url} alt="" loading="lazy" className={s.grayscale ? 'bw' : ''} />}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="empty-note">Todavía no hay citas en esta lista.</p>
        )}
      </section>

      {archive.length > 0 && (
        <section className="section" id="archivo">
          <div className="section-head">
            <Label>+Archivo</Label>
            <p className="label mute">Últimas {archive.length} fotografías</p>
          </div>
          <PhotoGrid
            grayscale={s.grayscale}
            items={archive.map((a, i) => ({ key: `${a.cita.id}-${a.photo.id}`, photo: a.photo, number: a.number, date: a.cita.date, onClick: () => setLb(i) }))}
          />
        </section>
      )}

      <SiteFooter />
      {lb !== null && <Lightbox items={archive} index={lb} onChange={setLb} onClose={() => setLb(null)} grayscale={s.grayscale} />}
    </div>
  );
}
