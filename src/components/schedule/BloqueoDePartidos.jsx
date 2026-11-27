import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TeeColorBadge from '../golf_course/TeeColorBadge';
import { motivoConocido, claveDeLaFalta } from '../../utils/textoDelBloqueo';

/**
 * Por qué una sesión con los sobres abiertos se quedó sin partidos (BE #361).
 *
 * Los partidos se crean al abrirse los sobres, sin nadie mirando. Cuando no
 * pueden crearse, lo útil es decir A QUIÉN le falta QUÉ: con doce jugadores,
 * «no se ha podido» deja al organizador sin saber a quién arreglar.
 *
 * @param {Object} props
 * @param {{reason: string, players: Array}|null} props.bloqueo
 * @param {boolean} [props.puedeReintentar=false] - Si quien mira tiene el botón
 *   de «Generar Partidos». A un jugador, mandarle a pulsarlo era un texto cierto
 *   solo para el organizador
 * @param {{current: ?HTMLElement}} [props.ref] - El recuadro, para quien lo
 *   lleve a la vista (el modal de generar)
 */
const BloqueoDePartidos = ({ bloqueo, puedeReintentar = false, ref }) => {
  const { t } = useTranslation('schedule');
  if (!bloqueo) return null;

  const motivo = motivoConocido(bloqueo.reason);
  const jugadores = bloqueo.players || [];

  return (
    <div
      ref={ref}
      data-testid="bloqueo-de-partidos"
      role="alert"
      className="rounded-lg border border-aviso bg-aviso-suave p-3 text-sm text-aviso"
    >
      <p className="flex items-start gap-2 font-semibold">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t('generationBlock.title')}</span>
      </p>
      {jugadores.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {jugadores.map((jugador) => (
            <li
              key={jugador.userId}
              data-testid={`falta-${jugador.userId}`}
              className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1"
            >
              <span className="font-medium">{jugador.name}</span>
              <span>
                {t(`generationBlock.missing.${claveDeLaFalta(jugador)}`)}
              </span>
              {jugador.teeColor && <TeeColorBadge color={jugador.teeColor} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1">{t(`generationBlock.reason.${motivo}`)}</p>
      )}
      {puedeReintentar && (
        <p className="mt-2 text-xs text-aviso">{t('generationBlock.retry')}</p>
      )}
    </div>
  );
};

export default BloqueoDePartidos;
