import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave }),
}));

import EntregaDelPartido from './EntregaDelPartido';
import EntregaDeLaPartida from './EntregaDeLaPartida';

/**
 * FE #1240 · casilla 16. La barra de entregar se apoya encima del aviso de
 * instalar, así que lo que tapa abajo es la barra MÁS el aviso. El hueco del
 * final de la anotación lo tiene que contar: App no pone el del aviso en la
 * anotación (es inmersiva), y con solo los 9rem de la barra las últimas filas
 * quedaban debajo.
 */
const HUECO = 'h-[calc(9rem+var(--alto-aviso-instalar,0px))]';

describe('El hueco del final de la anotación cuenta el aviso de instalar', () => {
  it('C16: en el partido', () => {
    render(
      <EntregaDelPartido
        estado="entregar"
        marcador="AS"
        onEntregar={vi.fn()}
      />,
    );

    expect(screen.getByTestId('hueco-de-la-barra')).toHaveClass(HUECO);
  });

  it('C16: en la partida de stroke play', () => {
    render(
      <EntregaDeLaPartida
        estado="entregar"
        onEntregar={vi.fn()}
        scoringView={{ matchStatus: 'IN_PROGRESS' }}
      />,
    );

    expect(screen.getByTestId('hueco-de-la-barra')).toHaveClass(HUECO);
  });
});
