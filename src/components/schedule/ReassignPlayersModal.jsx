import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import ModalShell, { CAJA_PROPIA } from '../ui/ModalShell';
import { motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import EnrollmentStatus from '../../domain/value_objects/EnrollmentStatus';
import { Team } from '../../domain/value_objects/Team';

// Wrapper: controls mount/unmount so inner component always has fresh state.
// key={match?.id} forces remount if the match changes while the modal is open.
const ReassignPlayersModal = ({ isOpen, match, ...props }) => {
  if (!isOpen) return null;
  return (
    <ReassignPlayersModalContent key={match?.id} match={match} {...props} />
  );
};

const ReassignPlayersModalContent = ({
  onClose,
  onConfirm,
  match,
  enrollments,
  isProcessing,
  teamNames,
  inscritosSinCargar = false,
  t,
}) => {
  const [teamAIds, setTeamAIds] = useState(() =>
    (match?.teamAPlayers || []).map((p) => p.userId),
  );

  const [teamBIds, setTeamBIds] = useState(() =>
    (match?.teamBPlayers || []).map((p) => p.userId),
  );

  // Only approved enrollments
  const approvedPlayers = enrollments.filter(
    (e) => e.status === EnrollmentStatus.APPROVED,
  );

  const togglePlayer = (playerId, team) => {
    if (team === Team.A) {
      // Remove from B if present
      setTeamBIds((prev) => prev.filter((id) => id !== playerId));
      setTeamAIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId],
      );
    } else {
      // Remove from A if present
      setTeamAIds((prev) => prev.filter((id) => id !== playerId));
      setTeamBIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId],
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inscritosSinCargar || teamAIds.length === 0 || teamBIds.length === 0)
      return;
    onConfirm(teamAIds, teamBIds);
  };

  const getPlayerTeam = (playerId) => {
    if (teamAIds.includes(playerId)) return Team.A;
    if (teamBIds.includes(playerId)) return Team.B;
    return null;
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="reasignar-jugadores-titulo"
      closeOnEscape={!isProcessing}
      busy={isProcessing}
      boxClassName={CAJA_PROPIA}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-fondo rounded-tarjeta max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-linea">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-tinta" />
            <h2
              id="reasignar-jugadores-titulo"
              className="text-xl font-bold text-tinta"
            >
              {t('matches.reassignPlayers')}
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
          <p className="text-sm text-tinta-suave mb-4">
            {t('matches.matchNumber', { number: match.matchNumber })}
          </p>

          {/* Sin la lista no hay a quién elegir: como el reparto manual (pasada
              del Kind, 1 nov 2026: salía vacía con el botón activo) */}
          {inscritosSinCargar && (
            <p
              id="reasignar-inscritos-sin-cargar"
              data-testid="reasignar-inscritos-sin-cargar"
              className="text-sm text-error"
            >
              {t('matches.reassignNeedsEnrollments')}
            </p>
          )}

          {/* Player list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {approvedPlayers.map((player) => {
              const team = getPlayerTeam(player.userId);
              return (
                <div
                  key={player.userId}
                  // La fila toma el color del equipo al que se asigna (Agustín, 26 nov
                  // 2026: probó todas iguales y prefirió esto); sin equipo, neutra
                  data-testid={`jugador-${player.userId}`}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    team === Team.A
                      ? 'border-team-a bg-team-a-suave'
                      : team === Team.B
                        ? 'border-team-b bg-team-b-suave'
                        : 'border-linea bg-tarjeta'
                  }`}
                >
                  <span className="text-sm font-medium text-tinta">
                    {player.userName || t('unnamedPlayer')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlayer(player.userId, Team.A)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        team === Team.A
                          ? 'border border-team-a bg-team-a text-fondo'
                          : 'border border-borde bg-fondo text-tinta-suave hover:bg-team-a-suave'
                      }`}
                    >
                      {teamNames.teamA}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePlayer(player.userId, Team.B)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        team === Team.B
                          ? 'border border-team-b bg-team-b text-fondo'
                          : 'border border-borde bg-fondo text-tinta-suave hover:bg-team-b-suave'
                      }`}
                    >
                      {teamNames.teamB}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-team-a-suave rounded-lg p-3 border border-team-a">
              <span className="font-semibold text-team-a">
                {teamNames.teamA}: {teamAIds.length}
              </span>
            </div>
            <div className="bg-team-b-suave rounded-lg p-3 border border-team-b">
              <span className="font-semibold text-team-b">
                {teamNames.teamB}: {teamBIds.length}
              </span>
            </div>
          </div>

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
              disabled={
                inscritosSinCargar ||
                isProcessing ||
                teamAIds.length === 0 ||
                teamBIds.length === 0
              }
              aria-describedby={
                inscritosSinCargar
                  ? 'reasignar-inscritos-sin-cargar'
                  : undefined
              }
              className="px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? '...' : t('matches.reassignPlayers')}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
};

export default ReassignPlayersModal;
