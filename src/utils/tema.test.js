import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * El tema claro u oscuro de la marca.
 *
 * Por defecto sigue al sistema; el conmutador (sol/luna) elige uno y se
 * recuerda en `localStorage`. El oscuro vale para toda la aplicación.
 *
 *   #   guardado  | sistema | qué se aplica (`data-tema`)
 *   ----|-----------|---------|-----------------------------
 *   T1  nada      | claro   | claro
 *   T2  nada      | oscuro  | oscuro
 *   T3  claro     | oscuro  | claro: manda lo elegido
 *   T4  oscuro    | claro   | oscuro
 *   T5  basura    | oscuro  | oscuro: lo que no se entiende es «sistema»
 *   T6  nada, y el sistema cambia a oscuro   | pasa a oscuro sin recargar
 *   T7  claro, y el sistema cambia a oscuro  | sigue en claro
 *   T8  alternar desde claro → oscuro, y se guarda
 *   T8b volver al tema del sistema         | deja de elegir: lo sigue otra vez
 *   T8c sistema oscuro, se elige claro     | se recuerda
 *   T9  sin `localStorage` (modo privado que lanza) | sigue al sistema, y
 *       alternar funciona aunque no se pueda guardar
 *   T10 quien escucha se entera de cada cambio, y deja de enterarse al irse
 *   T11 `theme-color` del documento: el fondo del tema
 */
let sistemaOscuro;
let oyentesDelSistema;
let almacen;

const preparar = async ({
  guardado,
  oscuro = false,
  sinAlmacen = false,
} = {}) => {
  vi.resetModules();
  sistemaOscuro = oscuro;
  oyentesDelSistema = new Set();
  almacen = new Map(guardado === undefined ? [] : [['tema', guardado]]);
  vi.stubGlobal(
    'localStorage',
    sinAlmacen
      ? {
          getItem: () => {
            throw new Error('bloqueado');
          },
          setItem: () => {
            throw new Error('bloqueado');
          },
          removeItem: () => {
            throw new Error('bloqueado');
          },
        }
      : {
          getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
          setItem: (k, v) => almacen.set(k, String(v)),
          removeItem: (k) => almacen.delete(k),
        },
  );
  vi.stubGlobal('matchMedia', (consulta) => ({
    media: consulta,
    get matches() {
      return sistemaOscuro;
    },
    addEventListener: (_, f) => oyentesDelSistema.add(f),
    removeEventListener: (_, f) => oyentesDelSistema.delete(f),
  }));
  const tema = await import('./tema');
  tema.arrancaElTema();
  return tema;
};

const elSistemaCambiaA = (oscuro) => {
  sistemaOscuro = oscuro;
  for (const f of oyentesDelSistema) f({ matches: oscuro });
};

const aplicado = () => document.documentElement.dataset.tema;

beforeEach(() => {
  delete document.documentElement.dataset.tema;
  document.head.innerHTML = '<meta name="theme-color" content="#000000">';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tema claro u oscuro', () => {
  it.each([
    ['T1', undefined, false, 'claro'],
    ['T2', undefined, true, 'oscuro'],
    ['T3', 'claro', true, 'claro'],
    ['T4', 'oscuro', false, 'oscuro'],
    ['T5', 'azul', true, 'oscuro'],
  ])(
    '%s: guardado %s, sistema oscuro=%s → %s',
    async (_, guardado, oscuro, esperado) => {
      const tema = await preparar({ guardado, oscuro });

      expect(aplicado()).toBe(esperado);
      expect(tema.temaActual()).toBe(esperado);
    },
  );

  it('T6: sin nada guardado, sigue al sistema cuando cambia', async () => {
    await preparar({ oscuro: false });

    elSistemaCambiaA(true);

    expect(aplicado()).toBe('oscuro');
  });

  it('T7: con uno elegido, el cambio del sistema no lo mueve', async () => {
    await preparar({ guardado: 'claro', oscuro: false });

    elSistemaCambiaA(true);

    expect(aplicado()).toBe('claro');
  });

  it('T8: alternar cambia de tema y lo recuerda', async () => {
    const tema = await preparar({ oscuro: false });

    tema.alternaElTema();
    expect(aplicado()).toBe('oscuro');
    expect(almacen.get('tema')).toBe('oscuro');
  });

  it('T8b: volver al tema del sistema es dejar de elegir, y se le sigue otra vez', async () => {
    const tema = await preparar({ oscuro: false });
    tema.alternaElTema(); // a oscuro, elegido
    tema.alternaElTema(); // a claro, que es el del sistema

    expect(aplicado()).toBe('claro');
    expect(almacen.has('tema')).toBe(false);

    // De noche el sistema pasa a oscuro: la aplicación le acompaña
    elSistemaCambiaA(true);
    expect(aplicado()).toBe('oscuro');
  });

  it('T8c: con el sistema en oscuro, elegir claro se recuerda', async () => {
    const tema = await preparar({ oscuro: true });

    tema.alternaElTema();

    expect(aplicado()).toBe('claro');
    expect(almacen.get('tema')).toBe('claro');
  });

  it('T9: sin almacenamiento sigue al sistema y alternar no rompe', async () => {
    const tema = await preparar({ oscuro: true, sinAlmacen: true });
    expect(aplicado()).toBe('oscuro');

    expect(() => tema.alternaElTema()).not.toThrow();
    expect(aplicado()).toBe('claro');
  });

  it('T10: quien escucha se entera de cada cambio, hasta que se va', async () => {
    const tema = await preparar({ oscuro: false });
    const oye = vi.fn();
    const dejar = tema.alCambiarElTema(oye);

    tema.alternaElTema();
    expect(oye).toHaveBeenCalledTimes(1);

    dejar();
    tema.alternaElTema();
    expect(oye).toHaveBeenCalledTimes(1);
  });

  it('T11: theme-color es el fondo del tema, en las dos metas de index.html', async () => {
    // `index.html` trae una por tema del sistema; quien elige a mano el
    // contrario tiene que ver la barra del tema elegido con cualquiera de las dos
    for (const m of document.querySelectorAll('meta[name="theme-color"]'))
      m.remove();
    for (const media of ['light', 'dark']) {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.media = `(prefers-color-scheme: ${media})`;
      document.head.append(m);
    }
    const metas = () =>
      [...document.querySelectorAll('meta[name="theme-color"]')].map((m) =>
        m.getAttribute('content'),
      );
    const tema = await preparar({ guardado: 'oscuro' });

    expect(metas()).toEqual(['#222d24', '#222d24']);

    tema.alternaElTema();
    expect(metas()).toEqual(['#f8f7f2', '#f8f7f2']);
  });
});
