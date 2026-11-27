import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join, relative, sep } from 'path';

/**
 * La franja de arriba —reloj, cobertura, bateria— no la pinta la pantalla de
 * espera: la pinta el fondo del documento. Sin fondo en `html` quedaba una
 * banda de otro color cruzando la pantalla en la app instalada. La regla vive
 * en dos sitios a proposito: el estilo en linea de `index.html` se aplica desde
 * el primer instante, e `index.css` la mantiene cuando ya manda React.
 *
 * Con la marca ComeBack Golf el ARRANQUE sigue al tema del sistema, instalada
 * o no: Off White en claro y Deep Forest en oscuro, como lo que viene detras
 * (25 nov 2026). Las esperas ENTRE pantallas siguen al tema elegido. Antes la aplicacion
 * instalada arrancaba en otro color, y hubo que distinguir arranque de
 * transicion para que una espera de dentro no pareciera un reinicio (FE #492).
 */
describe('el fondo del documento durante la espera', () => {
  const lee = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  /** El bloque de una media query, contando llaves. */
  const bloqueDe = (fuente, consulta) => {
    const desde = fuente.indexOf(`@media (${consulta})`);
    if (desde === -1) return '';
    let nivel = 0;
    for (let i = fuente.indexOf('{', desde); i < fuente.length; i += 1) {
      if (fuente[i] === '{') nivel += 1;
      if (fuente[i] === '}') {
        nivel -= 1;
        if (nivel === 0) return fuente.slice(desde, i + 1);
      }
    }
    return fuente.slice(desde);
  };

  it('index.html pinta el documento y la capa de Off White mientras se espera', () => {
    const html = lee('index.html');

    expect(html).toMatch(/html:has\(#arranque\)\s*\{\s*background:\s*#f8f7f2/);
    expect(html).toMatch(/#arranque\s*\{[^}]*background:\s*#f8f7f2/);
  });

  it('el arranque sigue al tema del sistema, como lo que viene detrás', () => {
    // El oscuro es de toda la aplicación (24 nov 2026): con el sistema en
    // oscuro, una capa de arranque en Sand era un fogonazo claro antes de una
    // pantalla oscura. Antes era al revés: lo de detrás iba en claro
    const html = lee('index.html');
    const oscuro = bloqueDe(html, 'prefers-color-scheme: dark');

    expect(oscuro).toMatch(
      /html:has\(#arranque\)\s*\{\s*background:\s*#222d24/,
    );
    expect(oscuro).toMatch(/#arranque\s*\{[^}]*background:\s*#222d24/);
    // El stamp, en lima: el Deep Forest no se vería sobre su mismo color
    expect(html).toMatch(
      /<source[^>]*prefers-color-scheme: dark[^>]*stamp-acid\.svg/,
    );
  });

  it('index.css pinta el documento con el fondo del tema, siempre', () => {
    const css = lee('src/index.css');

    expect(css).toMatch(/html\s*\{\s*background-color:\s*var\(--cbg-fondo\)/);
    expect(css).toMatch(
      /\.pantalla-de-espera\s*\{[^}]*background:\s*var\(--cbg-fondo\)/,
    );
  });

  it('la espera es la misma instalada o no: nada la cambia por `display-mode`', () => {
    // Una cara propia para la aplicacion instalada obligaba a distinguir el
    // arranque de las transiciones de dentro, que con ese color parecian un
    // reinicio (FE #492)
    for (const ruta of ['index.html', 'src/index.css']) {
      expect(bloqueDe(lee(ruta), 'display-mode: standalone')).toBe('');
    }
  });

  it('el fondo del documento va condicionado en index.html, no puesto en el html a secas', () => {
    // A secas, el de la capa se quedaria toda la sesion por encima del de
    // `index.css`, que es el que sigue al tema elegido
    expect(lee('index.html')).not.toMatch(/(^|\n)\s*html\s*\{/);
  });
});

/**
 * La MECANICA de la cortina se prueba en `hooks/useCortinaDeArranque.test.jsx`
 * y en `utils/cortinaDeArranque.test.js`, sobre el codigo de verdad. Lo que
 * falta es atarla a donde tiene que estar: si nadie la monta, o si se monta en
 * un sitio donde no llega a correr, aquellos tests siguen en verde y la
 * aplicacion arranca rota. La misma forma que usan `toastPlacement.test.jsx` y
 * `rutasPublicas.test.js`.
 */
describe('donde vive la cortina del arranque', () => {
  const lee = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

  it('App.jsx la engancha a la ruta que hay en pantalla', () => {
    expect(lee('src/App.jsx')).toContain(
      'useCortinaDeArranque(location.pathname)',
    );
  });

  it('main.jsx no la retira: ahi React todavia no ha pintado nada', () => {
    expect(lee('src/main.jsx')).not.toContain("getElementById('arranque')");
  });

  it('solo el modulo de la cortina toca la capa', () => {
    // Un `remove()` suelto por ahi la levantaria antes de tiempo y nadie se
    // enteraria: volveria el pantallazo, y esta vez sin dejar rastro
    const sospechosos = [
      'src/App.jsx',
      'src/main.jsx',
      'src/pages/Dashboard.jsx',
      'src/pages/AppStart.jsx',
    ];

    for (const ruta of sospechosos) {
      expect(lee(ruta), `${ruta} manipula la capa por su cuenta`).not.toContain(
        "getElementById('arranque')",
      );
    }
  });

  it('las TRES pantallas de destino avisan', () => {
    // Una por cada entrada de `RUTAS_QUE_AVISAN`. Sin el aviso, esa ruta se come
    // el plazo entero en cada arranque, y la portada es justo por donde entran
    // los iconos anteriores a FE #465
    expect(lee('src/pages/Dashboard.jsx')).toContain('laPantallaEstaLista()');
    expect(lee('src/pages/AppStart.jsx')).toContain('laPantallaEstaLista()');
    expect(lee('src/pages/Landing.jsx')).toContain('laPantallaEstaLista()');
  });

  it('las dos pantallas de error la levantan', () => {
    // Antes la retirada vivia FUERA de los error boundaries por esto: dentro,
    // una excepcion durante el render dejaba la capa tapando la pantalla de
    // error hasta que el CSS la apartaba seis segundos despues. Ahora la
    // decision es de la ruta y va dentro, asi que cada fallback tiene que
    // levantarla el mismo.
    // La de un fallo de render vive en su componente desde el 25 oct 2026
    expect(lee('src/components/errors/ErrorFallback.jsx')).toMatch(
      /const ErrorFallback[\s\S]{0,600}retiraLaCortina\(\)/,
    );
    expect(lee('src/components/errors/LazyLoadErrorBoundary.jsx')).toContain(
      'retiraLaCortina()',
    );
  });
});

/**
 * Las dos mitades del arranque —la capa de `index.html` y la pantalla de React
 * que la releva— tienen que pintar el MISMO dibujo (FE #495). El anillo puesto
 * en una sola de las dos apareceria de la nada a mitad del arranque, que es la
 * clase de salto que esta saga viene arreglando.
 */
describe('las dos mitades del arranque pintan lo mismo', () => {
  const lee = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

  it('la capa de index.html tambien lleva el anillo', () => {
    const fuente = lee('index.html');

    expect(fuente).toContain('<span id="arranque-anillo"></span>');
    expect(fuente).toMatch(
      /#arranque-anillo\s*\{[^}]*animation:\s*arranque-gira/,
    );
  });

  it('el anillo se detiene si se pide menos movimiento, en las dos', () => {
    expect(lee('index.html')).toMatch(
      /prefers-reduced-motion[\s\S]{0,140}#arranque-anillo\s*\{\s*animation:\s*none/,
    );
    expect(lee('src/components/ui/LoadingMark.jsx')).toContain(
      'motion-reduce:animate-none',
    );
  });

  it('el anillo lleva el mismo color en las dos', () => {
    // La capa no puede leer el tema —ahi todavia no hay CSS de Tailwind—, asi
    // que el color va escrito a mano y solo un test impide que se separen:
    // Deep Forest sobre Sand, lima sobre Deep Forest
    const css = lee('src/index.css');
    const html = lee('index.html');

    expect(css).toMatch(/--cbg-forest:\s*#222d24/);
    expect(css).toMatch(/--cbg-lime:\s*#ddf478/);
    expect(css).toMatch(
      /\.espera-anillo\s*\{[^}]*border-top-color:\s*var\(--cbg-tinta\)/,
    );
    expect(html).toContain('border-top-color: #222d24');
    expect(html).toContain('rgba(34, 45, 36, 0.18)'); // el mismo, al 18%
  });

  it('el anillo gira a la MISMA velocidad en las dos', () => {
    // `animate-spin` de Tailwind es 1s. Con otra duracion aqui, el relevo
    // cambia el ritmo justo en el fotograma que esta saga viene cuidando
    expect(lee('index.html')).toMatch(
      /animation:\s*arranque-gira\s+1s\s+linear/,
    );
  });

  it('las medidas del dibujo coinciden en las dos', () => {
    // Marco de 128 y marca de 64: si una mitad cambia y la otra no, el
    // monograma da un salto justo en el relevo. Ya paso con el hueco del texto
    const html = lee('index.html');
    const jsx = lee('src/components/ui/LoadingMark.jsx');

    // En la misma unidad las dos, que es justo lo que falta con `size-32`:
    // son 8rem, y con la fuente base en 20px una mitad mide 128 y la otra 160
    expect(html).toMatch(/#arranque-marco\s*\{[^}]*width:\s*128px/);
    expect(html).toMatch(/<img[^>]*width="64"/);
    expect(jsx).toContain("marco: 'w-[128px] h-[128px]'");
    expect(jsx).toContain("marca: 'w-[64px]'");
    expect(
      jsx,
      'las medidas en rem no casan con los pixeles de la capa',
    ).not.toMatch(/marco: 'size-\d/);
  });
});

/**
 * El monograma tiene que caer en el mismo sitio en la capa de `index.html` y en
 * la pantalla que la releva, o se ve dar un salto justo en el cambio.
 */
describe('la continuidad del monograma en el relevo', () => {
  it('la capa reserva el hueco de la linea de texto', () => {
    const fuente = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(fuente).toContain('<div id="arranque-hueco"></div>');
    expect(fuente).toMatch(/#arranque-hueco\s*\{[^}]*margin-top:\s*1rem/);
    expect(fuente).toMatch(/#arranque-hueco\s*\{[^}]*height:\s*1\.5rem/);
    expect(fuente).toMatch(/#arranque\s*\{[^}]*flex-direction:\s*column/);
  });
});

/**
 * El fondo de la pantalla de arranque no es libre: encima de el se leen dos
 * cosas que no controlamos igual.
 *
 * - La barra de estado del sistema —reloj, cobertura, bateria—. En la
 *   aplicacion instalada esa franja la pinta el fondo del documento, y con
 *   `apple-mobile-web-app-status-bar-style: default` sus simbolos son oscuros
 *   en claro. Un verde demasiado oscuro (#335d35) los dejo en 2.76:1 y no se
 *   leian; se reporto desde un iPhone. Por eso el arranque en claro es Sand y
 *   no Deep Forest, aunque el icono sea Deep Forest.
 * - El stamp y el «Cargando...», en la tinta del tema.
 */
describe('el fondo del arranque deja leer lo que va encima', () => {
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminancia = (hex) => {
    const n = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const contraste = (a, b) => {
    const [alto, bajo] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (alto + 0.05) / (bajo + 0.05);
  };

  const fondoDeArranque = () => {
    const fuente = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    // El de la capa, en claro: el primero que aparece
    const encontrado = fuente.match(
      /#arranque\s*\{[^}]*?background:\s*(#[0-9a-f]{6})/i,
    );
    return encontrado?.[1];
  };

  it('el mismo fondo en index.html, index.css y el manifiesto', () => {
    // Tres sitios pintan la secuencia de arranque; si se separan, vuelve el
    // salto de color que este trabajo vino a quitar
    const fondo = fondoDeArranque();

    // El del fondo en claro, Off White (25 nov 2026; antes, Sand)
    expect(fondo).toBe('#f8f7f2');
    expect(
      readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8'),
    ).toMatch(
      /--cbg-off-white:\s*#f8f7f2;[\s\S]*--cbg-fondo:\s*var\(--cbg-off-white\)/,
    );
    expect(
      readFileSync(resolve(process.cwd(), 'vite.config.js'), 'utf8'),
    ).toContain(`background_color: '${fondo}'`);
  });

  it('el reloj y la bateria del sistema se leen encima', () => {
    expect(contraste(fondoDeArranque(), '#000000')).toBeGreaterThanOrEqual(4.5);
  });

  it('el stamp y el texto se leen encima, en claro y en oscuro', () => {
    // Con los valores de verdad de index.css, no con copias escritas aquí: la
    // espera pinta la tinta suave sobre el fondo, y el stamp, la tinta
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
    const variables = (selector) => {
      const desde = css.indexOf(`${selector} {`);
      const bloque = css.slice(desde, css.indexOf('}', desde));
      const vars = {};
      for (const [, nombre, valor] of bloque.matchAll(
        /(--cbg-[\w-]+):\s*([^;]+);/g,
      )) {
        vars[nombre] = valor.trim();
      }
      return vars;
    };
    const claro = variables(':root');
    const oscuro = {
      ...claro,
      ...variables(":root[data-tema='oscuro']"),
    };
    const hex = (tema, nombre) => {
      const valor = tema[nombre];
      const ref = valor.match(/^var\((--cbg-[\w-]+)\)$/);
      return ref ? claro[ref[1]] : valor;
    };

    expect(css).toMatch(
      /\.pantalla-de-espera\s*\{[^}]*color:\s*var\(--cbg-tinta-suave\)/,
    );
    for (const tema of [claro, oscuro]) {
      const fondo = hex(tema, '--cbg-fondo');
      expect(contraste(fondo, hex(tema, '--cbg-tinta'))).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contraste(fondo, hex(tema, '--cbg-tinta-suave')),
      ).toBeGreaterThanOrEqual(4.5);
    }
    // El stamp del oscuro es el lima
    expect(
      contraste(hex(oscuro, '--cbg-fondo'), claro['--cbg-lime']),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * El dibujo de las esperas es UNO (FE #495). Este test recorre el fuente porque
 * la primera pasada dejo tres esperas de bloque sin migrar —vivian en
 * `components/`, y el inventario solo habia mirado `pages/`—, y nada lo delataba:
 * la suite seguia verde mientras la aplicacion cambiaba de dibujo por el camino.
 */
describe('no quedan esperas con dibujo propio', () => {
  // Lo que SI puede girar por su cuenta, y por que. Son indicadores de que una
  // ACCION esta en curso —«este boton esta trabajando», «se esta añadiendo»—, no
  // de que un contenido viene de camino: otra cosa, y quedaron fuera del
  // encargo. Cualquier sitio nuevo que aparezca aqui hay que mirarlo, no
  // añadirlo a la lista sin pensar.
  const PERMITIDOS = new Set([
    'components/ui/LoadingMark.jsx', // la pieza compartida
    'components/admin/ManageAccountModal.jsx', // boton de procesar
    'components/auth/SignInForm.jsx', // boton de entrar
    'components/modals/ConfirmModal.jsx', // boton de confirmar
    'components/competition/CompetitionGolfCoursesSection.jsx', // «añadiendo campo»
    'components/golf_course/GolfCourseSearchBox.jsx', // indicador dentro del campo
    'pages/ForgotPassword.jsx', // boton de enviar
    'pages/Register.jsx', // boton de registrarse
    'pages/ResetPassword.jsx', // boton de guardar
    'pages/EditProfile.jsx', // boton de guardar
    'pages/admin/AdminPanel.jsx', // botones de accion
    'pages/player/FeedPage.jsx', // boton de cargar mas
    'pages/player/PlayerProfilePage.jsx', // boton de cargar mas
    'components/profile/GamesTogether.jsx', // boton de cargar mas (FE-2)
    'components/admin/AdminEditCompetitionModal.jsx', // boton de guardar
    'components/admin/EditUserModal.jsx', // boton de guardar
    'components/friend/AddFriendModal.jsx', // indicador dentro del buscador
    'components/invitation/SendInvitationModal.jsx', // boton de enviar
  ]);

  const ficheros = () => {
    const salida = [];
    const recorre = (dir) => {
      for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const ruta = join(dir, entrada.name);
        if (entrada.isDirectory()) recorre(ruta);
        else if (/\.jsx?$/.test(entrada.name) && !/\.test\./.test(entrada.name))
          salida.push(ruta);
      }
    };
    recorre(resolve(process.cwd(), 'src'));
    return salida;
  };

  it('ninguna pantalla se pinta su propia espera', () => {
    const sueltos = [];
    for (const ruta of ficheros()) {
      // `relative` y no partir por '/src/': si la copia de trabajo vive en una
      // ruta que ya contiene '/src/', ninguna exencion casaria y la suite se
      // pondria roja por donde esta el repositorio
      const relativa = relative(resolve(process.cwd(), 'src'), ruta);
      if (PERMITIDOS.has(relativa)) continue;
      if (readFileSync(ruta, 'utf8').includes('animate-spin'))
        sueltos.push(relativa);
    }

    expect(sueltos, `esperas con dibujo propio: ${sueltos.join(', ')}`).toEqual(
      [],
    );
  });

  it('donde hay varias esperas a la vez, solo una se anuncia', () => {
    // El panel monta a la vez la de acciones pendientes y la de ultimas
    // partidas: sin callar a las demas, un lector de pantalla oye «Cargando...»
    // varias veces seguidas sin nada que las distinga. El proximo partido ya no
    // pinta espera ninguna (26 nov 2026): mientras carga no reserva sitio
    const panel = readFileSync(
      resolve(process.cwd(), 'src/pages/Dashboard.jsx'),
      'utf8',
    );
    const banner = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/NextMatchBanner.jsx'),
      'utf8',
    );

    const acciones = readFileSync(
      resolve(process.cwd(), 'src/components/dashboard/PendingActionsCard.jsx'),
      'utf8',
    );

    expect(banner, 'el proximo partido no pinta espera').not.toContain(
      '<BlockLoader',
    );
    expect(acciones, 'acciones pendientes tambien calla').toContain(
      '<BlockLoader silencioso',
    );
    expect(panel, 'ultimas partidas acompaña, asi que se calla').toMatch(
      /<RecentMatches[\s\S]{0,200}esperaSilenciosa/,
    );
    // Y el anuncio lo da el panel: si lo diera una tarjeta, en una vuelta con
    // acciones pendientes recordadas no quedaria ninguna que anunciara nada
    expect(panel, 'el anuncio va en el panel').toMatch(
      /role="status"[\s\S]{0,80}sr-only/,
    );
  });

  it('ni su propio esqueleto', () => {
    // `animate-pulse` es la otra forma de decir «esto esta cargando», y el
    // barrido solo miraba los spinners: por ahi se colaron el recuadro amarillo
    // de «Requiere tu Atencion» y los rectangulos grises del panel, que eran un
    // sexto dibujo distinto
    // Lo que late sin ser una espera. Ojo al añadir: `animate-pulse` casi
    // siempre significa «esto esta cargando», y ahi va el dibujo compartido
    // Lo que late sin decir «esto esta cargando». La lista es corta a proposito:
    // el selector de avatar estuvo aqui un rato y no debia —«los tres puntos
    // mientras llegan las opciones» es una espera, y el propio comentario lo
    // delataba—, asi que si algo entra aqui, que sea por no ser una espera, no
    // por no querer migrarlo
    const LATIDOS_QUE_NO_SON_ESPERAS = new Set([
      'pages/Competitions.jsx', // el punto naranja de «solicitudes pendientes»
    ]);

    const sueltos = [];
    for (const ruta of ficheros()) {
      // Con separadores de barra siempre: en Windows `relative` devuelve
      // `pages\\Competitions.jsx` y ninguna entrada de la lista casaria
      const relativa = relative(resolve(process.cwd(), 'src'), ruta)
        .split(sep)
        .join('/');
      if (LATIDOS_QUE_NO_SON_ESPERAS.has(relativa)) continue;
      if (readFileSync(ruta, 'utf8').includes('animate-pulse'))
        sueltos.push(relativa);
    }

    expect(sueltos, `esqueletos propios: ${sueltos.join(', ')}`).toEqual([]);
  });
});
