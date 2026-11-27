import { COLOR_DE_LO_ELEGIDO } from '../../ui/clasesDeComportamiento';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../../domain/entities/Competition';
import { PlayModeType } from '../../../domain/value_objects/HandicapSettings';

/**
 * El formato, a la vista: cuántos sois y si se juega con hándicap son las dos
 * preguntas que el organizador SÍ contesta (Agustín, 19 sep).
 */
const FormatoDeLaCompeticion = ({
  playMode,
  onElegirModo,
  numberOfPlayers,
  onChange,
  onBlurDelCupo,
  inscritos,
}) => {
  const { t } = useTranslation('competitions');
  return (
    <div className="rounded-tarjeta border border-contorno bg-tarjeta p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-fondo flex items-center justify-center">
          <Settings className="w-4 h-4 text-tinta" />
        </div>
        <h3 className="text-tinta font-bold text-base">
          {t('create.settingsTitle')}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Play Mode */}
        <div>
          <span className="block text-sm font-medium text-tinta mb-2">
            {t('create.playMode')}
          </span>
          <div className="flex flex-wrap gap-2">
            {[PlayModeType.HANDICAP, PlayModeType.SCRATCH].map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={playMode === mode}
                onClick={() => onElegirModo(mode)}
                className={`border-2 rounded-lg text-sm px-3 py-2 transition-colors ${
                  playMode === mode
                    ? COLOR_DE_LO_ELEGIDO
                    : 'bg-fondo text-tinta-suave border-linea hover:border-tinta hover:text-tinta'
                }`}
              >
                {t(`create.${mode.toLowerCase()}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Players */}
        <div>
          <label
            htmlFor="numberOfPlayers"
            className="block text-sm font-medium text-tinta mb-1"
          >
            {t('create.numberOfPlayers')}
          </label>
          <input
            id="numberOfPlayers"
            data-testid="campo-jugadores"
            type="number"
            name="numberOfPlayers"
            value={numberOfPlayers === undefined ? '' : numberOfPlayers}
            onChange={onChange}
            onBlur={onBlurDelCupo}
            min={Math.max(MIN_PLAYERS, inscritos)}
            max={MAX_PLAYERS}
            aria-describedby={inscritos > 0 ? 'cupo-minimo' : undefined}
            placeholder={t('create.numberOfPlayersPlaceholder')}
            className="w-full bg-fondo px-3 py-2 border border-linea rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
          />
          {/* Por qué no baja de ahí (FE #662): sin decirlo, el número
          se rechazaba sin motivo */}
          {inscritos > 0 && (
            <p
              id="cupo-minimo"
              data-testid="cupo-minimo"
              className="mt-1 text-xs text-tinta-suave"
            >
              {t('create.capFloor', { count: inscritos })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatoDeLaCompeticion;
