import { describe, it, expect } from 'vitest';
import {
  textoDelBloqueo,
  motivoConocido,
  faltaConocida,
  claveDeLaFalta,
} from './textoDelBloqueo';

/**
 * El motivo de un bloqueo en una línea, para el aviso de arriba cuando el
 * modal de esa sesión ya se cerró (23 nov 2026). Las mismas claves que pinta
 * `BloqueoDePartidos`.
 *
 *   bloqueo                         | texto
 *   --------------------------------|-------------------------------------------
 *   con jugadores                   | título: nombre falta; nombre falta
 *   con barra que falta             | ... falta color
 *   barra que falta, sin color      | la frase sin «:» (TEE_COLOR_NONE)
 *   sin jugadores                   | título: motivo
 *   motivo o falta desconocidos     | UNEXPECTED / OTHER
 */
const t = (clave) => clave;
const color = (c) => `color-${c}`;

describe('textoDelBloqueo', () => {
  it('con jugadores: quién y qué le falta, uno tras otro', () => {
    expect(
      textoDelBloqueo(
        {
          reason: 'NOT_ENOUGH_PLAYERS',
          players: [
            { userId: 'a', name: 'Ana', missing: 'ENROLLMENT', teeColor: null },
            { userId: 'b', name: 'Bea', missing: 'TEE_COLOR', teeColor: 'RED' },
          ],
        },
        t,
        color,
      ),
    ).toBe(
      'generationBlock.title: Ana generationBlock.missing.ENROLLMENT; ' +
        'Bea generationBlock.missing.TEE_COLOR color-RED',
    );
  });

  it('sin jugadores: el motivo', () => {
    expect(textoDelBloqueo({ reason: 'NO_TEAMS', players: [] }, t, color)).toBe(
      'generationBlock.title: generationBlock.reason.NO_TEAMS',
    );
  });

  it('lo desconocido sale como inesperado u otro', () => {
    expect(motivoConocido('MAÑANA')).toBe('UNEXPECTED');
    expect(motivoConocido('NO_TEAMS')).toBe('NO_TEAMS');
    expect(faltaConocida('ALGO')).toBe('OTHER');
    expect(faltaConocida('GENDER')).toBe('GENDER');
    expect(textoDelBloqueo({ reason: 'MAÑANA' }, t, color)).toBe(
      'generationBlock.title: generationBlock.reason.UNEXPECTED',
    );
  });

  it('una barra que falta sin saber cuál no acaba en «:»', () => {
    const texto = textoDelBloqueo(
      {
        reason: 'PLAYERS_WITHOUT_TEE',
        players: [
          { userId: 'b', name: 'Bea', missing: 'TEE_COLOR', teeColor: null },
        ],
      },
      t,
      color,
    );
    expect(texto).toBe(
      'generationBlock.title: Bea generationBlock.missing.TEE_COLOR_NONE',
    );
  });

  it('claveDeLaFalta: la variante sin color solo si no hay color', () => {
    expect(claveDeLaFalta({ missing: 'TEE_COLOR', teeColor: null })).toBe(
      'TEE_COLOR_NONE',
    );
    expect(claveDeLaFalta({ missing: 'TEE_COLOR', teeColor: 'RED' })).toBe(
      'TEE_COLOR',
    );
    expect(claveDeLaFalta({ missing: 'GENDER', teeColor: null })).toBe(
      'GENDER',
    );
    expect(claveDeLaFalta({ missing: 'RARO' })).toBe('OTHER');
  });
});
