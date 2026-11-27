import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import ModalesDeLaAgenda from './ModalesDeLaAgenda';

/**
 * S1 (23 nov 2026): qué motivo enseña el modal de generar.
 *
 *   respuesta guardada      | agenda       | modal
 *   ------------------------|--------------|---------------------------
 *   de esta sesión          | con otro     | el de la respuesta (reciente)
 *   de otra sesión          | sin nada     | ninguno
 *   de otra sesión          | con uno      | el de la agenda
 *   ninguna                 | con uno      | el de la agenda
 *   de esta, sin motivo     | con uno      | el de la agenda
 *   de esta, otra vez igual | -            | el aviso se monta de nuevo
 */
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...rest }) => {
      void initial;
      void animate;
      void transition;
      return <div {...rest}>{children}</div>;
    },
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave }),
}));

const DE_LA_RESPUESTA = {
  reason: 'NOT_ENOUGH_PLAYERS',
  players: [
    { userId: 'x1', name: 'Xavier', missing: 'ENROLLMENT', teeColor: null },
  ],
};
const GUARDADO = { reason: 'NO_TEAMS', players: [] };

const vista = ({ respuesta, guardado = null }) => (
  <ModalesDeLaAgenda
    modales={{
      generateRound: { id: 'r-b', matchFormat: 'SINGLES' },
      bloqueoAlGenerar: respuesta && { vez: 1, ...respuesta },
      cerrarGenerar: vi.fn(),
    }}
    acciones={{ isProcessing: false, handleGenerateMatches: vi.fn() }}
    enrollments={[]}
    inscritosSinCargar={false}
    playerNameMap={new Map()}
    playerHandicapMap={new Map()}
    competition={{ setupMode: 'MANUAL', captains: {} }}
    rounds={[{ id: 'r-b', matchGenerationBlock: guardado }]}
    teamAssignment={{ teamAPlayerIds: ['a'], teamBPlayerIds: ['b'] }}
    teamNames={{ teamA: 'A', teamB: 'B' }}
    canManage
    t={(clave) => clave}
    tComp={(clave) => clave}
  />
);
const pinta = (opciones) => render(vista(opciones));

const recuadro = () =>
  within(screen.getByTestId('generate-matches-modal')).queryByTestId(
    'bloqueo-de-partidos',
  );

describe('ModalesDeLaAgenda · el motivo del modal de generar', () => {
  it('S1: el de la respuesta de esta sesión gana al guardado', () => {
    pinta({
      respuesta: { roundId: 'r-b', bloqueo: DE_LA_RESPUESTA },
      guardado: GUARDADO,
    });
    expect(screen.getByTestId('falta-x1')).toBeInTheDocument();
  });

  it('S1: el de otra sesión no sale en esta', () => {
    pinta({ respuesta: { roundId: 'r-a', bloqueo: DE_LA_RESPUESTA } });
    expect(recuadro()).not.toBeInTheDocument();
  });

  it('S1: con el de otra sesión, sale el guardado de esta', () => {
    pinta({
      respuesta: { roundId: 'r-a', bloqueo: DE_LA_RESPUESTA },
      guardado: GUARDADO,
    });
    expect(recuadro()).toHaveTextContent('generationBlock.reason.NO_TEAMS');
  });

  it('S1: sin respuesta, el guardado', () => {
    pinta({ respuesta: null, guardado: GUARDADO });
    expect(recuadro()).toHaveTextContent('generationBlock.reason.NO_TEAMS');
  });

  it('S1: una respuesta sin motivo de esta sesión deja el guardado', () => {
    pinta({ respuesta: { roundId: 'r-b', bloqueo: null }, guardado: GUARDADO });
    expect(recuadro()).toHaveTextContent('generationBlock.reason.NO_TEAMS');
  });

  it('S1: otra respuesta igual vuelve a montar el aviso (se anuncia otra vez)', () => {
    const { rerender } = pinta({
      respuesta: { roundId: 'r-b', bloqueo: DE_LA_RESPUESTA, vez: 1 },
    });
    const primero = recuadro();
    rerender(
      vista({
        respuesta: { roundId: 'r-b', bloqueo: DE_LA_RESPUESTA, vez: 2 },
      }),
    );
    expect(recuadro()).not.toBe(primero);
    expect(recuadro()).toBeInTheDocument();
  });
});
