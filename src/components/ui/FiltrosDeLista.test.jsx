import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FiltrosDeLista from './FiltrosDeLista';

/**
 * Los filtros de una lista: botones con `aria-pressed`, no pestañas.
 *
 *   L1  el elegido va marcado; los demás, no
 *   L2  al tocar uno avisa con su valor (también el ya elegido: quien lo usa
 *       decide si eso lo quita)
 *   L3  el grupo tiene nombre
 *   L4  caben en una fila y cada uno mide 44 px de alto
 */
const OPCIONES = [
  { valor: 'A', texto: 'Activos' },
  { valor: 'P', texto: 'Próximos' },
  { valor: 'F', texto: 'Finalizados' },
];

const pinta = (valor, alCambiar = vi.fn()) =>
  render(
    <FiltrosDeLista
      nombre="Filtrar"
      opciones={OPCIONES}
      valor={valor}
      alCambiar={alCambiar}
    />,
  );

describe('FiltrosDeLista', () => {
  it('L1: marca solo el elegido', () => {
    pinta('P');

    expect(screen.getByRole('button', { name: 'Próximos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const otro of ['Activos', 'Finalizados']) {
      expect(screen.getByRole('button', { name: otro })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
  });

  it('L1b: sin ninguno elegido, ninguno marcado', () => {
    pinta('ALL');

    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
  });

  it('L2: al tocar uno avisa con su valor, también si ya era el elegido', () => {
    const alCambiar = vi.fn();
    pinta('P', alCambiar);

    fireEvent.click(screen.getByRole('button', { name: 'Finalizados' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximos' }));

    expect(alCambiar.mock.calls).toEqual([['F'], ['P']]);
  });

  it('L3: el grupo se llama como se le dice', () => {
    pinta('A');

    expect(screen.getByRole('group', { name: 'Filtrar' })).toBeInTheDocument();
  });

  it('L4: en una fila, a partes iguales y con 44 px de alto', () => {
    pinta('A');

    expect(screen.getByRole('group').className).not.toContain('flex-wrap');
    for (const boton of screen.getAllByRole('button')) {
      expect(boton.className.split(' ')).toEqual(
        expect.arrayContaining(['min-h-[44px]', 'flex-1', 'min-w-0']),
      );
    }
  });
});
