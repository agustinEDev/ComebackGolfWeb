import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  AL_PASAR,
  AL_PASAR_EN_ENLACE,
  AL_PULSAR,
  BOLA_ENCENDIDA,
  CARRIL_ENCENDIDO,
  CLASE_DE_LA_LISTA_DE_PESTANAS,
  COLOR_DE_LO_ELEGIDO,
  ELEGIDO,
  ELEGIDO_CON_ANILLO,
  ELEGIDO_CON_TEXTO_DENTRO,
  FONDO_DE_LO_ELEGIDO,
  claseDePestana,
} from './clasesDeComportamiento';

/**
 * Los colores de comportamiento (ComeBack Golf): una sola regla para toda la
 * aplicación, definida una vez.
 *
 *   #   caso                                  | resultado
 *   ----|-------------------------------------|--------------------------------
 *   C1  lo elegido                            | lima, letra Forest, borde Forest
 *   C2  bajo el puntero                       | contraste y su letra, solo hover
 *   C3  pestaña abierta                       | lo elegido, en negrita, sin
 *                                             | borde de abajo (se une al panel)
 *   C4  pestaña cerrada                       | letra suave, con «encima», y un
 *                                             | borde transparente: abrirla no
 *                                             | mueve a las demás
 *   C5  la lista de pestañas                  | raya de tinta debajo
 *   C6  toda `claseDePestana=` de `src`       | usa la regla común
 *   C7  toda lista de pestañas de `src`       | usa la raya común
 */
const clases = (texto) => texto.split(/\s+/).filter(Boolean);

function ficheros(dir) {
  const salida = [];
  for (const entrada of readdirSync(resolve(process.cwd(), dir))) {
    const ruta = join(dir, entrada);
    if (statSync(resolve(process.cwd(), ruta)).isDirectory()) {
      salida.push(...ficheros(ruta));
    } else if (entrada.endsWith('.jsx') && !entrada.includes('.test.')) {
      salida.push(ruta);
    }
  }
  return salida;
}

const conPestanas = ficheros('src')
  .map((ruta) => ({
    ruta,
    fuente: readFileSync(resolve(process.cwd(), ruta), 'utf8'),
  }))
  .filter(({ fuente }) => fuente.includes('<ListaDePestanas'));

describe('Colores de comportamiento', () => {
  it('C1: lo elegido va en lima, con letra y borde Forest', () => {
    expect(clases(ELEGIDO)).toEqual(
      expect.arrayContaining([
        'bg-lime',
        'text-forest',
        'border',
        'border-forest',
      ]),
    );
    // De 1 px, como el `border` de lo no elegido: elegir no mueve nada
    expect(clases(ELEGIDO).some((c) => /^border-\[/.test(c))).toBe(false);
  });

  it('C1d: sin borde propio, el contorno es un anillo hacia dentro', () => {
    expect(clases(ELEGIDO_CON_ANILLO)).toEqual(
      expect.arrayContaining([
        ...clases(FONDO_DE_LO_ELEGIDO),
        'ring-1',
        'ring-inset',
        'ring-forest',
      ]),
    );
    expect(clases(ELEGIDO_CON_ANILLO).some((c) => c.startsWith('border'))).toBe(
      false,
    );
  });

  it('C2c: en un enlace, el mismo color con `hover:` a secas', () => {
    // `:enabled` solo existe en los controles de formulario: con `enabled:`
    // un enlace no respondería nunca
    expect(clases(AL_PASAR_EN_ENLACE)).toEqual(
      expect.arrayContaining([
        'hover:bg-contraste',
        'hover:text-sobre-contraste',
      ]),
    );
    expect(
      clases(AL_PASAR_EN_ENLACE).some((c) => c.startsWith('enabled:')),
    ).toBe(false);
  });

  it('C2b: mientras se pulsa, ya en lima', () => {
    // Con `enabled:`, como el de «encima»: a secas pesa menos que él y con
    // ratón no se vería
    expect(clases(AL_PULSAR)).toEqual([
      'enabled:active:bg-lime',
      'enabled:active:text-forest',
    ]);
  });

  it('C1b: el color de lo elegido, sin grosor de borde, para quien ya trae el suyo', () => {
    expect(clases(COLOR_DE_LO_ELEGIDO)).toEqual([
      'bg-lime',
      'text-forest',
      'border-forest',
    ]);
    expect(clases(ELEGIDO)).toEqual(
      expect.arrayContaining(clases(COLOR_DE_LO_ELEGIDO)),
    );
  });

  it('C1c: una tarjeta elegida con textos dentro los pone todos en Forest', () => {
    // En oscuro esos textos son claros: sobre la lima no se leerían
    expect(clases(ELEGIDO_CON_TEXTO_DENTRO)).toEqual(
      expect.arrayContaining([
        ...clases(COLOR_DE_LO_ELEGIDO),
        '[&_*]:text-forest',
      ]),
    );
  });

  it('C2: bajo el puntero, el color de contraste, y solo con puntero', () => {
    expect(clases(AL_PASAR)).toEqual(
      expect.arrayContaining([
        'enabled:hover:bg-contraste',
        'enabled:hover:text-sobre-contraste',
      ]),
    );
    // Un botón desactivado no responde: nada de `hover:` a secas
    expect(clases(AL_PASAR).some((c) => c.startsWith('hover:'))).toBe(false);
    // Nada que pinte sin puntero: en el móvil un toque no lo deja marcado
    expect(clases(AL_PASAR).filter((c) => /^(bg|text)-/.test(c))).toHaveLength(
      0,
    );
  });

  it('C3: la pestaña abierta es lo elegido, unida a su panel', () => {
    const abierta = clases(claseDePestana(true));

    expect(abierta).toEqual(expect.arrayContaining(clases(ELEGIDO)));
    expect(abierta).toContain('font-bold');
    expect(abierta).toContain('border-b-0');
    expect(abierta).not.toContain('enabled:hover:bg-contraste');
  });

  it('C4: la cerrada, suave, con «encima» y sin mover a las demás', () => {
    const cerrada = clases(claseDePestana(false));

    expect(cerrada).toEqual(expect.arrayContaining(clases(AL_PASAR)));
    expect(cerrada).toContain('text-tinta-suave');
    // El mismo grosor que el borde de la abierta
    expect(cerrada).toContain('border');
    expect(cerrada).toContain('border-transparent');
    expect(cerrada).toContain('border-b-0');
    expect(cerrada).not.toContain('bg-lime');
  });

  it('C5: la lista lleva la raya de tinta debajo', () => {
    expect(clases(CLASE_DE_LA_LISTA_DE_PESTANAS)).toEqual(
      expect.arrayContaining(['flex', 'border-b-[1.5px]', 'border-tinta']),
    );
  });

  /**
   * Lo que se elige pulsando (botones con `aria-pressed`, conmutadores con
   * `aria-checked`, opciones con `aria-selected`) no pinta su estado elegido
   * con el color de antes: lo toma de la regla común.
   *
   *   C8  ningún elegido en `bg-primary`, `bg-contraste` o verde, en
   *       ninguna de las dos ramas, ni con la variante `aria-selected:`
   *   C11 la lima de lo elegido no se escribe a mano fuera de la regla
   */
  const DE_ANTES =
    /(?:^|[\s'`])(?:aria-selected:)?(?:bg-primary(?:-50|-500)?(?:\/\d+)?|bg-contraste|bg-green-50|border-green-600|border-primary(?:-400)?)(?=[\s'`])/;
  const conEleccion = ficheros('src')
    .map((ruta) => ({
      ruta,
      lineas: readFileSync(resolve(process.cwd(), ruta), 'utf8').split('\n'),
    }))
    .filter(({ lineas }) =>
      lineas.some((l) => /aria-(pressed|checked|selected)=/.test(l)),
    );

  it('C9: un conmutador encendido: carril en lima con contorno y bola Forest', () => {
    expect(clases(CARRIL_ENCENDIDO)).toEqual(
      expect.arrayContaining(['bg-lime', 'ring-inset', 'ring-forest']),
    );
    // Un anillo y no un borde: el borde movería la bola
    expect(clases(CARRIL_ENCENDIDO).some((c) => c.startsWith('border'))).toBe(
      false,
    );
    expect(clases(BOLA_ENCENDIDA)).toEqual(['bg-forest']);
  });

  const conConmutador = ficheros('src')
    .map((ruta) => ({
      ruta,
      fuente: readFileSync(resolve(process.cwd(), ruta), 'utf8'),
    }))
    .filter(({ fuente }) => fuente.includes('role="switch"'));

  it.each(conConmutador)(
    'C10: el conmutador de $ruta usa el carril y la bola comunes',
    ({ fuente }) => {
      expect(fuente).toContain('CARRIL_ENCENDIDO');
      expect(fuente).toContain('BOLA_ENCENDIDA');
    },
  );

  it('hay conmutadores que mirar', () => {
    expect(conConmutador.length).toBeGreaterThanOrEqual(3);
  });

  it('C11: `bg-lime text-forest` solo se escribe en la regla común', () => {
    const todos = (dir) =>
      readdirSync(resolve(process.cwd(), dir)).flatMap((entrada) => {
        const ruta = join(dir, entrada);
        if (statSync(resolve(process.cwd(), ruta)).isDirectory())
          return todos(ruta);
        return /\.jsx?$/.test(entrada) && !entrada.includes('.test.')
          ? [ruta]
          : [];
      });
    // El «+» de Torneos y la flecha de su tarjeta, y la acción principal de las
    // pantallas de acceso: botones principales, no algo elegido
    const PERMITIDOS = [
      'src/pages/Competitions.jsx',
      'src/components/ui/clasesDeBoton.js',
    ];
    const sueltos = todos('src')
      .filter(
        (ruta) =>
          !ruta.endsWith('clasesDeComportamiento.js') &&
          !PERMITIDOS.includes(ruta),
      )
      .filter((ruta) =>
        /(?:^|[\s'`])bg-lime text-forest/.test(
          readFileSync(resolve(process.cwd(), ruta), 'utf8'),
        ),
      );

    expect(sueltos).toEqual([]);
  });

  it('hay controles de elección que mirar', () => {
    expect(conEleccion.length).toBeGreaterThan(15);
  });

  it.each(conEleccion)(
    'C8: $ruta no pinta lo elegido con el color de antes',
    ({ lineas }) => {
      const malas = [];
      lineas.forEach((linea, i) => {
        if (!/aria-(pressed|checked|selected)=/.test(linea)) return;
        // El `className` del mismo control: las líneas que le siguen
        for (let k = i; k < Math.min(lineas.length, i + 20); k += 1) {
          if (DE_ANTES.test(lineas[k]))
            malas.push(`${k + 1}: ${lineas[k].trim()}`);
        }
      });

      expect(malas).toEqual([]);
    },
  );

  /**
   * El realce suave de antes (un gris, el fondo, la tarjeta) bajo el puntero
   * solo queda en lo que no es un control: filas de tabla y de lista, opciones
   * de un menú, tarjetas enteras que se pulsan. Cada excepción, con las veces
   * que sale: un botón nuevo con ese realce pone esto en rojo.
   *
   *   C12 ningún realce suave fuera de las excepciones, ni una vez de más
   *   C13 ninguna excepción que ya no haga falta
   */
  // Con cualquier variante delante (`enabled:hover:`, `md:hover:`) y con o sin
  // opacidad; `group-hover:` y `peer-hover:` son otra cosa: pintan a un hijo
  const REALCE_SUAVE =
    /(?<![\w-])(?:[a-z-]+:)*hover:bg-(?:gray-(?:50|100|200|300)|fondo|tarjeta|linea|borde|trazo|contorno|white|primary-(?:50|100)|primary\/(?:5|10|20)|sand|realce|black\/\d+)(?:\/\d+)?(?![\w/-])/g;
  const FILAS_Y_TARJETAS = {
    // Filas de tabla y la fila de cada elemento en móvil
    'components/admin/AdminCompetitionsTable.jsx': 2,
    'components/admin/AdminUsersTable.jsx': 2,
    'components/golf_course/GolfCourseTable.jsx': 1,
    // Opciones de un menú o de una lista de resultados
    'components/competition/AccionesDeLaFicha.jsx': 1,
    'components/friend/AddFriendModal.jsx': 1,
    'components/golf_course/GolfCourseSearchBox.jsx': 3,
    'components/invitation/SendInvitationModal.jsx': 2,
    'components/layout/Header.jsx': 4,
    'components/layout/HeaderAuth.jsx': 4,
    'components/profile/PlayerProfileMenu.jsx': 2,
    // Tarjetas y filas enteras que se pulsan
    'components/competition/detail/SolicitudesDeInscripcion.jsx': 1,
    'components/dashboard/PlayerStatsCards.jsx': 1,
    'components/dashboard/RecentMatches.jsx': 1,
    'components/enrollment/EnrollmentRequestModal.jsx': 1,
    'components/profile/GamesTogether.jsx': 1,
    'components/schedule/GenerateMatchesModal.jsx': 2,
    'components/schedule/RoundCard.jsx': 1,
    'pages/BrowseCompetitions.jsx': 2,
    'pages/Dashboard.jsx': 1,
    'pages/EnvelopePage.jsx': 1,
    // La casilla con un golpe ya anotado y la celda que corrige el organizador:
    // enseñan números con su propio color, que sobre el relleno no se leerían
    'components/quick_match/QuickMatchHoleInput.jsx': 1,
    'components/scoring/HuecosDelHoyo.jsx': 1,
    'components/scoring/TarjetasDeLaPartida.jsx': 1,
    // Acciones que borran o retiran, con su letra roja o de aviso: conservan
    // su color bajo el puntero
    'components/competition/AgendaDeLaCompeticion.jsx': 1,
    'components/competition/CompetitionGolfCoursesSection.jsx': 2,
    'components/competition/FranjasDeLaCompeticion.jsx': 1,
    'components/competition/PlazasDeLaFranja.jsx': 1,
    'components/competition/StrokePlaySettings.jsx': 1,
    'components/competition/create/CamposDeUnPais.jsx': 1,
    'components/competition/create/SelectorDePaisVecino.jsx': 1,
    'components/competition/detail/FilaDeAprobado.jsx': 1,
    'components/profile/AvatarPicker.jsx': 1,
    'components/quick_match/PestanaDeAnotarRapida.jsx': 1,
    'pages/Profile.jsx': 1,
    'pages/quick_match/MyQuickMatchesPage.jsx': 1,
    'components/scoring/PestanaDeAnotar.jsx': 1,
    'components/scoring/RetiradaDelFourball.jsx': 3,
    // La «x» de un aviso, sobre el color del aviso
    'utils/toast.js': 1,
  };
  const todoElCodigo = (dir) =>
    readdirSync(resolve(process.cwd(), dir)).flatMap((entrada) => {
      const ruta = join(dir, entrada);
      if (statSync(resolve(process.cwd(), ruta)).isDirectory())
        return todoElCodigo(ruta);
      return /\.jsx?$/.test(entrada) && !entrada.includes('.test.')
        ? [ruta]
        : [];
    });
  const realces = Object.fromEntries(
    todoElCodigo('src')
      .map((ruta) => [
        ruta.replace(/^src\//, ''),
        (
          readFileSync(resolve(process.cwd(), ruta), 'utf8').match(
            REALCE_SUAVE,
          ) ?? []
        ).length,
      ])
      .filter(([, veces]) => veces > 0),
  );

  it('C12: el realce suave bajo el puntero solo queda en filas y tarjetas', () => {
    const deMas = Object.entries(realces)
      .filter(([ruta, veces]) => veces > (FILAS_Y_TARJETAS[ruta] ?? 0))
      .map(
        ([ruta, veces]) =>
          `${ruta}: ${veces} veces, se permiten ${FILAS_Y_TARJETAS[ruta] ?? 0}`,
      );

    expect(deMas).toEqual([]);
  });

  it('C13: ninguna excepción sobra', () => {
    const sobran = Object.entries(FILAS_Y_TARJETAS)
      .filter(([ruta, veces]) => (realces[ruta] ?? 0) < veces)
      .map(
        ([ruta, veces]) => `${ruta}: dice ${veces}, hay ${realces[ruta] ?? 0}`,
      );

    expect(sobran).toEqual([]);
  });

  it('hay pantallas con pestañas que mirar', () => {
    expect(conPestanas.length).toBeGreaterThan(8);
  });

  it.each(conPestanas)(
    'C6: $ruta pinta sus pestañas con la regla común',
    ({ fuente }) => {
      const usos = fuente.match(/claseDePestana=\{[\s\S]*?\/>/g) ?? [];

      expect(usos.length).toBeGreaterThan(0);
      for (const uso of usos) {
        expect(uso).toContain('claseDePestana(abierta)');
        // Ningún color propio: ni el de antes ni otro
        expect(uso).not.toMatch(
          /(?:^|[\s'`])(?:hover:)?(?:bg|text|border)-(?!\[)/,
        );
      }
    },
  );

  it.each(conPestanas)(
    'C7: $ruta usa la raya común en la lista',
    ({ fuente }) => {
      const listas =
        fuente.match(/<ListaDePestanas[\s\S]*?claseDePestana=/g) ?? [];

      for (const lista of listas) {
        expect(lista).toContain('CLASE_DE_LA_LISTA_DE_PESTANAS');
        expect(lista).not.toMatch(/border-(gray|linea)/);
      }
    },
  );
});
