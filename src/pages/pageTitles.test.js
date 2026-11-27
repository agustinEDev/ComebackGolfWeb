import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Titulos de pagina frente a la cabecera contextual (FE #329).
 *
 * Desde FE #310 la cabecera pinta el titulo de la pantalla en movil, y lo hace
 * en un `<h1>`. Una pagina que ademas pinte el suyo repite el dato en la franja
 * mas cara de la pantalla y, si tambien usa `<h1>`, deja dos en el arbol de
 * accesibilidad: para un lector de pantalla eso es una jerarquia rota, no una
 * simple repeticion.
 *
 * `hidden` (display: none) si retira el elemento del arbol de accesibilidad,
 * al contrario que `sr-only`, que solo lo oculta a la vista. Por eso la regla
 * es `hidden md:block` y no una clase de solo-lectores.
 *
 * Estas son aserciones sobre el fichero porque jsdom no aplica media queries:
 * un render no distingue `hidden md:block` de visible.
 */

const read = (relativePath) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

/** Rutas inmersivas o publicas: la cabecera contextual no aparece en ellas. */
const SIN_CABECERA_CONTEXTUAL = [
  'player/ScoringPage.jsx',
  // La de anotar una partida de stroke play: también acaba en /scoring (FE #824, PR 7)
  'player/GroupScoringPage.jsx',
  'quick_match/QuickMatchScoringPage.jsx',
  'public/LeaderboardPage.jsx',
];

/**
 * Inicio pide a la cabecera que no pinte título (`marca`), así que
 * en el móvil la cabecera no pinta `<h1>`: el de la pantalla es el saludo, a
 * la vista en todos los anchos. Se comprueba aparte, abajo.
 */
const CON_SU_PROPIO_H1 = ['Dashboard.jsx'];

/** Sin ruta en App.jsx: inalcanzables, pendientes de FE #244. */
const SIN_RUTA = ['admin/GolfCourses.jsx', 'admin/PendingGolfCourses.jsx'];

function listarPaginas(dir, prefijo = '') {
  const salida = [];
  for (const entrada of readdirSync(resolve(process.cwd(), dir))) {
    const ruta = join(dir, entrada);
    if (statSync(resolve(process.cwd(), ruta)).isDirectory()) {
      salida.push(...listarPaginas(ruta, `${prefijo}${entrada}/`));
    } else if (entrada.endsWith('.jsx') && !entrada.includes('.test.')) {
      salida.push({ ruta, nombre: `${prefijo}${entrada}` });
    }
  }
  return salida;
}

describe('page titles vs the contextual header', () => {
  const paginas = listarPaginas('src/pages')
    .filter(({ ruta }) => read(ruta).includes('HeaderAuth'))
    .filter(
      ({ nombre }) =>
        !SIN_CABECERA_CONTEXTUAL.includes(nombre) &&
        !SIN_RUTA.includes(nombre) &&
        !CON_SU_PROPIO_H1.includes(nombre),
    );

  it('finds the authenticated pages to check', () => {
    expect(paginas.length).toBeGreaterThan(5);
  });

  it.each(paginas)(
    '$nombre does not render a second h1 on mobile',
    ({ ruta }) => {
      const fuente = read(ruta);
      const encabezados = fuente.match(/<h1[^>]*>/g) ?? [];

      for (const encabezado of encabezados) {
        // Si la pagina pinta un h1, debe quedarse fuera del movil: alli el titulo
        // ya lo pone la cabecera
        expect(encabezado).toContain('hidden md:block');
      }
    },
  );

  it('Inicio: un solo h1, el saludo, porque su cabecera lleva la marca y no el título', () => {
    const fuente = read('src/pages/Dashboard.jsx');

    expect(fuente.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
    expect(fuente).toMatch(/<h1[^>]*>\s*\{t\('welcome'/);
    // Y la cabecera va con `marca`: sin ella pintaría su propio h1 en el móvil
    expect(fuente).toMatch(/<HeaderAuth[^>]*\bmarca\b/);
    expect(read('src/components/layout/HeaderAuth.jsx')).toMatch(
      /const nombreDeLaPantalla = marca\s*\?\s*null/,
    );
  });

  it('la ficha de un torneo: su h1 es el nombre sobre la portada, y la cabecera no pinta otro', () => {
    // La página se lo dice a la cabecera, que conserva la flecha de volver
    expect(read('src/pages/CompetitionDetail.jsx')).toMatch(
      /<HeaderAuth[^>]*\btituloEnLaPagina\b/,
    );
    expect(read('src/components/layout/HeaderAuth.jsx')).toMatch(
      /const screenTitle = tituloEnLaPagina\s*\?\s*null/,
    );
    // Uno solo, y a la vista en el móvil
    const resumen = read(
      'src/components/competition/detail/ResumenDeLaCompeticion.jsx',
    );
    const encabezados = resumen.match(/<h1[^>]*>/g) ?? [];
    expect(encabezados).toHaveLength(1);
    expect(encabezados[0]).not.toContain('hidden');
  });

  // Un título que no es `<h1>` se le escapa al barrido de arriba. El de Editar
  // perfil salía dos veces en el móvil cuando el título bajó de la barra
  it('EditProfile: su título propio no sale en el móvil', () => {
    const fuente = read('src/pages/EditProfile.jsx');

    expect(fuente).toMatch(
      /<p className="hidden md:block [^"]*">\s*\{t\('edit\.title'\)\}/,
    );
  });

  // Los h1 que salieron de una página a su componente (pieza 4): fuera del
  // barrido de src/pages, pero con la misma regla. Debe seguir habiendo h1:
  // si no, la comprobación no miraría nada
  it.each(['src/components/schedule/CabeceraDeLaAgenda.jsx'])(
    '%s keeps its h1 out of mobile',
    (ruta) => {
      const encabezados = read(ruta).match(/<h1[^>]*>/g) ?? [];

      expect(encabezados.length).toBeGreaterThan(0);
      for (const encabezado of encabezados) {
        expect(encabezado).toContain('hidden md:block');
      }
    },
  );

  it('keeps the header as the only h1 on mobile', () => {
    // La cabecera si pinta el suyo sin condicion: es la fuente del titulo
    const header = read('src/components/layout/HeaderAuth.jsx');

    expect(header).toMatch(/<h1[^>]*>/);
    expect(header).not.toContain('<h1 className="hidden');
  });
});

/**
 * Enlaces de "volver" frente a la flecha de la cabecera (FE #338).
 *
 * Mismo origen que la duplicacion de titulos: la cabecera contextual trajo una
 * flecha de vuelta, y los enlaces que ya existian en las paginas hacen ahora lo
 * mismo justo debajo.
 */
describe('back links vs the header arrow', () => {
  const REDUNDANTES = [
    'src/pages/DeviceManagement.jsx',
    'src/pages/quick_match/MyQuickMatchesPage.jsx',
    // La cabecera de la agenda vive en su componente desde la pieza 4
    'src/components/schedule/CabeceraDeLaAgenda.jsx',
    'src/pages/creator/InvitationsPage.jsx',
    'src/pages/CompetitionDetail.jsx',
  ];

  it.each(REDUNDANTES)('%s hides its back link on mobile', (ruta) => {
    const fuente = read(ruta);

    // El enlace sigue en escritorio, donde la cabecera muestra la marca y no
    // ofrece vuelta
    // Entre comillas o en una plantilla, si lleva una clase común
    expect(fuente).toMatch(/className=(?:"|\{`)hidden md:(flex|inline-flex)\b/);
  });

  it('gives the competition header the origin-aware destination', () => {
    // La pagina sabe si se llego desde explorar; el mapa de rutas no. Sin
    // pasarle ese destino, ocultar el enlace perderia comportamiento
    const fuente = read('src/pages/CompetitionDetail.jsx');

    expect(fuente).toContain('backTo={backLink}');
  });
});
