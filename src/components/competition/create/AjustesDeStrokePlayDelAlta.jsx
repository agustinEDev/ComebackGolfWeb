import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StrokePlaySettings from '../StrokePlaySettings';
import { diasDelTorneo } from '../../../utils/ajustesDeStrokePlay';

/**
 * Los ajustes de un Stableford o un Medal, a la vista: las categorías y las
 * jornadas sí se deciden al crear (FE #824).
 */
const AjustesDeStrokePlayDelAlta = ({ formData, onCambio }) => {
  const { t } = useTranslation('competitions');
  return (
    <div
      data-testid="ajustes-stroke-play"
      className="rounded-tarjeta border border-contorno bg-tarjeta p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-fondo flex items-center justify-center">
          <Settings className="w-4 h-4 text-tinta" />
        </div>
        <h3 className="text-tinta font-bold text-base">
          {t('create.strokePlay.title', {
            tipo: t(`create.type.${formData.tournamentType}.title`),
          })}
        </h3>
      </div>
      <StrokePlaySettings
        valor={formData.strokePlay}
        onCambio={onCambio}
        tipo={formData.tournamentType}
        dias={diasDelTorneo(formData.startDate, formData.endDate)}
      />
    </div>
  );
};

export default AjustesDeStrokePlayDelAlta;
