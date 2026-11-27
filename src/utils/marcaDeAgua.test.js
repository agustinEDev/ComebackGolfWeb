import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DIBUJOS_DE_MARCA_DE_AGUA,
  marcaDeAgua,
  marcaDeAguaDeLaPestana,
  marcaDeAguaDelMonograma,
} from './marcaDeAgua';
import {
  PESTANAS_DEL_PARTIDO,
  PESTANAS_DE_LA_PARTIDA_DEL_JUGADOR,
  PESTANAS_DE_LA_PARTIDA_DE_QUIEN_MIRA,
  PESTANAS_DE_LA_RAPIDA,
} from './pestanasDeLaAnotacion';

/**
 * Las marcas de agua: qué dibujo lleva cada pantalla (reparto de Agustín, 25 nov
 * 2026) y cómo tienen que ser los ficheros.
 *
 *   #   qué                                      | por qué
 *   ----|------------------------------------------|---------------------------------
 *   M1  cada pantalla del reparto, su dibujo      | y ninguna otra: Inicio, Perfil,
 *       (vacía, ninguno: `vacia ? null : dibujo`; | lleva delante el suyo, y dos
 *       27 nov 2026)                              | dibujos a la vez sobran
 *                                                 | ficha, formularios y acceso van
 *                                                 | llenos y el dibujo no se vería
 *   M2  en la anotación: tarjeta al anotar y en la| la tabla de la tarjeta va
 *       tarjeta de resultados, trofeo en la       | translúcida y lo deja ver
 *       clasificación                             | (Agustín, 26 nov 2026)
 *   M3  un dibujo desconocido no pone nada        | ni una clase a medias
 *   M4  cada dibujo tiene su fichero y su clase,  | uno sin clase no se ve; una clase
 *       y no sobra ninguno                        | sin fichero rompe la compilación
 *   M5  los ficheros son solo dibujo              | sin sello de procedencia, sin
 *                                                 | metadatos ni nada que se ejecute
 *   M6  llevan su color dentro, translúcido       | de fondo no hay `currentColor`:
 *                                                 | saldrían en negro puro
 *   M7  van en una capa FIJA a la pantalla, por   | se ven al abrir, sin bajar hasta
 *       debajo de todo y sin recibir toques       | el final, y el contenido pasa por
 *                                                 | delante (Agustín, 26 nov 2026)
 *   M8  el contenedor pierde su fondo, fuera de   | con `bg-fondo` taparía la capa;
 *       las capas de Tailwind                     | dentro de una capa, la utilidad
 *                                                 | de la página ganaría
 *   M9  nada que cree contexto de apilado ni      | atraparía a los diálogos; y el
 *       `background-attachment`                   | fondo fijo no va en Safari de iOS
 *   M10 la capa acaba encima de la barra inferior | la barra taparía la base del
 *       (en ancho, que no hay barra, no la resta) | dibujo
 *   L1  la landing lleva el MONOGRAMA de su        | Agustín, 26 nov 2026: «el logo
 *       cabecera, en grande y centrado            | que está en el header, en grande»
 *   L2  en claro el sello Forest y en oscuro el   | como el de la cabecera
 *       lima, los dos muy tenues bajo un velo     |
 *   L3  fijo detrás de TODA la landing: ni la     | con fondo propio lo taparían un
 *       página, ni sus secciones, ni lo que las   | tramo entero del scroll; y no se
 *       envuelve; y cabe en el alto de la pantalla| cortaba en un portátil
 *   L4  Inicio lleva el mismo monograma y conserva | «falta algo en el panel»; y
 *       su dibujo del final                        | quiso los dos (26 nov 2026)
 *   L5  en Inicio, el sello y el recorrido del pie | el recorrido va sobre una franja
 *       nunca se tocan                             | opaca con fundido que tapa al sello
 *   M11 la página con marca no trae un fondo que  | un `bg-*` distinto del de la app
 *       la tape: ni otro color sin dárselo a la   | cambiaría de color; uno en `style`
 *       capa, ni un fondo en `style`              | gana a la regla y esconde la capa
 */
const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

const REPARTO = {
  'src/pages/Competitions.jsx': 'arbol-calle',
  'src/pages/BrowseCompetitions.jsx': 'arbol-calle',
  'src/pages/quick_match/MyQuickMatchesPage.jsx': 'bola-tee',
  'src/pages/player/UpcomingMatchesPage.jsx': 'bolsa',
  'src/pages/player/MyInvitationsPage.jsx': 'carrito',
  'src/pages/player/FriendsPage.jsx': 'guante',
  'src/pages/player/FeedPage.jsx': 'green-bandera',
  'src/pages/public/LeaderboardPage.jsx': 'trofeo',
  'src/pages/public/NotFound.jsx': 'bunker-rastrillo',
  'src/pages/public/Unauthorized.jsx': 'bunker-rastrillo',
};
const DE_LA_ANOTACION = [
  'src/pages/player/ScoringPage.jsx',
  'src/pages/player/GroupScoringPage.jsx',
  'src/pages/quick_match/QuickMatchScoringPage.jsx',
];

// La portada pública lleva el monograma de la marca, no un dibujo
const LANDING = 'src/pages/Landing.jsx';
// E Inicio, el mismo (Agustín, 26 nov 2026: «falta algo en el panel»)
const INICIO = 'src/pages/Dashboard.jsx';

const jsxDe = (carpeta) =>
  readdirSync(resolve(process.cwd(), carpeta), {
    recursive: true,
    withFileTypes: true,
  })
    .filter(
      (f) => f.isFile() && /\.jsx$/.test(f.name) && !/\.test\./.test(f.name),
    )
    .map((f) =>
      `${f.parentPath ?? f.path}/${f.name}`.replace(`${process.cwd()}/`, ''),
    );

describe('las marcas de agua', () => {
  it('M1: cada pantalla del reparto lleva su dibujo, en todas sus salidas', () => {
    for (const [fichero, dibujo] of Object.entries(REPARTO)) {
      // Directa, o quitada mientras la pantalla está vacía: `x ? null : 'dibujo'`
      const usos = [
        ...leer(fichero).matchAll(
          /marcaDeAgua\((?:[^()?]+\?\s*null\s*:\s*)?'([^']*)'\)/g,
        ),
      ].map((m) => m[1]);

      // Tantas como contenedores de página pinta el fichero: el de cargando
      // también, o el dibujo aparecería de golpe al acabar la carga
      const contenedores = leer(fichero).match(
        /className=\{`[^`]*\$\{PANTALLA_MENOS_BARRA_INFERIOR\}/g,
      );
      expect(usos, fichero).toHaveLength(contenedores.length);
      expect(new Set(usos), fichero).toEqual(new Set([dibujo]));
    }
  });

  it('M1: y ninguna otra pantalla ni componente lleva una', () => {
    const conMarca = [...jsxDe('src/pages'), ...jsxDe('src/components')].filter(
      (f) => /marcaDeAgua/.test(leer(f)),
    );

    expect(conMarca.sort()).toEqual(
      [...Object.keys(REPARTO), ...DE_LA_ANOTACION, LANDING, INICIO].sort(),
    );
  });

  it('M2: al anotar y en la tarjeta de resultados, la tarjeta; en la clasificación, el trofeo', () => {
    // Con `marca-de-agua-alta`: abajo va fija la barra de entregar la tarjeta
    expect(marcaDeAguaDeLaPestana('input')).toBe(
      'marca-de-agua agua-tarjeta-lapiz marca-de-agua-alta',
    );
    for (const clasificacion of [
      'leaderboard',
      'standings',
      'classification',
    ]) {
      expect(marcaDeAguaDeLaPestana(clasificacion), clasificacion).toBe(
        'marca-de-agua agua-trofeo marca-de-agua-alta',
      );
    }
    // La tarjeta de resultados también lo lleva, y se ve a través de la tabla,
    // que va translúcida (Agustín, 26 nov 2026; antes, nada)
    for (const tarjeta of ['scorecard', 'cards']) {
      expect(marcaDeAguaDeLaPestana(tarjeta), tarjeta).toBe(
        'marca-de-agua agua-tarjeta-lapiz marca-de-agua-alta',
      );
    }
    for (const ninguna of [null, undefined, 'otra']) {
      expect(marcaDeAguaDeLaPestana(ninguna), String(ninguna)).toBe('');
    }
  });

  it('M2: no queda ninguna pestaña de la anotación sin decidir', () => {
    const todas = new Set([
      ...PESTANAS_DEL_PARTIDO,
      ...PESTANAS_DE_LA_PARTIDA_DEL_JUGADOR,
      ...PESTANAS_DE_LA_PARTIDA_DE_QUIEN_MIRA,
      ...PESTANAS_DE_LA_RAPIDA,
    ]);

    // Una pestaña nueva tiene que entrar aquí, con dibujo o sin él
    expect(todas).toEqual(
      new Set([
        'input',
        'leaderboard',
        'standings',
        'classification',
        'scorecard',
        'cards',
      ]),
    );
  });

  it('M2: las tres pantallas de anotación lo piden con su pestaña activa', () => {
    for (const fichero of DE_LA_ANOTACION) {
      const codigo = leer(fichero);
      const contenedores = codigo.match(/min-h-screen bg-fondo text-tinta/g);
      const usos = codigo.match(
        /marcaDeAguaDeLaPestana\((activeTab|activa)\)/g,
      );

      // También las salidas de cargando y de error
      expect(contenedores.length, fichero).toBeGreaterThan(1);
      expect(usos, fichero).toHaveLength(contenedores.length);
    }
  });

  it('M3: un dibujo que no existe no pone ninguna clase', () => {
    for (const malo of ['gorra', '', null, undefined, 'trofeo agua-x']) {
      expect(marcaDeAgua(malo), String(malo)).toBe('');
    }
    expect(marcaDeAgua('trofeo')).toBe('marca-de-agua agua-trofeo');
  });

  it('M4: cada dibujo tiene su fichero y su clase, y no sobra ninguno', () => {
    const ficheros = readdirSync(
      resolve(process.cwd(), 'src/assets/ilustraciones'),
    )
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.replace('.svg', ''));
    const css = leer('src/index.css');
    const clases = [
      ...css.matchAll(
        /\.agua-([a-z-]+)::before \{\s*background-image: url\('\.\/assets\/ilustraciones\/([a-z-]+)\.svg'\);\s*\}/g,
      ),
    ];

    expect(ficheros.sort()).toEqual([...DIBUJOS_DE_MARCA_DE_AGUA].sort());
    expect(clases.map((c) => c[1]).sort()).toEqual(
      [...DIBUJOS_DE_MARCA_DE_AGUA].sort(),
    );
    // Cada clase, con su propio fichero
    for (const [, clase, fichero] of clases) expect(fichero).toBe(clase);
    // Y todos se usan en alguna pantalla
    expect(
      new Set([...Object.values(REPARTO), 'tarjeta-lapiz', 'trofeo']),
    ).toEqual(new Set(DIBUJOS_DE_MARCA_DE_AGUA));
  });

  it('M5: los ficheros son solo dibujo: sin metadatos ni sello de procedencia', () => {
    // También las siluetas de `DibujoDeMarca` (revisión, 27 nov 2026)
    const siluetas = readdirSync(
      resolve(process.cwd(), 'src/assets/ilustraciones/silueta'),
    ).map((f) => `silueta/${f.replace(/\.svg$/, '')}`);
    for (const dibujo of [...DIBUJOS_DE_MARCA_DE_AGUA, ...siluetas]) {
      const svg = leer(`src/assets/ilustraciones/${dibujo}.svg`);
      const etiquetas = new Set(
        [...svg.matchAll(/<([a-zA-Z][\w:-]*)/g)].map((m) => m[1]),
      );

      expect([...etiquetas].sort(), dibujo).toEqual(
        // Solo trazos, a línea limpia como el dibujo del panel
        // (`TrazoDeRecorrido`): con desenfoque desentonaban (Agustín, 25 nov
        // 2026), y un filtro se recalcula en cada repintado
        ['g', 'path', 'svg'].sort(),
      );
      expect(svg, dibujo).not.toMatch(
        /c2pa|metadata|xlink|href|<script|on\w+=|<!|style|filter|@import|data:|https?:\/\/(?!www\.w3\.org\/2000\/svg")/i,
      );
    }
  });

  it('M6b: las siluetas, opacas y en negro: la máscara toma de ellas la forma', () => {
    for (const f of readdirSync(
      resolve(process.cwd(), 'src/assets/ilustraciones/silueta'),
    )) {
      const svg = leer(`src/assets/ilustraciones/silueta/${f}`);
      expect(svg, f).not.toMatch(/opacity/);
      expect(svg, f).toContain('stroke="#000"');
    }
  });

  it('M6: llevan su color dentro, translúcido, y no dependen del color del texto', () => {
    for (const dibujo of DIBUJOS_DE_MARCA_DE_AGUA) {
      const svg = leer(`src/assets/ilustraciones/${dibujo}.svg`);

      expect(svg, dibujo).not.toContain('currentColor');
      expect(svg, dibujo).toContain('stroke="#7f8a7d" opacity="0.24"');
      expect(svg.match(/stroke="/g), dibujo).toHaveLength(1);
    }
  });

  const lasMarcas = () => {
    const css = leer('src/index.css');
    // Solo su bloque, de un comentario al otro: lo que se añada después en la
    // hoja no es asunto de estos casos
    return css.slice(
      css.indexOf('/* Las marcas de agua'),
      css.indexOf('/* Fin de las marcas de agua */'),
    );
  };
  // La regla de un selector, a principio de línea. Buscando el texto tal cual,
  // sin montar una expresión regular con el selector dentro
  const reglaDe = (selector, css = lasMarcas()) => {
    const texto = `\n${css}`;
    const apertura = `\n${selector} {`;
    const inicio = texto.indexOf(apertura);
    if (inicio === -1) return '';
    const desde = inicio + apertura.length;
    return texto.slice(desde, texto.indexOf('}', desde));
  };

  it('M7: van en una capa fija a la pantalla, por debajo de todo y sin recibir toques', () => {
    const capa = reglaDe('.marca-de-agua::before');

    expect(capa).toMatch(/content: '';/);
    expect(capa).toMatch(/position: fixed;/);
    expect(capa).toMatch(/inset: 0;/);
    expect(capa).toMatch(/z-index: -1;/);
    expect(capa).toMatch(/pointer-events: none;/);
    expect(capa).toMatch(/background-repeat: no-repeat;/);
    expect(capa).toMatch(/background-position: right -3rem bottom 1\.5rem;/);
    // En la anotación, por encima de la barra de entregar la tarjeta: lo que
    // la página le reserva más la zona segura, también en ancho
    const alta = [
      ...lasMarcas().matchAll(/\.marca-de-agua-alta::before \{([^}]*)\}/g),
    ].map((m) => m[1].replace(/\s+/g, ' '));
    expect(alta).toHaveLength(2);
    expect(alta[0]).toMatch(
      /background-position: right -3rem bottom calc\(9rem \+ env\(safe-area-inset-bottom, 0px\)\);/,
    );
    expect(alta[1]).toMatch(
      /background-position: right 2rem bottom calc\(9rem \+ env\(safe-area-inset-bottom, 0px\)\);/,
    );
  });

  it('M8: el contenedor pierde su fondo, y fuera de las capas de Tailwind', () => {
    const todas = lasMarcas();

    // El contenedor y el `body`: el `<html>` tiene fondo propio, así que el del
    // `body` se pintaría encima de la capa. En reglas SEPARADAS: sin `:has()`
    // el navegador descarta la lista entera y el contenedor seguiría opaco
    expect(todas).toMatch(
      /\n\.marca-de-agua \{\s*background-color: transparent;\s*\}/,
    );
    expect(todas).toMatch(
      /\nbody:has\(\.marca-de-agua\) \{\s*background-color: transparent;\s*\}/,
    );
    expect(todas).not.toMatch(/,\s*body:has/);
    expect(leer('src/index.css')).toMatch(
      /\n {2}html \{\s*background-color: var\(--cbg-fondo\);/,
    );
    // Fuera de `@layer`: lo que no va en capa puede con las utilidades
    expect(todas).not.toMatch(/@layer/);
  });

  it('M9: nada que cree contexto de apilado en el contenedor, ni fondo fijo', () => {
    const todas = lasMarcas().replace(/\/\*[\s\S]*?\*\//g, '');
    const contenedor = [
      ...todas.matchAll(
        /(?:^|\n)(?:body:has\()?\.marca-de-agua\)? \{([^}]*)\}/g,
      ),
    ]
      .map((m) => m[1])
      .join('');
    expect(contenedor).toMatch(
      /background-color: transparent;[\s\S]*background-color: transparent;/,
    );

    expect(contenedor).not.toMatch(
      /position|z-index|isolation|transform|opacity|filter|contain|perspective|clip-path|blend/,
    );
    expect(todas).not.toMatch(
      /isolation|attachment|transform|filter|will-change|contain:|perspective|clip-path|blend|opacity/,
    );
    // El único `z-index` y la única posición son los de la capa
    expect(todas.match(/z-index/g)).toHaveLength(1);
    expect(todas.match(/(?<!background-)position:/g)).toHaveLength(1);
  });

  it('M10: la capa acaba encima de la barra inferior; en ancho no la resta', () => {
    const todas = lasMarcas();
    const capa = reglaDe('.marca-de-agua::before');
    const enAncho = todas.slice(todas.indexOf('@media (min-width: 768px)'));

    expect(capa.replace(/\s+/g, ' ')).toMatch(
      /bottom: calc\( var\(--alto-barra-inferior, 0px\) \+ var\(--alto-aviso-instalar, 0px\) \);/,
    );
    expect(enAncho).toMatch(
      /\.marca-de-agua::before \{\s*bottom: var\(--alto-aviso-instalar, 0px\);/,
    );
  });

  it('M11: la página que lleva marca no le pone un fondo que la tape', () => {
    const conMarca = jsxDe('src/pages').filter((ruta) =>
      /marcaDeAgua(?:DeLaPestana|DelMonograma)?\(/.test(
        leer(ruta).replace(/import[^;]*;/g, ''),
      ),
    );
    expect(conMarca.length).toBeGreaterThanOrEqual(15);
    expect(conMarca).toEqual(expect.arrayContaining([LANDING, INICIO]));

    const fallos = [];
    for (const ruta of conMarca) {
      const lineas = leer(ruta).split('\n');
      lineas.forEach((linea, i) => {
        if (
          !/className=.*marcaDeAgua(?:DeLaPestana|DelMonograma)?\(/.test(linea)
        )
          return;
        // Un fondo que no es el de la aplicación se le da a la capa, con el
        // mismo valor: si no, la pantalla cambiaría de color
        for (const [, color] of linea.matchAll(
          /(?<![\w:-])bg-([a-z]+-\d+)\b/g,
        )) {
          if (!linea.includes(`[--fondo-de-agua:var(--color-${color})]`)) {
            fallos.push(`${ruta}:${i + 1} bg-${color} sin --fondo-de-agua`);
          }
        }
        // Y nunca en `style`: gana a la regla y deja la capa debajo
        const etiqueta = lineas
          .slice(i, i + 14)
          .join('\n')
          .split('>')[0];
        if (/backgroundColor|background:/.test(etiqueta)) {
          fallos.push(`${ruta}:${i + 1} fondo en style`);
        }
      });
    }
    expect(fallos).toEqual([]);
  });

  describe('el monograma de la landing y de Inicio', () => {
    const sinComentarios = (ruta) =>
      leer(ruta)
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        .replace(/^\s*\/\/.*$/gm, '');
    // La etiqueta que abre el contenedor de la página: la que lleva la marca
    const contenedorDe = (ruta) =>
      sinComentarios(ruta).match(
        /<div\s[^>]*marcaDeAguaDelMonograma\(\)[^>]*>/g,
      ) || [];
    // Cualquier fondo de Tailwind, también con variante (`md:`), con valor
    // arbitrario (`bg-[#fff]`) o con opacidad
    const FONDO = /(?:^|[\s"'`:])bg-(?:\[[^\]]*\]|[\w-]+)(?:\/[\w.[\]%]+)?/g;
    const fondosDe = (etiqueta) =>
      (etiqueta.match(FONDO) || []).map((f) => f.replace(/^[\s"'`:]/, ''));

    it('L1: la landing lleva el monograma, en grande y centrado', () => {
      expect(marcaDeAguaDelMonograma()).toBe(
        'marca-de-agua marca-de-agua-monograma',
      );
      const [contenedor, ...mas] = contenedorDe(LANDING);
      expect(mas).toEqual([]);
      // Su fondo de siempre se lo da a la capa, y él no lleva ninguno
      expect(contenedor).toContain('[--fondo-de-agua:var(--color-white)]');
      expect(fondosDe(contenedor)).toEqual([]);

      const capa = reglaDe('.marca-de-agua-monograma::before').replace(
        /\s+/g,
        ' ',
      );
      expect(capa).toMatch(/background-position: 0 0, center 58%;/);
      // A lo ancho de la pantalla, con tope en escritorio y también por el
      // alto: en un portátil se cortaba por arriba y por abajo
      expect(capa).toMatch(
        /background-size: auto, min\(120vw, 45rem, 75vh\) auto;/,
      );
    });

    it('L2: sello Forest en claro y lima en oscuro, bajo un velo del fondo', () => {
      const todas = lasMarcas().replace(/\s+/g, ' ');
      const capa = reglaDe('.marca-de-agua-monograma::before').replace(
        /\s+/g,
        ' ',
      );

      expect(capa).toMatch(/--sello: url\('\/brand\/stamp-deep\.svg'\);/);
      expect(capa).toMatch(
        /--velo: color-mix\( in srgb, var\(--fondo-de-agua, var\(--cbg-fondo\)\) 93%, transparent \);/,
      );
      // El velo, primero: es el que queda encima
      expect(capa).toMatch(
        /background-image: linear-gradient\(var\(--velo\), var\(--velo\)\), var\(--sello\);/,
      );
      // En oscuro cambia SOLO el fichero: la pila de fondos no se repite
      expect(todas).toMatch(
        /:root\[data-tema='oscuro'\] \.marca-de-agua-monograma::before \{ --sello: url\('\/brand\/stamp-acid\.svg'\); \}/,
      );
      expect(todas.match(/background-image: linear-gradient/g)).toHaveLength(1);
      // Los dos sellos existen donde se sirven
      for (const sello of ['stamp-deep.svg', 'stamp-acid.svg']) {
        expect(leer(`public/brand/${sello}`)).toMatch(/<svg/);
      }
      // Y va después del bloque de escritorio, o este le ganaría el tamaño
      expect(todas.indexOf('.marca-de-agua-monograma::before')).toBeGreaterThan(
        todas.indexOf('@media (min-width: 768px)'),
      );
    });

    it('L3: en la landing, ni las secciones ni lo que las envuelve lo tapan', () => {
      const codigo = sinComentarios(LANDING);
      const secciones = codigo.match(/<section\b[^>]*>/g) || [];
      const envoltorio =
        codigo.match(/<div className="layout-container[^>]*>/g) || [];

      expect(secciones.length).toBeGreaterThanOrEqual(4);
      expect(envoltorio).toHaveLength(1);
      // De fondo, como mucho la franja arena translúcida
      const fondos = [...secciones, ...envoltorio].flatMap(fondosDe);
      expect(fondos).toEqual(['bg-gray-50/65']);
    });

    it('L4: Inicio lleva el mismo monograma, y conserva su dibujo del final', () => {
      const [contenedor, ...mas] = contenedorDe(INICIO);

      // Una sola salida pinta la página: la de cargando es la espera común de
      // toda la aplicación, sin marca
      expect(mas).toEqual([]);
      expect(contenedor).toContain('${PANTALLA_MENOS_BARRA_INFERIOR}');
      // Sobre el fondo de la aplicación: no hace falta dárselo a la capa
      expect(fondosDe(contenedor)).toEqual(['bg-fondo']);
      // El recorrido del campo sigue al pie del panel
      expect(leer(INICIO)).toMatch(/<TrazoDeRecorrido\b/);
    });

    it('L5: en Inicio, el sello y el recorrido del pie nunca se tocan', () => {
      // El recorrido va sobre una franja del color del fondo, a todo el ancho,
      // que tapa el sello al llegar al final. Empieza con un fundido —el sello
      // desaparece poco a poco, no cortado— que es el arranque de la propia
      // franja: nunca una capa encima de lo de arriba (Agustín, 26 nov 2026)
      const codigo = sinComentarios(INICIO);
      const franja =
        codigo.match(/<div\s[^>]*data-testid="pie-del-panel"[^>]*>/)?.[0] ?? '';

      // De transparente al fondo en 4rem, y opaca desde ahí
      expect(franja).toContain(
        'bg-[linear-gradient(to_bottom,transparent,var(--cbg-fondo)_4rem)]',
      );
      // El recorrido empieza donde la franja ya es opaca
      expect(franja).toMatch(/\bpt-16\b/);
      // De borde a borde y hasta el final del panel, deshaciendo el margen
      // de la página; sin `100vw`, que con barra de scroll clásica se sale
      expect(franja).toMatch(/(?<![\w-])-mx-4\b/);
      expect(franja).toMatch(/(?<![\w:])-mb-5\b/);
      expect(franja).not.toMatch(/w-screen|vw/);
      expect(codigo).toMatch(
        /className="px-4 md:px-40 flex flex-1 justify-center py-5"/,
      );
      // Solo en móvil, como el recorrido
      expect(franja).toMatch(/\bmd:hidden\b/);
      // Sin capas que se salgan de la franja: taparían lo de arriba
      expect(franja).not.toMatch(/before:|after:|absolute|-mt-/);
      // Y el recorrido va DENTRO de la franja
      const dentro = codigo.slice(codigo.indexOf(franja) + franja.length);
      expect(dentro.indexOf('<TrazoDeRecorrido')).toBeGreaterThan(-1);
      expect(dentro.indexOf('<TrazoDeRecorrido')).toBeLessThan(
        dentro.indexOf('</div>'),
      );
    });
  });
});
