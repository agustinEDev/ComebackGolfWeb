import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BotonMapa from './BotonMapa';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave }),
}));

/**
 * «Mapa», entre «Anterior» y «Siguiente». Va sobre la página, donde pasa la
 * marca de agua: no puede ser transparente (Agustín, 25 nov 2026).
 *
 *   #   caso                    | resultado
 *   ----|-----------------------|----------------------------------------
 *   B1  en reposo               | fondo opaco, el de la página
 *   B2  bajo el puntero         | el color de «encima» de toda la app
 *   B3  al pulsar               | abre el mapa
 */
describe('BotonMapa', () => {
  const clases = () =>
    screen.getByRole('button', { name: 'mapa.abrir' }).className.split(/\s+/);

  it('B1: tiene fondo opaco, el de la página: la marca de agua no se ve a través', () => {
    render(<BotonMapa onAbrir={() => {}} />);

    expect(clases()).toContain('bg-fondo');
    // Ni transparente ni con una opacidad
    expect(clases().some((c) => /^bg-.*\/\d+$/.test(c))).toBe(false);
    expect(clases()).not.toContain('bg-transparent');
  });

  it('B2: bajo el puntero toma el color de «encima»', () => {
    render(<BotonMapa onAbrir={() => {}} />);

    expect(clases()).toEqual(
      expect.arrayContaining([
        'enabled:hover:bg-contraste',
        'enabled:hover:text-sobre-contraste',
      ]),
    );
  });

  it('B3: al pulsarlo abre el mapa', () => {
    const onAbrir = vi.fn();
    render(<BotonMapa onAbrir={onAbrir} />);

    fireEvent.click(screen.getByRole('button', { name: 'mapa.abrir' }));

    expect(onAbrir).toHaveBeenCalledTimes(1);
  });
});
