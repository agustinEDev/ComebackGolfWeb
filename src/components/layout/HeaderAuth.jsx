import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronDown, Globe } from 'lucide-react';
import { useLogout } from '../../hooks/useLogout';
import { resolveScreen } from './screenTitles';
import { useGoBack } from '../../hooks/useGoBack';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { Wordmark } from '../ui/BrandMark';
import InsigniaDeNovedades from '../feed/InsigniaDeNovedades';
import { useNovedadesDeActividad } from '../../hooks/useNovedadesDeActividad';

// Los destinos de la navegacion de escritorio. Se pintan dos veces —en linea
// desde xl y dentro del desplegable del avatar por debajo—, asi que viven en
// un solo sitio
const ID_DESCRIPCION_NOVEDADES = 'cabecera-novedades';

const NAVEGACION = [
  { to: '/dashboard', clave: 'header.dashboard' },
  { to: '/browse-competitions', clave: 'header.browseCompetitions' },
  { to: '/competitions', clave: 'header.myCompetitions' },
  { to: '/competitions/create', clave: 'header.createCompetition' },
  { to: '/player/invitations', clave: 'header.myInvitations' },
  // El feed solo se alcanzaba desde la navegacion inferior, que es md:hidden:
  // en escritorio no habia forma de llegar salvo tecleando la URL. Amigos ya no
  // va aqui suelto porque se entra desde dentro del propio feed, igual que en movil
  { to: '/feed', clave: 'header.feed' },
];

/**
 * @param {string} [title] - Sustituye al titulo del mapa de rutas. Para
 *   pantallas cuyo nombre solo se conoce en ejecucion (el de un torneo).
 * @param {string|null} [backTo] - Sustituye al destino de la flecha. `null`
 *   explicito la retira.
 * @param {Function} [alVolver] - La flecha hace esto en vez de ir a `backTo`:
 *   el detalle de un torneo al que se llegó desde Torneos vuelve atrás de
 *   verdad, para que Torneos quede donde estaba (FE #647, fase 3).
 * @param {boolean} [marca] - En el móvil, la cabecera no pinta título: la
 *   pantalla pone el suyo (Inicio, con su saludo). El logo va siempre.
 * @param {boolean} [tituloEnLaPagina] - En el móvil, la cabecera conserva la
 *   flecha de volver pero no pinta el título: el `<h1>` es de la página.
 * @param {import('react').ReactNode} [acciones] - Lo que va a la derecha de la
 *   cabecera: el conmutador de tema en Inicio, el «+» en Torneos.
 */
const HeaderAuth = ({
  user,
  title,
  backTo,
  alVolver,
  marca = false,
  tituloEnLaPagina = false,
  acciones,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef(null);
  const botonPerfilRef = useRef(null);
  const { logout } = useLogout();
  // Solo se lee: lo pide la barra inferior, montada también en escritorio
  const novedades = useNovedadesDeActividad();
  const insigniaDe = (to, className) =>
    to === '/feed' ? (
      <InsigniaDeNovedades n={novedades} className={className} />
    ) : null;
  // El número es solo visual: a los lectores de pantalla se lo cuenta esta
  // descripción, sin cambiarle el nombre al enlace (como en la barra inferior)
  const descripcionDe = (to) =>
    to === '/feed' && novedades > 0 ? ID_DESCRIPCION_NOVEDADES : undefined;

  // En movil la barra lleva el logo y como volver, y el titulo de la pantalla
  // va debajo. FE #310 quitaba la marca de las pantallas interiores; con la
  // identidad Comeback Golf, Agustin la quiere en todas
  const screen = resolveScreen(location.pathname);
  const nombreDeLaPantalla = marca
    ? null
    : (title ?? (screen ? t(screen.titleKey) : null));
  // Con `tituloEnLaPagina` la pantalla sigue teniendo nombre —y flecha de
  // volver—, pero su `<h1>` lo pinta la página (la ficha de un torneo, sobre
  // su portada)
  const screenTitle = tituloEnLaPagina ? null : nombreDeLaPantalla;
  const screenBackTo = backTo !== undefined ? backTo : (screen?.backTo ?? null);

  // Pantallas sin padre unico vuelven por donde se vino. En escritorio la
  // vuelta la pone la propia pagina, junto al contenido, como hace el detalle
  // de un torneo: una flecha suelta en la cabecera desentona
  const backByHistory = backTo === undefined && !!screen?.backByHistory;
  const goBack = useGoBack();

  const backArrowClasses =
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-tinta transition-colors active:bg-tarjeta';

  const handleProfileClick = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  // La salida es una sola y vive en `useLogout` (FE #531): esta hacia su
  // peticion y redirigia, sin limpiar nada, y lo mismo la del perfil
  const handleLogout = () => logout({ recargarEn: '/' });

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside, or on Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!desktopDropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      // Con el foco dentro, al desaparecer el desplegable caeria al body: se
      // devuelve al avatar para que quien va con teclado no pierda el sitio
      if (desktopDropdownRef.current?.contains(document.activeElement)) {
        botonPerfilRef.current?.focus();
      }
      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return '?';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-linea bg-fondo text-tinta px-4 md:px-10 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] overflow-visible">
        {/* Móvil: el logo en la barra de TODAS las pantallas, con la flecha de
          volver delante si la pantalla tiene padre, y la acción a la derecha. El
          título ya no va aquí: baja a la página, bajo la barra (Agustín, 25 nov
          2026: «bajamos el título y ponemos el logo en la cabecera») */}
        <div
          data-testid="cabecera-movil"
          className="md:hidden flex min-w-0 flex-1 items-center justify-between gap-2"
        >
          <div className="flex min-w-0 items-center">
            {nombreDeLaPantalla && screenBackTo && alVolver && (
              <button
                type="button"
                onClick={alVolver}
                aria-label={t('back')}
                className={`-ml-2 ${backArrowClasses}`}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {nombreDeLaPantalla && screenBackTo && !alVolver && (
              <Link
                to={screenBackTo}
                aria-label={t('back')}
                className={`-ml-2 ${backArrowClasses}`}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            {/* Excluyente con la de arriba a proposito: hoy ninguna pantalla
              declara `parent` y `back: 'history'` a la vez, pero el mapa esta
              hecho para crecer y la primera que declarase ambos pintaria dos
              flechas seguidas */}
            {nombreDeLaPantalla && !screenBackTo && backByHistory && (
              <button
                type="button"
                onClick={goBack}
                aria-label={t('back')}
                className={`-ml-2 ${backArrowClasses}`}
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <Link
              to="/dashboard"
              className="flex min-w-0 items-center transition-opacity hover:opacity-80"
            >
              {/* En una línea y a 50 px: Agustín lo eligió entre 38, 44, 50 y 56
                viéndolos en el móvil. En pantallas de menos de 360 px, a 42,
                para que quepa con la flecha y la acción */}
              <Wordmark
                forma="linea"
                className="h-[42px] w-auto min-[360px]:h-[50px]"
                title={t('brandMarkAlt')}
              />
            </Link>
          </div>
          {acciones}
        </div>

        {/* Escritorio: el nombre en una línea, sin el monograma: la fila lleva el
          menú, y con el monograma no cabía a 1280 px. Sin `shrink-0`: en el
          caso más cargado (administrador, con avisos y una acción en la
          cabecera) el logo se encoge un poco en vez de desplazar la página */}
        <Link
          to="/dashboard"
          data-testid="marca-en-ancho"
          className="hidden min-w-0 md:flex items-center transition-opacity hover:opacity-80"
        >
          <Wordmark
            forma="linea"
            className="h-9 w-auto"
            title={t('brandMarkAlt')}
          />
        </Link>

        {novedades > 0 && (
          <span id={ID_DESCRIPCION_NOVEDADES} hidden>
            {t('bottomNav.unseen', { count: novedades })}
          </span>
        )}

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-end gap-6 ml-6">
          {/* En linea solo desde xl: con todo junto la cabecera pide ~1160 px en
            español (medido con el nombre en una línea, 25 nov 2026), y por
            debajo la pagina se desplazaba en horizontal (FE #680). Por debajo,
            los mismos enlaces van al desplegable del avatar */}
          <div
            data-testid="navegacion-en-linea"
            className="hidden xl:flex items-center gap-6"
          >
            {NAVEGACION.map(({ to, clave }) => (
              <Link
                key={to}
                to={to}
                aria-describedby={descripcionDe(to)}
                className="inline-flex items-center gap-1.5 text-tinta text-sm font-medium leading-normal hover:underline transition-colors"
              >
                {t(clave)}
                {insigniaDe(to)}
              </Link>
            ))}
          </div>

          {/* El idioma vuelve a la barra como un globo de solo icono, que cabe
            entre md y xl (Agustín, 20 oct). La fila del desplegable se queda */}
          <div className="flex items-center gap-3">
            {acciones}
            <LanguageSwitcher compacto />

            {/* Desktop Profile Dropdown */}
            <div className="relative" ref={desktopDropdownRef}>
              <button
                ref={botonPerfilRef}
                onClick={toggleDropdown}
                aria-expanded={isDropdownOpen}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user?.is_admin && (
                  <span
                    data-testid="admin-badge"
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border border-linea text-tinta"
                  >
                    {t('header.adminBadge')}
                  </span>
                )}
                <div className="bg-contraste bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 md:h-10 md:w-10 flex items-center justify-center text-sobre-contraste font-bold text-sm md:text-base">
                  {getInitials()}
                </div>
                {/* Por debajo de xl los enlaces viven aqui dentro: tiene que notarse
                  que el avatar se abre (FE #680) */}
                <ChevronDown
                  data-testid="indicador-desplegable"
                  aria-hidden="true"
                  className={`-ml-1 h-4 w-4 text-tinta-suave transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Desktop Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-tarjeta rounded-2xl border border-linea py-1 z-50">
                  <div
                    data-testid="navegacion-en-desplegable"
                    className="xl:hidden"
                  >
                    {NAVEGACION.map(({ to, clave }) => (
                      <Link
                        key={to}
                        to={to}
                        aria-describedby={descripcionDe(to)}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-tinta hover:bg-fondo transition-colors"
                      >
                        {t(clave)}
                        {insigniaDe(to)}
                      </Link>
                    ))}
                    <div className="border-t border-linea my-1" />
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="block w-full text-left px-4 py-2 text-sm text-tinta hover:bg-fondo transition-colors"
                  >
                    {t('header.viewProfile')}
                  </button>
                  {/* El idioma tambien aqui, con su nombre: es un ajuste de la cuenta
                    (FE #680). Desde el 20 oct (Agustín) esta ademas en la barra,
                    como globo de solo icono; esta fila se queda */}
                  <div
                    data-testid="idioma-en-desplegable"
                    className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-tinta"
                  >
                    <span className="flex items-center gap-2">
                      <Globe
                        className="h-4 w-4 text-tinta-suave"
                        aria-hidden="true"
                      />
                      {t('header.language')}
                    </span>
                    <LanguageSwitcher />
                  </div>
                  {user?.is_admin && (
                    <>
                      <div className="border-t border-linea my-1" />
                      <p className="px-4 py-1 text-xs font-semibold text-tinta-suave uppercase tracking-wider">
                        {t('header.administration')}
                      </p>
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-tinta hover:bg-fondo transition-colors"
                      >
                        {t('header.adminPanel')}
                      </Link>
                    </>
                  )}
                  <div className="border-t border-linea my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-fondo transition-colors"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* En móvil no hay menú: la navegación vive en <BottomNav /> (FE #306).
          Idioma, panel Admin y cierre de sesión están en /profile. */}
      </header>
      {/* El título de la pantalla, en móvil: bajo la barra y ya dentro de la
          página, en grande. Lo pinta la cabecera, no cada página, para que sea
          el único <h1> y todas las pantallas queden iguales. Sin fondo propio:
          toma el de la página */}
      {screenTitle && (
        <div
          className={`md:hidden pt-5 ${screen?.contenedorAncho ? 'px-8' : 'px-4'}`}
        >
          <h1
            data-testid="titulo-de-pantalla"
            className="line-clamp-3 wrap-anywhere text-[1.75rem] font-extrabold leading-tight tracking-tight text-tinta"
          >
            {screenTitle}
          </h1>
        </div>
      )}
    </>
  );
};

export default HeaderAuth;
