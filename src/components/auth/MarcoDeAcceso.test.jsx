import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/**
 * El marco de las pantallas de acceso, que estaba copiado cinco veces. Cada
 * prop reproduce una de las diferencias que había entre las copias.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'es' } }),
}));
// Con qué entra cada caja: se deja a la vista
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, initial, animate, transition, ...resto }) => (
          <div
            data-motion={JSON.stringify({ initial, animate, transition })}
            {...resto}
          >
            {children}
          </div>
        ),
    },
  ),
}));

const { default: MarcoDeAcceso } = await import('./MarcoDeAcceso');

// Iconos de línea: componentes, como los de lucide
const Copa = (props) => <svg data-testid="icono-copa" {...props} />;
const Bandera = (props) => <svg data-testid="icono-bandera" {...props} />;
const VENTAJAS = [
  { Icono: Copa, text: 'Torneos' },
  { Icono: Bandera, text: 'Estadísticas' },
];

const abrir = (props = {}) =>
  render(
    <MemoryRouter>
      <MarcoDeAcceso titulo="Hola" subtitulo="Entra" {...props}>
        <div data-testid="tarjeta">la tarjeta</div>
      </MarcoDeAcceso>
    </MemoryRouter>,
  );

const movimiento = (el) =>
  JSON.parse(el.closest('[data-motion]').getAttribute('data-motion'));
const panel = (container) => container.querySelector('.lg\\:w-1\\/2');
const ladoDelFormulario = () =>
  screen.getByTestId('tarjeta').closest('[data-motion]');

describe('MarcoDeAcceso', () => {
  it('M1: el héroe lleva el título, el subtítulo y el pie', () => {
    const { container } = abrir();
    const heroe = within(panel(container));
    expect(heroe.getByRole('heading', { level: 2 }).textContent).toBe('Hola');
    expect(heroe.getByText('Entra')).toBeTruthy();
    expect(heroe.getByText('common:footer.copyrightShort')).toBeTruthy();
  });

  it('M2: las ventajas, cada una con su icono de línea en lima y con retardo creciente', () => {
    abrir({ ventajas: VENTAJAS });
    const torneos = screen.getByText('Torneos');
    const estadisticas = screen.getByText('Estadísticas');
    // El icono, decorativo y en lima: el texto ya lo dice
    const icono = within(torneos.previousSibling).getByTestId('icono-copa');
    expect(icono).toHaveAttribute('aria-hidden', 'true');
    expect(torneos.previousSibling.className).toContain('text-lime');
    expect(movimiento(torneos).transition).toEqual({ delay: 0.2 });
    expect(movimiento(estadisticas).transition.delay).toBeCloseTo(0.3);
  });

  it('M3: sin ventajas no pinta la lista', () => {
    const { container } = abrir();
    expect(container.querySelector('.space-y-4.mt-8')).toBeNull();
  });

  it('M4: el extra del héroe va tras la lista, dentro del bloque central', () => {
    abrir({
      ventajas: VENTAJAS,
      extraDelHeroe: <div data-testid="cifras">3 cifras</div>,
    });
    const cifras = screen.getByTestId('cifras');
    expect(cifras.parentElement.className).toBe('space-y-6');
    expect(cifras.previousSibling.className).toBe('space-y-4 mt-8');
  });

  it('M5: el logo del móvil, a la portada y solo fuera de pantalla grande', () => {
    abrir();
    const logos = screen.getAllByRole('link', { name: /Comeback Golf/ });
    expect(logos).toHaveLength(2);
    const movil = logos.find((a) => a.className.includes('lg:hidden'));
    expect(movil.getAttribute('href')).toBe('/');
    // El wordmark en la tinta del tema: van las dos y el CSS esconde la que
    // no toca. Con la deep fija no se veía en oscuro (revisión, 25 nov 2026)
    expect(
      [...movil.querySelectorAll('img')].map((i) => i.getAttribute('src')),
    ).toEqual(
      expect.arrayContaining([
        '/brand/wordmark-deep.svg',
        '/brand/wordmark-acid.svg',
      ]),
    );
  });

  it('M6: «Volver» con su texto, a la portada, tras la tarjeta', () => {
    abrir({ textoDeVolver: 'Volver al inicio' });
    const volver = screen.getByText('Volver al inicio').closest('a');
    expect(volver.getAttribute('href')).toBe('/');
    expect(volver.querySelector('svg')).toBeTruthy();
    expect(screen.getByTestId('tarjeta').nextSibling).toBe(volver);
  });

  it('M7: sin texto de volver no hay enlace tras la tarjeta', () => {
    abrir();
    expect(screen.getByTestId('tarjeta').nextSibling).toBeNull();
  });

  /**
   * El panel de escritorio, con la marca (Agustín, 26 nov 2026): Deep Forest
   * liso con el sello CG grande de marca de agua y el logo en lima. Fuera las
   * fotos de banco de imágenes, las manchas de color y la variante en verde
   * oliva del Registro: el mismo panel en todas las pantallas de acceso.
   */
  it('M8: el panel es Deep Forest, con el logo en lima y el sello de fondo', () => {
    const { container } = abrir();
    expect(panel(container).className).toContain('bg-forest');
    expect(
      panel(container).querySelector('img[src="/brand/wordmark-acid.svg"]'),
    ).toBeTruthy();
    const sello = within(panel(container)).getByTestId('sello-del-panel');
    expect(sello.querySelector('img')).toHaveAttribute(
      'src',
      '/brand/stamp-acid.svg',
    );
    // Decorativo: ni se lee ni se toca
    expect(sello.querySelector('img')).toHaveAttribute('alt', '');
    expect(sello).toHaveAttribute('aria-hidden', 'true');
    expect(sello.className).toContain('pointer-events-none');
    // El foco en lima: en claro es Forest, y sobre el panel Forest no se veía
    expect(panel(container).className).toContain(
      '[--cbg-foco:var(--cbg-lime)]',
    );
  });

  it('M9: ni fotos ni manchas: nada de fuera de la marca', () => {
    const { container } = abrir();
    expect(container.innerHTML).not.toMatch(/unsplash|bg-cover|blur-3xl/);
    expect(container.innerHTML).not.toMatch(/bg-primary|bg-accent/);
  });

  it('M12: el lado del formulario lleva el fondo de la app, no un gris', () => {
    const { container } = abrir();
    const lado = ladoDelFormulario().parentElement;
    expect(lado.className).toContain('bg-fondo');
    expect(container.innerHTML).not.toMatch(/bg-gray-50|bg-white\b/);
  });

  it('M13: «Volver» en la tinta suave de la app', () => {
    abrir({ textoDeVolver: 'Volver al inicio' });
    const volver = screen.getByText('Volver al inicio').closest('a');
    expect(volver.className).toContain('text-tinta-suave');
    expect(volver.className).not.toMatch(/text-gray-|text-primary/);
  });

  it('M10: el panel entra desde la izquierda y el formulario sube', () => {
    const { container } = abrir();
    expect(movimiento(panel(container))).toEqual({
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.6 },
    });
    expect(movimiento(ladoDelFormulario())).toEqual({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 },
    });
  });

  it('M11: con soloAparece el formulario no se desplaza (FE #865-12)', () => {
    abrir({ soloAparece: true });
    expect(movimiento(ladoDelFormulario())).toEqual({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 },
    });
  });
});
