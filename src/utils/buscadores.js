import { SITIO } from './sitio.js';
import { RUTAS_DE_LA_APLICACION } from './rutasDeLaAplicacion.js';

/**
 * Lo básico para los buscadores (27 nov 2026). Lo lee también `vite.config.js`
 * para escribir `robots.txt` y `sitemap.xml` en el build.
 *
 * Solo las páginas públicas con algo que leer van al sitemap y llevan canónica. El
 * resto de las pantallas de la aplicación se bloquean en el robots.txt, sacadas de
 * la lista que un test mantiene igual a `App.jsx`: una pantalla nueva queda
 * bloqueada sin acordarse de ella. Eso incluye los enlaces compartidos (la
 * clasificación y la partida): se ven con el enlace, pero no deben salir en un
 * buscador con los nombres de los jugadores.
 */
export const PAGINAS_DEL_SITEMAP = Object.freeze([
  '/',
  '/pricing',
  '/contact',
  '/terms',
  '/privacy',
  '/cookies',
  '/legal',
]);

/** Sin la barra final, salvo la portada. */
const sinBarraFinal = (ruta) =>
  ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta;

/** La canónica de una página pública, o null si la ruta no es de las indexables. */
export const canonicaDe = (pathname) => {
  const ruta = sinBarraFinal(pathname);
  return PAGINAS_DEL_SITEMAP.includes(ruta) ? `${SITIO}${ruta}` : null;
};

/** El tramo fijo de cada pantalla fuera del sitemap, sin los que ya cubre otro. */
const prefijosBloqueados = () => {
  const prefijos = [
    ...new Set(
      RUTAS_DE_LA_APLICACION.filter(
        (r) => !PAGINAS_DEL_SITEMAP.includes(r),
      ).map((r) => r.split('/:')[0]),
    ),
  ];
  return prefijos
    .filter(
      (p) => !prefijos.some((otro) => otro !== p && p.startsWith(`${otro}/`)),
    )
    .sort();
};

export const robotsTxt = () =>
  [
    '# Comeback Golf: las páginas públicas para cualquier buscador o asistente;',
    '# las pantallas de la aplicación y los enlaces compartidos, no',
    'User-agent: *',
    ...prefijosBloqueados().map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${SITIO}/sitemap.xml`,
    '',
  ].join('\n');

export const sitemapXml = () =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PAGINAS_DEL_SITEMAP.map((p) => `  <url><loc>${SITIO}${p}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
