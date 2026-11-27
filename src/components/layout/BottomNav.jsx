import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Home, Trophy, Sparkles, User } from 'lucide-react';
import {
  useNovedadesDeActividad,
  useVigilanciaDeNovedades,
} from '../../hooks/useNovedadesDeActividad';
import InsigniaDeNovedades from '../feed/InsigniaDeNovedades';

const ID_DESCRIPCION_NOVEDADES = 'bottom-nav-novedades';

// La activa, en negrita y con una barra lima debajo (ComeBack Golf): el color
// no es lo único que la distingue, y la lima se queda en un indicador pequeño
const NavItem = ({ to, icon: Icon, label, isActive, novedades = 0 }) => (
  <Link
    to={to}
    aria-current={isActive ? 'page' : undefined}
    aria-describedby={novedades > 0 ? ID_DESCRIPCION_NOVEDADES : undefined}
    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-2 transition-colors ${
      isActive ? 'text-tinta' : 'text-tinta-suave active:text-tinta'
    }`}
  >
    <span className="relative">
      <Icon
        className="h-5 w-5"
        strokeWidth={isActive ? 2.4 : 1.8}
        aria-hidden="true"
      />
      <InsigniaDeNovedades
        n={novedades}
        className="absolute -top-1.5 left-1/2 ml-1.5"
      />
    </span>
    <span
      className={`text-[11px] leading-none ${isActive ? 'font-extrabold' : 'font-medium'}`}
    >
      {label}
    </span>
    <span
      aria-hidden="true"
      data-testid={isActive ? 'indicador-activo' : undefined}
      className={`h-[3px] w-6 rounded-full ${isActive ? 'bg-lime' : 'bg-transparent'}`}
    />
  </Link>
);

/**
 * Navegación inferior para móvil (FE #306).
 *
 * Inicio · Torneos · Actividad · Perfil. Cuatro destinos y ninguna acción: el
 * botón redondo de «Partida» que había en el centro se quitó con la marca
 * ComeBack Golf (Agustín, 24 nov 2026). La partida rápida se lanza desde el
 * botón principal de Inicio, y una barra de navegación solo navega.
 *
 * Solo visible por debajo de `md`; en escritorio manda el menú de HeaderAuth.
 * Mide 4rem —borde incluido— más el área segura: ver `utils/barraInferior`.
 */
const BottomNav = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  // El número de Actividad se pide desde aquí: la barra está montada en toda
  // pantalla con sesión (en escritorio, oculta por CSS) y fuera de la
  // anotación, que es justo cuando tiene sentido preguntarlo (FE-1)
  useVigilanciaDeNovedades();
  const novedades = useNovedadesDeActividad();

  return (
    <nav
      data-testid="bottom-nav"
      aria-label={t('bottomNav.label')}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-linea bg-fondo pb-[env(safe-area-inset-bottom)]"
    >
      {/* Fuera del enlace para no cambiarle el nombre: lo cuenta como
          descripción. `hidden` evita que se lea dos veces */}
      {novedades > 0 && (
        <span id={ID_DESCRIPCION_NOVEDADES} hidden>
          {t('bottomNav.unseen', { count: novedades })}
        </span>
      )}
      {/* 4rem con el borde de arriba dentro: es la altura que reserva el
          resto de la aplicación (utils/barraInferior) */}
      <div className="grid h-[calc(4rem-1px)] grid-cols-4 items-stretch">
        <NavItem
          to="/dashboard"
          icon={Home}
          label={t('bottomNav.home')}
          isActive={isActive('/dashboard')}
        />
        <NavItem
          to="/competitions"
          icon={Trophy}
          label={t('bottomNav.tournaments')}
          isActive={isActive('/competitions')}
        />
        {/* La lista de amigos queda a un toque, dentro de Actividad, que es
            donde uno acaba mirando a sus amigos de todos modos */}
        <NavItem
          to="/feed"
          icon={Sparkles}
          label={t('bottomNav.feed')}
          isActive={isActive('/feed') || isActive('/friends')}
          novedades={novedades}
        />
        <NavItem
          to="/profile"
          icon={User}
          label={t('bottomNav.profile')}
          isActive={isActive('/profile')}
        />
      </div>
    </nav>
  );
};

export default BottomNav;
