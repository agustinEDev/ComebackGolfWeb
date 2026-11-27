import { useTranslation } from 'react-i18next';
import { Map as IconoMapa } from 'lucide-react';
import { AL_PASAR, AL_PULSAR } from '../../ui/clasesDeComportamiento';

/** «Mapa», entre «Anterior» y «Siguiente», fuera de la tarjeta del hoyo (16 oct): abre el mapa del hoyo (BE #532). */
const BotonMapa = ({ onAbrir }) => {
  const { t } = useTranslation('scoring');
  return (
    <button
      type="button"
      onClick={onAbrir}
      // Con fondo: va sobre la página, y sin él se veía la marca de agua a través
      className={`min-h-11 inline-flex shrink-0 items-center gap-1.5 rounded-boton border border-borde bg-fondo px-4 text-sm font-bold text-tinta ${AL_PASAR} ${AL_PULSAR}`}
    >
      <IconoMapa className="h-4 w-4" aria-hidden="true" />
      {t('mapa.abrir')}
    </button>
  );
};

export default BotonMapa;
