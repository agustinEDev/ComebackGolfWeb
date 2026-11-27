import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalesDeLaAgenda } from './useModalesDeLaAgenda';

/**
 * Cada diálogo con partido o sesión guarda solo eso: con él, abierto; `null`,
 * cerrado. La agenda lo pinta mientras lo haya.
 *
 *   diálogo    | abrir           | cerrar          | con
 *   -----------|-----------------|-----------------|---------------
 *   walkover   | abrirWalkover   | cerrarWalkover  | walkoverMatch
 *   reasignar  | abrirReasignar  | cerrarReasignar | reassignMatch
 *   detalle    | abrirDetalle    | cerrarDetalle   | detailMatchId
 *   generar    | abrirGenerar    | cerrarGenerar   | generateRound
 */
describe('useModalesDeLaAgenda', () => {
  it('empieza con todo cerrado', () => {
    const { result } = renderHook(() => useModalesDeLaAgenda());
    expect(result.current).toMatchObject({
      cubriendoCapitan: null,
      rehaciendoSobres: null,
      walkoverMatch: null,
      reassignMatch: null,
      detailMatchId: null,
      showTeamsModal: false,
      deshaciendoEquipos: false,
      generateRound: null,
    });
  });

  it.each([
    ['abrirWalkover', 'cerrarWalkover', 'walkoverMatch'],
    ['abrirReasignar', 'cerrarReasignar', 'reassignMatch'],
    ['abrirDetalle', 'cerrarDetalle', 'detailMatchId'],
    ['abrirGenerar', 'cerrarGenerar', 'generateRound'],
  ])('%s y %s', (abrir, cerrar, con) => {
    const { result } = renderHook(() => useModalesDeLaAgenda());
    const valor = { id: 'x' };

    act(() => result.current[abrir](valor));
    expect(result.current[con]).toBe(valor);

    act(() => result.current[cerrar]());
    expect(result.current[con]).toBe(null);
  });

  /*
   * S1: el motivo de la última respuesta de generar, con su sesión, es del
   * modal abierto: cerrarlo o abrir otro lo olvida. Y quién pregunta sabe qué
   * sesión tiene el modal abierto AHORA (la respuesta llega después).
   */
  it('S1: el bloqueo de la respuesta empieza vacío y se guarda con su sesión', () => {
    const { result } = renderHook(() => useModalesDeLaAgenda());
    expect(result.current.bloqueoAlGenerar).toBe(null);
    const bloqueo = {
      roundId: 'r1',
      bloqueo: { reason: 'NO_TEAMS', players: [] },
    };
    act(() => result.current.setBloqueoAlGenerar(bloqueo));
    expect(result.current.bloqueoAlGenerar).toBe(bloqueo);
  });

  it.each(['cerrarGenerar', 'abrirGenerar'])(
    'S1: %s olvida el bloqueo de la respuesta',
    (accion) => {
      const { result } = renderHook(() => useModalesDeLaAgenda());
      act(() => result.current.abrirGenerar({ id: 'r1' }));
      act(() =>
        result.current.setBloqueoAlGenerar({
          roundId: 'r1',
          bloqueo: { reason: 'NO_TEAMS', players: [] },
        }),
      );
      act(() => result.current[accion]({ id: 'r2' }));
      expect(result.current.bloqueoAlGenerar).toBe(null);
    },
  );

  it('S1: la sesión con el modal de generar abierto, al momento', () => {
    const { result } = renderHook(() => useModalesDeLaAgenda());
    const { rondaDeGenerarAbierta } = result.current;
    expect(rondaDeGenerarAbierta()).toBe(null);
    act(() => result.current.abrirGenerar({ id: 'r1' }));
    // La misma función de antes ya lo sabe: la usa una respuesta que llega tarde
    expect(rondaDeGenerarAbierta()).toBe('r1');
    act(() => result.current.abrirGenerar({ id: 'r2' }));
    expect(rondaDeGenerarAbierta()).toBe('r2');
    act(() => result.current.cerrarGenerar());
    expect(rondaDeGenerarAbierta()).toBe(null);
  });

  it('S1: cada respuesta bloqueada cuenta, aunque diga lo mismo', () => {
    const { result } = renderHook(() => useModalesDeLaAgenda());
    const bloqueo = { reason: 'NO_TEAMS', players: [] };
    act(() => result.current.abrirGenerar({ id: 'r1' }));
    act(() => result.current.respuestaBloqueada('r1', bloqueo));
    expect(result.current.bloqueoAlGenerar).toEqual({
      roundId: 'r1',
      bloqueo,
      vez: 1,
    });
    act(() => result.current.respuestaBloqueada('r1', bloqueo));
    expect(result.current.bloqueoAlGenerar.vez).toBe(2);
    act(() => result.current.respuestaBloqueada('r1', null));
    expect(result.current.bloqueoAlGenerar).toEqual({
      roundId: 'r1',
      bloqueo: null,
      vez: 3,
    });
    // Abrir otra vez empieza la cuenta
    act(() => result.current.abrirGenerar({ id: 'r1' }));
    act(() => result.current.respuestaBloqueada('r1', bloqueo));
    expect(result.current.bloqueoAlGenerar.vez).toBe(1);
  });
});
