const MAX_BYTES = 3.2 * 1024 * 1024; // queda por debajo del límite de 4.5 MB de Vercel tras pasar a base64

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo leer «${file.name}». Si es una foto HEIC del iPhone, conviértela a JPG.`));
    };
    img.src = url;
  });
}

const toBlob = (canvas, q) => new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));

const toBase64 = (blob) =>
  new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.readAsDataURL(blob);
  });

// Reduce la foto (máx. 2400 px por lado) y la convierte a JPG antes de subirla.
export async function prepareImage(file) {
  const img = await loadImage(file);
  let max = 2400;
  let q = 0.86;
  for (let attempt = 0; attempt < 8; attempt++) {
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s);
    const h = Math.round(img.naturalHeight * s);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await toBlob(c, q);
    if (blob && blob.size <= MAX_BYTES) {
      return { data: await toBase64(blob), type: 'image/jpeg', width: w, height: h };
    }
    if (q > 0.66) q -= 0.1;
    else max = Math.round(max * 0.8);
  }
  throw new Error(`«${file.name}» es demasiado grande incluso comprimida.`);
}
