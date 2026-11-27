import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CapturaDeLaApp from './CapturaDeLaApp';

/**
 * Una captura de verdad de la app, en un marco de móvil (26 nov 2026). La
 * portada enseñaba fotos de banco de imágenes con datos inventados («Próximo
 * torneo: Clásico de Primavera»); ahora enseña la app.
 */
describe('CapturaDeLaApp', () => {
  it('C1 la imagen, con su texto alternativo y sus medidas (sin saltos al cargar)', () => {
    render(<CapturaDeLaApp src="/images/portada/inicio.webp" alt="Inicio" />);
    const img = screen.getByRole('img', { name: 'Inicio' });
    expect(img).toHaveAttribute('src', '/images/portada/inicio.webp');
    expect(img).toHaveAttribute('width', '390');
    expect(img).toHaveAttribute('height', '844');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('C2 en un marco de móvil, con la proporción de la captura', () => {
    const { container } = render(
      <CapturaDeLaApp src="/x.webp" alt="x" className="w-64" />,
    );
    const marco = container.firstChild;
    // La proporción, en la imagen: en la caja con su borde, la imagen quedaba
    // más estrecha y `object-cover` le recortaba unos 6 px por lado (revisión)
    expect(marco.className).not.toContain('aspect-');
    expect(screen.getByRole('img').className).toContain('aspect-[390/844]');
    expect(screen.getByRole('img').className).not.toContain('object-cover');
    // El color de contraste: Forest en claro y arena en oscuro, donde un marco
    // Forest se fundía con el fondo
    expect(marco.className).toContain('bg-contraste');
    expect(marco.className).toContain('p-[10px]');
    expect(marco.className).not.toMatch(/border-forest|bg-forest|\bborder-\[/);
    expect(marco.className).toContain('w-64');
  });

  it('C3 la primera de la página no espera a desplazarse', () => {
    render(<CapturaDeLaApp src="/x.webp" alt="x" sinEspera />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager');
  });
});
