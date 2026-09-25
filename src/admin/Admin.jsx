import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useData } from '../lib/DataContext.jsx';
import { uid, dotDate, slugify } from '../lib/utils.js';
import CitaEditor from './CitaEditor.jsx';
import { ListsEditor, SettingsEditor } from './OtherEditors.jsx';
import './admin.css';

// Quita lo que solo existe mientras editas (vistas previas, estados de subida).
export function persistable(d) {
  if (!d) return d;
  const { storage, ...rest } = d;
  return {
    ...rest,
    citas: rest.citas.map((c) => ({
      ...c,
      photos: c.photos.filter((p) => p.url).map(({ uploading, preview, error, ...p }) => p),
    })),
  };
}

export default function Admin() {
  const [session, setSession] = useState({ checking: true });

  useEffect(() => {
    document.title = 'Panel — Bitácora';
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    api
      .session()
      .then((s) => setSession({ checking: false, ...s }))
      .catch(() => setSession({ checking: false, admin: false, error: 'No se pudo conectar con el servidor.' }));
  }, []);

  if (session.checking) return <div className="admin-loading">Abriendo el panel…</div>;
  if (!session.admin) return <Login info={session} onDone={() => setSession({ checking: false, admin: true })} />;
  return <Panel onLoggedOut={() => setSession({ checking: false, admin: false })} />;
}

function Login({ info, onDone }) {
  const { reload } = useData();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(info.error || (info.configured === false ? 'Falta configurar ADMIN_PASSWORD en Vercel.' : ''));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.login(password);
      reload();
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <p className="label">Bitácora — acceso privado</p>
        <h1 className="display">Panel</h1>
        <label htmlFor="pw" className="a-label">
          Contraseña
        </label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
        {error && <p className="a-error">{error}</p>}
        {info.devPassword && (
          <p className="a-hint">
            Estás en tu computador sin <code>ADMIN_PASSWORD</code>: la contraseña temporal es <b>bitacora</b>.
          </p>
        )}
        <button className="a-btn primary" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <Link to="/" className="a-link">
          ← Volver al sitio
        </Link>
      </form>
    </div>
  );
}

function Panel({ onLoggedOut }) {
  const { setData, reload } = useData();
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState('');
  const [loadError, setLoadError] = useState('');
  const [sel, setSel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // {type, text}
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.adminData();
      setDraft(d);
      setSaved(JSON.stringify(persistable(d)));
      setSel((s) => s || (d.citas[0] ? { type: 'cita', id: d.citas[0].id } : { type: 'settings' }));
    } catch (e) {
      if (e.status === 401) onLoggedOut();
      else setLoadError(e.message);
    }
  }, [onLoggedOut]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback((fn) => {
    setDraft((d) => {
      const n = structuredClone(d);
      fn(n);
      return n;
    });
  }, []);

  const dirty = useMemo(() => draft && JSON.stringify(persistable(draft)) !== saved, [draft, saved]);
  const uploading = draft ? draft.citas.reduce((n, c) => n + c.photos.filter((p) => p.uploading).length, 0) : 0;

  const save = useCallback(async () => {
    if (!draft || saving || uploading) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await api.save(persistable(draft));
      setDraft(res);
      setSaved(JSON.stringify(persistable(res)));
      setData(res);
      setNotice({ type: 'ok', text: 'Cambios guardados. El sitio público se actualiza en unos segundos.' });
    } catch (e) {
      if (e.status === 401) {
        setNotice({ type: 'error', text: 'Tu sesión expiró. Copia lo que escribiste, recarga la página y vuelve a entrar.' });
      } else setNotice({ type: 'error', text: `No se pudo guardar: ${e.message}` });
    } finally {
      setSaving(false);
    }
  }, [draft, saving, uploading, setData]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  useEffect(() => {
    if (notice?.type !== 'ok') return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  async function logout() {
    await api.logout().catch(() => {});
    reload();
    onLoggedOut();
  }

  function discard() {
    const d = JSON.parse(saved);
    setDraft((cur) => ({ ...d, storage: cur.storage }));
    setConfirmDiscard(false);
    if (sel?.type === 'cita' && !d.citas.some((c) => c.id === sel.id)) setSel(d.citas[0] ? { type: 'cita', id: d.citas[0].id } : { type: 'settings' });
  }

  function newCita() {
    const id = uid('c');
    const taken = new Set(draft.citas.map((c) => c.slug));
    let slug = 'nueva-cita';
    for (let n = 2; taken.has(slug); n++) slug = `nueva-cita-${n}`;
    const t = new Date();
    const date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    update((d) => {
      d.citas.unshift({
        id,
        slug,
        title: 'Nueva cita',
        date,
        place: '',
        with: '',
        listId: '',
        published: false,
        coverPhotoId: '',
        summary: '',
        photos: [],
        book: { title: '', synopsis: '', chapters: [] },
      });
    });
    setSel({ type: 'cita', id, tab: 'datos' });
    setNavOpen(false);
  }

  if (loadError)
    return (
      <div className="admin-loading">
        <p>{loadError}</p>
        <button className="a-btn" onClick={() => location.reload()}>
          Reintentar
        </button>
      </div>
    );
  if (!draft) return <div className="admin-loading">Cargando tus citas…</div>;

  const citas = [...draft.citas].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const current = sel?.type === 'cita' ? draft.citas.find((c) => c.id === sel.id) : null;
  const go = (s) => {
    setSel(s);
    setNavOpen(false);
  };

  return (
    <div className="admin">
      <header className="a-top">
        <button className="a-menu" type="button" onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen}>
          Menú
        </button>
        <p className="a-brand">
          {draft.settings.siteName} <span>/ Panel</span>
        </p>
        <p className={`a-status ${dirty ? 'dirty' : ''}`} aria-live="polite">
          {uploading ? `Subiendo ${uploading} foto${uploading > 1 ? 's' : ''}…` : saving ? 'Guardando…' : dirty ? 'Cambios sin guardar' : 'Todo guardado'}
        </p>
        <div className="a-top-actions">
          <a href="/" target="_blank" rel="noreferrer" className="a-btn ghost">
            Ver sitio ↗
          </a>
          {dirty && !confirmDiscard && (
            <button type="button" className="a-btn ghost" onClick={() => setConfirmDiscard(true)}>
              Descartar
            </button>
          )}
          <button type="button" className="a-btn primary" onClick={save} disabled={!dirty || saving || uploading > 0} title="Ctrl + S">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" className="a-btn ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      {confirmDiscard && (
        <div className="a-banner warn">
          <span>¿Descartar todo lo que cambiaste desde el último guardado?</span>
          <button className="a-btn ghost" onClick={() => setConfirmDiscard(false)}>
            No, seguir editando
          </button>
          <button className="a-btn danger" onClick={discard}>
            Sí, descartar
          </button>
        </div>
      )}
      {notice && (
        <div className={`a-banner ${notice.type}`}>
          <span>{notice.text}</span>
        </div>
      )}
      {!draft.updatedAt && (
        <div className="a-banner info">
          <span>
            Estás viendo los datos de ejemplo. Edita o elimina la cita de ejemplo y pulsa <b>Guardar cambios</b> para empezar tu bitácora.
          </span>
        </div>
      )}
      {draft.storage === 'local' && (
        <div className="a-banner info">
          <span>
            Modo local: las citas y fotos se guardan en la carpeta <code>.data</code> de este proyecto.
          </span>
        </div>
      )}

      <div className="a-body">
        <nav className={`a-side ${navOpen ? 'open' : ''}`} aria-label="Secciones del panel">
          <div className="a-side-head">
            <p className="label">Citas · {draft.citas.length}</p>
            <button type="button" className="a-btn small" onClick={newCita}>
              + Nueva cita
            </button>
          </div>
          <ul className="a-cita-list">
            {citas.map((c) => (
              <li key={c.id}>
                <button type="button" aria-current={sel?.type === 'cita' && sel.id === c.id} onClick={() => go({ type: 'cita', id: c.id })}>
                  <span className="a-cita-title">{c.title || 'Sin título'}</span>
                  <span className="a-cita-meta">
                    <i className={c.published ? 'dot on' : 'dot'} />
                    {c.published ? 'Publicada' : 'Borrador'} · {dotDate(c.date)} · {c.photos.length} fotos
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="a-side-links">
            <button type="button" aria-current={sel?.type === 'lists'} onClick={() => go({ type: 'lists' })}>
              Listas <span>{draft.lists.length}</span>
            </button>
            <button type="button" aria-current={sel?.type === 'settings'} onClick={() => go({ type: 'settings' })}>
              Ajustes del sitio
            </button>
          </div>
        </nav>

        <main className="a-main">
          {current && (
            <CitaEditor
              key={current.id}
              cita={current}
              lists={draft.lists}
              tab={sel.tab || 'datos'}
              setTab={(tab) => setSel({ ...sel, tab })}
              update={(fn) =>
                update((d) => {
                  const c = d.citas.find((x) => x.id === current.id);
                  if (c) fn(c);
                })
              }
              takenSlugs={draft.citas.filter((c) => c.id !== current.id).map((c) => c.slug)}
              onDelete={() => {
                update((d) => {
                  d.citas = d.citas.filter((c) => c.id !== current.id);
                });
                const next = citas.find((c) => c.id !== current.id);
                setSel(next ? { type: 'cita', id: next.id } : { type: 'settings' });
              }}
              slugify={slugify}
            />
          )}
          {sel?.type === 'lists' && <ListsEditor data={draft} update={update} />}
          {sel?.type === 'settings' && <SettingsEditor data={draft} update={update} />}
          {!current && sel?.type === 'cita' && <p className="a-empty">Elige una cita en el menú.</p>}
        </main>
      </div>
    </div>
  );
}
