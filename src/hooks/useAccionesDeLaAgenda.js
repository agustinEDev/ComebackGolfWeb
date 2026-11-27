import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import customToast from '../utils/toast';
import { AVISO_ARRIBA } from '../utils/avisoArriba';
import {
  generateMatchesUseCase,
  assignTeamsUseCase,
  undoTeamsUseCase,
  fillCaptainUseCase,
  updateMatchStatusUseCase,
  declareWalkoverUseCase,
  reassignPlayersUseCase,
  resetEnvelopesUseCase,
} from '../composition';
import { mensajeDeError } from '../utils/sinCobertura';
import { mensajeDelError } from '../utils/mensajeDelError';
import { registraElFallo } from '../utils/registraElFallo';
import { textoDelBloqueo } from '../utils/textoDelBloqueo';
import { nombreDeLaBarra } from '../utils/nombreDeLaBarra';

// Empezar y terminar un partido son la misma llamada: cambia la acción y con
// qué clave se apunta el fallo
const FALLOS_DEL_CAMBIO_DE_ESTADO = {
  start: {
    clave: 'SchedulePage.error-starting-match',
    mensaje: 'Error starting match:',
  },
  complete: {
    clave: 'SchedulePage.error-completing-match',
    mensaje: 'Error completing match:',
  },
};

/**
 * Lo que el organizador hace desde la agenda: generar partidos, empezarlos y
 * terminarlos, walkovers, reasignar, repartir y deshacer equipos, cubrir un
 * capitán y rehacer los sobres. Cada acción marca `isProcessing` mientras dura.
 *
 * @param {Object} params
 * @param {string} params.id - La competición.
 * @param {Function} params.t - Las traducciones de la agenda.
 * @param {Function} params.tComp - Las de competiciones (los sobres).
 * @param {Object} params.datos - Lo de useDatosDeLaAgenda.
 * @param {Object} params.modales - Lo de useModalesDeLaAgenda.
 */
export const useAccionesDeLaAgenda = ({ id, t, tComp, datos, modales }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  // Para el nombre de las barras en el aviso con el modal cerrado: su espacio
  // se carga antes de pintarlo, como hace `TeeColorBadge` (/code-review)
  const { i18n } = useTranslation();
  const {
    setCompetition,
    recargarTodo,
    recargarCompeticion,
    reloadSchedule,
    recargarTrasGeneracionBloqueada,
  } = datos;

  const cubrirCapitan = async (playerId) => {
    setIsProcessing(true);
    try {
      const { captains } = await fillCaptainUseCase.execute(
        id,
        modales.cubriendoCapitan,
        playerId,
      );
      setCompetition((prev) => ({ ...prev, captains }));
      modales.setCubriendoCapitan(null);
      customToast.success(t('success.captainFilled'));
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-filling-captain',
        'Error filling captain:',
        error,
      );
      customToast.error(
        mensajeDelError(error, t('errors.failedToFillCaptain')),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const rehacerSobres = async () => {
    setIsProcessing(true);
    try {
      await resetEnvelopesUseCase.execute(modales.rehaciendoSobres);
      modales.setRehaciendoSobres(null);
      customToast.success(tComp('envelope.resetDone'));
      recargarTodo();
    } catch (error) {
      // El servidor es quien sabe si esa sesión ya se jugó o si no había nada
      // que rehacer: aquí se enseña lo que diga
      customToast.error(mensajeDelError(error, t('common:errors.generic')));
    } finally {
      setIsProcessing(false);
    }
  };

  // El servidor lo ha apuntado en la sesión, en claves (BE #360), y el modal lo
  // enseña en su idioma, con quién y qué. Abierto: cerrarlo tiraba los
  // emparejamientos hechos a mano. Con las inscripciones: un retirado no puede
  // seguir ofreciéndose. Y con la competición: si la reabrieron entretanto,
  // «Generar» deja de ofrecerse
  // Con el modal de esa sesión ya cerrado, el motivo arriba y traducido, nunca
  // la frase del servidor. Sin motivo en la respuesta, el texto genérico
  const avisarDelBloqueoArriba = async (bloqueo) => {
    let texto = t('generationBlock.title');
    if (bloqueo) {
      await i18n.loadNamespaces('golfCourses');
      const tBarras = i18n.getFixedT(null, 'golfCourses');
      texto = textoDelBloqueo(bloqueo, t, (color) =>
        nombreDeLaBarra(tBarras, { color }),
      );
    }
    customToast.error(texto, AVISO_ARRIBA);
  };

  // El motivo de la respuesta va a su modal (23 nov 2026): el de un
  // emparejamiento a mano no se guarda en la sesión (BE #923), y sin él la
  // agenda releída no tenía nada que enseñar. Gana al guardado, por ser el más
  // reciente, y cada respuesta cuenta: el modal la trae a la vista y la
  // anuncia otra vez aunque diga lo mismo. Si el modal de esa sesión ya se
  // cerró, sale arriba, traducido
  const recargarTrasBloqueo = async (roundId, error) => {
    const bloqueo = error?.bloqueo ?? null;
    const abierto = modales.rondaDeGenerarAbierta() === roundId;
    if (abierto) modales.respuestaBloqueada(roundId, bloqueo);
    else await avisarDelBloqueoArriba(bloqueo);
    try {
      await recargarTrasGeneracionBloqueada();
    } catch (recarga) {
      registraElFallo(
        'SchedulePage.reloading-after-a-blocked-generation',
        'Error reloading after a blocked generation:',
        recarga,
      );
      // Sin la sesión recargada ni motivo en la respuesta, el modal no tiene
      // nada que enseñar. Si el de esa sesión sigue abierto (se mira ahora:
      // pudo cerrarse mientras recargaba), la frase del servidor, que también
      // dice quién; si ya no, el genérico traducido arriba. Cerrado desde el
      // principio, el aviso de arriba ya salió (CodeRabbit, PR #1233)
      if (abierto && !bloqueo) {
        if (modales.rondaDeGenerarAbierta() === roundId) {
          customToast.error(
            mensajeDelError(error, t('errors.failedToGenerateMatches')),
            AVISO_ARRIBA,
          );
        } else {
          await avisarDelBloqueoArriba(null);
        }
      }
    }
  };

  const handleGenerateMatches = async (roundId, manualPairings = null) => {
    setIsProcessing(true);
    // El motivo del intento anterior sigue mientras se envía: se cambia al
    // llegar la respuesta (sin parpadeo al reintentar)
    try {
      const pairings = manualPairings ? { manualPairings } : {};
      await generateMatchesUseCase.execute(roundId, pairings);
      customToast.success(t('success.matchesGenerated'));
      modales.cerrarGenerar();
      await reloadSchedule();
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-generating-matches',
        'Error generating matches:',
        error,
      );
      if (error?.errorCode === 'MATCH_GENERATION_BLOCKED') {
        await recargarTrasBloqueo(roundId, error);
      } else {
        // El servidor respondió sin bloqueo: el motivo de la respuesta
        // anterior ya no vale y el modal vuelve al guardado en la sesión, que
        // es lo que el servidor sabe. Un fallo sin respuesta (sin conexión) no
        // lo borra: puede ser la única copia (/code-review)
        const respondio = typeof error?.status === 'number';
        if (respondio && modales.rondaDeGenerarAbierta() === roundId)
          modales.setBloqueoAlGenerar(null);
        // Un emparejado a mano fuera de su equipo, con su texto (BE #919).
        // Arriba, como los avisos de los modales: el de generar sigue abierto y
        // abajo tapaba sus botones (pasada del iPhone, 22 nov)
        customToast.error(
          mensajeDelError(error, t('errors.failedToGenerateMatches'), {
            PAIRING_PLAYER_NOT_IN_TEAM: t('errors.PAIRING_PLAYER_NOT_IN_TEAM'),
          }),
          AVISO_ARRIBA,
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Match handlers ---
  const cambiarEstadoDelPartido = async (matchId, accion) => {
    setIsProcessing(true);
    try {
      await updateMatchStatusUseCase.execute(matchId, accion);
      customToast.success(t('success.matchStatusUpdated'));
      await reloadSchedule();
    } catch (error) {
      const { clave, mensaje } = FALLOS_DEL_CAMBIO_DE_ESTADO[accion];
      registraElFallo(clave, mensaje, error);
      customToast.error(
        mensajeDelError(error, t('errors.failedToUpdateMatchStatus')),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclareWalkover = async (winningTeam, reason) => {
    if (!modales.walkoverMatch) return;
    setIsProcessing(true);
    try {
      await declareWalkoverUseCase.execute(
        modales.walkoverMatch.id,
        winningTeam,
        reason,
      );
      customToast.success(t('success.walkoverDeclared'));
      modales.cerrarWalkover();
      await reloadSchedule();
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-declaring-walkover',
        'Error declaring walkover:',
        error,
      );
      customToast.error(
        mensajeDelError(error, t('errors.failedToDeclareWalkover')),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReassignPlayers = async (teamAIds, teamBIds) => {
    if (!modales.reassignMatch) return;
    setIsProcessing(true);
    try {
      await reassignPlayersUseCase.execute(
        modales.reassignMatch.id,
        teamAIds,
        teamBIds,
      );
      customToast.success(t('success.playersReassigned'));
      modales.cerrarReasignar();
      await reloadSchedule();
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-reassigning-players',
        'Error reassigning players:',
        error,
      );
      customToast.error(
        mensajeDelError(error, t('errors.failedToReassignPlayers')),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Con su código, en cristiano (29 oct 2026): formados quedan así, y con la
  // sala de draft abierta se espera a que termine
  const avisarDelFalloAlRepartir = async (error) => {
    if (error?.errorCode === 'DRAFT_IN_PROGRESS') {
      customToast.error(t('errors.waitForDraft'));
    } else if (error?.errorCode === 'TEAMS_FORMED') {
      customToast.error(t('errors.teamsFormed'));
      modales.setShowTeamsModal(false);
      await Promise.all([reloadSchedule(), recargarCompeticion()]);
    } else {
      customToast.error(
        mensajeDelError(error, t('errors.failedToAssignTeams')),
      );
    }
  };

  // --- Team assignment handler ---
  const handleAssignTeams = async (teamData) => {
    setIsProcessing(true);
    try {
      await assignTeamsUseCase.execute(id, teamData);
      customToast.success(t('success.teamsAssigned'));
      modales.setShowTeamsModal(false);
      // La competición también: repartir libera los subcapitanes en el servidor
      // (BE #320), y sin recargarla la etiqueta seguiría pegada a quien
      // ya no lo es
      await Promise.all([reloadSchedule(), recargarCompeticion()]);
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-assigning-teams',
        'Error assigning teams:',
        error,
      );
      await avisarDelFalloAlRepartir(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Deshacer los equipos para que entre alguien (30 oct 2026): el mismo
  // reinicio que al quitar a un jugador, y se repite el draft
  const handleUndoTeams = async () => {
    setIsProcessing(true);
    try {
      await undoTeamsUseCase.execute(id);
      customToast.success(t('success.teamsUndone'));
    } catch (error) {
      registraElFallo(
        'SchedulePage.error-undoing-teams',
        'Error undoing teams:',
        error,
      );
      // Ya deshechos (otra pestaña, o al quitar a alguien): basta con releer
      if (error?.errorCode !== 'NO_TEAMS') {
        customToast.error(
          error?.errorCode === 'TEAMS_LOCKED'
            ? t('errors.teamsLocked')
            : mensajeDeError(error, {
                sinConexion: t('common:sinConexion.mensaje'),
                generico: t('errors.failedToUndoTeams'),
              }),
        );
      }
    }
    modales.setDeshaciendoEquipos(false);
    // Haya ido bien o no, la agenda al día: sin equipos, o con los partidos
    // que no se veían. Hasta entonces sigue en curso: si no, el botón volvía
    // antes y un segundo toque daba NO_TEAMS (revisor)
    try {
      await Promise.all([reloadSchedule(), recargarCompeticion()]);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    cubrirCapitan,
    rehacerSobres,
    handleGenerateMatches,
    handleStartMatch: (matchId) => cambiarEstadoDelPartido(matchId, 'start'),
    handleCompleteMatch: (matchId) =>
      cambiarEstadoDelPartido(matchId, 'complete'),
    handleDeclareWalkover,
    handleReassignPlayers,
    handleAssignTeams,
    handleUndoTeams,
  };
};
