import { describe, it, expect } from 'vitest';
import { CompetitionStatusEnum } from '../domain/value_objects/CompetitionStatus';
import {
  GRUPOS_DE_COMPETICIONES,
  esDelGrupo,
  grupoValido,
} from './gruposDeCompeticiones';

/**
 * Los filtros de Torneos (ComeBack Golf, 24 nov 2026): tres grupos en vez del
 * desplegable con los seis estados.
 *
 *   grupo        | estados
 *   -------------|------------------------------------------
 *   ACTIVOS      | IN_PROGRESS: se está jugando
 *   PROXIMOS     | DRAFT, ACTIVE, CLOSED: aún no ha empezado
 *   FINALIZADOS  | COMPLETED, CANCELLED: ya no se juega
 *   (ninguno)    | todos
 */
describe('grupos de competiciones', () => {
  it('G1: cada estado está en un grupo, y solo en uno', () => {
    for (const estado of Object.values(CompetitionStatusEnum)) {
      const grupos = Object.keys(GRUPOS_DE_COMPETICIONES).filter((g) =>
        esDelGrupo(estado, g),
      );
      expect(grupos, estado).toHaveLength(1);
    }
  });

  it.each([
    ['IN_PROGRESS', 'ACTIVOS'],
    ['DRAFT', 'PROXIMOS'],
    ['ACTIVE', 'PROXIMOS'],
    ['CLOSED', 'PROXIMOS'],
    ['COMPLETED', 'FINALIZADOS'],
    ['CANCELLED', 'FINALIZADOS'],
  ])('G2: %s es de %s', (estado, grupo) => {
    expect(esDelGrupo(estado, grupo)).toBe(true);
  });

  it('G3: sin grupo elegido, todos', () => {
    for (const estado of Object.values(CompetitionStatusEnum)) {
      expect(esDelGrupo(estado, null)).toBe(true);
    }
  });

  it('G4: un estado que no se conoce no es de ningún grupo, pero sale sin filtro', () => {
    expect(esDelGrupo('NUEVO', 'ACTIVOS')).toBe(false);
    expect(esDelGrupo('NUEVO', null)).toBe(true);
  });

  it('G5: un filtro guardado que ya no existe (un estado suelto de antes) es «todos»', () => {
    expect(grupoValido('ACTIVOS')).toBe('ACTIVOS');
    expect(grupoValido('IN_PROGRESS')).toBeNull();
    expect(grupoValido('ALL')).toBeNull();
    expect(grupoValido(undefined)).toBeNull();
  });
});
