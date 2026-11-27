import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import Canonica from './Canonica';

/** S4 en la página: React 19 lleva el `<link>` al `<head>`. */
describe('Canonica', () => {
  afterEach(cleanup);

  const enlaces = () => [
    ...document.head.querySelectorAll('link[rel="canonical"]'),
  ];

  it('en una página pública pone la suya en comebackgolf.com', () => {
    render(<Canonica ruta="/pricing/" />);

    expect(enlaces().map((l) => l.getAttribute('href'))).toEqual([
      'https://www.comebackgolf.com/pricing',
    ]);
  });

  it('en una pantalla de la aplicación no pone ninguna', () => {
    render(<Canonica ruta="/dashboard" />);

    expect(enlaces()).toEqual([]);
  });

  it('al salir de la página pública la quita', () => {
    const { rerender } = render(<Canonica ruta="/" />);
    rerender(<Canonica ruta="/login" />);

    expect(enlaces()).toEqual([]);
  });
});
