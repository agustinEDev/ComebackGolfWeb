import { describe, it, expect } from 'vitest';
import {
  esLoPendienteAlTerminar,
  textoDeLoPendienteAlTerminar,
} from './loPendienteAlTerminar';
import es from '../i18n/locales/es/competitions.json';
import en from '../i18n/locales/en/competitions.json';

/**
 * M1 · terminar una competición con algo sin cerrar (backend, I1 del 22
 * nov): 409 PENDING_GAMES con cuántos partidos de la Ryder
 * (`pending_matches`) y partidas de stroke play (`pending_groups`). El texto
 * dice cuántos, con la palabra de cada modalidad.
 */
const t = (clave, v) => `${clave}|${v?.count ?? ''}`;
const fallo = (data) =>
  Object.assign(new Error('409'), {
    status: 409,
    errorCode: 'PENDING_GAMES',
    data: { error_code: 'PENDING_GAMES', ...data },
  });

describe('lo pendiente al terminar', () => {
  it('M1: reconoce el código', () => {
    expect(esLoPendienteAlTerminar(fallo({}))).toBe(true);
    expect(
      esLoPendienteAlTerminar(
        Object.assign(new Error('x'), { errorCode: 'OTRO' }),
      ),
    ).toBe(false);
    expect(esLoPendienteAlTerminar(null)).toBe(false);
  });

  it('M1: en una Ryder, los partidos, con su número', () => {
    expect(
      textoDeLoPendienteAlTerminar(
        t,
        fallo({ pending_matches: 3, pending_groups: 0 }),
      ),
    ).toBe('detail.errors.pendingMatches|3');
  });

  it('M1: en stroke play, las partidas, con su número', () => {
    expect(
      textoDeLoPendienteAlTerminar(
        t,
        fallo({ pending_matches: 0, pending_groups: 1 }),
      ),
    ).toBe('detail.errors.pendingGroups|1');
  });

  it('M1: con los dos (no debería pasar), los dos', () => {
    expect(
      textoDeLoPendienteAlTerminar(
        t,
        fallo({ pending_matches: 2, pending_groups: 4 }),
      ),
    ).toBe('detail.errors.pendingMatches|2 detail.errors.pendingGroups|4');
  });

  it('M1: sin números (o raros), un texto sin ellos', () => {
    expect(textoDeLoPendienteAlTerminar(t, fallo({}))).toBe(
      'detail.errors.pendingGames|',
    );
    expect(
      textoDeLoPendienteAlTerminar(
        t,
        fallo({ pending_matches: 'x', pending_groups: -1 }),
      ),
    ).toBe('detail.errors.pendingGames|');
    expect(
      textoDeLoPendienteAlTerminar(
        t,
        fallo({ pending_matches: 2.5, pending_groups: '3' }),
      ),
    ).toBe('detail.errors.pendingGames|');
  });

  it.each([
    ['es', es],
    ['en', en],
  ])('M1: en %s, los textos con sus plurales', (_idioma, textos) => {
    const e = textos.detail.errors;
    for (const clave of [
      'pendingMatches_one',
      'pendingMatches_other',
      'pendingGroups_one',
      'pendingGroups_other',
    ])
      expect(e[clave]).toContain('{{count}}');
    expect(e.pendingGames).toBeTruthy();
  });

  it('M1: en castellano, «partidos» en la Ryder y «partidas» en stroke play', () => {
    const e = es.detail.errors;
    expect(e.pendingMatches_one).toMatch(/partido\b/);
    expect(e.pendingMatches_other).toMatch(/partidos\b/);
    expect(e.pendingGroups_one).toMatch(/partida\b/);
    expect(e.pendingGroups_other).toMatch(/partidas\b/);
  });
});
