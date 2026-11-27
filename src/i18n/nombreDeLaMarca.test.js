import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * La aplicación se llama Comeback Golf (24 nov 2026). Ningún texto visible
 * puede decir «Ryder Cup» ni «RyderCup», que es una marca ajena; «Ryder» a
 * secas o «Cup» sí.
 *
 * La única excepción es el dominio y sus direcciones de correo
 * (`rydercupfriends.com`), que no cambian con la marca.
 *
 * Y el título del aviso de la mudanza, que solo sale en el dominio viejo: es
 * el único sitio donde hay que decir cómo se llamaba (Agustín, 27 nov 2026).
 * Solo esa clave y solo con el nombre antiguo de la aplicación.
 */
const raiz = process.cwd();
const leer = (ruta) => readFileSync(resolve(raiz, ruta), 'utf8');

// El dominio, fuera: lo que quede es texto
const sinElDominio = (texto) =>
  texto.replace(/[\w.+-]*@?(?:www\.|api\.)?rydercupfriends\.com/gi, '');

const PROHIBIDO = /ryder\s*cup|\bRCF\b/i;

const NOMBRE_ANTIGUO_PERMITIDO = { 'common.json': ['mudanza.titulo'] };
const sinElNombreAntiguo = (fichero, clave, texto) =>
  NOMBRE_ANTIGUO_PERMITIDO[fichero]?.includes(clave)
    ? texto.replace(/\bRyderCupFriends\b/g, '')
    : texto;

const textosDe = (valor, ruta = '') =>
  typeof valor === 'string'
    ? [[ruta, valor]]
    : Object.entries(valor ?? {}).flatMap(([clave, hijo]) =>
        textosDe(hijo, ruta ? `${ruta}.${clave}` : clave),
      );

describe('el nombre de la marca en lo que se ve', () => {
  const idiomas = readdirSync(resolve(raiz, 'src/i18n/locales')).filter(
    (d) => !d.includes('.'),
  );

  it.each(idiomas)('los textos en %s no nombran la marca ajena', (idioma) => {
    const dir = join('src/i18n/locales', idioma);
    const culpables = readdirSync(resolve(raiz, dir))
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) =>
        textosDe(JSON.parse(leer(join(dir, f))))
          .filter(([clave, texto]) =>
            PROHIBIDO.test(sinElDominio(sinElNombreAntiguo(f, clave, texto))),
          )
          .map(([clave]) => `${f}: ${clave}`),
      );

    expect(culpables).toEqual([]);
  });

  it.each(idiomas)(
    'la excepción del aviso de la mudanza (%s) nombra la aplicación antigua y nada más',
    (idioma) => {
      const comun = JSON.parse(
        leer(join('src/i18n/locales', idioma, 'common.json')),
      );
      expect(comun.mudanza.titulo).toMatch(/\bRyderCupFriends\b/);
      expect(
        comun.mudanza.titulo.replace(/\bRyderCupFriends\b/g, ''),
      ).not.toMatch(PROHIBIDO);
      expect(comun.mudanza.titulo).toContain('Comeback Golf');
    },
  );

  /**
   * Lo que se ve o se lee de una página: su título, sus metadatos, su texto y
   * los nombres accesibles. Con un analizador de HTML y no quitando los
   * comentarios a mano: los comentarios y los estilos no son contenido, y así
   * no hay que acertar con una expresión regular qué es un comentario.
   */
  const loVisibleDe = (fichero) => {
    const doc = new globalThis.DOMParser().parseFromString(
      leer(fichero),
      'text/html',
    );
    for (const nodo of doc.querySelectorAll('style, script')) nodo.remove();
    const atributos = [...doc.querySelectorAll('*')].flatMap((nodo) =>
      ['content', 'alt', 'title', 'aria-label', 'placeholder']
        .map((nombre) => nodo.getAttribute(nombre))
        .filter(Boolean),
    );
    return [doc.title, doc.body?.textContent ?? '', ...atributos].map(
      sinElDominio,
    );
  };

  it.each([['index.html'], ['public/offline.html']])(
    '%s tampoco',
    (fichero) => {
      const visible = loVisibleDe(fichero);

      expect(visible.length).toBeGreaterThan(1);
      for (const texto of visible) expect(texto).not.toMatch(PROHIBIDO);
    },
  );

  it('el vigía ve lo que tiene que ver: un título, un metadato y un texto con el nombre ajeno', () => {
    // Sin esto, un analizador que no encontrase nada daría el test por bueno
    const doc = new globalThis.DOMParser().parseFromString(
      '<title>Ryder Cup</title><meta name="d" content="RCF"><body><!-- RyderCup --><p>hola</p></body>',
      'text/html',
    );
    const meta = doc.querySelector('meta').getAttribute('content');

    expect(doc.title).toMatch(PROHIBIDO);
    expect(meta).toMatch(PROHIBIDO);
    // El comentario no cuenta: no se ve
    expect(doc.body.textContent).not.toMatch(PROHIBIDO);
  });

  it('el manifiesto de la aplicación instalada se llama Comeback Golf', () => {
    const config = leer('vite.config.js');

    expect(config).toMatch(/name: 'Comeback Golf'/);
    // Bajo el icono caben unos 12 caracteres
    const [, corto] = config.match(/short_name: '([^']+)'/);
    expect(corto).toBe('ComebackGolf');
    expect(corto.length).toBeLessThanOrEqual(12);
    expect(corto).not.toMatch(PROHIBIDO);
  });

  it('el título de la página y el nombre del icono en iOS, también', () => {
    const html = leer('index.html');

    expect(html).toMatch(/<title>Comeback Golf/);
    expect(html).toMatch(
      /name="apple-mobile-web-app-title" content="ComebackGolf"/,
    );
  });
});
