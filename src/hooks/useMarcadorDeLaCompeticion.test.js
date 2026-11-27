import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * El marcador por equipos de la competición en juego, para Inicio (ComeBack
 * Golf, 24 nov 2026). Sale del endpoint de clasificación que ya existía.
 *
 * Sin «cargando»: mientras llega no se pinta nada, y al volver a Inicio se
 * pinta lo último visto y se refresca por detrás.
 *
 *   #   caso                                   | qué da
 *   ----|----------------------------------------|---------------------------
 *   M1  sin competición                        | nada, y no pregunta
 *   M2  llega la clasificación                 | el marcador de sus equipos
 *   M3  falla (sin red, 403…)                  | nada; no lanza
 *   M4  se vuelve a montar con la misma        | lo último visto al
 *       competición                            | instante, y lo refresca
 *   M5  falla al refrescar                     | se queda lo último visto
 *   M6  cambia de competición                  | no enseña el de la anterior
 *   M7  se desmonta antes de que llegue        | no toca nada (sin avisos)
 *   M8  al refrescar, 403 o 404                | lo visto deja de valer: nada
 *   M9  se cierra la sesión                    | la siguiente cuenta no hereda
 *                                              | lo que vio la anterior
 *   M10 mientras llega por primera vez         | `esperando`, para guardarle
 *                                              | el sitio; al fallar, se suelta
 *   M11 se vuelve a la aplicación              | se pide otra vez
 *   M12 llega tras cerrar la sesión            | no reescribe la memoria
 */
const pide = vi.fn();
vi.mock('../composition', () => ({
  getLeaderboardUseCase: { execute: (...a) => pide(...a) },
}));

const marcador = (extra = {}) => ({
  competitionId: 'c-1',
  competitionName: 'Viaje Algarve',
  teamAName: 'Norte',
  teamBName: 'Sur',
  teamAPoints: 8.5,
  teamBPoints: 7.5,
  matches: [{ matchId: 'm-1' }],
  ...extra,
});

let useMarcadorDeLaCompeticion;
beforeEach(async () => {
  vi.resetModules();
  pide.mockReset();
  // Lo visto se guarda en el dispositivo: cada test, con el suyo vacío
  const almacen = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k) => almacen.get(k) ?? null,
    setItem: (k, v) => almacen.set(k, String(v)),
    removeItem: (k) => almacen.delete(k),
  });
  ({ useMarcadorDeLaCompeticion } =
    await import('./useMarcadorDeLaCompeticion'));
});

describe('useMarcadorDeLaCompeticion', () => {
  it('M1: sin competición no da nada ni pregunta', () => {
    const { result } = renderHook(() => useMarcadorDeLaCompeticion(null));

    expect(result.current).toEqual({ marcador: null, esperando: false });
    expect(pide).not.toHaveBeenCalled();
  });

  it('M2: da el marcador de los dos equipos, sin la lista de partidos', async () => {
    pide.mockResolvedValue(marcador());
    const { result } = renderHook(() => useMarcadorDeLaCompeticion('c-1'));

    expect(result.current.marcador).toBeNull();
    await waitFor(() => expect(result.current.marcador).not.toBeNull());

    expect(pide).toHaveBeenCalledWith('c-1');
    expect(result.current.marcador).toEqual({
      competitionId: 'c-1',
      competitionName: 'Viaje Algarve',
      teamAName: 'Norte',
      teamBName: 'Sur',
      teamAPoints: 8.5,
      teamBPoints: 7.5,
    });
  });

  it('M3: si falla no da nada y no lanza', async () => {
    pide.mockRejectedValue(new Error('sin red'));
    const { result } = renderHook(() => useMarcadorDeLaCompeticion('c-1'));

    await waitFor(() => expect(pide).toHaveBeenCalled());
    await Promise.resolve();

    expect(result.current.marcador).toBeNull();
  });

  it('M4: al volver pinta lo último visto al instante y lo refresca', async () => {
    pide.mockResolvedValue(marcador());
    const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(primera.result.current.marcador).not.toBeNull());
    primera.unmount();

    pide.mockResolvedValue(marcador({ teamAPoints: 9.5 }));
    const segunda = renderHook(() => useMarcadorDeLaCompeticion('c-1'));

    // En el primer pintado, sin esperar a la respuesta
    expect(segunda.result.current.marcador.teamAPoints).toBe(8.5);
    await waitFor(() =>
      expect(segunda.result.current.marcador.teamAPoints).toBe(9.5),
    );
  });

  it('M5: si el refresco falla, se queda lo último visto', async () => {
    pide.mockResolvedValue(marcador());
    const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(primera.result.current.marcador).not.toBeNull());
    primera.unmount();

    pide.mockRejectedValue(new Error('sin red'));
    const segunda = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(pide).toHaveBeenCalledTimes(2));
    await Promise.resolve();

    expect(segunda.result.current.marcador.teamAPoints).toBe(8.5);
  });

  it('M6: al cambiar de competición no enseña el marcador de la anterior', async () => {
    pide.mockResolvedValue(marcador());
    const { result, rerender } = renderHook(
      ({ id }) => useMarcadorDeLaCompeticion(id),
      { initialProps: { id: 'c-1' } },
    );
    await waitFor(() => expect(result.current.marcador).not.toBeNull());

    let llega;
    pide.mockReturnValue(new Promise((ok) => (llega = ok)));
    rerender({ id: 'c-2' });

    expect(result.current.marcador).toBeNull();
    llega(marcador({ competitionId: 'c-2', competitionName: 'Otra' }));
    await waitFor(() =>
      expect(result.current.marcador?.competitionId).toBe('c-2'),
    );
  });

  it('M7: si se desmonta antes de que llegue, no toca nada', async () => {
    let llega;
    pide.mockReturnValue(new Promise((ok) => (llega = ok)));
    const errores = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount, result } = renderHook(() =>
      useMarcadorDeLaCompeticion('c-1'),
    );

    unmount();
    llega(marcador());
    await Promise.resolve();

    expect(result.current.marcador).toBeNull();
    expect(errores).not.toHaveBeenCalled();
    errores.mockRestore();
  });

  it.each([403, 404])(
    'M8: si al refrescar llega un %s, lo visto deja de valer',
    async (status) => {
      pide.mockResolvedValue(marcador());
      const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
      await waitFor(() =>
        expect(primera.result.current.marcador).not.toBeNull(),
      );
      primera.unmount();

      pide.mockRejectedValue(Object.assign(new Error('fuera'), { status }));
      const segunda = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
      await waitFor(() => expect(segunda.result.current.marcador).toBeNull());
      segunda.unmount();

      // Y tampoco queda guardado para la próxima vez
      pide.mockReturnValue(new Promise(() => {}));
      const tercera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
      expect(tercera.result.current.marcador).toBeNull();
    },
  );

  it('M9: al cerrar la sesión se olvida lo visto', async () => {
    pide.mockResolvedValue(marcador());
    const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(primera.result.current.marcador).not.toBeNull());
    primera.unmount();

    const { olvidaLosMarcadores } =
      await import('../services/marcadoresVistos');
    olvidaLosMarcadores();

    pide.mockReturnValue(new Promise(() => {}));
    const otraCuenta = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    expect(otraCuenta.result.current.marcador).toBeNull();
  });

  it('M10: mientras llega por primera vez, `esperando`; con marcador o al fallar, ya no', async () => {
    let falla;
    pide.mockReturnValue(new Promise((_, no) => (falla = no)));
    const { result } = renderHook(() => useMarcadorDeLaCompeticion('c-1'));

    expect(result.current).toEqual({ marcador: null, esperando: true });

    falla(new Error('sin red'));
    await waitFor(() => expect(result.current.esperando).toBe(false));
    expect(result.current.marcador).toBeNull();
  });

  it('M10b: con lo último visto no se espera: se pinta ya', async () => {
    pide.mockResolvedValue(marcador());
    const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(primera.result.current.marcador).not.toBeNull());
    primera.unmount();

    pide.mockReturnValue(new Promise(() => {}));
    const segunda = renderHook(() => useMarcadorDeLaCompeticion('c-1'));

    expect(segunda.result.current.esperando).toBe(false);
    expect(segunda.result.current.marcador.teamAPoints).toBe(8.5);
  });

  it('M11: al volver a la aplicación se pide otra vez', async () => {
    pide.mockResolvedValue(marcador());
    const { result } = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    await waitFor(() => expect(result.current.marcador).not.toBeNull());

    pide.mockResolvedValue(marcador({ teamAPoints: 10 }));
    document.dispatchEvent(new globalThis.Event('visibilitychange'));

    await waitFor(() => expect(result.current.marcador.teamAPoints).toBe(10));
    expect(pide).toHaveBeenCalledTimes(2);
  });

  it('M12: una respuesta que llega tras desmontar no escribe la memoria', async () => {
    let llega;
    pide.mockReturnValue(new Promise((ok) => (llega = ok)));
    const primera = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    primera.unmount();
    const { olvidaLosMarcadores } =
      await import('../services/marcadoresVistos');
    olvidaLosMarcadores(); // se cierra la sesión

    llega(marcador());
    await Promise.resolve();
    await Promise.resolve();

    pide.mockReturnValue(new Promise(() => {}));
    const otraCuenta = renderHook(() => useMarcadorDeLaCompeticion('c-1'));
    expect(otraCuenta.result.current.marcador).toBeNull();
  });
});
