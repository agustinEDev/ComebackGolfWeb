import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import ModalShell, { CAJA_PROPIA } from '../ui/ModalShell';
import { motion } from 'framer-motion';
import { X, Users } from 'lucide-react';
import { formatoDeIndice } from '../../utils/formatoDeHandicap';
import EnrollmentStatus from '../../domain/value_objects/EnrollmentStatus';
import { Team } from '../../domain/value_objects/Team';

// Wrapper: controls mount/unmount so inner component always has fresh state
const AssignTeamsModal = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <AssignTeamsModalContent {...props} />;
};

const AssignTeamsModalContent = ({
  onClose,
  onConfirm,
  enrollments,
  isProcessing,
  teamNames,
  captains,
  inscritosSinCargar = false,
  t,
}) => {
  // Con los dos capitanes nombrados, cada uno queda fijo en su equipo (FE #692):
  // nombrarlos ya los fijó, y el servidor rechaza un reparto que los mueva
  // (BE #320). Con uno solo no se fija a nadie: ese reparto lo va a
  // rechazar igualmente pidiendo el capitán que falta
  const hayCapitanes = Boolean(captains?.teamA && captains?.teamB);
  // Con uno solo, el servidor rechaza el reparto en los dos modos pidiendo el
  // que falta: mejor decirlo antes que después de rellenar doce nombres
  const faltaUnCapitan = Boolean(captains?.teamA) !== Boolean(captains?.teamB);
  // Solo se abre sin equipos: con ellos formados, se deshacen antes (29-30 oct)
  const [mode, setMode] = useState('automatic');
  const [manualTeamA, setManualTeamA] = useState(() =>
    hayCapitanes ? [captains.teamA] : [],
  );
  const [manualTeamB, setManualTeamB] = useState(() =>
    hayCapitanes ? [captains.teamB] : [],
  );

  const approvedPlayers = enrollments.filter(
    (e) => e.status === EnrollmentStatus.APPROVED,
  );
  const esCapitan = (playerId) =>
    hayCapitanes &&
    (playerId === captains.teamA || playerId === captains.teamB);

  // Los capitanes no se mueven: sus botones van desactivados, y eso ya impide
  // que llegue aquí un clic suyo
  const togglePlayer = (playerId, team) => {
    if (team === Team.A) {
      setManualTeamB((prev) => prev.filter((id) => id !== playerId));
      setManualTeamA((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId],
      );
    } else {
      setManualTeamA((prev) => prev.filter((id) => id !== playerId));
      setManualTeamB((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId],
      );
    }
  };

  const getPlayerTeam = (playerId) => {
    if (manualTeamA.includes(playerId)) return Team.A;
    if (manualTeamB.includes(playerId)) return Team.B;
    return null;
  };

  // En una Ryder juegan todos: un reparto incompleto borra el anterior y deja
  // gente sin equipo, y el servidor no lo impide
  const sinEquipo = approvedPlayers.filter(
    (p) => !manualTeamA.includes(p.userId) && !manualTeamB.includes(p.userId),
  ).length;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'automatic') {
      onConfirm({ mode: 'automatic' });
    } else {
      onConfirm({
        mode: 'manual',
        team_a_player_ids: manualTeamA,
        team_b_player_ids: manualTeamB,
      });
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="repartir-equipos-titulo"
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
              id="repartir-equipos-titulo"
              className="text-xl font-bold text-tinta"
            >
              {t('teams.assign')}
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
          {inscritosSinCargar && (
            <p
              id="reparto-inscritos-sin-cargar"
              data-testid="reparto-inscritos-sin-cargar"
              className="text-sm text-error"
            >
              {t('teams.enrollmentsNotLoaded')}
            </p>
          )}
          {faltaUnCapitan && (
            <p className="text-sm text-aviso">{t('teams.captainMissing')}</p>
          )}
          {/* Mode selection */}
          <div>
            <label className="block text-sm font-medium text-tinta mb-2">
              {t('teams.mode')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="automatic"
                  checked={mode === 'automatic'}
                  onChange={() => setMode('automatic')}
                  className="text-tinta focus:ring-tinta"
                />
                <span className="text-sm font-medium">
                  {t('teams.automatic')}
                </span>
              </label>
              <label
                className={`flex items-center gap-2 ${
                  inscritosSinCargar
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="manual"
                  checked={mode === 'manual'}
                  onChange={() => setMode('manual')}
                  // Sin la lista, el manual mandaría solo a los capitanes; el
                  // automático lo reparte el servidor con la suya
                  disabled={inscritosSinCargar}
                  aria-describedby={
                    inscritosSinCargar
                      ? 'reparto-inscritos-sin-cargar'
                      : undefined
                  }
                  className="text-tinta focus:ring-tinta"
                />
                <span className="text-sm font-medium">{t('teams.manual')}</span>
              </label>
            </div>
          </div>

          {/* Manual player assignment */}
          {mode === 'manual' && (
            <>
              {hayCapitanes && (
                <p className="text-sm text-tinta-suave">
                  {t('teams.captainsFixed')}
                </p>
              )}
              {sinEquipo > 0 && (
                <p className="text-sm text-aviso">
                  {t('teams.everyoneNeedsTeam', { count: sinEquipo })}
                </p>
              )}
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
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-tinta">
                          {player.userName || t('unnamedPlayer')}
                        </span>
                        {player.userHandicap != null && (
                          <span className="text-xs text-tinta-suave ml-2">
                            {t('handicapLabels.indexWithColon', {
                              value: formatoDeIndice(player.userHandicap),
                            })}
                          </span>
                        )}
                        {esCapitan(player.userId) && (
                          <span className="block text-xs text-aviso truncate">
                            {t('teams.captainTag')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => togglePlayer(player.userId, Team.A)}
                          disabled={esCapitan(player.userId)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-60 ${
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
                          disabled={esCapitan(player.userId)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-60 ${
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
                    {teamNames.teamA}: {manualTeamA.length}
                  </span>
                </div>
                <div className="bg-team-b-suave rounded-lg p-3 border border-team-b">
                  <span className="font-semibold text-team-b">
                    {teamNames.teamB}: {manualTeamB.length}
                  </span>
                </div>
              </div>
            </>
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
              disabled={
                isProcessing ||
                faltaUnCapitan ||
                (mode === 'manual' && sinEquipo > 0)
              }
              className="px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? '...' : t('teams.assign')}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
};

export default AssignTeamsModal;
