import { esFalloDeUnaAccion, motivoDe } from '../../utils/lecturaDelPartido';
import { noSeArreglaReintentando } from '../../utils/noSeArreglaReintentando';

/**
 * Lo que dice la anotación de competición (`ScoringPage`) cuando no hay nada
 * que pintar —ni vista del servidor ni foto del móvil—: por qué, una pista si
 * el servidor no llegó a contestar, y «Reintentar». Sin estado ni efectos.
 *
 * Si la API ha dicho que el partido no existe o no es tuyo, reintentar daría
 * lo mismo: se ofrece volver a Mis partidos (26 nov 2026).
 */
const SinNadaQuePintar = ({
  t,
  error,
  refetch,
  alVolver,
  sinCobertura = false,
  origenDelError = null,
}) => {
  // Solo un fallo de CARGA: un golpe o una entrega rechazados no dicen nada de
  // si el partido existe o es tuyo
  const volver =
    !esFalloDeUnaAccion(origenDelError) &&
    noSeArreglaReintentando(error, sinCobertura);
  // ¿Contestó el servidor? Preguntado por `=== undefined` y no por verdadero/
  // falso, como en partida rápida: lo que importa es si hubo respuesta, y un
  // `status` 0 —que algún proxy expone en una petición abortada— no lo es
  const estado = error?.status ?? error?.response?.status;
  const contestoElServidor = estado !== undefined;

  return (
    <>
      <p className="text-tinta">
        {error ? motivoDe(t, error) : t('offline.nothingCached')}
      </p>
      {/* La pista se esconde solo si el servidor contestó —si el partido no
          está o no es tuyo, abrirlo con cobertura no arregla nada—. Con un
          fallo sin respuesta, que es lo que da un portal cautivo, es justo el
          consejo que hace falta */}
      {!contestoElServidor && (
        <p className="mt-2 text-sm text-tinta-suave">
          {t('offline.nothingCachedHint')}
        </p>
      )}
      <button
        onClick={volver ? alVolver : refetch}
        className="mt-4 px-4 py-2 bg-contraste text-sobre-contraste rounded-lg"
      >
        {volver ? t('errors.backToMyMatches') : t('retry')}
      </button>
    </>
  );
};

export default SinNadaQuePintar;
