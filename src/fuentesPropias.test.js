import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Montserrat, la fuente de la marca (ComeBack Golf), se sirve desde la propia
 * aplicación, como antes Inter y Poppins (revisión de la auditoría legal, M4). Cargarlas de Google Fonts mandaba la IP de cada
 * visitante a Google sin base legal ni aviso; además, la CSP tenía que abrirle
 * la puerta a dos dominios ajenos.
 */
const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

const GOOGLE_FONTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/;

describe('fuentes servidas desde la propia aplicación', () => {
  it('la hoja de estilos no las pide a Google', () => {
    expect(leer('src/index.css')).not.toMatch(GOOGLE_FONTS);
  });

  // Desde JS y no con `@import` en `index.css`: Tailwind incrusta esa hoja sin
  // reescribir sus `url(./files/...)`, Vite no emitía ningún .woff2 y la página
  // pedía las fuentes a una ruta que no existe
  it('main.jsx importa la hoja local de Montserrat, antes que index.css', () => {
    const main = leer('src/main.jsx');

    expect(main).toContain("import '@fontsource-variable/montserrat';");
    expect(main.indexOf('@fontsource-variable/montserrat')).toBeLessThan(
      main.indexOf("import './index.css'"),
    );
    expect(leer('src/index.css')).not.toMatch(/@import ['"]@fontsource/);
  });

  it('las fuentes de la marca anterior ya no se cargan', () => {
    expect(leer('src/main.jsx')).not.toMatch(
      /fontsource[^']*\/(inter|poppins)/,
    );
    expect(leer('package.json')).not.toMatch(
      /fontsource[^"]*\/(inter|poppins)/,
    );
    // Ni se piden por su nombre: toda la aplicación va en Montserrat
    expect(leer('src/index.css')).not.toMatch(/'Inter|'Poppins/);
  });

  it('los ficheros que pide esa hoja existen', () => {
    const hoja = 'node_modules/@fontsource-variable/montserrat/index.css';
    const urls = [...leer(hoja).matchAll(/url\((\.\/files\/[^)]+)\)/g)].map(
      (m) => m[1],
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(() => leer(resolve(hoja, '..', url))).not.toThrow();
    }
  });

  it('la variable cubre los pesos de la marca, del 400 al 900', () => {
    const hoja = leer('node_modules/@fontsource-variable/montserrat/index.css');
    const [, desde, hasta] = hoja.match(/font-weight: (\d+) (\d+)/);

    expect(Number(desde)).toBeLessThanOrEqual(400);
    expect(Number(hasta)).toBeGreaterThanOrEqual(900);
  });

  it('la familia se llama como la publica el paquete variable', () => {
    expect(leer('src/index.css')).toContain("'Montserrat Variable'");
    expect(
      leer('node_modules/@fontsource-variable/montserrat/index.css'),
    ).toContain("font-family: 'Montserrat Variable'");
  });

  it.each([
    ['vite.config.js'],
    ['index.html'],
    ['nginx-security-headers.conf'],
    ['nginx.conf'],
  ])('%s no abre la CSP a Google Fonts', (fichero) => {
    expect(leer(fichero)).not.toMatch(GOOGLE_FONTS);
  });
});

describe('precache de las fuentes', () => {
  // El service worker precachea los .woff2 al instalarse. Con todos los
  // alfabetos eran 22 ficheros y unos 470 KB (cirílico, griego, vietnamita,
  // devanagari...) para una aplicación en español e inglés. Se precachean latín
  // y latín extendido: este último para que nombres con ł, ő, ș o č se vean
  // bien sin conexión (revisión). El resto sigue disponible y el navegador lo
  // pide si una página lo necesita
  it('vite.config.js deja fuera del precache lo que no es latín ni latín extendido', () => {
    const config = leer('vite.config.js');

    // Sin depender del formato: la lista entera, y ninguna más. La segunda son las
    // cabeceras de los correos (cabecerasDeCorreo.test) y la tercera la imagen
    // para compartir un enlace (buscadores.test)
    const lista = config.match(/globIgnores: \[([\s\S]*?)\n\s*\],/)[1];
    const entradas = [...lista.matchAll(/^\s*'([^']+)',?\s*$/gm)].map(
      (m) => m[1],
    );

    expect(entradas).toEqual([
      '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,devanagari}-*.woff2',
      'images/correo/**',
      'images/compartir/**',
    ]);
  });

  it('latín extendido entra en el precache: el patrón no lo nombra', () => {
    const patron = leer('vite.config.js').match(
      /globIgnores: \[([\s\S]*?)\n\s*\],/,
    )[1];

    expect(patron).not.toContain('latin-ext');
  });

  it('el service worker no guarda nada de Google Fonts (FE-10)', () => {
    // Una regla que ya no servía: si las fuentes volvieran de Google, se servirían un año
    // desde la caché sin comprobar su integridad
    // En cualquier forma: como dirección, como expresión regular o como nombre de caché
    expect(leer('vite.config.js')).not.toMatch(
      /googleapis|gstatic|google-fonts/,
    );
  });
});
