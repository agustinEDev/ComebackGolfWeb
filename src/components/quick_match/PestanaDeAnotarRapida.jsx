import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CLASE_DE_ANTERIOR,
  CLASE_DE_SIGUIENTE,
} from '../scoring/clasesDeNavegar';
import QuickMatchHoleInput from './QuickMatchHoleInput';
import QuickMatchHoleSelector from './QuickMatchHoleSelector';
import BotonMapa from '../scoring/mapa/BotonMapa';
import VentanaDelMapa from '../scoring/mapa/VentanaDelMapa';

/**
 * La pestaña «Anotar» de la anotación de partida rápida
 * (`QuickMatchScoringPage`): el selector de hoyos, las casillas del hoyo con
 * su mapa, la navegación y, para quien la creó, terminar y cancelar. Sin
 * estado ni efectos: todo llega de la página.
 */
const PestanaDeAnotarRapida = ({
  t,
  quickMatch,
  isScorer,
  isCreator,
  currentHole,
  setCurrentHole,
  totalHoles,
  holeScoresVisibles,
  entries,
  currentHoleData,
  isReadOnly,
  allowsPickedUp,
  myRound,
  onScoreChange,
  onPrevHole,
  onNextHole,
  mapaDelHoyo,
  userId,
  miBarra,
  onPedirTerminar,
  onPedirCancelar,
}) => (
  <>
    {!isScorer && (
      <p className="text-sm text-tinta border border-contorno bg-realce rounded-lg p-3">
        {t('scoring.notAScorer')}
      </p>
    )}

    {isScorer && (
      <>
        <QuickMatchHoleSelector
          currentHole={currentHole}
          onSelect={setCurrentHole}
          holeScores={holeScoresVisibles}
          // Los golpes que espera cada casilla de la pantalla: una por
          // bando en foursomes —donde el hoyo está completo con las dos
          // bolas, no con cuatro— y una por jugador en el resto.
          expectedScoreIdGroups={entries.map((entry) => entry.scoreIds)}
          totalHoles={totalHoles}
        />

        {currentHoleData && (
          <>
            <QuickMatchHoleInput
              key={currentHole}
              holeNumber={currentHole}
              par={currentHoleData.par}
              strokeIndex={currentHoleData.strokeIndex}
              meters={currentHoleData.meters ?? null}
              entries={entries}
              isReadOnly={isReadOnly}
              allowPickedUp={allowsPickedUp}
              myRound={myRound}
              onScoreChange={onScoreChange}
            />
            <VentanaDelMapa
              mapaDelHoyo={mapaDelHoyo}
              golfCourseId={quickMatch?.golfCourseId ?? null}
              numeroDeHoyo={currentHole}
              par={currentHoleData.par}
              metros={currentHoleData.meters ?? null}
              userId={userId ?? null}
              barra={miBarra}
            />
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onPrevHole}
            disabled={currentHole <= 1}
            data-testid="quick-match-prev-hole"
            className={`flex-1 ${CLASE_DE_ANTERIOR}`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('scoring.navigation.previous')}
          </button>
          {/* «Mapa», entre Anterior y Siguiente (Agustín, 16 oct): ni dentro de la tarjeta del hoyo ni en una fila más, que empujaba la navegación fuera de la pantalla */}
          {/* Solo con el hoyo a la vista: la ventana del mapa va con él. Y en España, la única con imagen (19 oct) */}
          {currentHoleData && mapaDelHoyo.disponible && (
            <BotonMapa onAbrir={mapaDelHoyo.abrir} />
          )}
          <button
            onClick={onNextHole}
            disabled={currentHole >= totalHoles}
            data-testid="quick-match-next-hole"
            className={`flex-1 ${CLASE_DE_SIGUIENTE}`}
          >
            {t('scoring.navigation.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </>
    )}

    {isCreator && !quickMatch?.isCompleted && !quickMatch?.isCancelled && (
      <div className="flex flex-col gap-2">
        <button
          onClick={onPedirTerminar}
          className="w-full px-4 py-2 text-error border border-error rounded-lg text-sm font-medium hover:bg-fondo"
        >
          {t('scoring.finish.button')}
        </button>
        {/* Cancelar es la salida de una vuelta que se abandona: hasta
            ahora no habia ninguna, y quien la habia creado —el unico
            que puede cerrarla— acababa dandola por TERMINADA, metiendo
            una vuelta a medias en las estadisticas de todo el grupo. */}
        <button
          onClick={onPedirCancelar}
          data-testid="quick-match-cancel-button"
          className={`w-full px-4 py-2 text-tinta-suave border border-borde rounded-boton text-sm font-medium ${AL_PASAR}`}
        >
          {t('scoring.cancelMatch.button')}
        </button>
      </div>
    )}
  </>
);

export default PestanaDeAnotarRapida;
