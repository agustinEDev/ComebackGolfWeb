import BarraDeEntrega from './BarraDeEntrega';
import TeeGroupStatus from '../../domain/value_objects/TeeGroupStatus';

/**
 * La barra fija de entregar la tarjeta de una partida de stroke play
 * (`GroupScoringPage`), con el hueco que ocupa para que no tape lo último.
 * `estado` es el de `estadoDeEntregaDeLaPartida`. Sin estado ni efectos.
 */
const EntregaDeLaPartida = ({ estado, onEntregar, enviando, scoringView }) => (
  <div data-testid="estado-de-entrega" data-estado={estado}>
    {/* Lo que ocupa la barra fija y, si está, el aviso de instalar sobre el que
      se apoya: si no, tapan lo último (FE #1240) */}
    <div
      data-testid="hueco-de-la-barra"
      className="h-[calc(9rem+var(--alto-aviso-instalar,0px))]"
      aria-hidden="true"
    />
    <BarraDeEntrega
      estado={estado}
      marcador={null}
      onEntregar={onEntregar}
      enviando={enviando}
      esFoursomes={false}
      pendientes={[]}
      completado={scoringView.matchStatus === TeeGroupStatus.COMPLETED}
      sePuedeSeguir={false}
      dePartida
    />
  </div>
);

export default EntregaDeLaPartida;
