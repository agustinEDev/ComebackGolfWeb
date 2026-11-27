import { describe, it, expect } from 'vitest';
import { hayEquiposQueNoVe } from './equiposVisibles';

/**
 * A4 (revisión de arquitectura): la regla de FE #1225, pura. Quien no
 * gestiona y no recibe los equipos (`teamAssignment`), cuando la ficha dice
 * que los hay (`teamsAssigned`), no los ve: no se le dice que faltan.
 */
describe('hayEquiposQueNoVe', () => {
  it.each([
    // gestiona, hay equipos (ficha), los recibe, → los hay pero no los ve
    [false, true, false, true],
    [false, true, true, false],
    [false, false, false, false],
    [false, undefined, false, false],
    [false, 'true', false, false],
    [true, true, false, false],
    [true, true, true, false],
    [true, false, false, false],
  ])(
    'gestiona %s, la ficha dice %s, le llegan %s → %s',
    (puedeGestionar, teamsAssigned, leLlegan, esperado) => {
      expect(
        hayEquiposQueNoVe({
          puedeGestionar,
          teamsAssigned,
          teamAssignment: leLlegan ? { teamAPlayerIds: [] } : null,
        }),
      ).toBe(esperado);
    },
  );
});
