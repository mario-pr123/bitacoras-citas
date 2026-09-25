import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { uid, imgLabel, wordCount, readingMinutes, bookText } from '../lib/utils.js';
import { prepareImage } from './imageTools.js';

export default function CitaEditor({ cita, lists, tab, setTab, update, takenSlugs, onDelete, slugify }) {
  const chapters = cita.book?.chapters || [];
  return (
    <div className="a-editor">
      <div className="a-editor-head">
        <div>
          <p className="label">{cita.published ? 'Publicada' : 'Borrador'}</p>
          <h1 className="display">{cita.title || 'Sin título'}</h1>
        </div>
        <a className="a-btn ghost" href={`/cita/${cita.slug}`} target="_blank" rel="noreferrer">
          Ver cita ↗
        </a>
      </div>
      <div className="a-tabs" role="tablist">
        {[
          ['datos', 'Datos'],
          ['fotos', `Fotografías · ${cita.photos.length}`],
          ['libro', `Modo libro · ${chapters.length} cap.`],
        ].map(([id, name]) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}>
            {name}
          </button>
        ))}
      </div>
      {tab === 'datos' && <DatosTab cita={cita} lists={lists} update={update} takenSlugs={takenSlugs} onDelete={onDelete} slugify={slugify} />}
      {tab === 'fotos' && <FotosTab cita={cita} update={update} />}
      {tab === 'libro' && <LibroTab cita={cita} update={update} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Datos */
function DatosTab({ cita, lists, update, takenSlugs, onDelete, slugify }) {
  const [confirm, setConfirm] = useState(false);
  const slugTaken = takenSlugs.includes(cita.slug);
  const set = (k) => (e) => {
    const v = e.target.value;
    update((c) => {
      if (k === 'title' && c.slug === slugify(c.title)) c.slug = slugify(v);
      c[k] = v;
    });
  };
  const cover = cita.photos.find((p) => p.id === cita.coverPhotoId) || cita.photos[0];

  return (
    <div className="a-panel">
      <div className="a-grid">
        <Field label="Título" id="f-title" wide>
          <input id="f-title" value={cita.title} onChange={set('title')} maxLength={140} />
        </Field>
        <Field label="Dirección de la página" id="f-slug" hint={slugTaken ? 'Otra cita ya usa esta dirección; se le agregará un número al guardar.' : `/cita/${cita.slug}`}>
          <input id="f-slug" value={cita.slug} onChange={(e) => update((c) => (c.slug = slugify(e.target.value)))} />
        </Field>
        <Field label="Fecha" id="f-date">
          <input id="f-date" type="date" value={cita.date} onChange={set('date')} />
        </Field>
        <Field label="Lugar" id="f-place">
          <input id="f-place" value={cita.place} onChange={set('place')} placeholder="Parque de la 93, Bogotá" />
        </Field>
        <Field label="Con quién" id="f-with">
          <input id="f-with" value={cita.with} onChange={set('with')} placeholder="Nombre o apodo" />
        </Field>
        <Field label="Lista" id="f-list">
          <select id="f-list" value={cita.listId} onChange={set('listId')}>
            <option value="">Sin lista</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" id="f-pub">
          <label className="a-switch">
            <input id="f-pub" type="checkbox" checked={cita.published} onChange={(e) => update((c) => (c.published = e.target.checked))} />
            <span>{cita.published ? 'Publicada: todos la pueden ver' : 'Borrador: solo tú la ves'}</span>
          </label>
        </Field>
        <Field label="Mi perspectiva del día" id="f-sum" wide hint="Se muestra en la página de la cita. Deja una línea en blanco entre párrafos.">
          <textarea id="f-sum" rows={9} value={cita.summary} onChange={set('summary')} placeholder="Cómo viví esta cita, qué pensé, qué sentí…" />
        </Field>
      </div>

      <div className="a-cover-row">
        <div className="a-cover-thumb">{cover ? <img src={cover.preview || cover.url} alt="" /> : <span>Sin fotos</span>}</div>
        <div>
          <p className="a-label">Portada</p>
          <p className="a-hint">Se elige en la pestaña Fotografías con «Usar como portada». Es la foto que aparece en la lista de citas y en el libro.</p>
        </div>
      </div>

      <div className="a-danger">
        {!confirm ? (
          <button type="button" className="a-btn danger-ghost" onClick={() => setConfirm(true)}>
            Eliminar esta cita
          </button>
        ) : (
          <div className="a-confirm">
            <span>Se eliminan la cita, su libro y sus fotos al guardar.</span>
            <button type="button" className="a-btn ghost" onClick={() => setConfirm(false)}>
              Conservar
            </button>
            <button type="button" className="a-btn danger" onClick={onDelete}>
              Sí, eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, id, hint, wide, children }) {
  return (
    <div className={`a-field ${wide ? 'wide' : ''}`}>
      <label className="a-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && <p className="a-hint">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Fotos */
function FotosTab({ cita, update }) {
  const addRef = useRef(null);
  const [over, setOver] = useState(false);

  const patch = (photoId, fn) =>
    update((c) => {
      const p = c.photos.find((x) => x.id === photoId);
      if (p) fn(p, c);
    });

  async function upload(photoId, file) {
    patch(photoId, (p) => {
      p.uploading = true;
      p.error = '';
      p.preview = URL.createObjectURL(file);
    });
    try {
      const img = await prepareImage(file);
      const { url } = await api.upload({ data: img.data, type: img.type });
      patch(photoId, (p) => {
        p.url = url;
        p.width = img.width;
        p.height = img.height;
        p.uploading = false;
      });
    } catch (e) {
      patch(photoId, (p) => {
        p.uploading = false;
        p.error = e.status === 401 ? 'Tu sesión expiró. Vuelve a entrar.' : e.message;
      });
    }
  }

  function addFiles(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    const ids = list.map(() => uid('p'));
    update((c) => {
      ids.forEach((id) => c.photos.push({ id, url: '', width: null, height: null, description: '' }));
      if (!c.coverPhotoId && ids[0]) c.coverPhotoId = ids[0];
    });
    // Sube de a una para no saturar la conexión.
    (async () => {
      for (let i = 0; i < list.length; i++) await upload(ids[i], list[i]);
    })();
  }

  function move(i, d) {
    update((c) => {
      const j = i + d;
      if (j < 0 || j >= c.photos.length) return;
      [c.photos[i], c.photos[j]] = [c.photos[j], c.photos[i]];
    });
  }

  return (
    <div className="a-panel">
      <div
        className={`a-drop ${over ? 'over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <p className="display">Añadir fotografías</p>
        <p className="a-hint">Arrástralas aquí o elígelas. Se reducen a 2400 px y se guardan en JPG. Recuerda pulsar «Guardar cambios» al terminar.</p>
        <button type="button" className="a-btn primary" onClick={() => addRef.current?.click()}>
          Elegir fotos
        </button>
        <input
          ref={addRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {cita.photos.length === 0 && <p className="a-empty">Esta cita todavía no tiene fotografías.</p>}

      <ol className="a-photos">
        {cita.photos.map((p, i) => (
          <PhotoCard
            key={p.id}
            photo={p}
            index={i}
            total={cita.photos.length}
            isCover={cita.coverPhotoId === p.id || (!cita.coverPhotoId && i === 0)}
            onDesc={(v) => patch(p.id, (x) => (x.description = v))}
            onReplace={(file) => upload(p.id, file)}
            onCover={() => update((c) => (c.coverPhotoId = p.id))}
            onMove={(d) => move(i, d)}
            onRemove={() =>
              update((c) => {
                c.photos = c.photos.filter((x) => x.id !== p.id);
                if (c.coverPhotoId === p.id) c.coverPhotoId = c.photos[0]?.id || '';
              })
            }
          />
        ))}
      </ol>
    </div>
  );
}

function PhotoCard({ photo, index, total, isCover, onDesc, onReplace, onCover, onMove, onRemove }) {
  const ref = useRef(null);
  const src = photo.preview || photo.url;
  return (
    <li className="a-photo">
      <div className="a-photo-img">
        {src ? <img src={src} alt="" /> : <span>Sin imagen</span>}
        {photo.uploading && <span className="a-photo-state">Subiendo…</span>}
        {isCover && <span className="a-photo-badge">Portada</span>}
      </div>
      <div className="a-photo-body">
        <div className="a-photo-head">
          <span className="label">{imgLabel(index + 1)}</span>
          <span className="a-hint">
            En el libro: <code>[foto:{index + 1}]</code>
          </span>
        </div>
        <label className="a-label" htmlFor={`d-${photo.id}`}>
          Descripción
        </label>
        <textarea
          id={`d-${photo.id}`}
          rows={3}
          value={photo.description}
          onChange={(e) => onDesc(e.target.value)}
          placeholder="¿Qué estaba pasando en esta foto?"
        />
        {photo.error && <p className="a-error">{photo.error}</p>}
        <div className="a-photo-actions">
          <button type="button" className="a-btn small" onClick={() => ref.current?.click()} disabled={photo.uploading}>
            Cambiar foto
          </button>
          <input
            ref={ref}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            hidden
            onChange={(e) => {
              if (e.target.files[0]) onReplace(e.target.files[0]);
              e.target.value = '';
            }}
          />
          {!isCover && photo.url && (
            <button type="button" className="a-btn small ghost" onClick={onCover}>
              Usar como portada
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="a-btn small ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Mover antes">
            ↑
          </button>
          <button type="button" className="a-btn small ghost" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Mover después">
            ↓
          </button>
          <button type="button" className="a-btn small danger-ghost" onClick={onRemove}>
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ Libro */
function LibroTab({ cita, update }) {
  const chapters = cita.book.chapters;
  const [active, setActive] = useState(chapters[0]?.id || null);
  const [confirmDel, setConfirmDel] = useState(false);
  const bodyRef = useRef(null);
  const idx = chapters.findIndex((c) => c.id === active);
  const ch = chapters[idx];

  const setBook = (k) => (e) => update((c) => (c.book[k] = e.target.value));
  const setCh = (k, v) =>
    update((c) => {
      const x = c.book.chapters.find((y) => y.id === active);
      if (x) x[k] = v;
    });

  function addChapter() {
    const id = uid('ch');
    update((c) => c.book.chapters.push({ id, title: `Capítulo ${c.book.chapters.length + 1}`, body: '' }));
    setActive(id);
    setConfirmDel(false);
  }
  function moveCh(d) {
    update((c) => {
      const a = c.book.chapters;
      const j = idx + d;
      if (j < 0 || j >= a.length) return;
      [a[idx], a[j]] = [a[j], a[idx]];
    });
  }
  function removeCh() {
    const next = chapters[idx + 1] || chapters[idx - 1];
    update((c) => {
      c.book.chapters = c.book.chapters.filter((x) => x.id !== active);
    });
    setActive(next?.id || null);
    setConfirmDel(false);
  }

  // Inserta texto donde está el cursor (o envuelve lo seleccionado).
  function insert(before, after = '', block = false) {
    const ta = bodyRef.current;
    if (!ta || !ch) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    let pre = value.slice(0, s);
    let post = value.slice(e);
    let b = before;
    let a = after;
    if (block) {
      if (pre && !pre.endsWith('\n\n')) b = (pre.endsWith('\n') ? '\n' : '\n\n') + b;
      a = a + (post.startsWith('\n\n') ? '' : post.startsWith('\n') ? '\n' : '\n\n');
    }
    const next = pre + b + value.slice(s, e) + a + post;
    setCh('body', next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = (pre + b + value.slice(s, e)).length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const total = bookText(cita);

  return (
    <div className="a-panel">
      <div className="a-grid">
        <div className="a-field wide">
          <label className="a-label" htmlFor="b-title">
            Título del libro
          </label>
          <input id="b-title" value={cita.book.title} onChange={setBook('title')} placeholder={cita.title} />
        </div>
        <div className="a-field wide">
          <label className="a-label" htmlFor="b-syn">
            Sinopsis
          </label>
          <textarea id="b-syn" rows={3} value={cita.book.synopsis} onChange={setBook('synopsis')} placeholder="Dos o tres líneas que aparecen en la portada del libro." />
        </div>
      </div>

      <div className="a-book">
        <aside className="a-chapters">
          <div className="a-side-head">
            <p className="label">
              Capítulos · {wordCount(total)} palabras · {readingMinutes(total)} min
            </p>
          </div>
          <ol>
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={c.id === active}
                  onClick={() => {
                    setActive(c.id);
                    setConfirmDel(false);
                  }}
                >
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span>{c.title || 'Sin título'}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="a-btn small" onClick={addChapter}>
            + Nuevo capítulo
          </button>
        </aside>

        {ch ? (
          <section className="a-chapter">
            <div className="a-field">
              <label className="a-label" htmlFor="ch-title">
                Título del capítulo {idx + 1}
              </label>
              <input id="ch-title" value={ch.title} onChange={(e) => setCh('title', e.target.value)} />
            </div>

            <div className="a-toolbar" role="toolbar" aria-label="Formato">
              <button type="button" onClick={() => insert('*', '*')}>
                <em>Cursiva</em>
              </button>
              <button type="button" onClick={() => insert('**', '**')}>
                <b>Negrita</b>
              </button>
              <button type="button" onClick={() => insert('— ')}>
                — Diálogo
              </button>
              <button type="button" onClick={() => insert('***', '', true)}>
                · · · Salto de escena
              </button>
            </div>

            {cita.photos.some((p) => p.url) && (
              <div className="a-insert-photos">
                <p className="a-hint">Insertar una foto en el texto:</p>
                <div>
                  {cita.photos.map((p, i) =>
                    p.url ? (
                      <button key={p.id} type="button" onClick={() => insert(`[foto:${i + 1}]`, '', true)} title={`Insertar foto ${i + 1}`}>
                        <img src={p.preview || p.url} alt="" />
                        <span>{i + 1}</span>
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            <textarea
              ref={bodyRef}
              className="a-body-text"
              value={ch.body}
              onChange={(e) => setCh('body', e.target.value)}
              placeholder="Escribe el capítulo como si fuera una novela. Deja una línea en blanco entre párrafos."
              aria-label={`Texto del capítulo ${idx + 1}`}
            />

            <div className="a-chapter-foot">
              <span className="a-hint">
                {wordCount(ch.body)} palabras · {readingMinutes(ch.body)} min
              </span>
              <span className="spacer" />
              <a className="a-btn small ghost" href={`/cita/${cita.slug}/libro/${idx + 1}`} target="_blank" rel="noreferrer">
                Leer ↗
              </a>
              <button type="button" className="a-btn small ghost" onClick={() => moveCh(-1)} disabled={idx === 0}>
                ↑ Subir
              </button>
              <button type="button" className="a-btn small ghost" onClick={() => moveCh(1)} disabled={idx === chapters.length - 1}>
                ↓ Bajar
              </button>
              {!confirmDel ? (
                <button type="button" className="a-btn small danger-ghost" onClick={() => setConfirmDel(true)}>
                  Eliminar capítulo
                </button>
              ) : (
                <>
                  <button type="button" className="a-btn small ghost" onClick={() => setConfirmDel(false)}>
                    Conservar
                  </button>
                  <button type="button" className="a-btn small danger" onClick={removeCh}>
                    Sí, eliminar
                  </button>
                </>
              )}
            </div>

            <details className="a-help">
              <summary>Cómo dar formato al texto</summary>
              <ul>
                <li>Una línea en blanco separa los párrafos.</li>
                <li>
                  <code>*así*</code> se ve en <em>cursiva</em> y <code>**así**</code> en <b>negrita</b>.
                </li>
                <li>
                  <code>***</code> sola en una línea marca un salto de escena.
                </li>
                <li>
                  <code>[foto:3]</code> sola en una línea muestra la fotografía 3 con su descripción. El número es el orden en la pestaña Fotografías.
                </li>
              </ul>
            </details>
          </section>
        ) : (
          <section className="a-chapter a-empty-book">
            <p className="display">El libro está vacío</p>
            <p className="a-hint">Cuando la cita tenga al menos un capítulo, aparecerá el botón «Leer la cita como un libro» en su página.</p>
            <button type="button" className="a-btn primary" onClick={addChapter}>
              Escribir el primer capítulo
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
