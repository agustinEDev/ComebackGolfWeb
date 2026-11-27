import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITIO } from './sitio';
import { DIRECCION_NUEVA } from './mudanza';
import { RUTAS_DE_LA_APLICACION } from './rutasDeLaAplicacion';
import {
  PAGINAS_DEL_SITEMAP,
  canonicaDe,
  robotsTxt,
  sitemapXml,
} from './buscadores';

/**
 * Lo básico para los buscadores (27 nov 2026), tabla aprobada por Agustín:
 *
 *   S1 el dominio sale de una sola constante: la mudanza la usa e index.html no lo
 *      lleva escrito a mano
 *   S2 sitemap.xml: exactamente las páginas públicas, con la dirección entera
 *   S3 robots.txt: todos los rastreadores; bloquea cada ruta de la app fuera del
 *      sitemap (también los enlaces compartidos), nunca una pública ni lo que hace
 *      falta para pintarla, y apunta al sitemap
 *   S4 canónica: en una página pública, la suya en comebackgolf.com; en el resto, ninguna
 *   S5 index.html en español, sin keywords, con imagen para compartir y sin «Ryder Cup»
 *   S6 (vite.config.js) el build deja robots.txt y sitemap.xml y pone el dominio
 *   S7 (vite.config.js) el SW no precachea la imagen ni contesta la app en esos ficheros
 */

const raiz = process.cwd();
const leer = (ruta) => readFileSync(resolve(raiz, ruta), 'utf8');

/** RFC 9309 sin comodines: la regla más larga que encaja gana, y Allow en empate. */
const bloqueada = (robots, ruta) => {
  const reglas = robots
    .split('\n')
    .map((l) => l.match(/^(Allow|Disallow):\s*(\S*)$/))
    .filter(Boolean)
    .map(([, tipo, prefijo]) => ({ tipo, prefijo }))
    .filter(({ prefijo }) => prefijo && ruta.startsWith(prefijo));
  if (reglas.length === 0) return false;
  const larga = Math.max(...reglas.map((r) => r.prefijo.length));
  const ganadoras = reglas.filter((r) => r.prefijo.length === larga);
  return ganadoras.every((r) => r.tipo === 'Disallow');
};

/** Una ruta de ejemplo para cada patrón de App.jsx: `:id` → `7`, `:x?` fuera. */
const ejemplo = (patron) =>
  patron.replace(/\/:[^/]+\?/g, '').replace(/:[^/]+/g, '7') || '/';

describe('S1: el dominio, en un solo sitio', () => {
  it('es www.comebackgolf.com y la mudanza usa la misma constante', () => {
    expect(SITIO).toBe('https://www.comebackgolf.com');
    expect(DIRECCION_NUEVA).toBe(SITIO);
  });

  it('index.html no lleva el dominio escrito a mano', () => {
    expect(leer('index.html')).not.toMatch(/comebackgolf\.com/);
  });
});

describe('S2: sitemap.xml', () => {
  it('lleva exactamente las páginas públicas, con la dirección entera', () => {
    const xml = sitemapXml();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(urls).toEqual([
      `${SITIO}/`,
      `${SITIO}/pricing`,
      `${SITIO}/contact`,
      `${SITIO}/terms`,
      `${SITIO}/privacy`,
      `${SITIO}/cookies`,
      `${SITIO}/legal`,
    ]);
  });

  it('cada página del sitemap es una pantalla de la aplicación', () => {
    PAGINAS_DEL_SITEMAP.forEach((p) =>
      expect(RUTAS_DE_LA_APLICACION).toContain(p),
    );
  });
});

describe('S3: robots.txt', () => {
  const robots = robotsTxt();

  it('vale para todos los rastreadores y apunta al sitemap', () => {
    expect(robots).toMatch(/^User-agent: \*$/m);
    // La línea exacta: el dominio como texto, sin pasar por una expresión regular
    expect(robots.split('\n')).toContain(`Sitemap: ${SITIO}/sitemap.xml`);
  });

  it.each(
    RUTAS_DE_LA_APLICACION.filter((r) => !PAGINAS_DEL_SITEMAP.includes(r)),
  )('bloquea %s, que no está en el sitemap', (patron) => {
    expect(bloqueada(robots, ejemplo(patron))).toBe(true);
  });

  it.each([
    '/competitions/7/leaderboard',
    '/quick-matches/7/shared',
    '/players/7',
    '/admin/users',
  ])('bloquea el enlace compartido o privado %s', (ruta) => {
    expect(bloqueada(robots, ruta)).toBe(true);
  });

  it.each([
    ...PAGINAS_DEL_SITEMAP,
    '/assets/index-abc.js',
    '/brand/wordmark-acid.svg',
    '/icons/pwa-192x192.png',
    '/images/compartir/comebackgolf-1200x630.png',
    '/manifest.webmanifest',
    '/config.js',
  ])('no bloquea %s', (ruta) => {
    expect(bloqueada(robots, ruta)).toBe(false);
  });
});

describe('S4: la canónica', () => {
  it.each([
    ['/', `${SITIO}/`],
    ['/pricing', `${SITIO}/pricing`],
    ['/pricing/', `${SITIO}/pricing`],
    ['/legal', `${SITIO}/legal`],
  ])('%s → %s', (ruta, canonica) => {
    expect(canonicaDe(ruta)).toBe(canonica);
  });

  it.each([
    '/dashboard',
    '/login',
    '/competitions/7/leaderboard',
    '/no-existe',
  ])('%s no lleva', (ruta) => {
    expect(canonicaDe(ruta)).toBeNull();
  });
});

describe('S5: index.html', () => {
  const html = leer('index.html');
  const meta = (atributo, nombre) =>
    html.match(
      new RegExp(`<meta ${atributo}="${nombre}" content="([^"]*)"`),
    )?.[1];

  it('en español, con el título y la descripción aprobados y sin keywords', () => {
    expect(html).toMatch(/<html lang="es">/);
    expect(html).toContain(
      '<title>Comeback Golf: torneos de golf en formato Ryder</title>',
    );
    const descripcion =
      'Organiza torneos de golf amateur por equipos en formato Ryder, juega partidas ' +
      'rápidas y sigue los resultados hoyo a hoyo. Con hándicap WHS, gratis y sin anuncios.';
    expect(meta('name', 'description')).toBe(descripcion);
    expect(meta('property', 'og:description')).toBe(descripcion);
    expect(meta('property', 'og:title')).toBe(
      'Comeback Golf: torneos de golf en formato Ryder',
    );
    expect(html).not.toMatch(/name="keywords"/);
    expect(html).not.toMatch(/ryder\s*cup/i);
  });

  it('con la imagen para compartir, absoluta y de 1200×630', () => {
    const imagen = '__SITIO__/images/compartir/comebackgolf-1200x630.png';
    expect(meta('property', 'og:image')).toBe(imagen);
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
    expect(meta('property', 'og:image:alt')).toBe(
      'Comeback Golf. Golf entre amigos',
    );
    expect(meta('property', 'og:locale')).toBe('es_ES');
    expect(meta('property', 'og:site_name')).toBe('Comeback Golf');
    expect(meta('name', 'twitter:image')).toBe(imagen);
    expect(() =>
      readFileSync(
        resolve(raiz, 'public/images/compartir/comebackgolf-1200x630.png'),
      ),
    ).not.toThrow();
  });
});

describe('S6 y S7: vite.config.js', () => {
  const config = leer('vite.config.js');

  it('S6: el build escribe robots.txt y sitemap.xml y pone el dominio en el HTML', () => {
    expect(config).toMatch(/fileName: 'robots\.txt'/);
    expect(config).toMatch(/fileName: 'sitemap\.xml'/);
    expect(config).toMatch(/replaceAll\('__SITIO__', SITIO\)/);
  });

  it('S7: la imagen fuera del precache, y ni robots ni sitemap ni la imagen dan la app', () => {
    expect(config).toContain("'images/compartir/**'");
    expect(config).toContain('/^\\/robots\\.txt$/');
    expect(config).toContain('/^\\/sitemap\\.xml$/');
    expect(config).toContain('/^\\/images\\/compartir\\//');
  });
});
