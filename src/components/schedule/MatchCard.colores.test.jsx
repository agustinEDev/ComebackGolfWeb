import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MatchCard from './MatchCard';
import MatchStatus from '../../domain/value_objects/MatchStatus';

/**
 * El color del estado de cada partido (Tabla E1, 18 nov 2026).
 *
 * | #  | Estado      | Color                                  |
 * |----|-------------|----------------------------------------|
 * | C1 | SCHEDULED   | tinta suave: aún no se ha jugado       |
 * | C2 | IN_PROGRESS | el de éxito                            |
 * | C3 | COMPLETED   | tinta                                  |
 * | C4 | WALKOVER    | el de aviso                            |
 * | C5 | CONCEDED    | el de COMPLETED (E1-9: antes no tenía) |
 *
 * Con la marca ComeBack Golf (26 nov 2026) son cápsulas de contorno, del color
 * de su letra, y los colores cambian con el tema.
 */
const t = (clave) => clave;

const etiquetaDe = (status) => {
  render(
    <MatchCard
      match={{
        id: 'm1',
        matchNumber: 1,
        status,
        teamAPlayers: [],
        teamBPlayers: [],
      }}
      matchFormat="SINGLES"
      canManage={false}
      playerNameMap={new Map()}
      playerHandicapMap={new Map()}
      teamNames={{ teamA: 'A', teamB: 'B' }}
      t={t}
    />,
  );
  return screen.getByText(`status.${status}`);
};

describe('MatchCard · color del estado', () => {
  it.each([
    [MatchStatus.SCHEDULED, 'text-tinta-suave'],
    [MatchStatus.IN_PROGRESS, 'text-exito'],
    [MatchStatus.COMPLETED, 'text-tinta'],
    [MatchStatus.WALKOVER, 'text-aviso'],
    [MatchStatus.CONCEDED, 'text-tinta'],
  ])('%s lleva su color', (status, color) => {
    const etiqueta = etiquetaDe(status);

    expect(etiqueta).toHaveClass(color, 'border', 'border-current');
    // Uno solo: ningún otro color de estado a la vez
    const colores = etiqueta.className
      .split(/\s+/)
      .filter((c) => /^text-(tinta|tinta-suave|exito|aviso|error)$/.test(c));
    expect(colores).toEqual([color]);
  });

  it('programado, en juego, terminado y walkover llevan cuatro colores distintos', () => {
    const colorDe = (status) =>
      etiquetaDe(status)
        .className.split(/\s+/)
        .find((c) => /^text-(tinta|tinta-suave|exito|aviso)$/.test(c));

    const colores = [
      MatchStatus.SCHEDULED,
      MatchStatus.IN_PROGRESS,
      MatchStatus.COMPLETED,
      MatchStatus.WALKOVER,
    ].map(colorDe);
    expect(new Set(colores).size).toBe(4);
  });

  it('un estado que la app no conoce va apagado, no como terminado', () => {
    const clases = etiquetaDe('ALGO_NUEVO').className.split(/\s+/);

    expect(clases).toContain('text-tinta-suave');
    expect(clases).not.toContain('text-tinta');
  });

  it('C5: un partido concedido se pinta como uno terminado, no con el gris de reserva', () => {
    expect(etiquetaDe(MatchStatus.CONCEDED)).not.toHaveClass(
      'text-tinta-suave',
    );
  });
});
