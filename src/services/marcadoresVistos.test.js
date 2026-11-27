import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * El marcador visto se guarda en el dispositivo (Agustín, 24 nov 2026): al
 * abrir la app de cero, Inicio lo pinta al instante, como el resto del panel.
 *
 *   #  caso                                        | resultado
 *   ---|---------------------------------------------|---------------------------
 *   M1 visto, y se abre la app de cero             | sale lo guardado
 *   M2 nunca visto                                 | nada
 *   M3 guardado con otra versión                   | se ignora
 *   M4 guardado roto (no es JSON)                  | nada, sin reventar
 *   M5 un nombre que no es texto                   | ese marcador se ignora
 *   M6 se cierra la sesión                         | se borra del dispositivo
 *   M7 403/404: se olvida uno                      | se borra ese, quedan los demás
 *   M8 más de los que caben                        | se va el más viejo
 *   M9 el almacenamiento no deja escribir          | queda en memoria, sin reventar
 *   M10 lo recibido trae campos de más             | solo se guarda lo que se pinta
 *   M11 cerrada la sesión, llega una respuesta     | no se vuelve a escribir
 *   M12 entra una cuenta sin recargar              | se vuelve a guardar
 *   M13 otra pestaña borró lo guardado             | escribir no resucita lo de antes
 *   M14 otra pestaña avisa del cambio              | la memoria deja de valer
 *   M16 el almacenamiento no se deja ni leer       | la memoria conserva todos
 */
const CLAVE = 'comebackgolf-marcadores-vistos';
const marcador = (id, extra = {}) => ({
  competitionId: id,
  competitionName: `Torneo ${id}`,
  teamAName: 'Norte',
  teamBName: 'Sur',
  teamAPoints: 2.5,
  teamBPoints: 1,
  ...extra,
});

let almacen;
const abreLaApp = async () => {
  vi.resetModules();
  return import('./marcadoresVistos');
};

beforeEach(() => {
  almacen = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k) => almacen.get(k) ?? null,
    setItem: (k, v) => almacen.set(k, String(v)),
    removeItem: (k) => almacen.delete(k),
  });
});

describe('El marcador visto, guardado en el dispositivo', () => {
  it('M1: lo visto sale al abrir la app de cero', async () => {
    const antes = await abreLaApp();
    antes.recuerdaElMarcador('c1', marcador('c1'));

    const ahora = await abreLaApp();

    expect(ahora.elMarcadorVisto('c1')).toEqual(marcador('c1'));
  });

  it('M2: de una competición nunca vista no hay nada', async () => {
    const { elMarcadorVisto } = await abreLaApp();

    expect(elMarcadorVisto('c1')).toBeNull();
  });

  it('M3: lo guardado con otra versión se ignora', async () => {
    almacen.set(CLAVE, JSON.stringify({ v: 0, marcadores: [marcador('c1')] }));

    const { elMarcadorVisto } = await abreLaApp();

    expect(elMarcadorVisto('c1')).toBeNull();
  });

  it('M4: un guardado roto no revienta', async () => {
    almacen.set(CLAVE, '{no es json');

    const { elMarcadorVisto } = await abreLaApp();

    expect(elMarcadorVisto('c1')).toBeNull();
  });

  it('M5: un marcador con un nombre que no es texto se ignora', async () => {
    almacen.set(
      CLAVE,
      JSON.stringify({
        v: 1,
        marcadores: [marcador('c1', { teamAName: { x: 1 } }), marcador('c2')],
      }),
    );

    const { elMarcadorVisto } = await abreLaApp();

    expect(elMarcadorVisto('c1')).toBeNull();
    expect(elMarcadorVisto('c2')).toEqual(marcador('c2'));
  });

  it('M6: al cerrar la sesión se borra del dispositivo', async () => {
    const antes = await abreLaApp();
    antes.recuerdaElMarcador('c1', marcador('c1'));

    antes.olvidaLosMarcadores();

    expect(almacen.has(CLAVE)).toBe(false);
    expect(antes.elMarcadorVisto('c1')).toBeNull();
    expect((await abreLaApp()).elMarcadorVisto('c1')).toBeNull();
  });

  it('M7: olvidar uno lo borra también del dispositivo y deja los demás', async () => {
    const antes = await abreLaApp();
    antes.recuerdaElMarcador('c1', marcador('c1'));
    antes.recuerdaElMarcador('c2', marcador('c2'));

    antes.olvidaElMarcador('c1');
    const ahora = await abreLaApp();

    expect(ahora.elMarcadorVisto('c1')).toBeNull();
    expect(ahora.elMarcadorVisto('c2')).toEqual(marcador('c2'));
  });

  it('M8: con más de los que caben se va el más viejo', async () => {
    const antes = await abreLaApp();
    for (const id of ['c1', 'c2', 'c3', 'c4', 'c5'])
      antes.recuerdaElMarcador(id, marcador(id));

    const ahora = await abreLaApp();

    expect(ahora.elMarcadorVisto('c1')).toBeNull();
    expect(ahora.elMarcadorVisto('c5')).toEqual(marcador('c5'));
    expect(ahora.elMarcadorVisto('c2')).toEqual(marcador('c2'));
  });

  it('M9: si el almacenamiento no deja escribir, queda en memoria', async () => {
    const { recuerdaElMarcador, elMarcadorVisto } = await abreLaApp();
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    });

    recuerdaElMarcador('c1', marcador('c1'));

    expect(elMarcadorVisto('c1')).toEqual(marcador('c1'));
  });

  it('M10: solo se guarda lo que se pinta', async () => {
    const antes = await abreLaApp();
    antes.recuerdaElMarcador(
      'c1',
      marcador('c1', { matches: [{ id: 'm1' }], correo: 'a@b.c' }),
    );

    expect(almacen.get(CLAVE)).not.toContain('correo');
    expect(almacen.get(CLAVE)).not.toContain('matches');
    expect((await abreLaApp()).elMarcadorVisto('c1')).toEqual(marcador('c1'));
  });

  it('M11: cerrada la sesión, una respuesta en vuelo no vuelve a escribir', async () => {
    const m = await abreLaApp();
    m.recuerdaElMarcador('c1', marcador('c1'));
    m.olvidaLosMarcadores();

    m.recuerdaElMarcador('c1', marcador('c1'));

    expect(almacen.has(CLAVE)).toBe(false);
    expect(m.elMarcadorVisto('c1')).toBeNull();
  });

  it('M12: al entrar una cuenta sin recargar se vuelve a guardar', async () => {
    const m = await abreLaApp();
    m.olvidaLosMarcadores();

    m.abreLosMarcadoresParaLaCuenta();
    m.recuerdaElMarcador('c2', marcador('c2'));

    expect((await abreLaApp()).elMarcadorVisto('c2')).toEqual(marcador('c2'));
  });

  it('M13: si otra pestaña borró lo guardado, escribir no resucita lo de antes', async () => {
    const m = await abreLaApp();
    m.recuerdaElMarcador('c1', marcador('c1'));
    m.recuerdaElMarcador('c2', marcador('c2'));
    // Otra pestaña cierra la sesión: borra la clave, y aquí no llega el aviso
    almacen.delete(CLAVE);

    m.recuerdaElMarcador('c3', marcador('c3'));
    const guardado = JSON.parse(almacen.get(CLAVE)).marcadores;

    expect(guardado.map((x) => x.competitionId)).toEqual(['c3']);
    expect(m.elMarcadorVisto('c1')).toBeNull();
  });

  it('M13b: y olvidar uno tampoco devuelve los demás al dispositivo', async () => {
    const m = await abreLaApp();
    m.recuerdaElMarcador('c1', marcador('c1'));
    m.recuerdaElMarcador('c2', marcador('c2'));
    almacen.delete(CLAVE);

    m.olvidaElMarcador('c1');

    expect(almacen.get(CLAVE) ?? '').not.toContain('c2');
    expect(m.elMarcadorVisto('c2')).toBeNull();
  });

  it('M14: el aviso de otra pestaña deja sin valor la memoria', async () => {
    const m = await abreLaApp();
    m.recuerdaElMarcador('c1', marcador('c1'));
    almacen.delete(CLAVE);

    globalThis.dispatchEvent(
      new globalThis.StorageEvent('storage', { key: CLAVE }),
    );

    expect(m.elMarcadorVisto('c1')).toBeNull();
  });

  it('M16: si el almacenamiento no se deja leer, la memoria conserva todos', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {},
    });
    const m = await abreLaApp();

    m.recuerdaElMarcador('c1', marcador('c1'));
    m.recuerdaElMarcador('c2', marcador('c2'));
    m.olvidaElMarcador('c3');

    expect(m.elMarcadorVisto('c1')).toEqual(marcador('c1'));
    expect(m.elMarcadorVisto('c2')).toEqual(marcador('c2'));
  });
});
