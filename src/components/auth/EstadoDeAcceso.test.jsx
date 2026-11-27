import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Con qué entra la caja: se deja a la vista
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, initial, animate, ...resto }) => (
          <div data-motion={JSON.stringify({ initial, animate })} {...resto}>
            {children}
          </div>
        ),
    },
  ),
}));

const { default: EstadoDeAcceso } = await import('./EstadoDeAcceso');

/**
 * Las pantallas de estado del acceso (correo verificado o no, enlace caducado,
 * error de Google, cambio de correo): llevaban una X roja o un check en un
 * círculo de color. Ahora, uno de nuestros dibujos: el búnker para lo que salió
 * mal y el green con su bandera para lo que salió bien (Agustín, 26 nov 2026).
 *
 *   caso | qué                                  | cómo
 *   -----|--------------------------------------|-----------------------------
 *   E1   | algo salió mal                       | el búnker
 *   E2   | salió bien                           | el green con su bandera
 *   E3   | el título                            | encabezado del nivel pedido
 *   E4   | el texto y las acciones              | debajo, en ese orden
 *   E5   | pantalla completa                    | fondo de la app, centrado
 *   E6   | dentro de otro marco                 | solo la tarjeta
 *   E7   | con entrada (Restablecer, A5)        | aparece; sin ella, quieta
 *   E8   | ni círculos de color ni X roja       | nada de lo de antes
 */
const pinta = (props = {}) =>
  render(
    <EstadoDeAcceso
      dibujo="bunker"
      titulo="No se pudo"
      texto="El enlace no vale"
      {...props}
    >
      <a href="/login">Ir a iniciar sesión</a>
    </EstadoDeAcceso>,
  );

describe('EstadoDeAcceso', () => {
  it('E1 lo que salió mal lleva el búnker', () => {
    const { container } = pinta({ dibujo: 'bunker' });
    expect(container.querySelector('[data-dibujo="bunker"]')).toBeTruthy();
  });

  it('E2 lo que salió bien, el green con su bandera', () => {
    const { container } = pinta({ dibujo: 'green' });
    expect(container.querySelector('[data-dibujo="green"]')).toBeTruthy();
  });

  it.each([1, 2])('E3 el título, como encabezado de nivel %s', (nivel) => {
    pinta({ nivel });
    expect(
      screen.getByRole('heading', { level: nivel, name: 'No se pudo' }),
    ).toBeInTheDocument();
  });

  it('E4 el texto y luego las acciones', () => {
    pinta();
    const texto = screen.getByText('El enlace no vale');
    const accion = screen.getByRole('link', { name: 'Ir a iniciar sesión' });
    expect(
      texto.compareDocumentPosition(accion) &
        globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('E5 a pantalla completa, sobre el fondo de la app y centrada', () => {
    const { container } = pinta();
    expect(container.firstChild.className).toContain('bg-fondo');
    expect(container.firstChild.className).toContain('min-h-screen');
  });

  it('E6 dentro de otro marco, solo la tarjeta', () => {
    const { container } = pinta({ pantallaCompleta: false });
    expect(container.firstChild.className).not.toContain('min-h-screen');
    expect(container.firstChild.className).toContain('bg-tarjeta');
  });

  it('E7 con entrada aparece; sin ella, se queda quieta', () => {
    const { container, unmount } = pinta({ conEntrada: true });
    const caja = container.querySelector('[data-motion]');
    expect(JSON.parse(caja.getAttribute('data-motion')).initial).toEqual({
      opacity: 0,
      scale: 0.95,
    });
    unmount();
    const sin = pinta();
    expect(sin.container.querySelector('[data-motion]')).toBeNull();
  });

  it('E9 con algo encima (la espera), en lugar del dibujo', () => {
    const { container } = pinta({ encima: <span data-testid="espera" /> });
    expect(screen.getByTestId('espera')).toBeInTheDocument();
    expect(container.querySelector('[data-dibujo]')).toBeNull();
  });

  it('E10 sin título no pinta un encabezado vacío', () => {
    render(<EstadoDeAcceso dibujo="green" texto="Hecho" />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('E8 nada de lo de antes: ni círculos de color ni grises', () => {
    const { container } = pinta();
    expect(container.innerHTML).not.toMatch(
      /bg-(red|green|yellow|amber)-100|text-(red|green)-600|bg-gray-|bg-white\b/,
    );
  });
});
