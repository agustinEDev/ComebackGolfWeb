import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import BrandMark, { Wordmark } from './BrandMark';

describe('BrandMark (el stamp)', () => {
  it('se pinta como decoracion cuando no lleva titulo', () => {
    const { container } = render(<BrandMark tinta="deep" />);
    const marca = container.querySelector('img');
    expect(marca).toHaveAttribute('aria-hidden', 'true');
    expect(marca).toHaveAttribute('alt', '');
  });

  it('tiene nombre accesible cuando lleva titulo', () => {
    render(<BrandMark tinta="deep" title="Comeback Golf" />);
    const marca = screen.getByAltText('Comeback Golf');
    expect(marca).not.toHaveAttribute('aria-hidden');
  });

  it.each([
    ['deep', '/brand/stamp-deep.svg'],
    ['acid', '/brand/stamp-acid.svg'],
  ])('la tinta %s pinta su SVG original', (tinta, src) => {
    const { container } = render(<BrandMark tinta={tinta} />);
    expect(container.querySelector('img')).toHaveAttribute('src', src);
  });

  it('por defecto sigue al tema: las dos tintas, y el CSS esconde una', () => {
    const { container } = render(<BrandMark />);
    const [clara, oscura] = container.querySelectorAll('img');

    expect(clara).toHaveAttribute('src', '/brand/stamp-deep.svg');
    expect(clara).toHaveClass('solo-claro');
    expect(oscura).toHaveAttribute('src', '/brand/stamp-acid.svg');
    expect(oscura).toHaveClass('solo-oscuro');
  });

  it('cae en la tinta deep ante una tinta que no existe', () => {
    const { container } = render(<BrandMark tinta="turquesa" />);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/stamp-deep.svg',
    );
  });
});

describe('Wordmark (el logo de las cabeceras)', () => {
  it('por defecto sigue al tema: deep en claro, acid en oscuro', () => {
    const { container } = render(<Wordmark title="Comeback Golf" />);
    const [clara, oscura] = container.querySelectorAll('img');

    expect(clara).toHaveAttribute('src', '/brand/wordmark-deep.svg');
    expect(clara).toHaveClass('solo-claro');
    expect(oscura).toHaveAttribute('src', '/brand/wordmark-acid.svg');
    expect(oscura).toHaveClass('solo-oscuro');
    expect(clara).toHaveAttribute('alt', 'Comeback Golf');
  });

  /**
   * El nombre en UNA línea (25 nov 2026): el de dos líneas no se podía agrandar
   * en una cabecera sin hacerla más alta, y la letra quedaba pequeña.
   *
   *   #   forma     | tinta | qué se pinta
   *   ----|----------|-------|--------------------------------------------
   *   L1  (ninguna) | tema  | el de dos líneas, como hasta ahora
   *   L2  linea     | tema  | el de una línea, en sus dos tintas
   *   L3  linea     | acid  | solo el de una línea en lima
   *   L4  otra cosa | tema  | el de dos líneas: una forma mal escrita no deja
   *                         | la cabecera sin logo
   */
  it('L2: en una línea, sigue al tema con sus dos tintas', () => {
    const { container } = render(
      <Wordmark forma="linea" title="Comeback Golf" />,
    );
    const [clara, oscura] = container.querySelectorAll('img');

    expect(clara).toHaveAttribute('src', '/brand/wordmark-linea-deep.svg');
    expect(clara).toHaveClass('solo-claro');
    expect(oscura).toHaveAttribute('src', '/brand/wordmark-linea-acid.svg');
    expect(oscura).toHaveClass('solo-oscuro');
    expect(clara).toHaveAttribute('alt', 'Comeback Golf');
  });

  it('L3: en una línea y con una tinta fija, solo esa', () => {
    const { container } = render(<Wordmark forma="linea" tinta="acid" />);

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/wordmark-linea-acid.svg',
    );
  });

  it('L4: una forma que no existe pinta el de dos líneas, y avisa', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Wordmark forma="línea" />);

    // «línea» con tilde es el despiste fácil: sin aviso salía el de dos líneas
    // a la altura pensada para el de una, con la letra diminuta
    expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/forma.*línea/));
    aviso.mockRestore();

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/wordmark-deep.svg',
    );
  });

  it('con una tinta fija pinta solo esa', () => {
    const { container } = render(<Wordmark tinta="acid" />);

    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/wordmark-acid.svg',
    );
  });
});

/**
 * Las dos tintas van siempre en el DOM y el CSS esconde la que no toca. Esa
 * regla no puede perder contra otra clase del mismo elemento: en la cabecera
 * pública el logo llevaba `block`, que en la capa de utilidades le ganaba por
 * orden, y salían las dos tintas a la vez (24 nov 2026).
 */
describe('esconder la tinta que no toca no depende de las demás clases', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

  it('las tres reglas llevan !important', () => {
    expect(css).toMatch(/\.solo-oscuro\s*\{\s*display:\s*none !important/);
    expect(css).toMatch(
      /\[data-tema='oscuro'\] \.solo-claro\s*\{\s*display:\s*none !important/,
    );
    expect(css).toMatch(
      /\[data-tema='oscuro'\] \.solo-oscuro\s*\{\s*display:\s*revert !important/,
    );
  });

  it('y van fuera de cualquier @layer', () => {
    // Hasta la regla, las llaves abiertas y cerradas se compensan: no hay
    // ningún bloque abierto alrededor
    const hasta = css.slice(0, css.search(/\n\.solo-oscuro\s*\{/));
    const sinComentarios = hasta.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(sinComentarios.split('{').length).toBe(
      sinComentarios.split('}').length,
    );
  });
});

/**
 * Los logos son los del diseñador: no se redibujan, no se deforman y no se
 * recolorean. Los originales viven fuera del repositorio (la carpeta `brand/`
 * dejó de versionarse el 25 nov 2026), así que lo que se vigila es lo que se
 * sirve, `public/brand/`, por sí mismo:
 *
 *   #   qué                                   | por qué
 *   ----|---------------------------------------|---------------------------------
 *   O1  están exactamente los seis que se usan | uno de más no lo vigila nadie
 *   O2  cada uno, una sola tinta: la suya      | los originales llegan en los tonos
 *                                              | del diseñador, no en los del dossier
 *   O3  solo dibujo: sin metadatos, scripts,   | los originales traen un bloque de
 *       enlaces ni datos embebidos             | procedencia que pesa más que el logo
 *   O4  solo las etiquetas de un dibujo plano  | lo que entre con otra etiqueta
 *   O5  los iconos PNG, solo con sus trozos    | el mismo bloque cabe en un PNG
 *       de imagen
 */
describe('los logos servidos', () => {
  const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta));
  const SERVIDOS = [
    'wordmark-deep.svg',
    'wordmark-acid.svg',
    'wordmark-linea-deep.svg',
    'wordmark-linea-acid.svg',
    'stamp-deep.svg',
    'stamp-acid.svg',
  ];
  const TINTA = { deep: '#222D24', acid: '#DDF478' };

  it('O1: en public/brand están los seis que se usan, y ninguno más', () => {
    expect(readdirSync(resolve(process.cwd(), 'public/brand')).sort()).toEqual(
      [...SERVIDOS].sort(),
    );
  });

  it.each(SERVIDOS)(
    'O2: %s lleva una sola tinta, la del dossier',
    (fichero) => {
      const svg = leer(`public/brand/${fichero}`).toString();
      const colores = [...svg.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) =>
        m[0].toUpperCase(),
      );

      expect([...new Set(colores)]).toEqual([
        TINTA[fichero.match(/-(deep|acid)\.svg$/)[1]],
      ]);
    },
  );

  it.each(SERVIDOS)('O3: %s es solo dibujo', (fichero) => {
    const svg = leer(`public/brand/${fichero}`).toString();

    expect(svg).not.toMatch(
      /<metadata|c2pa|jumbf|<script|<foreignObject|<image|<use|href=|\bon[a-z]+\s*=|<!DOCTYPE|<!ENTITY|base64|data:|url\(|@import/i,
    );
  });

  it.each(SERVIDOS)(
    'O4: %s solo usa las etiquetas de un dibujo plano',
    (fichero) => {
      const svg = leer(`public/brand/${fichero}`).toString();
      const etiquetas = new Set(
        [...svg.matchAll(/<([a-zA-Z][\w:-]*)/g)].map((m) => m[1]),
      );

      expect([...etiquetas].sort()).toEqual([
        'defs',
        'g',
        'path',
        'style',
        'svg',
      ]);
    },
  );

  it('O5: los iconos de la aplicación son PNG con solo sus trozos de imagen', () => {
    const PERMITIDOS = new Set([
      'IHDR',
      'PLTE',
      'tRNS',
      'IDAT',
      'IEND',
      'sRGB',
      'gAMA',
      'pHYs',
    ]);
    const iconos = readdirSync(resolve(process.cwd(), 'public/icons')).filter(
      (f) => f.endsWith('.png'),
    );
    expect(iconos.length).toBeGreaterThan(0);

    for (const fichero of iconos) {
      const png = leer(`public/icons/${fichero}`);
      const trozos = [];
      // 8 bytes de firma; cada trozo: 4 de longitud, 4 de tipo, datos, 4 de CRC
      for (let i = 8; i < png.length;) {
        const largo = png.readUInt32BE(i);
        trozos.push(png.toString('latin1', i + 4, i + 8));
        i += 12 + largo;
      }

      expect(
        trozos.filter((t) => !PERMITIDOS.has(t)),
        fichero,
      ).toEqual([]);
      expect(trozos.at(-1), fichero).toBe('IEND');
    }
  });
});

/**
 * La marca vivia copiada a mano en trece sitios (FE #464): quien retocaba el
 * color o la imagen cambiaba unas copias y se dejaba otras, y la discrepancia
 * solo salia en la pantalla que nadie abria. Durante un tiempo llegaron a
 * convivir DOS marcas distintas —el triangulo en el pie y en las pantallas de
 * autenticacion, el monograma en las cabeceras—, que es como se descubrio.
 *
 * Es una asercion sobre el fuente, como pageTitles.test.js, porque una copia
 * pegada en una pantalla que este test no renderiza no la ve ningun render.
 */
describe('la marca no vuelve a duplicarse', () => {
  const PERMITIDOS = ['src/components/ui/BrandMark.jsx'];

  /** `index.html`, `public/` y `vite.config.js` llevan marcado escrito a mano
   *  —la pantalla sin conexion, el manifiesto, el service worker— donde cabe un
   *  logo de arranque: si el guardia no los mira, una copia pegada ahi se queda
   *  con la marca vieja y vuelve a divergir. */
  const RAICES = ['src', 'public'];
  const SUELTOS = ['index.html', 'vite.config.js'];

  /** Cualquier forma de nombrar los ficheros de marca, los de ahora y los de
   *  la marca anterior, que no deben volver. El trazo del triangulo se vigila
   *  tambien: si reaparece, es que alguien volvio a pegarlo. */
  const RASTROS = [
    /brand\/(stamp|wordmark|badge)/,
    /rcf-monogram/,
    /rcf-logo/,
    /M13\.8261 17\.4264/,
  ];

  const listarFuentes = (dir) => {
    const salida = [];
    for (const entrada of readdirSync(resolve(process.cwd(), dir))) {
      const ruta = join(dir, entrada);
      if (statSync(resolve(process.cwd(), ruta)).isDirectory()) {
        salida.push(...listarFuentes(ruta));
      } else if (
        /\.(jsx?|tsx?|html|svg|css)$/.test(entrada) &&
        // Un test puede nombrar el fichero que comprueba
        !/\.test\.jsx?$/.test(entrada)
      ) {
        salida.push(ruta);
      }
    }
    return salida;
  };

  it('solo BrandMark.jsx nombra la marca', () => {
    const conLaMarca = [...RAICES.flatMap(listarFuentes), ...SUELTOS]
      .filter((ruta) => {
        const texto = readFileSync(resolve(process.cwd(), ruta), 'utf8');
        return RASTROS.some((r) => r.test(texto));
      })
      // `index.html` y la hoja de estilos tienen su caso propio, más abajo:
      // no se les da vía libre, se cuenta lo que nombran
      .filter(
        (ruta) =>
          !PERMITIDOS.includes(ruta) &&
          ruta !== 'index.html' &&
          // Con la barra normalizada: en Windows la ruta sale con `\\`
          ruta.replaceAll('\\', '/') !== 'src/index.css',
      );

    expect(conLaMarca).toEqual([]);
  });
});

/**
 * `index.html` es el unico sitio donde la marca vive fuera del componente: la
 * espera del arranque se pinta ANTES de que exista React. No se le da via libre
 * al fichero entero —eso apagaria el guardia justo ahi— sino a la referencia
 * que necesita la capa.
 */
describe('la marca en index.html', () => {
  // Las dos tintas del stamp de la espera del arranque: Deep Forest en claro y
  // lima si el sistema va en oscuro (el oscuro es de toda la app, 24 nov 2026)
  const ESPERADAS = ['/brand/stamp-deep.svg', '/brand/stamp-acid.svg'];

  it('solo estan las dos tintas de la espera del arranque', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    // Sin deduplicar: una tercera copia que repita una ruta —un `og:image`
    // apuntando al mismo PNG— se colaba si se agrupaban
    const encontradas =
      html.match(/[\w./-]*brand\/(?:stamp|wordmark|badge)[\w-]*\.\w+/g) || [];

    expect(encontradas.sort()).toEqual([...ESPERADAS].sort());
  });

  it('el trazo del triangulo tampoco puede colarse ahi', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(html).not.toMatch(/M13\.8261 17\.4264/);
    expect(html).not.toMatch(/rcf-logo|rcf-monogram/);
  });
});

/**
 * La hoja de estilos es el otro sitio donde la marca vive fuera del componente:
 * la marca de agua de la portada pública es el monograma en una capa de fondo
 * (`marcaDeAguaDelMonograma`, Agustín, 26 nov 2026), y un fondo de CSS no puede
 * pintarse con un componente. Como en `index.html`, no se le da vía libre al
 * fichero: se cuenta lo que nombra.
 */
describe('la marca en index.css', () => {
  // Las dos tintas del sello: Deep Forest en claro y lima en oscuro
  const ESPERADAS = ['/brand/stamp-deep.svg', '/brand/stamp-acid.svg'];
  const css = () =>
    readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );

  it('solo estan las dos tintas del monograma de la marca de agua', () => {
    const encontradas =
      css().match(/[\w./-]*brand\/(?:stamp|wordmark|badge)[\w-]*\.\w+/g) || [];

    expect(encontradas.sort()).toEqual([...ESPERADAS].sort());
  });

  it('y las dos, dentro de la regla del monograma', () => {
    const reglas = css().match(/[^{}]*\{[^{}]*brand\/stamp[^{}]*\}/g) || [];

    expect(reglas).toHaveLength(2);
    for (const regla of reglas) {
      expect(regla).toMatch(/\.marca-de-agua-monograma::before\s*\{/);
    }
  });

  it('ni la marca anterior ni el trazo del triangulo', () => {
    expect(css()).not.toMatch(/M13\.8261 17\.4264/);
    expect(css()).not.toMatch(/rcf-logo|rcf-monogram/);
  });
});
