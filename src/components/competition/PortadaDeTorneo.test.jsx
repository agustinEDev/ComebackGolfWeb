import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortadaDeTorneo from './PortadaDeTorneo';
import { indiceDeLaPortada } from '../../utils/indiceDeLaPortada';

/**
 * La portada de un torneo, mientras no tenga imagen propia (ComeBack Golf).
 *
 *   #   caso                              | qué pasa
 *   ----|-----------------------------------|-------------------------------
 *   I1  el mismo torneo                   | siempre la misma portada
 *   I2  muchos torneos                    | se reparten entre todas
 *   I3  sin identificador                 | la primera, sin romper
 *   I4  es decorativa                     | sin nombre, fuera del foco
 */
describe('PortadaDeTorneo', () => {
  it('I1: el mismo torneo lleva siempre la misma', () => {
    const id = '112310e7-be52-4a6d-9670-cece3adbc03d';

    expect(indiceDeLaPortada(id, 3)).toBe(indiceDeLaPortada(id, 3));
    const { unmount } = render(<PortadaDeTorneo semilla={id} />);
    const primera = screen.getByTestId('portada-de-torneo').dataset.portada;
    unmount();
    render(<PortadaDeTorneo semilla={id} />);

    expect(screen.getByTestId('portada-de-torneo').dataset.portada).toBe(
      primera,
    );
  });

  it('I2: entre muchos torneos salen todas las portadas', () => {
    const vistas = new Set();
    for (let i = 0; i < 60; i += 1) {
      vistas.add(indiceDeLaPortada(`torneo-${i}`, 3));
    }

    expect([...vistas].sort()).toEqual([0, 1, 2]);
  });

  it.each([[undefined], [null], ['']])(
    'I3: sin identificador (%s) pinta la primera',
    (semilla) => {
      render(<PortadaDeTorneo semilla={semilla} />);

      expect(screen.getByTestId('portada-de-torneo').dataset.portada).toBe('0');
    },
  );

  it('I4: es decorativa: sin nombre accesible y fuera del foco', () => {
    render(<PortadaDeTorneo semilla="x" />);
    const svg = screen.getByTestId('portada-de-torneo');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});
