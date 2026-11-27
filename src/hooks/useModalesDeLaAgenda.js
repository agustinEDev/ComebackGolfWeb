import { useRef, useState } from 'react';

/**
 * Qué diálogo de la agenda está abierto, y con qué partido o sesión. Vive en
 * la pantalla y no en los diálogos: mientras la agenda recarga entera se pinta
 * la espera, y lo abierto tiene que seguir así al volver.
 *
 * Los diálogos de un partido o una sesión guardan solo eso: con él, abierto;
 * `null`, cerrado. No hay un «abierto» aparte que se pueda desacompasar.
 */
export const useModalesDeLaAgenda = () => {
  // Cubrir el puesto de un capitán que se fue tras el reparto (FE #692)
  const [cubriendoCapitan, setCubriendoCapitan] = useState(null);
  // La sesión cuyos sobres se van a rehacer, mientras se confirma
  const [rehaciendoSobres, setRehaciendoSobres] = useState(null);
  const [walkoverMatch, setWalkoverMatch] = useState(null);
  const [reassignMatch, setReassignMatch] = useState(null);
  const [detailMatchId, setDetailMatchId] = useState(null);
  const [generateRound, setGenerateRound] = useState(null);
  // El motivo de la última respuesta de generar, con su sesión y cuántas van
  // (`{roundId, bloqueo, vez}`): es del modal abierto, así que abrir o cerrar lo
  // olvida. La agenda puede no tenerlo (un emparejamiento a mano no se guarda
  // en la sesión, BE #923)
  const [bloqueoAlGenerar, setBloqueoAlGenerar] = useState(null);
  // La sesión con el modal de generar abierto AHORA: la respuesta llega
  // después, y con el estado de cuando se envió no sabría si se cerró
  const generarAbierto = useRef(null);
  const ponerGenerar = (round) => {
    generarAbierto.current = round;
    setBloqueoAlGenerar(null);
    setGenerateRound(round);
  };
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [deshaciendoEquipos, setDeshaciendoEquipos] = useState(false);

  return {
    cubriendoCapitan,
    setCubriendoCapitan,
    rehaciendoSobres,
    setRehaciendoSobres,
    walkoverMatch,
    abrirWalkover: setWalkoverMatch,
    cerrarWalkover: () => setWalkoverMatch(null),
    reassignMatch,
    abrirReasignar: setReassignMatch,
    cerrarReasignar: () => setReassignMatch(null),
    detailMatchId,
    abrirDetalle: setDetailMatchId,
    cerrarDetalle: () => setDetailMatchId(null),
    generateRound,
    abrirGenerar: ponerGenerar,
    cerrarGenerar: () => ponerGenerar(null),
    rondaDeGenerarAbierta: () => generarAbierto.current?.id ?? null,
    bloqueoAlGenerar,
    setBloqueoAlGenerar,
    // Cada respuesta bloqueada cuenta (`vez`), aunque diga lo mismo: el modal
    // la trae a la vista y la anuncia otra vez (/code-review)
    respuestaBloqueada: (roundId, bloqueo) =>
      setBloqueoAlGenerar((antes) => ({
        roundId,
        bloqueo,
        vez: (antes?.vez ?? 0) + 1,
      })),
    showTeamsModal,
    setShowTeamsModal,
    deshaciendoEquipos,
    setDeshaciendoEquipos,
  };
};
