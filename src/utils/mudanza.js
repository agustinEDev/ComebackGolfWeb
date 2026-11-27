/**
 * La mudanza a comebackgolf.com (Agustín, 27 nov 2026). Fase 1: los dos
 * dominios sirven la misma aplicación y la del dominio viejo avisa al abrir,
 * una vez al día, de que hay que pasarse a la nueva. Una aplicación instalada
 * no puede cambiar de dominio: hay que instalar la otra. La sesión y lo
 * guardado en el móvil van por dominio, por eso el aviso espera a que no quede
 * nada sin enviar.
 */

import { SITIO } from './sitio';

export const DIRECCION_NUEVA = SITIO;

/** El único sitio del front que nombra el dominio viejo (un test fija su valor) */
export const DOMINIO_ANTIGUO = 'rydercupfriends.com';

/**
 * @param {string} host - `location.hostname`
 * @returns {boolean} si la aplicación se está abriendo desde el dominio viejo
 */
export const esElDominioAntiguo = (host) =>
  host === DOMINIO_ANTIGUO || host === `www.${DOMINIO_ANTIGUO}`;

// Donde el aviso no sale: pasos de un solo uso que llevan un secreto en la
// dirección (la app lo quita de la barra, pero el router lo conserva), y los
// enlaces compartidos, que se abren para mirar una cosa (revisión, 27 nov 2026)
const NO_TAPAR = [
  /^\/reset-password(?:\/|$)/,
  /^\/verify-email\/?$/,
  /^\/confirm-email-change\/?$/,
  /^\/auth\//,
  /^\/quick-matches\/[^/]+\/shared\/?$/,
  /^\/competitions\/[^/]+\/leaderboard\/?$/,
];

// Nunca encima de la anotación: se usa en el campo, con prisa
const ANOTANDO =
  /\/(?:player\/matches|player\/groups|quick-matches)\/[^/]+\/scoring\/?$/;

/**
 * Adónde lleva «Ir a la app nueva». La instalada, a la portada: es desde donde
 * se instala la otra. En el navegador, a la misma página, SIN la consulta: ahí
 * pueden ir códigos de un solo uso, que no se copian a otro dominio. Las rutas
 * que llevan un secreto en la propia ruta, a la portada.
 *
 * @param {{ instalada: boolean, pathname: string }} donde
 * @returns {string}
 */
export const direccionNueva = ({ instalada, pathname }) =>
  instalada || NO_TAPAR.some((r) => r.test(pathname))
    ? `${DIRECCION_NUEVA}/`
    : `${DIRECCION_NUEVA}${pathname}`;

/** La fecha local `AAAA-MM-DD` de un día. */
const fechaLocal = (dia) =>
  `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(
    dia.getDate(),
  ).padStart(2, '0')}`;

/**
 * El día en que vuelve a salir tras «Ahora no»: mañana, en la fecha del móvil.
 *
 * @param {Date} hoy
 * @returns {string} `AAAA-MM-DD`
 */
export const hastaCuandoSeAplaza = (hoy) =>
  fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));

/**
 * @param {{ hoy: Date, aplazadoHasta: string|null, pathname: string }} estado
 * @returns {boolean} si toca enseñar el aviso ahora
 */
export const tocaEnsenarlo = ({ hoy, aplazadoHasta, pathname }) => {
  if (ANOTANDO.test(pathname) || NO_TAPAR.some((r) => r.test(pathname)))
    return false;
  // Lo que no se entienda se trata como si no se hubiera aplazado
  if (!/^\d{4}-\d{2}-\d{2}$/.test(aplazadoHasta ?? '')) return true;
  // Y lo que quede más allá de mañana también: se guardó con el reloj mal, y
  // escondería el aviso hasta esa fecha
  if (aplazadoHasta > hastaCuandoSeAplaza(hoy)) return true;
  return fechaLocal(hoy) >= aplazadoHasta;
};
