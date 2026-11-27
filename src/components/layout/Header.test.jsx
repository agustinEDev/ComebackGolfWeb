import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Header from './Header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../ui/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

const renderHeader = (ruta = '/', props = {}) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Header {...props} />
    </MemoryRouter>,
  );

/**
 * The two actions the site exists for must be reachable without opening the
 * hamburger menu on a phone (FE #314).
 */
describe('Header', () => {
  it('L3: en la portada el idioma sigue en la barra', () => {
    // Quien llega por primera vez no tiene un desplegable de cuenta donde
    // buscarlo; en la cabecera con sesión sí se movió ahí (FE #680)
    renderHeader();

    expect(screen.getAllByTestId('language-switcher').length).toBeGreaterThan(
      0,
    );
  });

  it('exposes sign in and register without opening the menu', () => {
    renderHeader();

    const loginLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/login');
    const registerLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/register');

    // one in the desktop block, one in the mobile header
    expect(loginLinks).toHaveLength(2);
    expect(registerLinks).toHaveLength(2);
    // Un enlace con aspecto de botón, sin un botón dentro: eran dos paradas del
    // tabulador por acción y HTML no válido (revisión, 26 nov 2026)
    for (const enlace of [...loginLinks, ...registerLinks]) {
      expect(enlace.querySelector('button')).toBeNull();
      expect(enlace.className).toContain('rounded-none');
    }
  });

  it('keeps the mobile menu for marketing links only', () => {
    renderHeader();

    fireEvent.click(screen.getByLabelText('header.toggleMenu'));

    const menu = screen.getByTestId('mobile-menu');
    const menuLinks = within(menu)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));

    expect(menuLinks).toContain('/pricing');
    expect(menuLinks).toContain('/contact');
    expect(menuLinks).not.toContain('/login');
    expect(menuLinks).not.toContain('/register');
  });

  // Por defecto va el wordmark, que ya es el nombre: no hay texto al lado. En
  // el móvil, el de dos líneas, pequeño (54 px de ancho, h-9): uno de una línea
  // no cabe junto a los dos botones y el menú. En ancho, el de una línea
  it.each(['/', '/pricing'])(
    'en %s, por defecto: el wordmark, pequeño en el móvil para que quepan los botones',
    (ruta) => {
      renderHeader(ruta);

      const [logo] = screen
        .getByTestId('nombre-en-movil')
        .querySelectorAll('img');
      expect(logo).toHaveAttribute('src', '/brand/wordmark-deep.svg');
      expect(logo).toHaveAttribute('alt', 'brandMarkAlt');
      expect(logo.className.split(' ')).toContain('h-9');
      expect(
        screen.getByTestId('nombre-en-ancho').querySelector('img'),
      ).toHaveAttribute('src', '/brand/wordmark-linea-deep.svg');
      expect(
        screen.queryByText(/RyderCup|Comeback Golf/),
      ).not.toBeInTheDocument();
    },
  );

  // La página que ya enseña el nombre en grande —la portada, en su título— pide
  // la cabecera con el monograma solo, para no repetir el logo en la pantalla
  // (Agustín, 25 nov 2026). Lo pide ella: la cabecera no lo deduce de la ruta
  it.each(['/', '/pricing'])(
    'en %s, con `soloMonograma`: el monograma, que lleva el nombre de la marca',
    (ruta) => {
      renderHeader(ruta, { soloMonograma: true });

      expect(screen.queryByTestId('nombre-en-movil')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nombre-en-ancho')).not.toBeInTheDocument();
      const [monograma] = screen
        .getByTestId('monograma-de-cabecera')
        .querySelectorAll('img');
      expect(monograma).toHaveAttribute('src', '/brand/stamp-deep.svg');
      expect(monograma).toHaveAttribute('alt', 'brandMarkAlt');
    },
  );

  /**
   * La versión completa necesita 928 px en español, y aparecía desde 768: entre
   * medias la página se desplazaba en horizontal (FE #689). El modo compacto
   * —marca, «Registrarse», «Entrar» y el menú— se mantiene hasta lg.
   */
  describe('el modo compacto llega hasta lg (FE #689)', () => {
    it('C1: la versión completa, solo desde lg', () => {
      // jsdom no mide anchos: se vigila el contrato de clases. Que de verdad
      // quepa se midió con Playwright en los anchos que importan
      renderHeader();

      expect(screen.getByTestId('cabecera-completa')).toHaveClass(
        'hidden',
        'lg:flex',
      );
    });

    it('C2: las dos acciones y el menú compactos, hasta lg', () => {
      renderHeader();

      expect(screen.getByTestId('acciones-compactas')).toHaveClass('lg:hidden');
      expect(
        screen.getByLabelText('header.toggleMenu').parentElement,
      ).toHaveClass('lg:hidden');
    });
  });
});
