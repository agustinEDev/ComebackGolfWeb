import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../utils/toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));
vi.mock('../utils/registraElFallo', () => ({ registraElFallo: vi.fn() }));
// Las barras del aviso con el modal cerrado se traducen con el espacio
// `golfCourses`, que el test puede cambiar por uno de verdad
const traducciones = vi.hoisted(() => ({
  i18n: {
    loadNamespaces: () => Promise.resolve(),
    getFixedT: () => (clave) => clave,
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: traducciones.i18n }),
}));

const mockEstado = vi.fn();
const mockGenerar = vi.fn();
const mockRepartir = vi.fn();
const mockDeshacer = vi.fn();

vi.mock('../composition', () => ({
  generateMatchesUseCase: { execute: (...a) => mockGenerar(...a) },
  assignTeamsUseCase: { execute: (...a) => mockRepartir(...a) },
  undoTeamsUseCase: { execute: (...a) => mockDeshacer(...a) },
  fillCaptainUseCase: { execute: vi.fn() },
  updateMatchStatusUseCase: { execute: (...a) => mockEstado(...a) },
  declareWalkoverUseCase: { execute: vi.fn() },
  reassignPlayersUseCase: { execute: vi.fn() },
  resetEnvelopesUseCase: { execute: vi.fn() },
}));

import customToast from '../utils/toast';

// O1 (pasada del iPhone, 22 nov): el fallo al generar sale arriba
const ARRIBA = { position: 'top-center' };
import { registraElFallo } from '../utils/registraElFallo';
import { useAccionesDeLaAgenda } from './useAccionesDeLaAgenda';

const t = (clave) => clave;

const montar = () => {
  const orden = [];
  const datos = {
    setCompetition: vi.fn(),
    recargarTodo: vi.fn(),
    recargarCompeticion: vi.fn(async () => orden.push('competicion')),
    reloadSchedule: vi.fn(async () => orden.push('agenda')),
    recargarTrasGeneracionBloqueada: vi.fn(),
  };
  const modales = {
    cerrarGenerar: vi.fn(),
    setBloqueoAlGenerar: vi.fn(),
    respuestaBloqueada: vi.fn(),
    // La sesión con el modal de generar abierto cuando llega la respuesta
    rondaDeGenerarAbierta: vi.fn(() => 'r1'),
    setShowTeamsModal: vi.fn(),
    setDeshaciendoEquipos: vi.fn(() => orden.push('cerrar-confirmacion')),
  };
  const hook = renderHook(() =>
    useAccionesDeLaAgenda({ id: 'comp-1', t, tComp: t, datos, modales }),
  );
  return { hook, datos, modales, orden };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAccionesDeLaAgenda · empezar y terminar un partido', () => {
  /*
   *   acción    | llamada    | clave del fallo
   *   ----------|------------|-------------------------------------
   *   empezar   | 'start'    | SchedulePage.error-starting-match
   *   terminar  | 'complete' | SchedulePage.error-completing-match
   */
  it.each([
    [
      'handleStartMatch',
      'start',
      'SchedulePage.error-starting-match',
      'Error starting match:',
    ],
    [
      'handleCompleteMatch',
      'complete',
      'SchedulePage.error-completing-match',
      'Error completing match:',
    ],
  ])(
    '%s pide %s y, si falla, lo apunta con su clave',
    async (manejador, accion, clave, mensaje) => {
      const fallo = new Error('500');
      mockEstado.mockRejectedValue(fallo);
      const { hook } = montar();

      await act(() => hook.result.current[manejador]('m1'));

      expect(mockEstado).toHaveBeenCalledWith('m1', accion);
      expect(registraElFallo).toHaveBeenCalledWith(clave, mensaje, fallo);
      expect(customToast.error).toHaveBeenCalledWith(
        'errors.failedToUpdateMatchStatus',
      );
      expect(hook.result.current.isProcessing).toBe(false);
    },
  );

  it('bien, avisa y recarga la agenda', async () => {
    mockEstado.mockResolvedValue({});
    const { hook, datos } = montar();

    await act(() => hook.result.current.handleCompleteMatch('m2'));

    expect(mockEstado).toHaveBeenCalledWith('m2', 'complete');
    expect(customToast.success).toHaveBeenCalledWith(
      'success.matchStatusUpdated',
    );
    expect(datos.reloadSchedule).toHaveBeenCalled();
    expect(registraElFallo).not.toHaveBeenCalled();
  });
});

describe('useAccionesDeLaAgenda · generar bloqueado', () => {
  it('recarga todo y no enseña la frase del servidor', async () => {
    mockGenerar.mockRejectedValue({
      errorCode: 'MATCH_GENERATION_BLOCKED',
      message: 'Falta Luis',
    });
    const { hook, datos, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(datos.recargarTrasGeneracionBloqueada).toHaveBeenCalled();
    expect(modales.cerrarGenerar).not.toHaveBeenCalled();
    expect(customToast.error).not.toHaveBeenCalled();
  });

  it('si la recarga falla, lo apunta y enseña la frase del servidor', async () => {
    const fallo = Object.assign(new Error('Falta Luis'), {
      status: 409,
      errorCode: 'MATCH_GENERATION_BLOCKED',
    });
    const recarga = new Error('sin red');
    mockGenerar.mockRejectedValue(fallo);
    const { hook, datos } = montar();
    datos.recargarTrasGeneracionBloqueada.mockRejectedValue(recarga);

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(registraElFallo).toHaveBeenCalledWith(
      'SchedulePage.reloading-after-a-blocked-generation',
      'Error reloading after a blocked generation:',
      recarga,
    );
    // O1: arriba, como los avisos de los modales: el de generar sigue abierto
    expect(customToast.error).toHaveBeenCalledWith('Falta Luis', ARRIBA);
  });

  /*
   * S1 (23 nov 2026): el motivo viene en la respuesta (BE #923: el de un
   * emparejamiento a mano no se guarda en la sesión). Va al modal de ESA
   * sesión, con su id, y gana al guardado por ser el más reciente. Si su modal
   * ya se cerró, un aviso arriba con el motivo traducido.
   *
   *   respuesta        | modal abierto | recarga | modal               | toast arriba
   *   -----------------|---------------|---------|---------------------|-----------------
   *   con motivo       | el suyo       | bien    | respuesta(r1, motivo)| ninguno
   *   sin motivo       | el suyo       | bien    | respuesta(r1, null) | ninguno
   *   con motivo       | el suyo       | falla   | respuesta(r1, motivo)| ninguno
   *   sin motivo       | el suyo       | falla   | respuesta(r1, null) | frase del servidor
   *   con motivo       | ninguno       | bien    | sin tocar           | motivo traducido
   *   con motivo       | otra sesión   | bien    | sin tocar           | motivo traducido
   *   con motivo       | ninguno       | falla   | sin tocar           | solo el traducido
   *   sin motivo       | ninguno       | -       | sin tocar           | texto genérico
   *   barra en el motivo, cerrado      | -       | su nombre traducido («Blancas»)
   *   422 (otro fallo) | el suyo       | -       | null al llegar (el guardado) | su texto
   *   sin conexión     | el suyo       | -       | sin tocar (única copia)
   *   al enviar        | -             | -       | sin tocar (sin parpadeo)
   *
   * Cada respuesta bloqueada cuenta (`respuestaBloqueada`): el modal la trae a
   * la vista y la anuncia otra vez aunque diga lo mismo.
   */
  const BLOQUEO = {
    reason: 'NOT_ENOUGH_PLAYERS',
    players: [
      { userId: 'x1', name: 'Xavier', missing: 'ENROLLMENT', teeColor: null },
    ],
  };
  const TEXTO_DEL_BLOQUEO =
    'generationBlock.title: Xavier generationBlock.missing.ENROLLMENT';
  const conMotivo = () =>
    Object.assign(new Error('No se pueden generar: Xavier'), {
      status: 400,
      errorCode: 'MATCH_GENERATION_BLOCKED',
      bloqueo: BLOQUEO,
    });

  it('S1: con el motivo en la respuesta, se lo da a su modal y recarga', async () => {
    mockGenerar.mockRejectedValue(conMotivo());
    const { hook, datos, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1', ['p']));

    expect(modales.respuestaBloqueada).toHaveBeenCalledTimes(1);
    expect(modales.respuestaBloqueada).toHaveBeenCalledWith('r1', BLOQUEO);
    expect(modales.setBloqueoAlGenerar).not.toHaveBeenCalled();
    expect(datos.recargarTrasGeneracionBloqueada).toHaveBeenCalled();
    expect(modales.cerrarGenerar).not.toHaveBeenCalled();
    expect(customToast.error).not.toHaveBeenCalled();
  });

  it('S1: sin motivo en la respuesta, cuenta la respuesta sin motivo (el modal, al guardado)', async () => {
    mockGenerar.mockRejectedValue({
      status: 400,
      errorCode: 'MATCH_GENERATION_BLOCKED',
    });
    const { hook, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(modales.respuestaBloqueada).toHaveBeenCalledTimes(1);
    expect(modales.respuestaBloqueada).toHaveBeenCalledWith('r1', null);
    expect(customToast.error).not.toHaveBeenCalled();
  });

  it('S1: dos respuestas bloqueadas iguales cuentan dos veces', async () => {
    mockGenerar.mockRejectedValue(conMotivo());
    const { hook, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1'));
    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(modales.respuestaBloqueada).toHaveBeenCalledTimes(2);
  });

  it('S1: con motivo y la recarga fallida, no repite la frase del servidor', async () => {
    mockGenerar.mockRejectedValue(conMotivo());
    const { hook, datos, modales } = montar();
    datos.recargarTrasGeneracionBloqueada.mockRejectedValue(new Error('red'));

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(modales.respuestaBloqueada).toHaveBeenLastCalledWith('r1', BLOQUEO);
    expect(registraElFallo).toHaveBeenCalledWith(
      'SchedulePage.reloading-after-a-blocked-generation',
      'Error reloading after a blocked generation:',
      expect.any(Error),
    );
    expect(customToast.error).not.toHaveBeenCalled();
  });

  it.each([
    ['ninguno', null],
    ['el de otra sesión', 'r2'],
  ])(
    'S1: con el modal cerrado (%s), el motivo traducido sale arriba',
    async (_caso, abierta) => {
      mockGenerar.mockRejectedValue(conMotivo());
      const { hook, datos, modales } = montar();
      modales.rondaDeGenerarAbierta.mockReturnValue(abierta);

      await act(() => hook.result.current.handleGenerateMatches('r1'));

      expect(customToast.error).toHaveBeenCalledTimes(1);
      expect(customToast.error).toHaveBeenCalledWith(TEXTO_DEL_BLOQUEO, ARRIBA);
      // El modal que haya (de otra sesión) no se toca
      expect(modales.respuestaBloqueada).not.toHaveBeenCalled();
      expect(modales.setBloqueoAlGenerar).not.toHaveBeenCalled();
      expect(datos.recargarTrasGeneracionBloqueada).toHaveBeenCalled();
    },
  );

  it('S1: cerrado y con la recarga fallida, solo el motivo traducido', async () => {
    mockGenerar.mockRejectedValue(conMotivo());
    const { hook, datos, modales } = montar();
    modales.rondaDeGenerarAbierta.mockReturnValue(null);
    datos.recargarTrasGeneracionBloqueada.mockRejectedValue(new Error('red'));

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(customToast.error).toHaveBeenCalledTimes(1);
    expect(customToast.error).toHaveBeenCalledWith(TEXTO_DEL_BLOQUEO, ARRIBA);
  });

  /*
   * CodeRabbit (PR #1233): sin motivo y con la recarga fallida, quién está
   * abierto se mira DESPUÉS de la recarga. Si entretanto se cerró el modal o
   * se abrió otra sesión, el genérico traducido arriba, no la frase del
   * servidor; y sin repetir el que ya se dio con el modal cerrado.
   *
   *   antes de recargar | tras la recarga fallida | aviso
   *   ------------------|-------------------------|-----------------------------
   *   r1 abierto        | r1 abierto              | frase del servidor
   *   r1 abierto        | cerrado                 | genérico traducido, una vez
   *   r1 abierto        | r2 abierto              | genérico traducido, una vez
   *   cerrado           | cerrado                 | el genérico de antes, una vez
   */
  const bloqueadoSinMotivo = () =>
    Object.assign(new Error('No se pueden generar los partidos'), {
      status: 400,
      errorCode: 'MATCH_GENERATION_BLOCKED',
      bloqueo: null,
    });

  it('S1: abierto y sigue abierto tras la recarga fallida: la frase del servidor', async () => {
    mockGenerar.mockRejectedValue(bloqueadoSinMotivo());
    const { hook, datos } = montar();
    datos.recargarTrasGeneracionBloqueada.mockRejectedValue(new Error('red'));

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    expect(customToast.error).toHaveBeenCalledTimes(1);
    expect(customToast.error).toHaveBeenCalledWith(
      'No se pueden generar los partidos',
      ARRIBA,
    );
  });

  it.each([
    ['cerrado', null],
    ['con otra sesión abierta', 'r2'],
  ])(
    'S1: abierto al llegar y %s mientras recarga (falla): el genérico traducido, una vez',
    async (_caso, despues) => {
      mockGenerar.mockRejectedValue(bloqueadoSinMotivo());
      const { hook, datos, modales } = montar();
      modales.rondaDeGenerarAbierta
        .mockReturnValueOnce('r1')
        .mockReturnValue(despues);
      datos.recargarTrasGeneracionBloqueada.mockRejectedValue(new Error('red'));

      await act(() => hook.result.current.handleGenerateMatches('r1'));

      expect(customToast.error).toHaveBeenCalledTimes(1);
      expect(customToast.error).toHaveBeenCalledWith(
        'generationBlock.title',
        ARRIBA,
      );
    },
  );

  it('S1: cerrado y sin motivo en la respuesta, el texto genérico traducido arriba', async () => {
    mockGenerar.mockRejectedValue(
      Object.assign(new Error('No se pueden generar los partidos'), {
        status: 400,
        errorCode: 'MATCH_GENERATION_BLOCKED',
        bloqueo: null,
      }),
    );
    const { hook, datos, modales } = montar();
    modales.rondaDeGenerarAbierta.mockReturnValue(null);
    datos.recargarTrasGeneracionBloqueada.mockRejectedValue(new Error('red'));

    await act(() => hook.result.current.handleGenerateMatches('r1'));

    // Nunca la frase del servidor
    expect(customToast.error).toHaveBeenCalledTimes(1);
    expect(customToast.error).toHaveBeenCalledWith(
      'generationBlock.title',
      ARRIBA,
    );
  });

  it('S1: cerrado, la barra del motivo con su nombre («Blancas»), cargando su espacio', async () => {
    // Un i18next de verdad, en español, que aún no tiene `golfCourses`: sin
    // haber pintado ninguna barra antes
    const i18next = (await import('i18next')).default;
    const instancia = i18next.createInstance();
    const cargados = [];
    await instancia
      .use({
        type: 'backend',
        init() {},
        read(idioma, espacio, listo) {
          cargados.push(espacio);
          import(`../i18n/locales/${idioma}/${espacio}.json`).then(
            (m) => listo(null, m.default),
            (e) => listo(e, null),
          );
        },
      })
      .init({
        lng: 'es',
        fallbackLng: false,
        ns: ['schedule'],
        defaultNS: 'schedule',
      });
    expect(instancia.hasLoadedNamespace('golfCourses')).toBe(false);
    const antes = traducciones.i18n;
    traducciones.i18n = instancia;
    try {
      mockGenerar.mockRejectedValue(
        Object.assign(new Error('400'), {
          status: 400,
          errorCode: 'MATCH_GENERATION_BLOCKED',
          bloqueo: {
            reason: 'PLAYERS_WITHOUT_TEE',
            players: [
              {
                userId: 'b',
                name: 'Bea',
                missing: 'TEE_COLOR',
                teeColor: 'WHITE',
              },
            ],
          },
        }),
      );
      const { hook, modales } = montar();
      modales.rondaDeGenerarAbierta.mockReturnValue(null);

      await act(() => hook.result.current.handleGenerateMatches('r1'));

      expect(cargados).toContain('golfCourses');
      const [texto] = customToast.error.mock.calls[0];
      expect(texto).toContain('Bea generationBlock.missing.TEE_COLOR Blancas');
      expect(texto).not.toContain('WHITE');
    } finally {
      traducciones.i18n = antes;
    }
  });

  it('S1: un fallo sin conexión no borra el motivo de la respuesta (puede ser la única copia)', async () => {
    mockGenerar.mockRejectedValue(
      Object.assign(new Error('Failed to fetch'), { sinConexion: true }),
    );
    const { hook, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1', ['p']));

    expect(modales.setBloqueoAlGenerar).not.toHaveBeenCalled();
    expect(modales.respuestaBloqueada).not.toHaveBeenCalled();
    expect(customToast.error).toHaveBeenCalled();
  });

  it('S1: sin parpadeo: al enviar no se olvida el motivo; un fallo sin motivo lo olvida al llegar', async () => {
    const orden = [];
    mockGenerar.mockImplementation(async () => {
      orden.push('generar');
      throw Object.assign(new Error('422'), {
        status: 422,
        errorCode: 'PAIRING_PLAYER_NOT_IN_TEAM',
      });
    });
    const { hook, modales } = montar();
    modales.setBloqueoAlGenerar.mockImplementation((b) =>
      orden.push(['bloqueo', b]),
    );

    await act(() => hook.result.current.handleGenerateMatches('r1', ['p']));

    expect(orden).toEqual(['generar', ['bloqueo', null]]);
  });

  it('S1: un fallo sin motivo con el modal de otra sesión no toca ese modal', async () => {
    mockGenerar.mockRejectedValue(
      Object.assign(new Error('422'), {
        status: 422,
        errorCode: 'PAIRING_PLAYER_NOT_IN_TEAM',
      }),
    );
    const { hook, modales } = montar();
    modales.rondaDeGenerarAbierta.mockReturnValue('r2');

    await act(() => hook.result.current.handleGenerateMatches('r1', ['p']));

    expect(modales.setBloqueoAlGenerar).not.toHaveBeenCalled();
  });

  it('con emparejamientos a mano, los manda; bien, cierra y recarga', async () => {
    mockGenerar.mockResolvedValue({});
    const { hook, datos, modales } = montar();

    await act(() => hook.result.current.handleGenerateMatches('r1', ['p']));

    expect(mockGenerar).toHaveBeenCalledWith('r1', { manualPairings: ['p'] });
    expect(modales.cerrarGenerar).toHaveBeenCalled();
    expect(datos.reloadSchedule).toHaveBeenCalled();
  });
});

/**
 * D11: un emparejado a mano fuera de su equipo (BE #919) tiene su
 * texto, no la frase del servidor.
 */
describe('useAccionesDeLaAgenda · generar con un emparejado fuera de su equipo', () => {
  it('PAIRING_PLAYER_NOT_IN_TEAM: su texto, sin cerrar el modal', async () => {
    mockGenerar.mockRejectedValue(
      Object.assign(new Error('Player p9 is not on any team'), {
        status: 422,
        errorCode: 'PAIRING_PLAYER_NOT_IN_TEAM',
      }),
    );
    const { hook, modales } = montar();
    await act(() =>
      hook.result.current.handleGenerateMatches('r1', [{ a: 1 }]),
    );
    // O1: arriba, sin tapar los botones del modal, que sigue abierto
    expect(customToast.error).toHaveBeenCalledWith(
      'errors.PAIRING_PLAYER_NOT_IN_TEAM',
      ARRIBA,
    );
    expect(modales.cerrarGenerar).not.toHaveBeenCalled();
  });

  it('O1: cualquier otro fallo al generar, también arriba', async () => {
    mockGenerar.mockRejectedValue(new Error('sin red'));
    const { hook } = montar();
    await act(() => hook.result.current.handleGenerateMatches('r1'));
    expect(customToast.error).toHaveBeenCalledWith(
      'errors.failedToGenerateMatches',
      ARRIBA,
    );
  });
});

describe('useAccionesDeLaAgenda · repartir equipos', () => {
  it.each([
    ['DRAFT_IN_PROGRESS', 'errors.waitForDraft', false],
    ['TEAMS_FORMED', 'errors.teamsFormed', true],
  ])('%s → %s (recarga: %s)', async (errorCode, aviso, recarga) => {
    mockRepartir.mockRejectedValue({ errorCode });
    const { hook, datos, modales } = montar();

    await act(() => hook.result.current.handleAssignTeams({}));

    expect(customToast.error).toHaveBeenCalledWith(aviso);
    expect(modales.setShowTeamsModal).toHaveBeenCalledTimes(recarga ? 1 : 0);
    expect(datos.reloadSchedule).toHaveBeenCalledTimes(recarga ? 1 : 0);
    expect(datos.recargarCompeticion).toHaveBeenCalledTimes(recarga ? 1 : 0);
  });
});

describe('useAccionesDeLaAgenda · deshacer equipos', () => {
  it('cierra la confirmación, recarga y solo entonces deja de procesar', async () => {
    mockDeshacer.mockRejectedValue({ errorCode: 'NO_TEAMS' });
    const { hook, orden } = montar();

    await act(() => hook.result.current.handleUndoTeams());

    expect(orden).toEqual(['cerrar-confirmacion', 'agenda', 'competicion']);
    // Ya deshechos: basta con releer, sin aviso
    expect(customToast.error).not.toHaveBeenCalled();
    expect(hook.result.current.isProcessing).toBe(false);
  });

  it('con TEAMS_LOCKED, su aviso', async () => {
    mockDeshacer.mockRejectedValue({ errorCode: 'TEAMS_LOCKED' });
    const { hook } = montar();

    await act(() => hook.result.current.handleUndoTeams());

    expect(customToast.error).toHaveBeenCalledWith('errors.teamsLocked');
  });
});
