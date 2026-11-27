import { describe, it, expect } from 'vitest';
import { claveDelFalloDeLaBarra } from './falloDeLaBarra';
import es from '../i18n/locales/es/competitions.json';
import en from '../i18n/locales/en/competitions.json';

const fallo = (status, errorCode) =>
  Object.assign(new Error(String(status)), { status, errorCode });

/** F4: cada rechazo con su texto, nunca el del servidor. */
describe('claveDelFalloDeLaBarra', () => {
  it.each([
    [fallo(422, 'TEE_NOT_AVAILABLE'), 'TEE_NOT_AVAILABLE'],
    [fallo(409, 'TEE_CHANGE_CLOSED'), 'TEE_CHANGE_CLOSED'],
    [fallo(409, 'ENROLLMENT_NOT_APPROVED'), 'ENROLLMENT_NOT_APPROVED'],
    [
      fallo(409, 'PENDING_GAME_NOT_RECALCULABLE'),
      'PENDING_GAME_NOT_RECALCULABLE',
    ],
    [fallo(404, 'COURSE_NOT_IN_COMPETITION'), 'COURSE_NOT_IN_COMPETITION'],
    [fallo(422, 'TEE_NOT_ON_PENDING_COURSE'), 'TEE_NOT_ON_PENDING_COURSE'],
    [fallo(403, undefined), 'FORBIDDEN'],
    [fallo(409, 'OTRO_CODIGO'), 'generic'],
    [new Error('sin red'), 'generic'],
    [null, 'generic'],
  ])('%s → %s', (error, clave) => {
    expect(claveDelFalloDeLaBarra(error)).toBe(
      `competitions:tees.errors.${clave}`,
    );
  });
});

describe('claveDelFalloDeLaBarra · la barra de un campo para un género', () => {
  it('TEE_NOT_AVAILABLE con su texto propio; lo demás, como siempre', () => {
    expect(
      claveDelFalloDeLaBarra(fallo(422, 'TEE_NOT_AVAILABLE'), {
        delCampo: true,
      }),
    ).toBe('competitions:tees.courses.errors.TEE_NOT_AVAILABLE');
    expect(claveDelFalloDeLaBarra(fallo(403), { delCampo: true })).toBe(
      'competitions:tees.errors.FORBIDDEN',
    );
  });
});

describe('claveDelFalloDeLaBarra · al quitar una barra', () => {
  it('TEE_NOT_AVAILABLE al quitar: no se puede quitar, sea del jugador o del campo', () => {
    const error = fallo(422, 'TEE_NOT_AVAILABLE');
    expect(claveDelFalloDeLaBarra(error, { quitando: true })).toBe(
      'competitions:tees.errors.cantRemove',
    );
    expect(
      claveDelFalloDeLaBarra(error, { quitando: true, delCampo: true }),
    ).toBe('competitions:tees.errors.cantRemove');
  });

  it('otro código al quitar, el suyo', () => {
    expect(
      claveDelFalloDeLaBarra(fallo(409, 'TEE_CHANGE_CLOSED'), {
        quitando: true,
      }),
    ).toBe('competitions:tees.errors.TEE_CHANGE_CLOSED');
  });
});

/**
 * D10: lo pendiente es un «partido» en una Ryder y una «partida» en stroke
 * play (tabla del 21 nov 2026). Sin decirlo, el de la Ryder, como hasta ahora.
 */
describe('claveDelFalloDeLaBarra · lo pendiente según la modalidad', () => {
  it.each(['PENDING_GAME_NOT_RECALCULABLE', 'TEE_NOT_ON_PENDING_COURSE'])(
    '%s: en stroke play, su texto de partida',
    (codigo) => {
      expect(
        claveDelFalloDeLaBarra(fallo(422, codigo), { conEquipos: false }),
      ).toBe(`competitions:tees.errorsStrokePlay.${codigo}`);
      expect(
        claveDelFalloDeLaBarra(fallo(422, codigo), { conEquipos: true }),
      ).toBe(`competitions:tees.errors.${codigo}`);
      expect(claveDelFalloDeLaBarra(fallo(422, codigo))).toBe(
        `competitions:tees.errors.${codigo}`,
      );
    },
  );

  it('no poder quitarla, igual', () => {
    const error = fallo(422, 'TEE_NOT_AVAILABLE');
    expect(
      claveDelFalloDeLaBarra(error, { quitando: true, conEquipos: false }),
    ).toBe('competitions:tees.errorsStrokePlay.cantRemove');
    expect(
      claveDelFalloDeLaBarra(error, { quitando: true, conEquipos: true }),
    ).toBe('competitions:tees.errors.cantRemove');
  });

  it('lo que no habla de lo pendiente no cambia', () => {
    expect(
      claveDelFalloDeLaBarra(fallo(422, 'TEE_NOT_AVAILABLE'), {
        conEquipos: false,
      }),
    ).toBe('competitions:tees.errors.TEE_NOT_AVAILABLE');
    expect(
      claveDelFalloDeLaBarra(fallo(409, 'TEE_CHANGE_CLOSED'), {
        conEquipos: false,
      }),
    ).toBe('competitions:tees.errors.TEE_CHANGE_CLOSED');
    expect(claveDelFalloDeLaBarra(fallo(500), { conEquipos: false })).toBe(
      'competitions:tees.errors.generic',
    );
  });
});

/**
 * M1 (pasada del iPhone, 22 nov): lo nuevo del servidor (BE #923),
 * con su texto en los dos idiomas.
 */
describe('claveDelFalloDeLaBarra · lo nuevo de la #923', () => {
  it('M1: el jugador, con la competición en curso: en una Ryder, capitán u organizador', () => {
    expect(
      claveDelFalloDeLaBarra(fallo(403, 'PLAYER_TEE_CHANGE_IN_PROGRESS')),
    ).toBe('competitions:tees.errors.PLAYER_TEE_CHANGE_IN_PROGRESS');
  });

  it('M1: en stroke play, solo el organizador', () => {
    expect(
      claveDelFalloDeLaBarra(fallo(403, 'PLAYER_TEE_CHANGE_IN_PROGRESS'), {
        conEquipos: false,
      }),
    ).toBe('competitions:tees.errorsStrokePlay.PLAYER_TEE_CHANGE_IN_PROGRESS');
  });

  it.each([
    [{}],
    [{ conEquipos: false }],
    [{ quitando: true }],
    [{ delCampo: true }],
  ])(
    'M1: ENROLLMENT_NOT_APPROVED en cualquier cambio de barra, con su texto (%o)',
    (contexto) => {
      expect(
        claveDelFalloDeLaBarra(fallo(409, 'ENROLLMENT_NOT_APPROVED'), contexto),
      ).toBe('competitions:tees.errors.ENROLLMENT_NOT_APPROVED');
    },
  );

  it.each([
    ['es', es],
    ['en', en],
  ])('M1: en %s, los textos existen', (_idioma, textos) => {
    expect(textos.tees.errors.PLAYER_TEE_CHANGE_IN_PROGRESS).toBeTruthy();
    expect(
      textos.tees.errorsStrokePlay.PLAYER_TEE_CHANGE_IN_PROGRESS,
    ).toBeTruthy();
    expect(textos.tees.errors.ENROLLMENT_NOT_APPROVED).toBeTruthy();
  });

  it('M1: en castellano, quién la cambia en cada modalidad', () => {
    expect(es.tees.errors.PLAYER_TEE_CHANGE_IN_PROGRESS).toBe(
      'Con la competición en curso, tu barra la cambian tu capitán o el organizador.',
    );
    expect(es.tees.errorsStrokePlay.PLAYER_TEE_CHANGE_IN_PROGRESS).toBe(
      'Con la competición en curso, tu barra la cambia el organizador.',
    );
  });
});
