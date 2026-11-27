import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const DE_ANIMACION = new Set(['initial', 'animate', 'exit', 'transition']);
  const Div = ({ children, ...props }) => (
    <div
      {...Object.fromEntries(
        Object.entries(props).filter(([k]) => !DE_ANIMACION.has(k)),
      )}
    >
      {children}
    </div>
  );
  return { motion: new Proxy({}, { get: () => Div }) };
});

import ReassignPlayersModal from './ReassignPlayersModal';

/**
 * Sin la lista de inscritos no se reasigna (pasada del Kind, 1 nov 2026: la
 * ventana salía vacía con el botón activo). Como el reparto manual.
 *
 * | #  | Caso                     | Queda                                           |
 * |----|--------------------------|-------------------------------------------------|
 * | R1 | La lista no cargó        | Aviso de recargar; «Reasignar» desactivado y descrito por él |
 * | R2 | La lista cargó           | Como siempre: sin aviso y «Reasignar» activo    |
 */
const t = (clave) => clave;
const partido = {
  id: 'm1',
  matchNumber: 1,
  teamAPlayers: [{ userId: 'ana' }],
  teamBPlayers: [{ userId: 'bea' }],
};
const inscritos = [
  { userId: 'ana', userName: 'Ana Alba', status: 'APPROVED' },
  { userId: 'bea', userName: 'Bea Blanco', status: 'APPROVED' },
];
const pintar = (props) =>
  render(
    <ReassignPlayersModal
      isOpen
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      match={partido}
      isProcessing={false}
      teamNames={{ teamA: 'A', teamB: 'B' }}
      t={t}
      {...props}
    />,
  );
const reasignar = () =>
  screen.getByRole('button', { name: 'matches.reassignPlayers' });

describe('ReassignPlayersModal · sin la lista de inscritos', () => {
  it('R1: avisa de recargar y no deja reasignar', () => {
    const onConfirm = vi.fn();
    pintar({ enrollments: [], inscritosSinCargar: true, onConfirm });
    // Ni enviando el formulario (con Intro, sin pasar por el botón)
    fireEvent.submit(reasignar().closest('form'));
    expect(onConfirm).not.toHaveBeenCalled();

    const aviso = screen.getByTestId('reasignar-inscritos-sin-cargar');
    expect(aviso).toHaveTextContent('matches.reassignNeedsEnrollments');
    expect(reasignar()).toBeDisabled();
    expect(reasignar()).toHaveAttribute('aria-describedby', aviso.id);
  });

  it('R2: con la lista, como siempre', () => {
    pintar({ enrollments: inscritos });

    expect(
      screen.queryByTestId('reasignar-inscritos-sin-cargar'),
    ).not.toBeInTheDocument();
    expect(reasignar()).not.toBeDisabled();
    expect(reasignar()).not.toHaveAttribute('aria-describedby');
  });
});

/**
 * Las filas de jugadores toman el color del equipo al que se asignan (Agustín,
 * 26 nov 2026: probó todas iguales y prefirió esto).
 *
 * | #  | Caso                         | Queda                                   |
 * |----|------------------------------|-----------------------------------------|
 * | F1 | uno de cada equipo y uno sin | cada fila en el color de su equipo; sin equipo, neutra |
 * | F2 | el botón del equipo que toca | relleno en el color del equipo; el otro, con contorno |
 * | F3 | marcar y desmarcar           | los dos botones con borde: nada se mueve |
 * | F4 | cambiar a alguien de equipo  | su fila cambia de color con él           |
 */
describe('ReassignPlayersModal · las filas de jugadores', () => {
  const tres = [
    ...inscritos,
    { userId: 'cruz', userName: 'Cruz Cano', status: 'APPROVED' },
  ];
  const fila = (id) => screen.getByTestId(`jugador-${id}`);
  const clasesDe = (id) => fila(id).className.split(/\s+/);

  it('F1: cada fila en el color de su equipo; sin equipo, neutra', () => {
    pintar({ enrollments: tres });

    expect(clasesDe('ana')).toEqual(
      expect.arrayContaining(['border-team-a', 'bg-team-a-suave']),
    );
    expect(clasesDe('bea')).toEqual(
      expect.arrayContaining(['border-team-b', 'bg-team-b-suave']),
    );
    expect(clasesDe('cruz')).toEqual(
      expect.arrayContaining(['border-linea', 'bg-tarjeta']),
    );
    expect(fila('cruz').className).not.toMatch(/team-/);
  });

  it('F4: al cambiar a alguien de equipo, su fila cambia de color', () => {
    pintar({ enrollments: tres });

    fireEvent.click(
      [...fila('ana').querySelectorAll('button')].find(
        (b) => b.textContent === 'B',
      ),
    );

    expect(clasesDe('ana')).toEqual(
      expect.arrayContaining(['border-team-b', 'bg-team-b-suave']),
    );
    expect(clasesDe('ana')).not.toContain('bg-team-a-suave');
  });

  it('F2: el equipo lo dice el botón marcado', () => {
    pintar({ enrollments: tres });

    const boton = (id, nombre) =>
      [...fila(id).querySelectorAll('button')]
        .find((b) => b.textContent === nombre)
        .className.split(/\s+/);
    expect(boton('ana', 'A')).toContain('bg-team-a');
    expect(boton('ana', 'B')).not.toContain('bg-team-b');
    expect(boton('bea', 'B')).toContain('bg-team-b');
    expect(boton('bea', 'A')).not.toContain('bg-team-a');
    expect(boton('cruz', 'A')).not.toContain('bg-team-a');
    expect(boton('cruz', 'B')).not.toContain('bg-team-b');
  });

  it('F3: marcado o no, el botón lleva borde: al elegir no se mueve nada', () => {
    pintar({ enrollments: tres });

    for (const b of fila('ana').querySelectorAll('button'))
      expect(b.className.split(/\s+/)).toContain('border');
  });
});
