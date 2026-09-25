import { useState } from 'react';
import { uid } from '../lib/utils.js';

export function ListsEditor({ data, update }) {
  const [confirm, setConfirm] = useState(null);
  const count = (id) => data.citas.filter((c) => c.listId === id).length;

  return (
    <div className="a-editor">
      <div className="a-editor-head">
        <div>
          <p className="label">Organiza tus citas</p>
          <h1 className="display">Listas</h1>
        </div>
        <button type="button" className="a-btn primary" onClick={() => update((d) => d.lists.push({ id: uid('l'), name: 'Nueva lista', description: '' }))}>
          + Nueva lista
        </button>
      </div>
      <p className="a-hint a-intro">
        Cada lista aparece como filtro en la página principal. Asigna una cita a una lista desde su pestaña Datos.
      </p>
      {data.lists.length === 0 && <p className="a-empty">Aún no tienes listas.</p>}
      <ul className="a-lists">
        {data.lists.map((l, i) => (
          <li key={l.id} className="a-list-row">
            <div className="a-field">
              <label className="a-label" htmlFor={`ln-${l.id}`}>
                Nombre
              </label>
              <input id={`ln-${l.id}`} value={l.name} onChange={(e) => update((d) => (d.lists[i].name = e.target.value))} maxLength={80} />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor={`ld-${l.id}`}>
                Descripción
              </label>
              <input id={`ld-${l.id}`} value={l.description} onChange={(e) => update((d) => (d.lists[i].description = e.target.value))} placeholder="Opcional" />
            </div>
            <div className="a-list-side">
              <span className="a-hint">
                {count(l.id)} {count(l.id) === 1 ? 'cita' : 'citas'}
              </span>
              {confirm === l.id ? (
                <span className="a-confirm inline">
                  <button type="button" className="a-btn small ghost" onClick={() => setConfirm(null)}>
                    No
                  </button>
                  <button
                    type="button"
                    className="a-btn small danger"
                    onClick={() => {
                      update((d) => {
                        d.lists = d.lists.filter((x) => x.id !== l.id);
                        d.citas.forEach((c) => {
                          if (c.listId === l.id) c.listId = '';
                        });
                      });
                      setConfirm(null);
                    }}
                  >
                    Sí, eliminar
                  </button>
                </span>
              ) : (
                <button type="button" className="a-btn small danger-ghost" onClick={() => setConfirm(l.id)}>
                  Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {confirm && <p className="a-hint">Las citas de esa lista no se borran; quedan sin lista.</p>}
    </div>
  );
}

export function SettingsEditor({ data, update }) {
  const s = data.settings;
  const set = (k) => (e) => update((d) => (d.settings[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value));
  return (
    <div className="a-editor">
      <div className="a-editor-head">
        <div>
          <p className="label">Todo el sitio</p>
          <h1 className="display">Ajustes</h1>
        </div>
      </div>
      <div className="a-panel">
        <div className="a-grid">
          <div className="a-field">
            <label className="a-label" htmlFor="s-name">
              Nombre del sitio
            </label>
            <input id="s-name" value={s.siteName} onChange={set('siteName')} maxLength={60} />
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="s-author">
              Tu nombre (autora de los libros)
            </label>
            <input id="s-author" value={s.author} onChange={set('author')} />
          </div>
          <div className="a-field wide">
            <label className="a-label" htmlFor="s-statement">
              Frase principal
            </label>
            <textarea id="s-statement" rows={2} value={s.statement} onChange={set('statement')} maxLength={300} />
            <p className="a-hint">Se muestra en letras grandes sobre la foto de portada de la página principal.</p>
          </div>
          <div className="a-field wide">
            <label className="a-label" htmlFor="s-intro">
              Texto de presentación
            </label>
            <textarea id="s-intro" rows={4} value={s.intro} onChange={set('intro')} maxLength={1200} />
          </div>
          <div className="a-field wide">
            <span className="a-label">Fotografías</span>
            <label className="a-switch">
              <input type="checkbox" checked={s.grayscale} onChange={set('grayscale')} />
              <span>Mostrar en blanco y negro (recuperan el color al pasar el cursor)</span>
            </label>
          </div>
        </div>
        <div className="a-note">
          <p className="a-label">Contraseña del panel</p>
          <p className="a-hint">
            Se cambia en Vercel: Settings → Environment Variables → <code>ADMIN_PASSWORD</code>, y luego se vuelve a desplegar el proyecto.
          </p>
          <p className="a-label">Almacenamiento</p>
          <p className="a-hint">
            {data.storage === 'blob'
              ? 'Vercel Blob. Se guardan las últimas 15 versiones de tus citas como respaldo.'
              : 'Carpeta .data de este computador (modo local).'}
          </p>
        </div>
      </div>
    </div>
  );
}
