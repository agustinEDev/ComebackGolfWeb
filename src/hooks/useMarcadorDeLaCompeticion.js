import { useEffect, useState } from 'react';
import { getLeaderboardUseCase } from '../composition';
import {
  elMarcadorVisto,
  olvidaElMarcador,
  recuerdaElMarcador,
  soloLoQueSePinta,
} from '../services/marcadoresVistos';

/**
 * El marcador por equipos de una competición, para Inicio. Sale del endpoint
 * de clasificación, el mismo que usa su pantalla.
 *
 * No enseña «cargando»: mientras llega por primera vez da `esperando`, para
 * que Inicio le guarde el sitio y la pantalla no salte al llegar. Si falla
 * —sin red, sin permiso— se queda con lo último visto o con nada. Es un dato
 * de apoyo: no puede estropear la portada.
 *
 * Se vuelve a pedir al volver a la aplicación (otra pestaña, el móvil
 * bloqueado): dice «En juego», y con la pantalla abierta toda la sesión se
 * quedaba con el marcador de cuando se abrió.
 *
 * @param {string|null} competitionId - nulo si no hay competición por equipos
 * @returns {{marcador: object|null, esperando: boolean}}
 */
export const useMarcadorDeLaCompeticion = (competitionId) => {
  // Lo que respondió la última petición: un marcador, o que no hay
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    if (!competitionId) return undefined;
    let vigente = true;
    const pide = () =>
      getLeaderboardUseCase
        .execute(competitionId)
        .then((clasificacion) => {
          // Solo si sigue siendo de esta pantalla. Tras un cierre de sesión
          // con Inicio aún montado, quien no deja escribir es el cerrojo de
          // `marcadoresVistos`
          if (!vigente) return;
          const marcador = soloLoQueSePinta(clasificacion);
          recuerdaElMarcador(competitionId, marcador);
          setRespuesta({ competitionId, marcador });
        })
        .catch((error) => {
          if (!vigente) return;
          // Sin permiso (403) o sin competición (404), lo visto ya no vale:
          // quien fue expulsado no sigue viendo el marcador. Sin red se queda
          // lo último visto, o nada
          const yaNoSePuedeVer = error?.status === 403 || error?.status === 404;
          if (yaNoSePuedeVer) olvidaElMarcador(competitionId);
          setRespuesta((antes) =>
            !yaNoSePuedeVer &&
            antes?.competitionId === competitionId &&
            antes.marcador
              ? antes
              : { competitionId, marcador: null },
          );
        });
    pide();
    const alVolver = () => {
      if (globalThis.document?.visibilityState === 'visible') pide();
    };
    globalThis.document?.addEventListener('visibilitychange', alVolver);
    return () => {
      vigente = false;
      globalThis.document?.removeEventListener('visibilitychange', alVolver);
    };
  }, [competitionId]);

  if (!competitionId) return { marcador: null, esperando: false };
  // La de ESTA competición: el estado puede traer aún la de la anterior
  const deEsta = respuesta?.competitionId === competitionId ? respuesta : null;
  // Lo de la última respuesta o, si no trajo nada, lo último visto: un 403 o
  // un 404 ya lo borraron de la memoria, así que ahí no queda nada que heredar
  const visto = deEsta?.marcador ?? elMarcadorVisto(competitionId);
  // Tras un fallo sin nada que enseñar ya no se espera: el sitio se suelta
  return { marcador: visto, esperando: !visto && !deEsta };
};
