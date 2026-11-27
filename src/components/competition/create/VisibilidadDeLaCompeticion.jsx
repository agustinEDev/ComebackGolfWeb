import { COLOR_DE_LO_ELEGIDO } from '../../ui/clasesDeComportamiento';
import { useTranslation } from 'react-i18next';
import { Visibility } from '../../../domain/value_objects/Visibility';

/**
 * Privada o pública, arriba y pequeño: de quién es el torneo se decide al
 * montarlo, no en «Más opciones». Privada por defecto, que es lo que hay hoy y
 * lo que no enseña nada a nadie por error (FE #664).
 */
const VisibilidadDeLaCompeticion = ({ visibility, onElegir }) => {
  const { t } = useTranslation('competitions');
  return (
    <div>
      <span
        id="etiqueta-visibilidad"
        className="block text-sm font-medium text-tinta mb-2"
      >
        {t('create.visibility')}
      </span>
      {/* Los dos botones van juntos y con su pregunta: sueltos, un
      lector de pantalla dice «Solo invitados, pulsado» sin
      decir a qué pregunta responde */}
      <div
        role="group"
        aria-labelledby="etiqueta-visibilidad"
        className="flex flex-wrap gap-2"
      >
        {[Visibility.PRIVATE, Visibility.PUBLIC].map((cual) => (
          <button
            key={cual}
            type="button"
            data-testid={`visibilidad-${cual}`}
            aria-pressed={visibility === cual}
            onClick={() => onElegir(cual)}
            className={`border-2 rounded-lg text-sm px-3 py-2 transition-colors ${
              visibility === cual
                ? COLOR_DE_LO_ELEGIDO
                : 'bg-fondo text-tinta-suave border-linea hover:border-tinta hover:text-tinta'
            }`}
          >
            {t(
              `create.visibility${cual === Visibility.PRIVATE ? 'Private' : 'Public'}`,
            )}
          </button>
        ))}
      </div>
      {/* «Privada» a secas no dice si la gente puede apuntarse sola */}
      <p
        data-testid="visibilidad-explicacion"
        className="text-xs text-tinta-suave mt-1"
      >
        {t(
          visibility === Visibility.PUBLIC
            ? 'create.visibilityPublicHelp'
            : 'create.visibilityPrivateHelp',
        )}
      </p>
    </div>
  );
};

export default VisibilidadDeLaCompeticion;
