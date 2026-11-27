import { AL_PASAR } from './clasesDeComportamiento';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTema } from '../../hooks/useTema';

/**
 * El conmutador de tema: sol en claro, luna en oscuro. Por defecto la
 * aplicación sigue al sistema; al pulsarlo se elige uno y se recuerda.
 *
 * El nombre dice lo que HARÁ («Cambiar a oscuro»), no el estado: un lector de
 * pantalla anuncia la acción del botón.
 */
const ConmutadorDeTema = ({ className = '' }) => {
  const { t } = useTranslation('common');
  const { tema, alternar } = useTema();
  const oscuro = tema === 'oscuro';
  const Icono = oscuro ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={t(oscuro ? 'theme.switchToLight' : 'theme.switchToDark')}
      data-testid="conmutador-de-tema"
      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-borde text-tinta ${AL_PASAR} ${className}`}
    >
      <Icono className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};

export default ConmutadorDeTema;
