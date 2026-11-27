import RejillaDeHoyos from '../scoring/RejillaDeHoyos';

/**
 * Hole grid selector for quick match scoring.
 * Status reflects whether every score this screen expects for that hole is in
 * — quick match has no dual-validation concept, so there's no "mismatch"
 * state, only empty/partial/complete.
 *
 * `expectedScoreIdGroups` es UN GRUPO POR CASILLA de la pantalla, con los
 * participantes a cuyo nombre puede estar guardado ese golpe: un jugador en
 * casi todos los formatos, y los dos del BANDO en foursomes, donde la pareja
 * juega una sola bola. Contando participantes en vez de casillas, un hoyo de
 * foursomes con las dos bolas anotadas daba 2 de 4 y se quedaba en amarillo
 * para siempre; y mirando solo al titular de la tarjeta, una bola anotada a
 * nombre del compañero se veía en su casilla pero no aquí.
 */
// Aquí no hay doble validación: a medias se dibuja como «anotado» y completo
// como «cerrado», las mismas formas que en el selector de los partidos
const FORMA_DEL_ESTADO = {
  empty: 'empty',
  partial: 'pending',
  complete: 'validated',
};

const QuickMatchHoleSelector = ({
  currentHole,
  onSelect,
  holeScores = [],
  expectedScoreIdGroups = [],
  totalHoles = 18,
}) => {
  const getHoleStatus = (holeNumber) => {
    if (expectedScoreIdGroups.length === 0) return 'empty';
    const scoredCount = expectedScoreIdGroups.filter((scoreIds) =>
      // Basta con que HAYA anotación: una raya (`score` nulo) es un hoyo
      // cerrado, no uno pendiente. Exigiendo número, un hoyo recogido dejaba la
      // casilla en amarillo para siempre y la partida sin poder darse por
      // terminada de un vistazo.
      holeScores.some(
        (hs) =>
          hs.holeNumber === holeNumber && scoreIds.includes(hs.participantId),
      ),
    ).length;
    if (scoredCount === 0) return 'empty';
    if (scoredCount === expectedScoreIdGroups.length) return 'complete';
    return 'partial';
  };

  return (
    <RejillaDeHoyos
      currentHole={currentHole}
      onSelect={onSelect}
      totalHoles={totalHoles}
      estadoDe={getHoleStatus}
      formaDelEstado={FORMA_DEL_ESTADO}
      testId="quick-match-hole-selector"
      testIdDelHoyo={(hoyo) => `quick-match-hole-btn-${hoyo}`}
    />
  );
};

export default QuickMatchHoleSelector;
