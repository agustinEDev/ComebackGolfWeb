import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SiFallaNada from './SiFallaNada';

vi.mock('../../utils/registraElFallo', () => ({ registraElFallo: vi.fn() }));

const Revienta = () => {
  throw new Error('no se pudo descargar');
};

describe('SiFallaNada', () => {
  it('pinta lo de dentro cuando no falla', () => {
    render(
      <SiFallaNada>
        <p>aviso</p>
      </SiFallaNada>,
    );
    expect(screen.getByText('aviso')).toBeInTheDocument();
  });

  it('si lo de dentro falla, no pinta nada y lo de fuera sigue', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <>
        <SiFallaNada>
          <Revienta />
        </SiFallaNada>
        <p>la anotación</p>
      </>,
    );
    expect(screen.getByText('la anotación')).toBeInTheDocument();
  });
});
