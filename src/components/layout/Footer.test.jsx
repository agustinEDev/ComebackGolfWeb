import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Footer from './Footer';
import commonEs from '../../i18n/locales/es/common.json';
import commonEn from '../../i18n/locales/en/common.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

/**
 * El pie de marketing delata la aplicacion instalada como un sitio web: ninguna
 * aplicacion nativa termina cada pantalla con redes sociales y copyright
 * (FE #309).
 */
describe('Footer', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', {
      value: undefined,
      configurable: true,
    });
  });

  it('renders in a browser tab', () => {
    mockMatchMedia(false);

    renderFooter();

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
  });

  it('disappears when the app runs installed', () => {
    mockMatchMedia(true);

    const { container } = renderFooter();

    expect(container).toBeEmptyDOMElement();
  });

  it('disappears when installed on iOS', () => {
    // iOS no implementa display-mode de forma fiable
    mockMatchMedia(false);
    // Con el userAgent: `navigator.standalone` solo existe en iOS, y la
    // deteccion se apoya en el para no fiarse de `display-mode` en los
    // navegadores de alli basados en WebView
    Object.defineProperty(window.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'standalone', {
      value: true,
      configurable: true,
    });

    const { container } = renderFooter();

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the legal links reachable in a browser tab', () => {
    // Instalada no se pintan: su unico acceso pasa a ser Perfil
    mockMatchMedia(false);

    renderFooter();

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining(['/terms', '/privacy', '/cookies']),
    );
  });

  it('A3: enlaza al Aviso Legal junto a los demas legales', () => {
    mockMatchMedia(false);

    renderFooter();

    expect(
      screen.getByRole('link', { name: 'footer.legalNotice' }),
    ).toHaveAttribute('href', '/legal');
  });

  it.each([
    ['es', commonEs],
    ['en', commonEn],
  ])(
    'A4 (%s): el copyright dice Comeback Golf, sin datos del titular (6 nov 2026)',
    (_idioma, common) => {
      for (const clave of ['copyright', 'copyrightShort']) {
        expect(common.footer[clave]).toContain('© {{year}} Comeback Golf');
        expect(common.footer[clave]).not.toContain('Estévez');
        expect(common.footer[clave]).not.toContain('RCF');
      }
      expect(common.footer.legalNotice).toBeTruthy();
    },
  );

  /**
   * Las redes (Agustín, 27 nov 2026): Instagram y TikTok de @comebackgolf. X,
   * Facebook y LinkedIn fuera hasta que existan las cuentas: un enlace a una
   * cuenta que no existe da mala imagen y deja el nombre a quien lo coja.
   */
  it('R1: enlaza Instagram y TikTok de @comebackgolf, y ninguna otra red', () => {
    mockMatchMedia(false);
    renderFooter();
    const redes = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('target') === '_blank');
    expect(
      redes.map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')]),
    ).toEqual([
      ['Instagram', 'https://www.instagram.com/comebackgolf'],
      ['TikTok', 'https://www.tiktok.com/@comebackgolf'],
    ]);
    for (const a of redes) {
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    // Ningún enlace del pie, abra pestaña o no, a las redes que aún no existen
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('href') ?? '').not.toMatch(
        /twitter\.com|\bx\.com|facebook\.com|linkedin\.com/,
      );
    }
  });
});
