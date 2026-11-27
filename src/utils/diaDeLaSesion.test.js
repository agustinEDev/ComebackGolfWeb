import { describe, it, expect } from 'vitest';
import { diaCorto, diaDeLaSesion, diaEnElIdioma } from './diaDeLaSesion';

/**
 * Una fecha sin hora, como el día de una sesión, es ese día EN CASA.
 *
 * `new Date('2026-09-26')` la lee como medianoche UTC, y en cualquier huso por
 * detrás de UTC —toda América— se pinta el 25: el organizador arreglaría la
 * sesión equivocada (revisión de la BE #361).
 */
describe('diaDeLaSesion', () => {
  it('L1: el día es el mismo en cualquier huso', () => {
    const fecha = diaDeLaSesion('2026-09-26');

    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(8);
    expect(fecha.getDate()).toBe(26);
  });

  it('L2: lo que no es una fecha sin hora es null', () => {
    expect(diaDeLaSesion('')).toBeNull();
    expect(diaDeLaSesion(undefined)).toBeNull();
    expect(diaDeLaSesion('26/09/2026')).toBeNull();
  });
});

/**
 * El día de una tarjeta, corto y sin comas: «Jue 24 sept» (FE #845, #846).
 *
 *   #   caso                    | sale
 *   ----|-------------------------|------------------
 *   1   en español              | Jue 24 sept
 *   2   en inglés               | Thu Sep 24
 *   3   sin fecha o mal escrita | null
 */
describe('diaCorto (FE #845)', () => {
  it('1 · en español, con mayúscula y sin coma', () => {
    // «sep» o «sept»: ICU ha cambiado esa abreviatura entre versiones (CodeRabbit)
    expect(diaCorto('2026-09-24', 'es')).toMatch(/^Jue 24 sept?$/);
  });

  it('2 · en inglés, en su orden', () => {
    expect(diaCorto('2026-09-24', 'en')).toBe('Thu Sep 24');
  });

  it('3 · sin fecha válida, nada', () => {
    expect(diaCorto(null, 'es')).toBeNull();
    expect(diaCorto('24/09/2026', 'es')).toBeNull();
  });

  it('4 · un idioma mal escrito no tumba la pantalla: sale en el de por defecto', () => {
    expect(() => diaCorto('2026-09-24', 'es_ES')).not.toThrow();
    expect(diaCorto('2026-09-24', 'es_ES')).toMatch(/24/);
  });
});

describe('diaEnElIdioma (FE #1238)', () => {
  const FORMATO = { weekday: 'short', day: 'numeric', month: 'short' };

  it('I1: el día en el idioma que se pide, no en el del navegador', () => {
    expect(diaEnElIdioma('2026-11-23', 'es', FORMATO)).toBe('lun, 23 nov');
    expect(diaEnElIdioma('2026-11-23', 'en', FORMATO)).toBe('Mon, Nov 23');
  });

  it('I2: sin fecha sin hora válida, null', () => {
    expect(diaEnElIdioma(null, 'es', FORMATO)).toBeNull();
    expect(diaEnElIdioma('23/11/2026', 'es', FORMATO)).toBeNull();
  });

  it('I3: un idioma que Intl no entiende no tumba la pantalla', () => {
    expect(diaEnElIdioma('2026-11-23', 'es_ES', FORMATO)).toMatch(/23/);
  });
});
