import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useStandalone } from '../../hooks/useStandalone';
import BrandMark from '../ui/BrandMark';

const REDES = [
  {
    nombre: 'Instagram',
    href: 'https://www.instagram.com/comebackgolf',
    icono:
      'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    nombre: 'TikTok',
    href: 'https://www.tiktok.com/@comebackgolf',
    icono:
      'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
];

const Footer = () => {
  const { t } = useTranslation('common');
  const isStandalone = useStandalone();

  // Instalada, la aplicacion no debe terminar cada pantalla con enlaces de
  // marketing y redes: eso la delata como sitio web (FE #309). Los legales
  // siguen alcanzables desde Perfil. El descarte vive aqui y no en cada pagina
  // porque son siete las que montan el pie.
  if (isStandalone) return null;

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {/* El stamp: el pie es uno de sus sitios. En la tinta del tema */}
              <BrandMark className="h-10 w-auto" tinta="tema" />
              <h3 className="text-gray-900 text-lg font-extrabold">
                Comeback Golf
              </h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>

            {/* Las redes de la marca (Agustín, 27 nov 2026). X, Facebook y
                LinkedIn, cuando existan sus cuentas: una línea más en REDES */}
            <div className="flex gap-4 mt-6">
              {REDES.map(({ nombre, href, icono }) => (
                <a
                  key={nombre}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary transition-all duration-200"
                  aria-label={nombre}
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d={icono} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 font-poppins">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/#features"
                  onClick={(e) => {
                    e.preventDefault();
                    globalThis.location.href = '/#features';
                  }}
                  className="text-gray-600 text-sm hover:text-primary transition-colors cursor-pointer"
                >
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.support')}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.getStarted')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4 font-poppins">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/legal"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.legalNotice')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.cookies')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 text-sm hover:text-primary transition-colors"
                >
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
