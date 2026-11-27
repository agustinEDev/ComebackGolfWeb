import { describe, it, expect } from 'vitest';

/**
 * Tocar fuera cierra TODOS los diálogos, igual que Escape y «Cerrar» (Agustín,
 * 23 nov 2026). Hasta entonces 32 diálogos sobre `ModalShell` pasaban
 * `closeOnBackdrop={false}`, y el asistente de partida rápida y dos avisos de
 * su anotación no cerraban con el fondo. Este test lee el código para que no
 * vuelva a entrar un diálogo que no se cierre así:
 *
 *   - `closeOnBackdrop` ya no existe: el fondo de `ModalShell` sigue a
 *     `closeOnEscape`, y nadie puede separarlos.
 *   - Cada diálogo con fondo propio (`aria-modal`, un rol de diálogo o un
 *     `<dialog>`, fuera de los comentarios) pone en su fondo `alTocarElFondo`
 *     con un cierre, que exige el gesto entero en el fondo. Uno por diálogo:
 *     un fichero con dos diálogos y un solo fondo que cierra no pasa.
 *   - Un diálogo sobre `ModalShell` que no se cierra NUNCA, ni con Escape ni
 *     con el fondo (`closeOnEscape={false}` fijo), va en su lista con su
 *     porqué. El `closeOnEscape={!ocupado}` de mientras se guarda no cuenta.
 *   - Una lista que se cierra al tocar fuera de ella se anuncia abierta
 *     (`aria-expanded` con un combobox, o un botón que abre una lista o un
 *     menú): es lo que mira el fondo para que, con ella abierta, tocar fuera
 *     cierre solo la lista, como su Escape.
 *
 * Lo que no puede ver: que el cierre que se pasa sea el mismo que el de Escape.
 * Eso lo prueban los tests de cada diálogo.
 */
const SIN_FONDO_QUE_CIERRE = {
  // El desacuerdo con otro anotador: hay que quedarse con uno de los dos
  // resultados, y Escape tampoco lo cierra
  'components/quick_match/DialogosDePartidaRapida.jsx': 1,
};

const SIN_SALIDA = {
  // La anotación la tiene otro dispositivo: hay que elegir entre quedársela o
  // volver, y no hay un «cerrar» que no sea una de las dos
  'components/scoring/SessionBlockedModal.jsx': 1,
};

// Las listas que se cierran al tocar fuera de ellas (escuchan el `mousedown`,
// el `click` o el `touchstart` del documento) y no se anuncian abiertas como
// lista (`LISTA_ABIERTA` en `alTocarElFondo`), con su porqué: dentro de un
// diálogo, tocar fuera cerraría la lista Y el diálogo
const LISTAS_SIN_ANUNCIARSE = {
  // El menú de la cabecera pública y el de la de la sesión: las cabeceras no
  // van nunca dentro de un diálogo
  'components/layout/Header.jsx': 'cabecera',
  'components/layout/HeaderAuth.jsx': 'cabecera',
};

const fuentes = import.meta.glob(
  ['/src/**/*.{js,jsx}', '!/src/**/*.test.{js,jsx}'],
  { query: '?raw', import: 'default', eager: true },
);

const relativo = (fichero) => fichero.replace(/^\/src\//, '');
const cuantas = (codigo, patron) => (codigo.match(patron) ?? []).length;

// Sin comentarios: ni los de bloque (también `{/* */}` en JSX) ni los de
// línea. Los de línea, solo tras un espacio o al empezar: así no se come el
// `//` de una URL
const sinComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

// `aria-modal` como atributo: con "true", 'true', {true} o sin valor
const ARIA_MODAL =
  /\saria-modal(?:=(?:"true"|'true'|\{true\}|\{"true"\}|\{'true'\}))?(?=[\s/>])/g;
// El rol como atributo (no dentro de un selector como `[role="dialog"]`)
const ROL_DE_DIALOGO =
  /\srole=(?:"|'|\{"|\{'|\{`)(?:alert)?dialog(?:"|'|"\}|'\}|`\})/g;
const ETIQUETA_DIALOG = /<dialog[\s/>]/g;
// Con un cierre: `alTocarElFondo()`, `(null)`, `(undefined)` o `(false)` no
// cierran nada y no cuentan
const FONDO_QUE_CIERRA =
  /\{\.\.\.alTocarElFondo\((?!\s*(?:null|undefined|false)?\s*\))/g;
const SIN_ESCAPE = /closeOnEscape=\{false\}/g;

// Dónde empieza la etiqueta JSX que contiene la posición `i`: el último `<`
// seguido de una letra (un `<` de una comparación no abre etiqueta)
const inicioDeEtiqueta = (codigo, i) => {
  for (
    let j = codigo.lastIndexOf('<', i);
    j >= 0;
    j = codigo.lastIndexOf('<', j - 1)
  )
    if (/[A-Za-z]/.test(codigo[j + 1] ?? '')) return j;
  return -1;
};

// Los elementos distintos con alguna marca de diálogo: uno con `role` y
// `aria-modal` a la vez es un diálogo, y dos elementos con una marca cada uno
// son dos (CodeRabbit, FE #1229)
const cuantosDialogos = (codigo) =>
  new Set(
    [ARIA_MODAL, ROL_DE_DIALOGO, ETIQUETA_DIALOG].flatMap((marca) =>
      [...codigo.matchAll(marca)].map((m) => inicioDeEtiqueta(codigo, m.index)),
    ),
  ).size;

const sinFondoQueCierre = (fuente, permitidos = 0) => {
  const codigo = sinComentarios(fuente);
  const dialogos = cuantosDialogos(codigo);
  if (dialogos === 0) return 0;
  return dialogos - permitidos - cuantas(codigo, FONDO_QUE_CIERRA);
};

// Escucha toques fuera en el documento (no la propia pieza del fondo)
const ESCUCHA_FUERA =
  /document\.addEventListener\(\s*['"](?:mousedown|click|touchstart|pointerdown)['"]/;
// Se anuncia abierta como lista: `aria-expanded` junto a un combobox o a un
// botón que abre una lista o un menú
const SE_ANUNCIA_LISTA =
  /aria-expanded[\s\S]*?(?:role="combobox"|aria-haspopup="(?:listbox|menu)")|(?:role="combobox"|aria-haspopup="(?:listbox|menu)")[\s\S]*?aria-expanded/;

const listaSinAnunciarse = (fuente) => {
  const codigo = sinComentarios(fuente);
  return ESCUCHA_FUERA.test(codigo) && !SE_ANUNCIA_LISTA.test(codigo);
};

const sinEscapeNiFondo = (fuente) =>
  cuantas(sinComentarios(fuente), SIN_ESCAPE);

describe('todos los diálogos se cierran al tocar fuera', () => {
  it('nadie usa ya `closeOnBackdrop`', () => {
    const conLaProp = Object.entries(fuentes)
      .filter(([, codigo]) => codigo.includes('closeOnBackdrop'))
      .map(([fichero]) => relativo(fichero));

    expect(conLaProp).toEqual([]);
  });

  it('cada diálogo con fondo propio cierra con `alTocarElFondo`, salvo los permitidos', () => {
    const distintos = Object.entries(fuentes)
      .map(([fichero, codigo]) => [
        relativo(fichero),
        sinFondoQueCierre(codigo, SIN_FONDO_QUE_CIERRE[relativo(fichero)]),
      ])
      .filter(([, falta]) => falta !== 0);

    expect(distintos).toEqual([]);
  });

  it('solo los permitidos fijan `closeOnEscape={false}`, con su número exacto', () => {
    const distintos = Object.entries(fuentes)
      .map(([fichero, codigo]) => [relativo(fichero), sinEscapeNiFondo(codigo)])
      .filter(([fichero, n]) => n !== (SIN_SALIDA[fichero] ?? 0));

    expect(distintos).toEqual([]);
  });

  it('cada lista que se cierra al tocar fuera se anuncia abierta, salvo las permitidas', () => {
    const sinAnunciarse = Object.entries(fuentes)
      .filter(([fichero]) => !relativo(fichero).endsWith('alTocarElFondo.js'))
      .filter(([, codigo]) => listaSinAnunciarse(codigo))
      .map(([fichero]) => relativo(fichero))
      .filter((fichero) => !LISTAS_SIN_ANUNCIARSE[fichero]);

    expect(sinAnunciarse).toEqual([]);
  });

  it('todos los permitidos existen (un fichero borrado o renombrado se quita de la lista)', () => {
    const existen = new Set(Object.keys(fuentes).map(relativo));
    expect(
      [
        ...Object.keys(SIN_FONDO_QUE_CIERRE),
        ...Object.keys(SIN_SALIDA),
        ...Object.keys(LISTAS_SIN_ANUNCIARSE),
      ].filter((f) => !existen.has(f)),
    ).toEqual([]);
  });

  describe('el detector', () => {
    const conFondo =
      '<div className="fixed inset-0" {...alTocarElFondo(cerrar)}><div role="dialog" aria-modal="true" /></div>';
    const sinFondo =
      '<div className="fixed inset-0" onClick={cerrar}><div role="dialog" aria-modal="true" /></div>';

    it.each([
      ['un diálogo con su fondo', conFondo, 0],
      ['un diálogo sin fondo que cierre', sinFondo, 1],
      ['dos diálogos y un solo fondo', `${conFondo}${sinFondo}`, 1],
      [
        'dos elementos con marcas distintas y una sola pieza',
        '<div {...alTocarElFondo(cerrar)}><div role="dialog" /></div><section aria-modal="true" />',
        1,
      ],
      [
        'una comparación no abre etiqueta',
        '<div {...alTocarElFondo(cerrar)}><div role="dialog" data-n={a < b} aria-modal="true" /></div>',
        0,
      ],
      ["role='dialog'", "<div {...x}><div role='dialog' /></div>", 1],
      ["role={'dialog'}", "<div {...x}><div role={'dialog'} /></div>", 1],
      ['role={"dialog"}', '<div {...x}><div role={"dialog"} /></div>', 1],
      ['role="alertdialog"', '<div {...x}><div role="alertdialog" /></div>', 1],
      ['aria-modal sin valor', '<div {...x}><div aria-modal /></div>', 1],
      ['aria-modal={true}', '<div {...x}><div aria-modal={true} /></div>', 1],
      ["aria-modal='true'", "<div {...x}><div aria-modal='true' /></div>", 1],
      ['<dialog>', '<dialog open><p>Hola</p></dialog>', 1],
      [
        'alTocarElFondo(null)',
        '<div {...alTocarElFondo(null)}><div aria-modal="true" /></div>',
        1,
      ],
      [
        'alTocarElFondo()',
        '<div {...alTocarElFondo()}><div aria-modal="true" /></div>',
        1,
      ],
      [
        'alTocarElFondo(undefined)',
        '<div {...alTocarElFondo( undefined )}><div aria-modal="true" /></div>',
        1,
      ],
      [
        'alTocarElFondo(false)',
        '<div {...alTocarElFondo(false)}><div aria-modal="true" /></div>',
        1,
      ],
      [
        'un cierre condicionado sí cuenta',
        '<div {...alTocarElFondo(!ocupado && cerrar)}><div aria-modal="true" /></div>',
        0,
      ],
      [
        'el fondo que cierra, solo en un comentario de bloque',
        '<div>{/* {...alTocarElFondo(cerrar)} */}<div aria-modal="true" /></div>',
        1,
      ],
      [
        'el fondo que cierra, solo en un comentario de línea',
        '<div\n  // {...alTocarElFondo(cerrar)}\n><div aria-modal="true" /></div>',
        1,
      ],
      ['un diálogo solo en un comentario', '// <div role="dialog" />', 0],
      ['en un selector', 'fila.closest(\'[role="dialog"]\')', 0],
      ['una URL no es un comentario', 'const u = "http://x"; <dialog />', 1],
    ])('%s', (_, codigo, falta) => {
      expect(sinFondoQueCierre(codigo)).toBe(falta);
    });

    it('descuenta los permitidos', () => {
      expect(sinFondoQueCierre(`${conFondo}${sinFondo}`, 1)).toBe(0);
    });

    it.each([
      [
        'una lista que escucha fuera y no se anuncia',
        "document.addEventListener('mousedown', fuera); <input />",
        true,
      ],
      [
        'con aria-expanded y combobox',
        'document.addEventListener(\'click\', fuera, true); <input role="combobox" aria-expanded={abierta} />',
        false,
      ],
      [
        'con aria-haspopup="listbox" y aria-expanded',
        'document.addEventListener(\'mousedown\', fuera); <button aria-haspopup="listbox" aria-expanded={abierta} />',
        false,
      ],
      [
        'con aria-expanded y menú',
        'document.addEventListener(\'touchstart\', fuera); <button aria-expanded={a} aria-haspopup="menu" />',
        false,
      ],
      [
        'solo un plegable (aria-expanded sin lista)',
        "document.addEventListener('mousedown', fuera); <button aria-expanded={a} />",
        true,
      ],
      [
        'la escucha solo en un comentario',
        "// document.addEventListener('mousedown', fuera)\n<input />",
        false,
      ],
      ['sin escucha de fuera', '<button aria-expanded={a} />', false],
    ])('ve las listas sin anunciarse: %s', (_, codigo, falta) => {
      expect(listaSinAnunciarse(codigo)).toBe(falta);
    });

    it.each([
      ['closeOnEscape={false}', '<ModalShell closeOnEscape={false} />', 1],
      ['mientras guarda, no', '<ModalShell closeOnEscape={!ocupado} />', 0],
      [
        'en un comentario, no',
        '<ModalShell\n  // closeOnEscape={false}\n/>',
        0,
      ],
    ])('cuenta los que no cierran nunca: %s', (_, codigo, n) => {
      expect(sinEscapeNiFondo(codigo)).toBe(n);
    });
  });
});
