import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import BottomNav from './BottomNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

// La barra no consulta la sesión (/auth/current-user): antes lo hacía su
// lanzador de partida rápida, al pulsar el botón central
const useAuthMock = vi.fn(() => ({ user: null, loading: true }));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

// El número del botón de Actividad: lo vigila la barra y lo lee de la pieza
// compartida (FE-1)
let novedades = 0;
const vigilar = vi.fn();
vi.mock('../../hooks/useNovedadesDeActividad', () => ({
  useNovedadesDeActividad: () => novedades,
  useVigilanciaDeNovedades: () => vigilar(),
  olvidaLasNovedades: () => {},
}));

const renderNav = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  );

const hrefOf = (label) =>
  screen.getByRole('link', { name: label }).getAttribute('href');

/**
 * Navegación inferior en móvil (FE #306).
 */
describe('BottomNav', () => {
  it('links the four navigation tabs to their pages', () => {
    renderNav();

    expect(hrefOf('bottomNav.home')).toBe('/dashboard');
    expect(hrefOf('bottomNav.tournaments')).toBe('/competitions');
    expect(hrefOf('bottomNav.feed')).toBe('/feed');
    expect(hrefOf('bottomNav.profile')).toBe('/profile');
  });

  it('keeps the feed tab active while browsing friends', () => {
    // Amigos ya no tiene posición propia: vive dentro del feed, así que su
    // pestaña debe seguir marcada al navegar a la lista de amigos.
    renderNav('/friends');

    expect(
      screen.getByRole('link', { name: 'bottomNav.feed' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks the current section as the active page', () => {
    renderNav('/competitions/abc-123');

    expect(
      screen.getByRole('link', { name: 'bottomNav.tournaments' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'bottomNav.home' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('keeps the profile tab active on its subpages', () => {
    renderNav('/profile/edit');

    expect(
      screen.getByRole('link', { name: 'bottomNav.profile' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('hides itself on desktop and clears the home indicator', () => {
    renderNav();

    const nav = screen.getByTestId('bottom-nav');
    expect(nav.className).toContain('md:hidden');
    expect(nav.className).toContain('env(safe-area-inset-bottom)');
  });

  // Con la marca ComeBack Golf (24 nov 2026) la barra solo navega: el botón
  // redondo de «Partida» que había en el centro se quitó, y la partida rápida
  // se lanza desde el botón principal de Inicio
  it('has four destinations and no action button', () => {
    renderNav();

    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('bottomNav.quickMatch')).not.toBeInTheDocument();
  });

  it('never asks who the user is: it has nothing to launch', () => {
    renderNav();

    expect(useAuthMock).not.toHaveBeenCalled();
  });

  it('marks the active destination with more than colour: bold and a lime bar', () => {
    renderNav('/competitions');

    const activa = screen.getByRole('link', { name: 'bottomNav.tournaments' });
    expect(activa).toHaveAttribute('aria-current', 'page');
    expect(
      activa.querySelector('[data-testid="indicador-activo"]'),
    ).toHaveClass('bg-lime');
    expect(screen.getAllByTestId('indicador-activo')).toHaveLength(1);
  });

  it('is 4rem tall, the height the rest of the app reserves for it', () => {
    renderNav();

    // 4rem con el borde de arriba dentro: con `h-16` más el borde eran 65 px
    // y la barra tapaba el último píxel de la página
    const nav = screen.getByTestId('bottom-nav');
    expect(nav.className.split(' ')).toContain('border-t');
    expect(nav.lastElementChild).toHaveClass('h-[calc(4rem-1px)]');
  });

  describe('the unseen number on Actividad (FE-1, case 1)', () => {
    afterEach(() => {
      novedades = 0;
    });

    const insignia = () => screen.queryByTestId('insignia-novedades');

    it('shows nothing at zero', () => {
      novedades = 0;
      renderNav();

      expect(insignia()).not.toBeInTheDocument();
    });

    it.each([
      [1, '1'],
      [9, '9'],
      [10, '9+'],
    ])('shows %s as %s on the Actividad button', (n, texto) => {
      novedades = n;
      renderNav();

      const enlace = screen.getByRole('link', { name: 'bottomNav.feed' });
      expect(enlace).toContainElement(insignia());
      expect(insignia()).toHaveTextContent(texto);
    });

    it('keeps the link name and describes the number for screen readers', () => {
      novedades = 3;
      renderNav();

      const enlace = screen.getByRole('link', { name: 'bottomNav.feed' });
      expect(enlace).toHaveAccessibleDescription('bottomNav.unseen');
    });

    it('watches the number while the bar is up (case 3)', () => {
      renderNav();

      expect(vigilar).toHaveBeenCalled();
    });
  });
});
