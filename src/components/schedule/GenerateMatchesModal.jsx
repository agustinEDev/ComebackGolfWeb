import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import ModalShell, { CAJA_PROPIA } from '../ui/ModalShell';
import { motion } from 'framer-motion';
import { X, Zap, Plus, Trash2 } from 'lucide-react';
import BloqueoDePartidos from './BloqueoDePartidos';
import { formatoDeIndice } from '../../utils/formatoDeHandicap';
import EnrollmentStatus from '../../domain/value_objects/EnrollmentStatus';
import { MatchFormat } from '../../domain/value_objects/MatchFormat';
import { Team } from '../../domain/value_objects/Team';
import { SetupMode } from '../../domain/value_objects/SetupMode';

let matchIdCounter = 0;
const createEmptyMatch = () => ({
  id: ++matchIdCounter,
  teamAPlayerIds: [],
  teamBPlayerIds: [],
});

// Wrapper: controls mount/unmount so inner component always has fresh state
const GenerateMatchesModal = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <GenerateMatchesModalContent {...props} />;
};

const GenerateMatchesModalContent = ({
  onClose,
  onConfirm,
  round,
  bloqueo = null,
  vezDelBloqueo = 0,
  enrollments,
  teamAssignment,
  isProcessing,
  teamNames,
  playerNameMap,
  setupMode,
  t,
}) => {
  // En modo Ryder los enfrentamientos salen de los sobres de los capitanes, y
  // el servidor rechaza los que se manden a mano: ofrecerlos era dejar colocar
  // a todo el mundo para recibir un error al final (BE #361)
  const emparejanLosSobres = setupMode === SetupMode.RYDER_CUP;
  const [mode, setMode] = useState('automatic');
  const [matches, setMatches] = useState([createEmptyMatch()]);
  const [validationError, setValidationError] = useState(null);

  const playersPerSide = round.matchFormat === MatchFormat.SINGLES ? 1 : 2;

  // Cuando aparece o cambia el motivo, o llega otra respuesta bloqueada
  // (`vezDelBloqueo`), su recuadro a la vista (23 nov 2026): a 360 px se pulsa
  // «Generar» desde abajo y el recuadro va arriba. Solo se desplaza la caja del
  // modal, como el de las barras (sin `scrollIntoView`, que movería también la
  // página de detrás), y solo si quedó por encima de lo visible. Sin foco: el
  // `role="alert"` lo anuncia, y se vuelve a montar con cada respuesta para que
  // lo anuncie otra vez.
  // Se mira el contenido y no el objeto: cada relectura de la agenda mapea
  // otro igual, y la caja no tiene que saltar mientras se desplaza. Se mide con
  // `offsetTop` dentro de la caja (`relative`): la animación de entrada la
  // escala, y las medidas en pantalla salían falseadas (/code-review)
  const cajaRef = useRef(null);
  const recuadroRef = useRef(null);
  const claveDelBloqueo = bloqueo
    ? JSON.stringify([
        vezDelBloqueo,
        bloqueo.reason,
        (bloqueo.players || []).map((j) => [j.userId, j.missing, j.teeColor]),
      ])
    : null;
  useLayoutEffect(() => {
    const caja = cajaRef.current;
    const recuadro = recuadroRef.current;
    if (!claveDelBloqueo || !caja || !recuadro) return;
    if (recuadro.offsetTop < caja.scrollTop)
      caja.scrollTop = recuadro.offsetTop - 16;
  }, [claveDelBloqueo]);

  const approvedPlayers = useMemo(
    () => enrollments.filter((e) => e.status === EnrollmentStatus.APPROVED),
    [enrollments],
  );

  const teamAPlayers = useMemo(
    () =>
      approvedPlayers.filter((p) =>
        teamAssignment?.teamAPlayerIds?.includes(p.userId),
      ),
    [approvedPlayers, teamAssignment],
  );

  const teamBPlayers = useMemo(
    () =>
      approvedPlayers.filter((p) =>
        teamAssignment?.teamBPlayerIds?.includes(p.userId),
      ),
    [approvedPlayers, teamAssignment],
  );

  // All player IDs currently used across all matches
  const usedPlayerIds = useMemo(() => {
    const ids = new Set();
    matches.forEach((m) => {
      m.teamAPlayerIds.forEach((id) => {
        if (id) ids.add(id);
      });
      m.teamBPlayerIds.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [matches]);

  const assignedCount = usedPlayerIds.size;
  const totalCount = teamAPlayers.length + teamBPlayers.length;

  const addMatch = () => {
    setMatches((prev) => [...prev, createEmptyMatch()]);
    setValidationError(null);
  };

  const removeMatch = (index) => {
    setMatches((prev) => prev.filter((_, i) => i !== index));
    setValidationError(null);
  };

  const updateMatchPlayer = (matchIndex, team, slotIndex, playerId) => {
    setMatches((prev) =>
      prev.map((match, i) => {
        if (i !== matchIndex) return match;
        const key = team === Team.A ? 'teamAPlayerIds' : 'teamBPlayerIds';
        const updated = [...match[key]];
        if (playerId === '') {
          updated[slotIndex] = '';
        } else {
          updated[slotIndex] = playerId;
        }
        return { ...match, [key]: updated };
      }),
    );
    setValidationError(null);
  };

  const isPlayerUsedElsewhere = (
    playerId,
    currentMatchIndex,
    team,
    slotIndex,
  ) => {
    if (!playerId) return false;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (
        m.teamAPlayerIds.some(
          (id, si) =>
            id === playerId &&
            !(i === currentMatchIndex && team === Team.A && si === slotIndex),
        )
      )
        return true;
      if (
        m.teamBPlayerIds.some(
          (id, si) =>
            id === playerId &&
            !(i === currentMatchIndex && team === Team.B && si === slotIndex),
        )
      )
        return true;
    }
    return false;
  };

  const validate = () => {
    if (matches.length === 0) {
      return t('matches.pairings.validation.noMatches');
    }

    for (const match of matches) {
      if (
        match.teamAPlayerIds.length !== playersPerSide ||
        match.teamBPlayerIds.length !== playersPerSide
      ) {
        return t('matches.pairings.validation.incompleteMatch');
      }
      if (
        match.teamAPlayerIds.some((id) => !id) ||
        match.teamBPlayerIds.some((id) => !id)
      ) {
        return t('matches.pairings.validation.incompleteMatch');
      }
    }

    // Check duplicates
    const allIds = matches.flatMap((m) => [
      ...m.teamAPlayerIds,
      ...m.teamBPlayerIds,
    ]);
    if (new Set(allIds).size !== allIds.length) {
      return t('matches.pairings.validation.duplicatePlayer');
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !teamAssignment ||
      (!teamAssignment.teamAPlayerIds?.length &&
        !teamAssignment.teamBPlayerIds?.length)
    ) {
      setValidationError(t('matches.pairings.validation.noTeamAssignment'));
      return;
    }

    if (mode === 'automatic') {
      onConfirm(null);
      return;
    }

    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    onConfirm(
      matches.map(({ teamAPlayerIds, teamBPlayerIds }) => ({
        teamAPlayerIds,
        teamBPlayerIds,
      })),
    );
  };

  const renderPlayerSelect = (matchIndex, team, slotIndex, players) => {
    const key = team === Team.A ? 'teamAPlayerIds' : 'teamBPlayerIds';
    const currentValue = matches[matchIndex][key][slotIndex] || '';

    return (
      <select
        value={currentValue}
        onChange={(e) =>
          updateMatchPlayer(matchIndex, team, slotIndex, e.target.value)
        }
        className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg text-sm focus:ring-tinta focus:border-tinta"
      >
        <option value="">{t('matches.pairings.selectPlayer')}</option>
        {players.map((player) => {
          const isUsed = isPlayerUsedElsewhere(
            player.userId,
            matchIndex,
            team,
            slotIndex,
          );
          return (
            <option key={player.userId} value={player.userId} disabled={isUsed}>
              {playerNameMap.get(player.userId) ||
                player.userName ||
                t('unnamedPlayer')}
              {player.userHandicap != null
                ? ` (${t('handicapLabels.indexWithColon', { value: formatoDeIndice(player.userHandicap) })})`
                : ''}
              {isUsed ? ` - ${t('matches.pairings.playerAlreadyUsed')}` : ''}
            </option>
          );
        })}
      </select>
    );
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="generar-partidos-titulo"
      closeOnEscape={!isProcessing}
      busy={isProcessing}
      boxClassName={CAJA_PROPIA}
    >
      <motion.div
        ref={cajaRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        data-testid="generate-matches-modal"
        className="relative bg-fondo rounded-tarjeta max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-linea">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-tinta" />
            <h2
              id="generar-partidos-titulo"
              className="text-xl font-bold text-tinta"
            >
              {t('matches.pairings.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common:close')}
            className="p-2 text-tinta-suave rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Por qué no salieron la última vez (BE #360): lo apuntado en la
              sesión o, si no lo apuntó, lo que dijo la respuesta (BE #923),
              en el idioma de la pantalla */}
          <BloqueoDePartidos
            key={vezDelBloqueo}
            ref={recuadroRef}
            bloqueo={bloqueo}
          />
          {/* Warning when no teams assigned */}
          {(!teamAssignment ||
            (!teamAssignment.teamAPlayerIds?.length &&
              !teamAssignment.teamBPlayerIds?.length)) && (
            <div className="bg-aviso-suave border border-aviso rounded-lg p-3">
              <p className="text-sm font-medium text-aviso">
                {t('matches.pairings.noTeamsWarning')}
              </p>
              <p className="text-xs text-aviso mt-1">
                {t('matches.pairings.noTeamsWarningDesc')}
              </p>
            </div>
          )}

          {/* Mode selection: en modo Ryder no hay nada que elegir */}
          {emparejanLosSobres ? (
            <p
              data-testid="emparejan-los-sobres"
              className="rounded-lg border border-linea bg-tarjeta p-3 text-sm text-tinta"
            >
              {t('matches.pairings.byEnvelopes')}
            </p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-tinta mb-2">
                {t('matches.pairings.mode')}
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-linea hover:bg-tarjeta transition-colors">
                  <input
                    type="radio"
                    name="pairingMode"
                    value="automatic"
                    checked={mode === 'automatic'}
                    onChange={() => {
                      setMode('automatic');
                      setValidationError(null);
                    }}
                    className="mt-0.5 text-tinta focus:ring-tinta"
                  />
                  <div>
                    <span className="text-sm font-medium">
                      {t('matches.pairings.automatic')}
                    </span>
                    <p className="text-xs text-tinta-suave mt-0.5">
                      {t('matches.pairings.automaticDesc')}
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-linea hover:bg-tarjeta transition-colors">
                  <input
                    type="radio"
                    name="pairingMode"
                    value="manual"
                    checked={mode === 'manual'}
                    onChange={() => {
                      setMode('manual');
                      setValidationError(null);
                    }}
                    className="mt-0.5 text-tinta focus:ring-tinta"
                  />
                  <div>
                    <span className="text-sm font-medium">
                      {t('matches.pairings.manual')}
                    </span>
                    <p className="text-xs text-tinta-suave mt-0.5">
                      {t('matches.pairings.manualDesc')}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Manual matches UI */}
          {!emparejanLosSobres && mode === 'manual' && (
            <div className="space-y-4">
              {matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  className="border border-linea rounded-lg p-4 space-y-3"
                >
                  {/* Match header */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-tinta">
                      {t('matches.pairings.matchN', { number: matchIndex + 1 })}
                    </span>
                    {matches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(matchIndex)}
                        className="p-1 text-tinta-suave hover:text-error rounded transition-colors"
                        title={t('matches.pairings.removeMatch')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                    {/* Team A */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-team-a">
                        {teamNames.teamA}
                      </span>
                      {Array.from(
                        { length: playersPerSide },
                        (_, slotIndex) => (
                          <div key={`a-${slotIndex}`}>
                            {renderPlayerSelect(
                              matchIndex,
                              Team.A,
                              slotIndex,
                              teamAPlayers,
                            )}
                          </div>
                        ),
                      )}
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center pt-6">
                      <span className="text-sm font-bold text-tinta-suave">
                        {t('matches.vs')}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-team-b">
                        {teamNames.teamB}
                      </span>
                      {Array.from(
                        { length: playersPerSide },
                        (_, slotIndex) => (
                          <div key={`b-${slotIndex}`}>
                            {renderPlayerSelect(
                              matchIndex,
                              Team.B,
                              slotIndex,
                              teamBPlayers,
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add match button */}
              <button
                type="button"
                onClick={addMatch}
                className="flex items-center gap-2 w-full justify-center py-2 border-2 border-dashed border-linea rounded-lg text-sm font-medium text-tinta-suave hover:border-tinta hover:text-tinta transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('matches.pairings.addMatch')}
              </button>

              {/* Summary */}
              <div className="rounded-lg border border-linea bg-tarjeta p-3 text-sm text-tinta-suave">
                {t('matches.pairings.summary', {
                  matchCount: matches.length,
                  assignedCount,
                  totalCount,
                })}
              </div>
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="text-sm text-error bg-error-suave border border-error rounded-lg p-3">
              {validationError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-linea">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-11 px-4 py-2 border-[1.5px] border-tinta bg-fondo text-tinta rounded-boton text-sm font-bold ${AL_PASAR}`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              data-testid="generate-submit"
              className="flex items-center gap-2 px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {isProcessing ? '...' : t('matches.pairings.generate')}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
};

export default GenerateMatchesModal;
