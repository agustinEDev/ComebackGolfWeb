import { loadErrorKeyFor } from '../../utils/textosDePartidaRapida';
import { noSeArreglaReintentando } from '../../utils/noSeArreglaReintentando';

/**
 * La partida rápida no llegó a cargar (`QuickMatchScoringPage`). Sin estado ni
 * efectos.
 *
 * La misma regla que en el resto de la pantalla: quedarse sin cobertura no es
 * un error, y aquí llegaba como «ha ocurrido un error», que suena a que algo
 * se ha roto.
 *
 * Una partida que ya no existe, o que no es tuya, no se reintenta
 * (`noSeArreglaReintentando`): se ofrece volver a la lista.
 */

const ErrorDeCargaRapida = ({
  t,
  sondeoSinRespuesta,
  loadError,
  refetch,
  alVolver,
}) => {
  const volver = noSeArreglaReintentando(loadError, sondeoSinRespuesta);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-center">
      <p
        className={sondeoSinRespuesta ? 'text-aviso' : 'text-error'}
        data-testid="quick-match-scoring-error"
      >
        {sondeoSinRespuesta
          ? t('scoring.offline.noSeActualiza')
          : t(loadErrorKeyFor(loadError))}
      </p>
      <button
        onClick={volver ? alVolver : refetch}
        className="mt-4 px-4 py-2 bg-contraste text-sobre-contraste transition-opacity hover:opacity-90 rounded-boton"
      >
        {volver ? t('scoring.backToMyQuickMatches') : t('scoring.retry')}
      </button>
    </div>
  );
};

export default ErrorDeCargaRapida;
