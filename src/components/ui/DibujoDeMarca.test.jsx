import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DibujoDeMarca from './DibujoDeMarca';
import bunker from '../../assets/ilustraciones/silueta/bunker-rastrillo.svg';
import green from '../../assets/ilustraciones/silueta/green-bandera.svg';
import trofeo from '../../assets/ilustraciones/silueta/trofeo.svg';
import tarjeta from '../../assets/ilustraciones/silueta/tarjeta-lapiz.svg';
import bola from '../../assets/ilustraciones/silueta/bola-tee.svg';
import carrito from '../../assets/ilustraciones/silueta/carrito.svg';
import bolsa from '../../assets/ilustraciones/silueta/bolsa.svg';

/**
 * Uno de nuestros dibujos de línea, a tamaño de ilustración y en el color del
 * texto que lo rodea (26 nov 2026). Los de las marcas de agua vienen grises y
 * al 24 %: aquí va su silueta como máscara, pintada con `currentColor`, para
 * que se lea en claro y en oscuro.
 */
describe('DibujoDeMarca', () => {
  it.each([
    ['bunker', bunker],
    ['green', green],
    // Los de las pantallas vacías (27 nov 2026)
    ['trofeo', trofeo],
    ['tarjeta', tarjeta],
    ['bola', bola],
    ['carrito', carrito],
    ['bolsa', bolsa],
  ])('D1 «%s» pinta su silueta', (nombre, fichero) => {
    const { container } = render(<DibujoDeMarca nombre={nombre} />);
    const dibujo = container.firstChild;
    expect(dibujo.style.getPropertyValue('--silueta')).toBe(
      `url("${fichero}")`,
    );
    expect(dibujo.className).toContain('[mask-image:var(--silueta)]');
    expect(dibujo.className).toContain('[-webkit-mask-image:var(--silueta)]');
    // Pintado con el color del texto: la máscara recorta un fondo `currentColor`
    expect(dibujo.className).toContain('bg-current');
  });

  it('D2 es decorativo: ni se lee ni se toca', () => {
    const { container } = render(<DibujoDeMarca nombre="green" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstChild.className).toContain('pointer-events-none');
  });

  it('D3 un nombre que no está no pinta nada', () => {
    const { container } = render(<DibujoDeMarca nombre="otro" />);
    expect(container).toBeEmptyDOMElement();
  });
});
