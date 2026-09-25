// Datos de ejemplo que se muestran mientras aún no has guardado nada desde el panel.
// Las fotos son de picsum.photos solo para que el diseño se vea completo: reemplázalas desde el panel.
const pic = (id, w, h) => ({ url: `https://picsum.photos/id/${id}/${w}/${h}`, width: w, height: h });

export function seedData() {
  return {
    version: 1,
    settings: {
      siteName: 'Bitácora',
      author: 'Emilia',
      statement: 'Guardo cada cita como una fotografía: sin pose, con la luz que había.',
      intro:
        'Un archivo personal de encuentros. Cada cita tiene sus fotografías, lo que yo vi ese día y, cuando vale la pena, su versión larga contada como un libro.',
      grayscale: true,
    },
    lists: [
      { id: 'l-primeras', name: 'Primeras citas', description: 'Las que empezaron algo.' },
      { id: 'l-viajes', name: 'Escapadas', description: 'Citas fuera de la ciudad.' },
    ],
    citas: [
      {
        id: 'c-ejemplo',
        demo: true,
        slug: 'atardecer-en-el-lago',
        title: 'Atardecer en el lago',
        date: '2026-09-12',
        place: 'Embalse de Tominé',
        with: 'Mateo',
        listId: 'l-viajes',
        published: true,
        coverPhotoId: 'p1',
        summary:
          'Esta es una cita de ejemplo. Llegué tarde porque me cambié tres veces de blusa; él ya había extendido una manta cerca del agua. Hablamos de cosas seguras hasta que me contó que de niño quería ser guardabosques, y todo se volvió más fácil.',
        photos: [
          { id: 'p1', ...pic(1011, 1200, 1500), description: 'Foto de ejemplo. Escribe aquí qué estaba pasando en este momento.' },
          { id: 'p2', ...pic(1047, 1500, 1000), description: 'Foto de ejemplo. Cambia esta imagen desde el panel.' },
          { id: 'p3', ...pic(1060, 1200, 1500), description: 'Foto de ejemplo. Aquí va la descripción de la fotografía.' },
          { id: 'p4', ...pic(1035, 1500, 1050), description: 'Foto de ejemplo.' },
          { id: 'p5', ...pic(1073, 1200, 1600), description: 'Foto de ejemplo.' },
          { id: 'p6', ...pic(1067, 1500, 1000), description: 'Foto de ejemplo.' },
          { id: 'p7', ...pic(1080, 1200, 1500), description: 'Foto de ejemplo.' },
        ],
        book: {
          title: 'Lo que el lago no contó',
          synopsis: 'Una tarde, una manta demasiado pequeña y dos helados que no sobrevivieron al sol.',
          chapters: [
            {
              id: 'ch1',
              title: 'Tres blusas',
              body:
                'Me cambié tres veces antes de salir. La primera blusa era *demasiado*; la segunda parecía que no me importaba. La tercera fue la que tenía puesta el día que lo conocí, y eso me pareció una señal, aunque no creo en señales.\n\nLlegué veinte minutos tarde. Él no dijo nada. Solo levantó un helado medio derretido y sonrió como si lo hubiera planeado así.\n\n[foto:1]\n\n—Pensé que ya no venías —dijo.\n—Yo también lo pensé —le respondí, y los dos nos reímos.',
            },
            {
              id: 'ch2',
              title: 'El guardabosques',
              body:
                'Al principio hablamos de cosas seguras: el trabajo, el tráfico de la autopista, lo caro que está todo. Después, sin que yo preguntara, me contó que de niño quería ser guardabosques.\n\n**Nunca** había escuchado a alguien hablar así de un sueño que dejó ir. Sin tristeza. Como quien habla de una casa donde vivió.\n\n***\n\nEl viento cambió y la manta se nos voló dos veces.\n\n[foto:4]',
            },
            {
              id: 'ch3',
              title: 'La luz rosada',
              body:
                'Nos fuimos justo cuando el cielo se puso rosado. Yo quería quedarme, pero no lo dije.\n\nEn el carro, de regreso, él puso una canción que yo no conocía y no me explicó por qué. Me gustó que no lo explicara.\n\n[foto:7]\n\nEsta es la última página del ejemplo. Escribe tus propios capítulos desde el panel, en la pestaña **Libro**.',
            },
          ],
        },
      },
    ],
    updatedAt: null,
  };
}
