import { describe, it, expect } from 'vitest';
import { competicionEnJuego } from './competicionEnJuego';

/**
 * De qué competición se enseña el marcador en Inicio (24 nov 2026).
 *
 *   #   próximo                    | su competición     | marcador
 *   ----|----------------------------|--------------------|----------
 *   J1  partido por equipos        | en juego           | sí
 *   J2  partido por equipos        | aún no ha empezado | no
 *   J3  partido por equipos        | acabada            | no
 *   J4  partida de stroke play     | en juego           | no: no hay equipos
 *   J5  ninguno                    | —                  | no
 *   J6  partido por equipos        | no está en la lista| no
 *   J7  sin lista (aún cargando)   | —                  | no, sin romper
 */
const partido = (extra = {}) => ({ competitionId: 'c-1', ...extra });
const lista = (status) => [
  { id: 'c-0', status: 'IN_PROGRESS' },
  { id: 'c-1', status },
];

describe('competicionEnJuego', () => {
  it('J1: por equipos y en juego, su identificador', () => {
    expect(competicionEnJuego(partido(), lista('IN_PROGRESS'))).toBe('c-1');
  });

  it.each([['DRAFT'], ['ACTIVE'], ['CLOSED']])(
    'J2: aún no ha empezado (%s), nada',
    (status) => {
      expect(competicionEnJuego(partido(), lista(status))).toBeNull();
    },
  );

  it.each([['COMPLETED'], ['CANCELLED']])(
    'J3: acabada (%s), nada',
    (status) => {
      expect(competicionEnJuego(partido(), lista(status))).toBeNull();
    },
  );

  it('J4: una partida de stroke play no tiene marcador por equipos', () => {
    expect(
      competicionEnJuego(
        partido({ esPartidaDeFranja: true }),
        lista('IN_PROGRESS'),
      ),
    ).toBeNull();
  });

  it('J5: sin próximo partido, nada', () => {
    expect(competicionEnJuego(null, lista('IN_PROGRESS'))).toBeNull();
  });

  it('J6: si su competición no está en la lista, nada', () => {
    expect(
      competicionEnJuego(
        partido({ competitionId: 'c-9' }),
        lista('IN_PROGRESS'),
      ),
    ).toBeNull();
  });

  it.each([[null], [undefined], ['x']])('J7: sin lista (%s) no rompe', (c) => {
    expect(competicionEnJuego(partido(), c)).toBeNull();
  });
});
