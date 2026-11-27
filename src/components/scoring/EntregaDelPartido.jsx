import BarraDeEntrega from './BarraDeEntrega';
import MatchStatus from '../../domain/value_objects/MatchStatus';

/**
 * La barra fija de entregar la tarjeta de la anotación de competición
 * (`ScoringPage`), con el hueco que ocupa para que no tape lo último. Sin
 * estado ni efectos. `estado` es el de `estadoDeEntrega`.
 */
const EntregaDelPartido = ({
  estado,
  marcador,
  onEntregar,
  enviando,
  esFoursomes,
  pendientes,
  scoringView,
  cerradoSinJugar,
  holesToSubmit,
  totalHoles,
}) => (
  <>
    {/* Lo que ocupa la barra fija y, si está, el aviso de instalar sobre el que
      se apoya: si no, tapan lo último (FE #1240) */}
    <div
      data-testid="hueco-de-la-barra"
      className="h-[calc(9rem+var(--alto-aviso-instalar,0px))]"
      aria-hidden="true"
    />
    <BarraDeEntrega
      estado={estado}
      marcador={marcador}
      onEntregar={onEntregar}
      enviando={enviando}
      esFoursomes={esFoursomes}
      pendientes={pendientes}
      // Concedido o walkover también lo terminan: ya no se espera a nadie
      completado={
        scoringView?.matchStatus === MatchStatus.COMPLETED || cerradoSinJugar
      }
      // Todo anotado y sin validar, sin decidir: no «Partido terminado»
      soloAnotado={estado === 'faltaValidar' && !scoringView?.isDecided}
      // Decidido no es acabado: se puede seguir jugando hasta el 18
      sePuedeSeguir={
        Boolean(scoringView?.isDecided) && holesToSubmit < totalHoles
      }
    />
  </>
);

export default EntregaDelPartido;
