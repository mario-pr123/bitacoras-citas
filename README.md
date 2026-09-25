# Bitácora de citas

Sitio en blanco y negro, con estilo editorial, para guardar tus citas. Cada cita tiene sus fotografías con descripción, tu perspectiva del día y un **modo libro** por capítulos. Todo se controla desde un panel privado en `/admin`.

- **Sitio público**: `/`. Tiene la portada, un filtro por listas, el índice de citas y el archivo de fotos.
- **Cita**: `/cita/nombre-de-la-cita`. Tiene tu perspectiva, las fotos (al tocar una se abre con su descripción) y el botón para leerla como libro.
- **Modo libro**: `/cita/nombre-de-la-cita/libro`. Tiene portada, índice, capítulos, tres fondos (claro, sepia y noche), tamaño de letra ajustable y barra de progreso. Además, recuerda en qué capítulo quedó quien lee.
- **Panel**: `/admin`. Entras con tu contraseña. Desde ahí creas y editas las citas, subes, cambias, ordenas y describes las fotos, escribes los capítulos del libro y manejas las listas y los ajustes del sitio.

## Subirlo a Vercel

1. Sube esta carpeta a un repositorio de GitHub. También puedes usar `npx vercel` desde la carpeta.
2. En [vercel.com](https://vercel.com), entra a **Add New → Project** e importa el repositorio. Vercel detecta Vite solo, así que no hace falta cambiar nada.
3. En el proyecto, entra a **Storage → Create Database → Blob**. Elige acceso **Public** y conéctalo al proyecto. Eso crea la variable `BLOB_READ_WRITE_TOKEN`.
4. En **Settings → Environment Variables**, agrega:
   - `ADMIN_PASSWORD`: tu contraseña para el panel.
   - `ADMIN_SECRET`: un texto largo y aleatorio (por ejemplo, 40 letras y números al azar).
5. Entra a **Deployments** y elige **Redeploy** para que tome las variables.
6. Abre `https://tu-proyecto.vercel.app/admin`, entra con tu contraseña, borra o edita la cita de ejemplo y pulsa **Guardar cambios**.

## Probarlo en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Si no creaste `.env.local`, la contraseña del panel es `bitacora` y todo se guarda en la carpeta `.data/`. Para usar tus datos reales de Vercel, ejecuta `npx vercel env pull .env.local`.

## Cómo escribir los capítulos

| Escribes | Se ve |
| --- | --- |
| una línea en blanco | párrafo nuevo |
| `*texto*` | *cursiva* |
| `**texto**` | **negrita** |
| `***` sola en una línea | salto de escena |
| `[foto:3]` sola en una línea | la fotografía 3 de la cita, con su descripción |

El editor tiene botones para todo esto. Al tocar una miniatura se inserta la foto donde está el cursor.

## Detalles

- Las citas en **Borrador** solo las ves tú, siempre que hayas entrado al panel en ese navegador.
- Antes de subirlas, las fotos se reducen a 2400 px y se convierten a JPG. Las fotos HEIC del iPhone funcionan en Safari; en otros navegadores hay que convertirlas antes a JPG.
- Cuando quitas o reemplazas una foto y guardas, el archivo viejo se borra del almacenamiento.
- Se conservan las últimas 15 versiones de tus citas como respaldo en Vercel Blob (carpeta `db/`).
- Los archivos de Vercel Blob son públicos pero tienen direcciones imposibles de adivinar. Esto aplica también a las fotos de los borradores, así que no subas nada que no quieras que exista en internet.
