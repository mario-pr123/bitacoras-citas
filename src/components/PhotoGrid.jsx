import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { imgLabel, shortYear } from '../lib/utils.js';

const LABEL_H = 22;
// Posición inicial de cada columna (en fracciones del ancho de columna) para el escalonado editorial.
const START = { 2: [0, 0.45], 3: [0.55, 0, 0.3], 4: [0.95, 0.5, 0, 0.5] };
// Aire extra entre fotos, repetido en ciclo, para que la retícula no se vea como un mosaico.
const EXTRA = [0, 0.3, 0.05, 0.6, 0.12, 0, 0.42];

/**
 * Retícula escalonada: cada foto lleva su etiqueta IMG_00N_JPG y el año.
 * items: [{ key, photo, number, date, onClick, caption }]
 */
export default function PhotoGrid({ items, grayscale = true }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!width) return { boxes: [], height: 0 };
    const cols = width < 520 ? 2 : width < 900 ? 3 : 4;
    const gap = width < 520 ? 12 : 16;
    const colW = (width - gap * (cols - 1)) / cols;
    const heights = START[cols].map((f) => f * colW);
    const boxes = items.map((it, i) => {
      const p = it.photo;
      const ratio = p.width && p.height ? Math.min(1.6, Math.max(0.55, p.height / p.width)) : 1.25;
      // Columna más baja; en empate, la de la izquierda.
      let col = 0;
      for (let c = 1; c < cols; c++) if (heights[c] < heights[col] - 1) col = c;
      const top = heights[col];
      const imgH = colW * ratio;
      heights[col] = top + LABEL_H + imgH + gap * 2 + EXTRA[i % EXTRA.length] * colW;
      return { left: col * (colW + gap), top, w: colW, imgH };
    });
    return { boxes, height: Math.max(...heights) };
  }, [items, width]);

  return (
    <div className="photo-grid" ref={ref} style={{ height: layout.height || undefined }}>
      {layout.boxes.map((b, i) => {
        const it = items[i];
        return (
          <figure
            key={it.key}
            className="grid-item"
            style={{ transform: `translate(${b.left}px, ${b.top}px)`, width: b.w }}
          >
            <figcaption className="grid-label">
              <span>{imgLabel(it.number)}</span>
              <span className="mute">{shortYear(it.date)}</span>
            </figcaption>
            <button
              type="button"
              className="grid-photo"
              style={{ height: b.imgH }}
              onClick={it.onClick}
              aria-label={`Abrir ${imgLabel(it.number)}${it.photo.description ? `: ${it.photo.description}` : ''}`}
            >
              <img src={it.photo.url} alt={it.photo.description || ''} loading="lazy" className={grayscale ? 'bw' : ''} />
            </button>
            {it.caption && <p className="grid-caption">{it.caption}</p>}
          </figure>
        );
      })}
    </div>
  );
}
