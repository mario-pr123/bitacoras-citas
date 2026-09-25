import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { imgLabel, dotDate } from '../lib/utils.js';

/** items: [{ photo, number, cita }] */
export default function Lightbox({ items, index, onChange, onClose, grayscale }) {
  const closeRef = useRef(null);
  const it = items[index];

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onChange(index - 1);
      if (e.key === 'ArrowRight' && index < items.length - 1) onChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onChange, onClose]);

  if (!it) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={imgLabel(it.number)} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lb-media" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img src={it.photo.url} alt={it.photo.description || ''} />
      </div>
      <aside className="lb-panel">
        <div className="lb-top">
          <span className="label">{imgLabel(it.number)}</span>
          <button ref={closeRef} type="button" className="lb-close" onClick={onClose}>
            Cerrar ✕
          </button>
        </div>
        <div className="lb-text">
          <p className="label mute">
            {it.cita.title} — {dotDate(it.cita.date)}
          </p>
          <p className="lb-desc">{it.photo.description || 'Sin descripción.'}</p>
        </div>
        <div className="lb-bottom">
          <div className="lb-nav">
            <button type="button" onClick={() => onChange(index - 1)} disabled={index === 0}>
              ← Anterior
            </button>
            <span className="label">
              {index + 1} / {items.length}
            </span>
            <button type="button" onClick={() => onChange(index + 1)} disabled={index === items.length - 1}>
              Siguiente →
            </button>
          </div>
          {it.showCitaLink && (
            <Link to={`/cita/${it.cita.slug}`} className="lb-link" onClick={onClose}>
              Ver la cita completa →
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
