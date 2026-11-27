import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ConmutadorDeTema from '../ui/ConmutadorDeTema';
import MarcaDeCabecera from './MarcaDeCabecera';
import { AL_PULSAR_ENLACE, PRINCIPAL, SECUNDARIO } from '../ui/clasesDeBoton';

/**
 * La cabecera de las páginas públicas.
 *
 * @param {boolean} soloMonograma - la página ya enseña el nombre de la marca en
 *   grande (la portada, en su título): aquí queda el monograma solo. Lo pide la
 *   página, que es quien sabe qué pinta; la cabecera no lo deduce de la ruta
 */
const Header = ({ soloMonograma = false }) => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-4 md:px-10 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] overflow-visible">
      {/* La marca de la cabecera. En la portada no enlaza: ya se está en ella */}
      {isLandingPage ? (
        <div className="flex items-center" data-testid="header-logo-static">
          <MarcaDeCabecera
            titulo={t('brandMarkAlt')}
            soloMonograma={soloMonograma}
          />
        </div>
      ) : (
        <Link
          to="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <MarcaDeCabecera
            titulo={t('brandMarkAlt')}
            soloMonograma={soloMonograma}
          />
        </Link>
      )}

      {/* Desktop Menu — desde lg y no desde md: completa pide unos 1000 px en
          español con el monograma y el nombre en una línea (928 con el logo de
          antes), y entre medias la página se desplazaba en horizontal (FE #689) */}
      <div
        data-testid="cabecera-completa"
        className="hidden lg:flex flex-1 justify-end gap-8 ml-6"
      >
        <div className="flex items-center gap-9">
          <a
            className="text-gray-900 text-sm font-medium leading-normal"
            href="/#features"
          >
            {t('header.features')}
          </a>
          <Link
            className="text-gray-900 text-sm font-medium leading-normal"
            to="/pricing"
          >
            {t('header.pricing')}
          </Link>
          <Link
            className="text-gray-900 text-sm font-medium leading-normal"
            to="/contact"
          >
            {t('header.support')}
          </Link>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* El tema también se elige sin sesión (Agustín, 24 nov 2026) */}
        <ConmutadorDeTema />

        <div className="flex gap-2">
          <Link
            to="/register"
            className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden h-10 px-4 text-sm leading-normal tracking-wide ${PRINCIPAL} ${AL_PULSAR_ENLACE}`}
          >
            <span className="truncate">{t('header.register')}</span>
          </Link>
          <Link
            to="/login"
            className={`flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden h-10 px-4 text-sm leading-normal tracking-wide ${SECUNDARIO} ${AL_PULSAR_ENLACE}`}
          >
            <span className="truncate">{t('header.signIn')}</span>
          </Link>
        </div>
      </div>

      {/* Mobile: the two actions the site exists for stay visible (#314). Hasta lg,
          con el menú de al lado (FE #689) */}
      <div
        data-testid="acciones-compactas"
        className="lg:hidden flex items-center gap-2 ml-auto mr-2"
      >
        <Link
          to="/register"
          className={`flex items-center justify-center h-10 px-3 text-sm tracking-wide ${PRINCIPAL} ${AL_PULSAR_ENLACE}`}
        >
          {t('header.register')}
        </Link>
        <Link
          to="/login"
          className={`flex items-center justify-center h-10 px-3 text-sm tracking-wide ${SECUNDARIO} ${AL_PULSAR_ENLACE}`}
        >
          {t('header.signInShort')}
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={toggleMobileMenu}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={t('header.toggleMenu')}
        >
          <svg
            className="w-6 h-6 text-gray-900"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            data-testid="mobile-menu"
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            <a
              href="/#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t('header.features')}
            </a>
            <Link
              to="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t('header.pricing')}
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t('header.support')}
            </Link>
            <div className="border-t border-gray-200 my-2"></div>

            {/* Language Switcher - Mobile */}
            {/* En el móvil el conmutador va en el menú: en la barra, con las
                dos acciones y el menú, no cabe a 360 px */}
            <div className="flex items-center justify-between gap-3 px-4 py-2">
              <LanguageSwitcher />
              <ConmutadorDeTema />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
