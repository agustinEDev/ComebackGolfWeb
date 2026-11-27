import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
// Lo que usa `@tailwindcss/postcss` por dentro: compila el `index.css` de verdad
import { compile } from '@tailwindcss/node';

/**
 * Los colores de la marca con opacidad (pasada del Kind, 27 oct 2026).
 *
 * `index.css` definía cada color solo por su escala (`--color-primary-50` … `-950`)
 * y unas utilidades a mano. Tailwind no generaba `bg-primary/90`, `ring-primary/20`,
 * `border-primary/30` ni `bg-accent/90`, usadas en 70 ficheros: ni el hover de los
 * botones, ni los anillos de foco, ni los fondos suaves; y el cuadro de la invitación
 * salía con borde negro. jsdom no pinta CSS, así que ningún render lo nota: de ahí
 * que esto compile el tema y mire lo que sale.
 */
const SRC = resolve(process.cwd(), 'src');
let tailwind;

beforeAll(async () => {
  tailwind = await compile(readFileSync(resolve(SRC, 'index.css'), 'utf8'), {
    base: SRC,
    onDependency() {},
  });
});

/** La regla entera de una clase, contando llaves (lleva un `@supports` dentro). */
const reglaDe = (clase) => {
  const css = tailwind.build([clase]);
  const inicio = css.indexOf(`.${clase.replace('/', '\\/')} {`);
  if (inicio < 0) return null;
  let profundidad = 0;
  for (let i = css.indexOf('{', inicio); i < css.length; i++) {
    if (css[i] === '{') profundidad++;
    else if (css[i] === '}' && --profundidad === 0)
      return css.slice(inicio, i + 1);
  }
  return null;
};

// El tono de cada color «a secas»: el de las utilidades que había a mano
// Con la marca ComeBack Golf (24 nov 2026) son otros: `primary`, `secondary` y
// `navy` pasan a Deep Forest, y `accent`, al oliva de la familia de la lima
const TONOS = {
  primary: ['#222d24', '--color-primary-500'],
  secondary: ['#222d24', '--color-secondary-500'],
  accent: ['#5f6b2a', '--color-accent-500'],
  navy: ['#222d24', '--color-navy-800'],
};
// Con su tono de verdad: el hexadecimal en la regla, o una variable que, en lo
// que compila Tailwind, vale ese hexadecimal (CodeRabbit). Las escalas son
// variables de verdad desde el 24 nov 2026 —para que el oscuro pueda darles otro
// valor—, así que la regla dice `var(--color-primary)` y esa apunta a su tono:
// se sigue la cadena. Vale la PRIMERA definición, la del tema; las de después
// son las del oscuro.
const valorDe = (variable, css) => {
  let nombre = variable;
  for (let salto = 0; salto < 4; salto++) {
    const valor = css.match(new RegExp(`${nombre}:\\s*([^;]+);`))?.[1].trim();
    const otra = valor?.match(/^var\((--[\w-]+)\)$/)?.[1];
    if (!otra) return valor?.toLowerCase() ?? null;
    nombre = otra;
  }
  return null;
};
const conSuTono = (regla, color, css) => {
  const [hex, variable] = TONOS[color];
  if (regla.toLowerCase().includes(hex)) return true;
  const usada = regla.match(
    new RegExp(`var\\((--color-${color}(?:-\\d+)?)\\)`),
  );
  return (
    Boolean(usada) &&
    valorDe(usada[1], css) === hex &&
    valorDe(variable, css) === hex
  );
};

describe('colores de marca', () => {
  it.each([
    ['bg-primary/90', 'primary', 'background-color'],
    ['bg-primary/5', 'primary', 'background-color'],
    ['border-primary/30', 'primary', 'border-color'],
    ['ring-primary/20', 'primary', '--tw-ring-color'],
    ['bg-accent/90', 'accent', 'background-color'],
  ])('%s existe, con su tono y su opacidad', (clase, color, propiedad) => {
    const regla = reglaDe(clase);
    const opacidad = clase.split('/')[1];

    expect(regla).not.toBeNull();
    expect(regla).toContain(propiedad);
    expect(conSuTono(regla, color, tailwind.build([clase]))).toBe(true);
    expect(regla).toMatch(new RegExp(`\\b${opacidad}%`));
  });

  it.each([
    ['bg-primary', 'primary'],
    ['text-primary', 'primary'],
    ['border-primary', 'primary'],
    ['bg-secondary', 'secondary'],
    ['text-secondary', 'secondary'],
    ['bg-accent', 'accent'],
    ['text-accent', 'accent'],
    ['bg-navy', 'navy'],
  ])('%s lleva el tono de la marca', (clase, color) => {
    const regla = reglaDe(clase);

    expect(regla).not.toBeNull();
    expect(conSuTono(regla, color, tailwind.build([clase]))).toBe(true);
  });
});

/**
 * La identidad de ComeBack Golf (su dossier, 24 nov 2026). Los tres
 * colores son los del dossier y no se retocan; los semánticos cambian con el
 * tema, y el oscuro vale para toda la aplicación.
 */
describe('ComeBack Golf · colores de la marca', () => {
  const css = readFileSync(resolve(SRC, 'index.css'), 'utf8');

  /** Las variables `--cbg-*` de un bloque, tal como están escritas. */
  const escritasEn = (selector) => {
    const inicio = css.indexOf(`${selector} {`);
    expect(inicio).toBeGreaterThanOrEqual(0);
    const bloque = css.slice(inicio, css.indexOf('}', inicio));
    return Object.fromEntries(
      [...bloque.matchAll(/(--cbg-[\w-]+):\s*([^;]+);/g)].map(
        ([, nombre, valor]) => [nombre, valor.replaceAll(/\s+/g, ' ').trim()],
      ),
    );
  };

  /**
   * Cada variable con su valor final: sigue los `var()` y calcula los
   * `color-mix(in srgb, A N%, B)`. Se resuelve con las variables DEL TEMA: un
   * tinte definido una vez en `:root` sale distinto en oscuro porque lo que
   * mezcla cambia, igual que en el navegador.
   */
  const resueltas = (escritas) => {
    const valorDe = (expresion) => {
      const ref = expresion.match(/^var\((--cbg-[\w-]+)\)$/);
      if (ref) return valorDe(escritas[ref[1]]);
      const mezcla = expresion.match(
        /^color-mix\( ?in srgb, (.+?) (\d+)%, (.+?) ?\)$/,
      );
      if (!mezcla) return expresion;
      const [uno, otro] = [valorDe(mezcla[1]), valorDe(mezcla[3])].map((hex) =>
        [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)),
      );
      const parte = Number(mezcla[2]) / 100;
      return `#${uno
        .map((v, i) =>
          Math.round(v * parte + otro[i] * (1 - parte))
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')}`;
    };
    return Object.fromEntries(
      Object.entries(escritas).map(([nombre, valor]) => [
        nombre,
        valorDe(valor),
      ]),
    );
  };

  const enClaro = escritasEn(':root');
  const claro = resueltas(enClaro);
  const oscuro = resueltas({
    ...enClaro,
    ...escritasEn(":root[data-tema='oscuro']"),
  });

  it.each([
    ['--cbg-sand', '#e8ddce'],
    ['--cbg-forest', '#222d24'],
    ['--cbg-lime', '#ddf478'],
  ])('%s es el del dossier', (variable, hex) => {
    expect(claro[variable]).toBe(hex);
    // No cambian con el tema
    expect(oscuro[variable]).toBe(hex);
  });

  /**
   * El sistema cromático (25 nov 2026): el claro, todo en arena, perdía
   * frescura. Tres superficies por tema, y el oscuro no es el claro invertido.
   *
   *   superficie | claro               | oscuro
   *   -----------|---------------------|-------------------------
   *   fondo      | Off White #f8f7f2   | Deep Forest #222d24
   *   tarjeta    | Sand #e8ddce        | #273328
   *   realce     | Soft Sage #dce3d7   | Forest Medium #354638
   */
  it.each([
    ['--cbg-fondo', '#f8f7f2', '#222d24'],
    ['--cbg-tarjeta', '#e8ddce', '#273328'],
    ['--cbg-realce', '#dce3d7', '#354638'],
    ['--cbg-tinta', '#222d24', '#e8ddce'],
  ])('%s: %s en claro y %s en oscuro', (variable, enClaro, enOscuro) => {
    expect(claro[variable]).toBe(enClaro);
    expect(oscuro[variable]).toBe(enOscuro);
  });

  // Solo que no se repita un valor: que se DISTINGAN a la vista no lo prueba
  // esto (Sage y Sand tienen la misma luminancia; las separa el matiz)
  it('ninguna superficie repite el valor de otra', () => {
    for (const tema of [claro, oscuro]) {
      expect(
        new Set([
          tema['--cbg-fondo'],
          tema['--cbg-tarjeta'],
          tema['--cbg-realce'],
        ]).size,
      ).toBe(3);
    }
  });

  it.each([
    ['bg-fondo', 'var(--cbg-fondo)'],
    ['bg-tarjeta', 'var(--cbg-tarjeta)'],
    ['bg-realce', 'var(--cbg-realce)'],
    ['bg-error-suave', 'var(--cbg-error-suave)'],
    ['bg-team-b-suave', 'var(--cbg-team-b-suave)'],
    ['text-tinta', 'var(--cbg-tinta)'],
    ['text-tinta-suave', 'var(--cbg-tinta-suave)'],
    ['border-linea', 'var(--cbg-linea)'],
    ['text-team-a', 'var(--cbg-team-a)'],
    ['text-team-b', 'var(--cbg-team-b)'],
    ['bg-lime', '#ddf478'],
    ['text-forest', '#222d24'],
    ['bg-sand', '#e8ddce'],
  ])('%s existe y sale de su token', (clase, valor) => {
    const regla = reglaDe(clase);

    expect(regla).not.toBeNull();
    expect(regla.toLowerCase()).toContain(valor);
  });

  it('los semánticos admiten opacidad (bg-tinta/10)', () => {
    expect(reglaDe('bg-tinta/10')).toMatch(/\b10%/);
  });

  // Contraste WCAG 2.1 sobre los valores de verdad de index.css
  const luminancia = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contraste = (a, b) => {
    const [clara, oscura] = [luminancia(a), luminancia(b)].sort(
      (x, y) => y - x,
    );
    return (clara + 0.05) / (oscura + 0.05);
  };

  const TEXTOS = [
    ['--cbg-tinta', '--cbg-fondo'],
    ['--cbg-tinta', '--cbg-tarjeta'],
    ['--cbg-tinta', '--cbg-realce'],
    // La bola que contó (fourball), con lo que lleva encima
    ['--cbg-tinta', '--cbg-mejor-bola'],
    ['--cbg-tinta-suave', '--cbg-mejor-bola'],
    // Texto sobre un color macizo: la pestaña elegida de un equipo y el «Sí» de un aviso
    ['--cbg-fondo', '--cbg-team-a'],
    ['--cbg-fondo', '--cbg-team-b'],
    ['--cbg-sobre-contraste', '--cbg-aviso'],
    ['--cbg-tinta-suave', '--cbg-realce'],
    ['--cbg-team-a', '--cbg-realce'],
    ['--cbg-team-b', '--cbg-realce'],
    ['--cbg-exito', '--cbg-realce'],
    ['--cbg-tinta-suave', '--cbg-fondo'],
    ['--cbg-tinta-suave', '--cbg-tarjeta'],
    ['--cbg-sobre-contraste', '--cbg-contraste'],
    ['--cbg-team-a', '--cbg-fondo'],
    ['--cbg-team-a', '--cbg-tarjeta'],
    ['--cbg-team-b', '--cbg-fondo'],
    ['--cbg-team-b', '--cbg-tarjeta'],
    ['--cbg-aviso', '--cbg-tarjeta'],
    ['--cbg-error', '--cbg-tarjeta'],
    ['--cbg-exito', '--cbg-tarjeta'],
    ['--cbg-aviso', '--cbg-fondo'],
    ['--cbg-error', '--cbg-fondo'],
    ['--cbg-exito', '--cbg-fondo'],
    // Un estado como fondo (un hoyo en conflicto): su texto es el del fondo
    ['--cbg-fondo', '--cbg-error'],
    ['--cbg-fondo', '--cbg-exito'],
    ['--cbg-fondo', '--cbg-aviso'],
    // El botón principal: Deep Forest sobre Acid Lime, en los dos temas
    ['--cbg-forest', '--cbg-lime'],
  ];

  describe.each([
    ['claro', claro],
    ['oscuro', oscuro],
  ])('contraste AA en %s', (_, tema) => {
    it.each(TEXTOS)('%s sobre %s llega a 4,5:1', (texto, fondo) => {
      expect(contraste(tema[texto], tema[fondo])).toBeGreaterThanOrEqual(4.5);
    });
  });

  /**
   * Los fondos suaves de las insignias («Gana», «Pierde», «Retirado», la cabecera
   * de un equipo): el color al 12 % sobre el fondo, OPACO. Con una opacidad sobre
   * lo que hubiera debajo, el mismo texto bajaba de 4,5:1 encima de una tarjeta
   * arena o salvia (revisión, 25 nov 2026).
   */
  describe.each([
    ['claro', claro],
    ['oscuro', oscuro],
  ])('las insignias sobre su fondo suave, en %s', (_, tema) => {
    it.each(['aviso', 'error', 'exito', 'team-a', 'team-b'])(
      '%s se lee sobre su fondo suave',
      (nombre) => {
        // Sale del color y del fondo del tema, no es un valor suelto
        expect(enClaro[`--cbg-${nombre}-suave`]).toMatch(
          new RegExp(
            `^color-mix\\( ?in srgb, var\\(--cbg-${nombre}\\) \\d+%, var\\(--cbg-fondo\\) ?\\)$`,
          ),
        );
        expect(
          contraste(tema[`--cbg-${nombre}`], tema[`--cbg-${nombre}-suave`]),
        ).toBeGreaterThanOrEqual(4.5);
      },
    );
  });

  it('la lima no es fondo de texto claro: solo lleva Deep Forest encima', () => {
    expect(contraste('#e8ddce', '#ddf478')).toBeLessThan(3);
    expect(contraste('#222d24', '#ddf478')).toBeGreaterThanOrEqual(7);
  });

  // Las escalas de antes siguen en muchas pantallas, en claro: lo que era
  // texto gris tiene que seguir leyéndose sobre el Sand
  it.each([
    ['--color-gray-500', '#5c6258'],
    ['--color-gray-600', '#4a5148'],
    ['--color-gray-900', '#222d24'],
  ])('%s se lee sobre Sand y sobre blanco', (variable, hex) => {
    expect(css).toContain(`${variable}: ${hex};`);
    expect(contraste(hex, '#e8ddce')).toBeGreaterThanOrEqual(4.5);
    expect(contraste(hex, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * La paleta oscura de las escalas de antes (24 nov 2026): el oscuro vale para
   * toda la aplicación, y las pantallas sin rediseñar lo pintan con sus clases
   * de siempre, que aquí cambian de valor.
   *
   *   #  caso                                            | resultado
   *   ---|-------------------------------------------------|---------------------
   *   P1 texto gris/primario sobre tarjeta y sobre fondo | AA (4,5:1)
   *   P2 `bg-X-600 text-white` (botones de color)        | AA: texto oscuro
   *   P3 `bg-X-100 text-X-800` (insignias de estado)     | AA
   *   P4 dentro de `data-paleta="propia"` (mapa, fotos)  | el blanco es blanco
   *   P5 en claro, el blanco de antes                    | el fondo, Off White
   */
  describe('la paleta oscura de las escalas de antes', () => {
    const bloque = (selector) => {
      // El ÚLTIMO bloque con ese selector: el primero es el de los semánticos
      const inicio = css.lastIndexOf(`\n${selector} {`);
      expect(inicio).toBeGreaterThanOrEqual(0);
      const texto = css.slice(inicio, css.indexOf('\n}', inicio));
      return Object.fromEntries(
        [...texto.matchAll(/(--color-[\w-]+):\s*(#[0-9a-f]{3,6});/g)].map(
          ([, nombre, valor]) => [nombre, valor],
        ),
      );
    };
    const paleta = bloque(":root[data-tema='oscuro']");
    const TARJETA = '#273328';
    const FONDO = '#222d24';
    const COLORES = [
      'blue',
      'red',
      'green',
      'emerald',
      'yellow',
      'amber',
      'orange',
      'purple',
      'indigo',
      'pink',
      'rose',
      'sky',
      'teal',
      'violet',
    ];

    it('el blanco es la tarjeta oscura y `gray-50`, el fondo', () => {
      expect(paleta['--color-white']).toBe(TARJETA);
      expect(paleta['--color-gray-50']).toBe(FONDO);
    });

    it.each([
      '--color-gray-500',
      '--color-gray-600',
      '--color-gray-700',
      '--color-gray-900',
      '--color-primary',
      '--color-primary-700',
    ])('P1: %s se lee sobre la tarjeta y sobre el fondo', (variable) => {
      expect(contraste(paleta[variable], TARJETA)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(paleta[variable], FONDO)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(COLORES)('P2: %s-600 con texto «blanco» encima se lee', (color) => {
      expect(
        contraste(paleta[`--color-${color}-600`], paleta['--color-white']),
      ).toBeGreaterThanOrEqual(4.5);
    });

    it.each(COLORES)('P3: %s-800 y -700 sobre %s-100 se leen', (color) => {
      const fondo = paleta[`--color-${color}-100`];
      expect(
        contraste(paleta[`--color-${color}-800`], fondo),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contraste(paleta[`--color-${color}-700`], fondo),
      ).toBeGreaterThanOrEqual(4.5);
    });

    it('P4: lo que pinta sus propios colores recupera TODAS las escalas', () => {
      // El texto entero del bloque: los valores de claro no son todos
      // hexadecimales (los de Tailwind van en oklch)
      const textoDe = (selector) => {
        const inicio = css.lastIndexOf(`\n${selector} {`);
        expect(inicio).toBeGreaterThanOrEqual(0);
        return css.slice(inicio, css.indexOf('\n}', inicio));
      };
      const nombres = (texto) =>
        [...texto.matchAll(/(--color-[\w-]+):/g)].map(([, n]) => n).sort();
      const propia = textoDe(
        ":root[data-tema='oscuro'] [data-paleta='propia']",
      );

      // Ni una de menos: un `bg-green-700 text-white` sobre el satélite del
      // mapa quedaba verde pálido con texto blanco (revisión, 25 nov 2026)
      expect(nombres(propia)).toEqual(
        nombres(textoDe(":root[data-tema='oscuro']")),
      );
      expect(propia).toMatch(/--color-white:\s*#fff;/);

      // Y con el VALOR de claro, el que compila Tailwind: si se retoca un tono
      // del tema o cambia el de Tailwind, el mapa no puede quedarse con otro
      const variables = [...propia.matchAll(/(--color-[\w-]+):\s*([^;]+);/g)]
        .map(([, nombre, valor]) => [nombre, valor.trim()])
        .filter(([nombre]) => nombre !== '--color-white');
      const compilado = tailwind.build(
        variables.map(([nombre]) => nombre.replace('--color-', 'bg-')),
      );
      const enClaro = (nombre) =>
        compilado.match(new RegExp(`${nombre}:\\s*([^;]+);`))?.[1].trim();
      for (const [nombre, valor] of variables)
        expect(`${nombre}: ${valor}`).toBe(`${nombre}: ${enClaro(nombre)}`);
      expect(propia).toMatch(/--color-primary:\s*var\(--color-primary-500\);/);
      expect(propia).toMatch(/--color-primary-500:\s*#222d24;/);
      expect(bloque("[data-paleta='propia']")['--color-white']).toBe('#fff');
    });

    it('P6: todo tono de color que usa la aplicación tiene su valor oscuro', () => {
      // Un `bg-cyan-100` nuevo saldría claro sobre Deep Forest sin que nada avisara
      const usados = new Set();
      const recorre = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const ruta = resolve(dir, e.name);
          if (e.isDirectory()) recorre(ruta);
          else if (/\.jsx?$/.test(e.name) && !/\.test\./.test(e.name))
            for (const [, familia, paso] of readFileSync(ruta, 'utf8').matchAll(
              /\b(?:bg|text|border|ring|divide|from|via|to|fill|stroke|outline|decoration|accent|caret|placeholder)-(?:[trblxy]-)?(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary|secondary|accent|navy)-(\d{2,3})\b/g,
            ))
              usados.add(`--color-${familia}-${paso}`);
        }
      };
      recorre(SRC);

      expect([...usados].filter((v) => !(v in paleta)).sort()).toEqual([]);
    });

    it('P5: en claro, el blanco de antes es el fondo, Off White', () => {
      expect(css).toMatch(
        /\n:root \{\s*--color-white:\s*var\(--cbg-fondo\);\s*\}/,
      );
    });
  });
});
