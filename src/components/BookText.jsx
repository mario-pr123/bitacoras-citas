import { Fragment } from 'react';

// Formato simple para escribir capítulos desde el panel:
//   línea en blanco = párrafo nuevo · *cursiva* · **negrita** · *** = salto de escena · [foto:3] = inserta la foto 3
function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(
      t.startsWith('**') ? <strong key={`${keyBase}-${k++}`}>{t.slice(2, -2)}</strong> : <em key={`${keyBase}-${k++}`}>{t.slice(1, -1)}</em>,
    );
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(text, key) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <Fragment key={`${key}-l${i}`}>
      {inline(line, `${key}-${i}`)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export default function BookText({ body, photos, grayscale }) {
  const blocks = String(body || '')
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((b, i) => {
    const foto = b.match(/^\[foto:(\d+)\]$/i);
    if (foto) {
      const p = photos[Number(foto[1]) - 1];
      if (!p) return null;
      return (
        <figure key={i} className="book-figure">
          <img src={p.url} alt={p.description || ''} loading="lazy" />
          {p.description && <figcaption>{p.description}</figcaption>}
        </figure>
      );
    }
    if (/^(\*\s*){3,}$|^—{3,}$|^-{3,}$/.test(b)) return <p key={i} className="scene-break" aria-hidden="true">·  ·  ·</p>;
    const isDialogue = /^[—–-]\s?/.test(b);
    return (
      <p key={i} className={isDialogue ? 'dialogue' : undefined}>
        {withBreaks(b, i)}
      </p>
    );
  });
}
