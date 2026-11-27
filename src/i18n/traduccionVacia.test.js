import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * Una traducción vacía se pinta vacía (23 nov 2026). i18next 27 cambió el valor
 * por defecto de `returnEmptyString` a `false`: un `""` cuenta como ausente, pasa
 * al idioma de respaldo (también `""`) y acaba en la clave. El plan Enterprise
 * no tiene periodo, a propósito, y salía «enterprise.period» junto al precio.
 * Se prueba con la configuración real de la aplicación, no con una instancia
 * hecha para el test, y sin cambiar su idioma: cada texto se lee con su `t` fija.
 */

// Lo que la app lee y guarda al arrancar (el detector de idioma), en un almacén
// propio del test y no en el de jsdom
const almacen = new Map();
const localStorageFalso = {
  getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
  setItem: (clave, valor) => almacen.set(clave, String(valor)),
  removeItem: (clave) => almacen.delete(clave),
  clear: () => almacen.clear(),
  key: (i) => [...almacen.keys()][i] ?? null,
  get length() {
    return almacen.size;
  },
};

let i18n;

beforeAll(async () => {
  vi.stubGlobal('localStorage', localStorageFalso);
  // La configuración se importa después del stub: al cargarse detecta el idioma
  await import('./config');
  i18n = (await import('i18next')).default;
  await i18n.loadLanguages(['es', 'en']);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// Las claves que están vacías a propósito, con su espacio de nombres
const CLAVES_VACIAS = [
  ['pricing', 'enterprise.period'],
  ['landing', 'pricing.enterprise.period'],
];

describe('i18n/config: traducciones vacías', () => {
  it.each(
    ['es', 'en'].flatMap((idioma) =>
      CLAVES_VACIAS.map(([ns, clave]) => [idioma, ns, clave]),
    ),
  )('en %s, %s:%s sale vacía', (idioma, ns, clave) => {
    const t = i18n.getFixedT(idioma, ns);

    expect(t(clave)).toBe('');
  });
});
