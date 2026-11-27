/**
 * El tema claro u oscuro de la marca (ComeBack Golf).
 *
 * Por defecto sigue al sistema; el conmutador elige el otro y se recuerda en
 * `localStorage`. Volver al del sistema es dejar de elegir: se sigue otra vez. Lo aplicado va en `<html data-tema>`, de donde lo lee
 * `index.css`.
 *
 * El oscuro vale para toda la aplicación: las pantallas rediseñadas lo pintan
 * con los tokens semánticos y las demás, con la paleta oscura de `index.css`.
 */
const CLAVE = 'tema';
const CONSULTA = '(prefers-color-scheme: dark)';
const FONDO = { claro: '#f8f7f2', oscuro: '#222d24' };

const oyentes = new Set();
let elegido = null; // 'claro' | 'oscuro' | null (sigue al sistema)

const guardado = () => {
  try {
    const valor = globalThis.localStorage?.getItem(CLAVE);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue al sistema
    return null;
  }
};

const elSistemaEsOscuro = () =>
  Boolean(globalThis.matchMedia?.(CONSULTA).matches);

/** @returns {'claro'|'oscuro'} el tema elegido, o el del sistema */
export const temaActual = () =>
  elegido ?? (elSistemaEsOscuro() ? 'oscuro' : 'claro');

const aplica = () => {
  const raiz = globalThis.document?.documentElement;
  if (!raiz) return;
  const tema = temaActual();
  raiz.dataset.tema = tema;
  // La barra del navegador y la de estado, del color del fondo. `index.html`
  // trae dos, una por tema del sistema, para que el arranque acierte antes de
  // que corra esto; aquí se ponen las dos al tema que de verdad se ve
  for (const meta of globalThis.document.querySelectorAll(
    'meta[name="theme-color"]',
  ))
    meta.setAttribute('content', FONDO[tema]);
  for (const oye of oyentes) oye(tema);
};

/** Lee lo guardado, lo aplica y sigue al sistema. Una vez, al arrancar. */
export const arrancaElTema = () => {
  elegido = guardado();
  aplica();
  globalThis.matchMedia?.(CONSULTA).addEventListener?.('change', aplica);
};

/** El conmutador: pasa al otro tema y lo recuerda. */
export const alternaElTema = () => {
  const otro = temaActual() === 'oscuro' ? 'claro' : 'oscuro';
  // Si el otro es el del sistema, es volver a seguirlo: se deja de elegir. Sin
  // esto, probar el oscuro una vez dejaba el claro fijado para siempre, y de
  // noche la aplicación ya no acompañaba al sistema (/code-review)
  const elDelSistema = elSistemaEsOscuro() ? 'oscuro' : 'claro';
  elegido = otro === elDelSistema ? null : otro;
  try {
    if (elegido) globalThis.localStorage?.setItem(CLAVE, elegido);
    else globalThis.localStorage?.removeItem(CLAVE);
  } catch {
    // Sin poder guardarlo vale para esta visita
  }
  aplica();
};

/**
 * @param {(tema: 'claro'|'oscuro') => void} oye
 * @returns {() => void} deja de escuchar
 */
export const alCambiarElTema = (oye) => {
  oyentes.add(oye);
  return () => oyentes.delete(oye);
};
