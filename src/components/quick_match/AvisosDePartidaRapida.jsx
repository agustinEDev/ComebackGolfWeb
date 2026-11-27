import { claveDelAvisoDelVaciado } from '../../utils/erroresDeAnotacion';
import {
  loadErrorKeyFor,
  saveErrorKeyFor,
} from '../../utils/textosDePartidaRapida';

/**
 * Tres avisos de la anotación de partida rápida (`QuickMatchScoringPage`) con
 * la partida pintada: los hoyos que hay que volver a anotar, el vaciado parado
 * por el almacenamiento y el recuadro rojo de los fallos. Sin estado ni
 * efectos.
 */
const AvisosDePartidaRapida = ({
  t,
  quickMatch,
  perdidos,
  hoyosPerdidos,
  avisoDelVaciado,
  errorDeVerdad,
  saveError,
  loadError,
  refetch,
}) => (
  <>
    {perdidos?.length > 0 && (
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <p
          role="alert"
          data-testid="quick-match-perdidos"
          className="bg-error-suave border border-error text-error rounded-lg p-3 text-sm"
        >
          {/* Un anotador cubre a varios jugadores, así que el mismo hoyo
              puede perderse varias veces: sin agrupar salía «Los hoyos 7, 7,
              7, 8, 8, 8». Lo que el jugador necesita es la lista de hoyos que
              tiene que volver a anotar, cada uno una vez */}
          {t('scoring.offline.lost', {
            count: hoyosPerdidos.length,
            holes: hoyosPerdidos.join(', '),
          })}
        </p>
      </div>
    )}

    {/* El vaciado se paró porque el móvil no admite escrituras. Aparte del
        error general: ese lo limpia cada anotación que sale bien, y esto
        tiene que durar hasta que un vaciado termine bien (FE #551) */}
    {avisoDelVaciado && quickMatch && (
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <p
          role="status"
          data-testid="quick-match-aviso-vaciado"
          className="rounded-lg border border-aviso bg-aviso-suave p-3 text-sm text-aviso"
        >
          {t(claveDelAvisoDelVaciado(avisoDelVaciado))}
        </p>
      </div>
    )}

    {errorDeVerdad && quickMatch && (
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="bg-error-suave border border-error rounded-lg p-3 flex items-center justify-between">
          <p
            className="text-sm text-error"
            data-testid="quick-match-scoring-error"
          >
            <span data-testid="quick-match-save-error">
              {saveError
                ? t(saveErrorKeyFor(saveError))
                : t(loadErrorKeyFor(loadError))}
              {/* El hook apunta el hoyo en el error: sin decirlo, el jugador
                  lee la misma frase genérica y no sabe cuál repetir */}
              {saveError?.holeNumber != null &&
                ` ${t('scoring.offline.atHole', { hole: saveError.holeNumber })}`}
            </span>
          </p>
          <button
            onClick={refetch}
            className="px-3 py-1 text-xs bg-error text-sobre-contraste rounded hover:opacity-90"
          >
            {t('scoring.retry')}
          </button>
        </div>
      </div>
    )}
  </>
);

export default AvisosDePartidaRapida;
