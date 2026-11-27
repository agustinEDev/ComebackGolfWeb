import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TituloDeLaPortada from './TituloDeLaPortada';

/**
 * El título de la portada lleva el logo auténtico en vez del nombre escrito
 * (Agustín, 25 nov 2026): «Bienvenido a» en la letra de la web y, debajo,
 * «Comeback Golf» con el trazo del diseñador, en una línea.
 *
 *   #   quién lo lee           | qué recibe
 *   ----|------------------------|--------------------------------------------
 *   T1  un lector de pantalla  | un solo h1: «Bienvenido a Comeback Golf»
 *   T2  quien mira             | el saludo y, debajo, el logo en una línea
 *   T3  el lector, otra vez    | el logo NO se anuncia: sería decirlo dos veces
 *   T4  el tema                | las dos tintas, cada una con la clase que el
 *                              | CSS usa para esconder la que no toca
 *   T6  mientras carga         | el logo ya ocupa su sitio: no empuja la página
 *   T5  un buscador            | el nombre va como texto dentro del h1, no solo
 *                              | como imagen
 */
const pinta = () =>
  render(<TituloDeLaPortada saludo="Bienvenido a" marca="Comeback Golf" />);

describe('TituloDeLaPortada', () => {
  it('T1: un solo encabezado de nivel 1 con el saludo y el nombre', () => {
    pinta();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Bienvenido a Comeback Golf',
      }),
    ).toBeInTheDocument();
  });

  it('T2: debajo del saludo, el logo en una línea', () => {
    const { container } = pinta();

    expect(
      [...container.querySelectorAll('h1 img')].map((i) =>
        i.getAttribute('src'),
      ),
    ).toEqual([
      '/brand/wordmark-linea-deep.svg',
      '/brand/wordmark-linea-acid.svg',
    ]);
  });

  it('T3: el logo es decorativo: el nombre ya lo dice el texto', () => {
    const { container } = pinta();

    for (const img of container.querySelectorAll('h1 img')) {
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('T4: cada tinta, con la clase del tema que la enseña', () => {
    const { container } = pinta();
    const [clara, oscura] = container.querySelectorAll('h1 img');

    expect(clara).toHaveClass('solo-claro');
    expect(oscura).toHaveClass('solo-oscuro');
  });

  it('T5: el nombre va como texto en el h1, fuera de la vista pero no del árbol', () => {
    pinta();

    const nombre = screen.getByText('Comeback Golf');
    expect(nombre.closest('h1')).not.toBeNull();
    // `sr-only` y no `hidden`: un `hidden` lo sacaría también del lector
    expect(nombre).toHaveClass('sr-only');
    expect(nombre.className).not.toMatch(/\bhidden\b/);
  });

  it('T6: el logo lleva su proporción: reserva el alto antes de cargar', () => {
    // 533,67 × 135,45, el viewBox del SVG. Sin esto la primera visita veía
    // bajar el subtítulo y los botones cuando llegaba la imagen
    const { container } = pinta();

    for (const img of container.querySelectorAll('h1 img'))
      expect(img.className.split(' ')).toContain('aspect-[53367/13545]');
  });
});
