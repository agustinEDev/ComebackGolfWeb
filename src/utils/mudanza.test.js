import { describe, it, expect } from 'vitest';
import {
  DOMINIO_ANTIGUO,
  DIRECCION_NUEVA,
  direccionNueva,
  esElDominioAntiguo,
  tocaEnsenarlo,
  hastaCuandoSeAplaza,
} from './mudanza';

/**
 * La mudanza a comebackgolf.com, fase 1 (Agustín, 27 nov 2026): los dos
 * dominios sirven la misma app, y la del dominio viejo avisa al abrir.
 *
 *   caso | qué                                         | resultado
 *   -----|---------------------------------------------|---------------------------
 *   U1   | el dominio viejo y su www.                  | dominio viejo
 *   U2   | comebackgolf.com, localhost, un dominio que | no: ni uno que solo
 *        | acaba igual sin serlo                       | termine en el nombre
 *   U3   | la app instalada                            | a la portada nueva
 *   U4   | en el navegador                             | a la misma ruta en el nuevo,
 *        |                                             | SIN la consulta (códigos)
 *   U5   | «Ahora no»                                  | vuelve mañana, en la fecha
 *        |                                             | local del móvil
 *   U6   | vuelve mañana o más tarde                   | no se enseña
 *   U7   | vuelve hoy, ya volvió, nunca se aplazó, o   | se enseña
 *        | lo guardado no se entiende                  |
 *   U8   | anotando (también con barra final)          | nunca encima de la anotación
 *   U9   | pasos con secreto (restablecer, verificar,  | no sale; y si se enlazaran,
 *        | Google) y enlaces compartidos               | a la portada, nunca la ruta
 *   U10  | una vuelta más allá de mañana (reloj mal)   | se descarta: sale
 */
describe('la mudanza', () => {
  it.each([DOMINIO_ANTIGUO, `www.${DOMINIO_ANTIGUO}`])(
    'U1 %s es el dominio viejo',
    (host) => {
      expect(esElDominioAntiguo(host)).toBe(true);
    },
  );

  it.each([
    'www.comebackgolf.com',
    'comebackgolf.com',
    'localhost',
    `not${DOMINIO_ANTIGUO}`,
    `${DOMINIO_ANTIGUO}.ejemplo.com`,
    '',
  ])('U2 %s no lo es', (host) => {
    expect(esElDominioAntiguo(host)).toBe(false);
  });

  it('U3 la app instalada va a la portada nueva', () => {
    expect(
      direccionNueva({ instalada: true, pathname: '/feed', search: '?x=1' }),
    ).toBe(`${DIRECCION_NUEVA}/`);
  });

  it('U4 en el navegador, a la misma ruta y consulta en el dominio nuevo', () => {
    expect(
      direccionNueva({
        instalada: false,
        pathname: '/competitions/1',
        search: '?tab=2',
      }),
    ).toBe(`${DIRECCION_NUEVA}/competitions/1`);
    expect(DIRECCION_NUEVA).toBe('https://www.comebackgolf.com');
  });

  it('U5 «Ahora no» aplaza hasta mañana', () => {
    expect(hastaCuandoSeAplaza(new Date(2026, 10, 27, 23, 50))).toBe(
      '2026-11-28',
    );
    expect(hastaCuandoSeAplaza(new Date(2026, 11, 31, 9))).toBe('2027-01-01');
  });

  it.each([
    ['2026-11-28', false],
    ['2026-11-27', true],
    ['2026-11-26', true],
    [null, true],
    ['basura', true],
  ])('U6/U7 vuelve el %s: ¿se enseña? %s', (aplazado, sale) => {
    expect(
      tocaEnsenarlo({
        hoy: new Date(2026, 10, 27, 12),
        aplazadoHasta: aplazado,
        pathname: '/dashboard',
      }),
    ).toBe(sale);
  });

  it('U7 vuelve mañana: al llegar mañana, sale', () => {
    expect(
      tocaEnsenarlo({
        hoy: new Date(2026, 10, 28, 0, 5),
        aplazadoHasta: '2026-11-28',
        pathname: '/dashboard',
      }),
    ).toBe(true);
  });

  it.each([
    '/reset-password/abc123',
    '/verify-email',
    '/confirm-email-change',
    '/auth/google/callback',
    '/auth/complete-profile',
    '/quick-matches/q1/shared',
    '/competitions/c1/leaderboard',
  ])('U9 en %s no sale, y el enlace no lleva la ruta', (pathname) => {
    expect(
      tocaEnsenarlo({ hoy: new Date(), aplazadoHasta: null, pathname }),
    ).toBe(false);
    expect(direccionNueva({ instalada: false, pathname })).toBe(
      `${DIRECCION_NUEVA}/`,
    );
  });

  it('U10 una vuelta guardada con el reloj adelantado se descarta', () => {
    expect(
      tocaEnsenarlo({
        hoy: new Date(2026, 10, 27, 12),
        aplazadoHasta: '2027-12-02',
        pathname: '/dashboard',
      }),
    ).toBe(true);
  });

  it.each([
    '/player/matches/m1/scoring/',
    '/player/matches/m1/scoring',
    '/player/groups/g1/scoring',
    '/quick-matches/q1/scoring',
  ])('U8 anotando (%s), nunca', (pathname) => {
    expect(
      tocaEnsenarlo({ hoy: new Date(), aplazadoHasta: null, pathname }),
    ).toBe(false);
  });
});
