import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { alTocarElFondo } from './alTocarElFondo';

/**
 * Tocar fuera de un diálogo lo cierra, en TODOS (Agustín, 23 nov 2026), pero
 * solo con un gesto que empieza y acaba en el fondo.
 *
 * LA TABLA:
 *
 *   #   | gesto                                         | cierra
 *   ----|-----------------------------------------------|-------
 *   G1  | pulsar y soltar en el fondo                   | sí
 *   G2  | pulsar y soltar dentro de la caja             | no
 *   G3  | empezar en la caja y soltar en el fondo       | no (seleccionar texto)
 *   G3b | un clic suelto, sin su pulsar y soltar        | no
 *   G4  | sin cierre (algo en vuelo, o no hay salida)   | no
 *   G5  | un fondo dentro de otro: tocar el de encima   | solo el de encima
 *   G6  | el de debajo, con un gesto que empezó en el   | no
 *       | fondo de encima                               |
 *   G7  | pulsar en el fondo y soltar en la caja        | no
 *
 * Y de las revisiones (23 nov 2026), que el gesto no se quede pegado:
 *
 *   R1  | pulsar en el fondo sin soltar ahí, y luego el | no
 *       | clic de un botón (Enter, envío de un form)    |
 *   R2  | botón derecho en el fondo                     | no
 *   R3  | el gesto entero y una tecla antes del clic    | no
 *   R3b | una tecla con el botón aún apretado           | no
 *   R4  | soltar fuera y luego soltar en el fondo       | no
 *   R5  | un gesto completo y luego otro que empieza en | no
 *       | la caja con un clic que cae en el fondo       |
 *   R6  | un clic en un botón de dentro tras un gesto   | no
 *       | entero en el fondo                            |
 *
 * Y las listas desplegables dentro de un diálogo (su toque es suyo, como su
 * Escape), y la barra de desplazamiento del fondo:
 *
 *   L1  | al pulsar no se podía cerrar (la lista abierta| no
 *       | quita el Escape) y al soltar ya sí            |
 *   L2  | al pulsar se podía y al soltar ya no          | no
 *   L3  | una lista abierta dentro (combobox, o botón   | no
 *       | que abre una lista o un menú)                 |
 *   L4  | una lista cerrada, un botón que abre otro     | sí
 *       | diálogo o un plegable abierto                 |
 *   L5  | el toque siguiente, ya sin lista              | sí
 *   B1  | pulsar la barra de desplazamiento del fondo   | no
 *   B2  | el fondo junto a la barra                     | sí
 *   B3  | sin barra que ocupe sitio                     | sí
 */
const Dialogo = ({ cerrar, children }) => (
  <div data-testid="fondo" {...alTocarElFondo(cerrar)}>
    <div data-testid="caja">
      <p>Texto</p>
      <button type="button">Entregar</button>
      {children}
    </div>
  </div>
);

const tocar = (donde) => {
  fireEvent.mouseDown(donde);
  fireEvent.mouseUp(donde);
  fireEvent.click(donde);
};
const fondo = () => screen.getByTestId('fondo');

describe('alTocarElFondo', () => {
  it('G1 · pulsar y soltar en el fondo cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    tocar(fondo());

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('G2 · dentro de la caja no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    tocar(screen.getByText('Texto'));

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('G3 · empezar en la caja y soltar en el fondo no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(screen.getByText('Texto'));
    fireEvent.mouseUp(fondo());
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('G3b · tras cerrar, un clic suelto en el fondo, sin su pulsar y soltar, no vuelve a cerrar', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    tocar(fondo());
    fireEvent.click(fondo());

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  // Así se usa: `alTocarElFondo(!ocupado && cerrar)`
  it.each([[false], [null], [undefined]])(
    'G4 · sin cierre (%s && cerrar) el fondo no cierra nada',
    (sePuede) => {
      const cerrar = vi.fn();
      render(<Dialogo cerrar={sePuede && cerrar} />);

      tocar(fondo());

      expect(cerrar).not.toHaveBeenCalled();
    },
  );

  it('G5 · con un diálogo dentro de otro, tocar el fondo de encima cierra solo ese', () => {
    const cerrarDebajo = vi.fn();
    const cerrarEncima = vi.fn();
    render(
      <Dialogo cerrar={cerrarDebajo}>
        <div data-testid="fondo-encima" {...alTocarElFondo(cerrarEncima)}>
          <p>Hoja</p>
        </div>
      </Dialogo>,
    );

    tocar(screen.getByTestId('fondo-encima'));

    expect(cerrarEncima).toHaveBeenCalledTimes(1);
    expect(cerrarDebajo).not.toHaveBeenCalled();
  });

  it('G6 · un gesto que empezó en el fondo de encima no cierra el de debajo', () => {
    const cerrarDebajo = vi.fn();
    const cerrarEncima = vi.fn();
    render(
      <Dialogo cerrar={cerrarDebajo}>
        <div data-testid="fondo-encima" {...alTocarElFondo(cerrarEncima)}>
          <p>Hoja</p>
        </div>
      </Dialogo>,
    );

    fireEvent.mouseDown(screen.getByTestId('fondo-encima'));
    fireEvent.mouseUp(fondo());
    fireEvent.click(fondo());

    expect(cerrarDebajo).not.toHaveBeenCalled();
    expect(cerrarEncima).not.toHaveBeenCalled();
  });

  it('G7 · pulsar en el fondo y soltar en la caja no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(screen.getByText('Texto'));
    // El clic cae en el antepasado común: el propio fondo
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R1 · pulsar en el fondo y luego el clic de un botón (Enter en «Entregar») no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R2 · el botón derecho en el fondo no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo(), { button: 2 });
    fireEvent.mouseUp(fondo(), { button: 2 });
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R3 · una tecla entre el gesto y el clic lo olvida', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(fondo());
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R3b · una tecla con el botón aún apretado también lo olvida', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.mouseUp(fondo());
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R4 · soltar fuera del fondo olvida dónde se pulsó', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(document.body);
    fireEvent.mouseUp(fondo());
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R5 · un gesto nuevo que empieza en la caja olvida el anterior', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(fondo());
    fireEvent.mouseDown(screen.getByText('Texto'));
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('R6 · el clic de un botón de dentro no cierra, aunque el fondo se tocara entero antes', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(fondo());
    fireEvent.click(screen.getByRole('button', { name: 'Entregar' }));

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('L1 · si al pulsar no se podía cerrar, no cierra aunque al soltar ya se pueda', () => {
    const cerrar = vi.fn();
    const { rerender } = render(<Dialogo cerrar={null} />);

    fireEvent.mouseDown(fondo());
    // La lista se cerró con ese mismo toque y el diálogo se pinta sin ella
    rerender(<Dialogo cerrar={cerrar} />);
    fireEvent.mouseUp(fondo());
    fireEvent.click(fondo());

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('L2 · si al pulsar se podía y al soltar ya no (algo salió en vuelo), no cierra', () => {
    const cerrar = vi.fn();
    const { rerender } = render(<Dialogo cerrar={cerrar} />);

    fireEvent.mouseDown(fondo());
    fireEvent.mouseUp(fondo());
    rerender(<Dialogo cerrar={false} />);
    expect(() => fireEvent.click(fondo())).not.toThrow();

    expect(cerrar).not.toHaveBeenCalled();
  });

  // Lo que la lista pone en su disparador o en su campo
  it.each([
    ['un combobox abierto', { role: 'combobox', 'aria-expanded': 'true' }],
    [
      'un botón que abre una lista',
      { 'aria-haspopup': 'listbox', 'aria-expanded': 'true' },
    ],
    [
      'un botón que abre un menú',
      { 'aria-haspopup': 'menu', 'aria-expanded': 'true' },
    ],
  ])(
    'L3 · con %s dentro, el toque es de la lista y no cierra',
    (_, atributos) => {
      const cerrar = vi.fn();
      render(
        <Dialogo cerrar={cerrar}>
          <input aria-label="Buscar" {...atributos} />
        </Dialogo>,
      );

      tocar(fondo());

      expect(cerrar).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['un combobox cerrado', { role: 'combobox', 'aria-expanded': 'false' }],
    [
      'un botón que abre otro diálogo (que tiene su fondo)',
      { 'aria-haspopup': 'dialog', 'aria-expanded': 'true' },
    ],
    ['un plegable abierto', { 'aria-expanded': 'true' }],
  ])('L4 · con %s dentro, cierra', (_, atributos) => {
    const cerrar = vi.fn();
    render(
      <Dialogo cerrar={cerrar}>
        <button type="button" {...atributos}>
          Más
        </button>
      </Dialogo>,
    );

    tocar(fondo());

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('L5 · cerrada la lista, el toque siguiente cierra', () => {
    const cerrar = vi.fn();
    const { rerender } = render(
      <Dialogo cerrar={cerrar}>
        <input aria-label="Buscar" role="combobox" aria-expanded="true" />
      </Dialogo>,
    );
    tocar(fondo());
    rerender(
      <Dialogo cerrar={cerrar}>
        <input aria-label="Buscar" role="combobox" aria-expanded="false" />
      </Dialogo>,
    );

    tocar(fondo());

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  /**
   * Un fondo que se desplaza (`scrollableBackdrop`) tiene su barra, que en el
   * ordenador ocupa sitio a la derecha: pulsarla o arrastrarla no es tocar el
   * fondo. jsdom no mide, así que se le dan las medidas a mano.
   */
  const conBarra = (el) => {
    Object.defineProperty(el, 'offsetWidth', { value: 400 });
    Object.defineProperty(el, 'clientWidth', { value: 385 });
    el.getBoundingClientRect = () => ({ left: 10 });
  };
  const tocarEn = (el, clientX) => {
    fireEvent.mouseDown(el, { clientX });
    fireEvent.mouseUp(el, { clientX });
    fireEvent.click(el, { clientX });
  };

  it('B1 · pulsar la barra de desplazamiento del fondo no cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);
    conBarra(fondo());

    // 10 + 385: el primer punto de la barra
    tocarEn(fondo(), 395);

    expect(cerrar).not.toHaveBeenCalled();
  });

  it('B2 · y justo a su izquierda, en el fondo, sí', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);
    conBarra(fondo());

    tocarEn(fondo(), 394);

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('B3 · sin barra que ocupe sitio (la del móvil flota), todo el fondo cierra', () => {
    const cerrar = vi.fn();
    render(<Dialogo cerrar={cerrar} />);
    Object.defineProperty(fondo(), 'offsetWidth', { value: 385 });
    Object.defineProperty(fondo(), 'clientWidth', { value: 385 });
    fondo().getBoundingClientRect = () => ({ left: 10 });

    tocarEn(fondo(), 396);

    expect(cerrar).toHaveBeenCalledTimes(1);
  });
});
