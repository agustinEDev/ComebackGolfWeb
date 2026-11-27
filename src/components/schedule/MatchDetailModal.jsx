import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState, useEffect } from 'react';
import ModalShell, { CAJA_PROPIA } from '../ui/ModalShell';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { X, Trophy, AlertTriangle, ClipboardList } from 'lucide-react';
import { getMatchDetailUseCase } from '../../composition';
import BlockLoader from '../ui/BlockLoader';
import RetiradaPorElOrganizador from './RetiradaPorElOrganizador';
import {
  formatoDeIndice,
  formatoDeHandicapDeJuego,
} from '../../utils/formatoDeHandicap';
import { mensajeDelError } from '../../utils/mensajeDelError';
import { registraElFallo } from '../../utils/registraElFallo';
import MatchStatus from '../../domain/value_objects/MatchStatus';
import { MatchFormat } from '../../domain/value_objects/MatchFormat';
import { Team } from '../../domain/value_objects/Team';
import { Winner } from '../../domain/value_objects/Winner';

const MatchDetailModal = ({
  isOpen,
  onClose,
  matchId,
  playerNameMap,
  playerHandicapMap,
  maxPlayingHandicap,
  teamNames,
  t,
  canManage = false,
  // El de la ronda: el detalle del partido no lo trae, y la retirada es solo
  // de fourball (F10)
  matchFormat = null,
}) => {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!matchId) return;

    const loadMatch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMatchDetailUseCase.execute(matchId);
        setMatch(data);
      } catch (err) {
        registraElFallo(
          'MatchDetailModal.error-loading-match-detail',
          'Error loading match detail:',
          err,
        );
        setError(mensajeDelError(err, t('errors.failedToLoadMatch')));
      } finally {
        setIsLoading(false);
      }
    };

    loadMatch();
  }, [matchId, t]);

  if (!isOpen) return null;

  const getPlayerName = (playerId) =>
    playerNameMap.get(playerId) || t('unnamedPlayer');

  const renderHandicapInfo = (p) => {
    const realHcp =
      p.playerHandicap ?? playerHandicapMap?.get(p.userId) ?? null;
    const ph = p.playingHandicap;
    const isCapped =
      maxPlayingHandicap != null && ph != null && ph >= maxPlayingHandicap;

    if (realHcp == null && ph == null) return null;

    return (
      <span className="ml-2 inline-flex items-center gap-1">
        {realHcp != null && (
          <span className="text-xs text-tinta-suave font-medium">
            {t('handicapLabels.index', { value: formatoDeIndice(realHcp) })}
          </span>
        )}
        {ph != null && (
          <>
            {realHcp != null && (
              <span className="text-xs text-tinta-suave">|</span>
            )}
            {isCapped ? (
              <span className="text-xs border border-current text-aviso font-semibold px-1.5 py-0.5 rounded">
                {t('handicapLabels.playingCapped', {
                  value: formatoDeHandicapDeJuego(ph),
                })}
              </span>
            ) : (
              <span className="text-xs text-tinta-suave font-medium">
                {t('handicapLabels.playing', {
                  value: formatoDeHandicapDeJuego(ph),
                })}
              </span>
            )}
          </>
        )}
      </span>
    );
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="detalle-partido-titulo"
      boxClassName={CAJA_PROPIA}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-fondo rounded-tarjeta max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-linea">
          <h2
            id="detalle-partido-titulo"
            className="text-xl font-bold text-tinta"
          >
            {t('matches.viewDetail')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('common:close')}
            className="p-2 text-tinta-suave rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <BlockLoader sinRelleno />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-error">
              <p>{error}</p>
            </div>
          )}

          {match && !isLoading && (
            <div className="space-y-4">
              {/* Match Info */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-tinta">
                  {t('matches.matchNumber', { number: match.matchNumber })}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    // Concedido es un partido terminado: su color (18 nov 2026)
                    match.status === MatchStatus.COMPLETED ||
                    match.status === MatchStatus.CONCEDED
                      ? 'border border-current text-tinta'
                      : match.status === MatchStatus.IN_PROGRESS
                        ? 'border border-current text-exito'
                        : match.status === MatchStatus.WALKOVER
                          ? 'border border-current text-aviso'
                          : 'border border-current text-tinta-suave'
                  }`}
                >
                  {t(`status.${match.status}`)}
                </span>
              </div>

              {/* Team A */}
              <div className="bg-team-a-suave rounded-lg p-4 border border-team-a">
                <h4 className="font-semibold text-team-a mb-2">
                  {teamNames.teamA}
                </h4>
                <div className="space-y-1">
                  {(match.teamAPlayers || []).map((p, i) => (
                    <p key={p.userId || i} className={`text-sm text-tinta`}>
                      {getPlayerName(p.userId)}
                      {renderHandicapInfo(p)}
                    </p>
                  ))}
                  {(!match.teamAPlayers || match.teamAPlayers.length === 0) && (
                    <p className="text-sm text-tinta-suave">--</p>
                  )}
                </div>
              </div>

              {/* Team B */}
              <div className="bg-team-b-suave rounded-lg p-4 border border-team-b">
                <h4 className="font-semibold text-team-b mb-2">
                  {teamNames.teamB}
                </h4>
                <div className="space-y-1">
                  {(match.teamBPlayers || []).map((p, i) => (
                    <p key={p.userId || i} className={`text-sm text-tinta`}>
                      {getPlayerName(p.userId)}
                      {renderHandicapInfo(p)}
                    </p>
                  ))}
                  {(!match.teamBPlayers || match.teamBPlayers.length === 0) && (
                    <p className="text-sm text-tinta-suave">--</p>
                  )}
                </div>
              </div>

              {/* Fourball: el organizador retira o devuelve a un jugador (F10) */}
              {canManage &&
                matchFormat === MatchFormat.FOURBALL &&
                MatchStatus.isPlayable(match.status) && (
                  <RetiradaPorElOrganizador key={matchId} matchId={matchId} />
                )}

              {/* Handicap Strokes */}
              {match.handicapStrokesGiven != null &&
                match.handicapStrokesGiven > 0 && (
                  <div className="bg-tarjeta rounded-lg p-4 border border-linea">
                    <p className="text-sm text-tinta">
                      {t('matches.handicapStrokes', {
                        strokes: match.handicapStrokesGiven,
                      })}
                    </p>
                    {match.strokesGivenToTeam && (
                      <p className="text-sm text-tinta-suave">
                        {t('matches.strokesGivenTo', {
                          team:
                            match.strokesGivenToTeam === Team.A
                              ? teamNames.teamA
                              : teamNames.teamB,
                        })}
                      </p>
                    )}
                  </div>
                )}

              {/* Result */}
              {match.result &&
                (() => {
                  const isWalkover =
                    match.result.score === 'W/O' ||
                    match.status === MatchStatus.WALKOVER;
                  const bgClass = isWalkover
                    ? 'bg-aviso-suave border-aviso'
                    : 'bg-exito-suave border-exito';
                  const headerClass = isWalkover ? 'text-aviso' : 'text-exito';
                  const Icon = isWalkover ? AlertTriangle : Trophy;
                  const iconClass = isWalkover
                    ? 'w-4 h-4 text-aviso'
                    : 'w-4 h-4 text-exito';

                  return (
                    <div className={`rounded-lg p-4 border ${bgClass}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={iconClass} />
                        <h4 className={`font-semibold ${headerClass}`}>
                          {t('matches.result')}
                        </h4>
                      </div>
                      <div className="space-y-1 text-sm text-tinta">
                        {match.result.score && (
                          <p className="font-medium">
                            {t('matches.resultScore', {
                              score: match.result.score,
                            })}
                          </p>
                        )}
                        {match.result.winner && (
                          <p>
                            {t('matches.resultWinner', {
                              team:
                                match.result.winner === Winner.A
                                  ? teamNames.teamA
                                  : teamNames.teamB,
                            })}
                          </p>
                        )}
                        {match.result.reason && (
                          <p className="text-tinta-suave italic">
                            {t('matches.resultReason', {
                              reason: match.result.reason,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-linea">
          {/* En juego o terminado jugando, también concedido; el walkover no se jugó */}
          {match &&
            (match.status === MatchStatus.IN_PROGRESS ||
              match.status === MatchStatus.COMPLETED ||
              match.status === MatchStatus.CONCEDED) && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/player/matches/${matchId}/scoring`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90"
              >
                <ClipboardList className="w-4 h-4" />
                {t('matches.viewScorecard')}
              </button>
            )}
          <button
            onClick={onClose}
            className={`min-h-11 px-4 py-2 border-[1.5px] border-tinta bg-fondo text-tinta rounded-boton text-sm font-bold ${AL_PASAR}`}
          >
            {t('matches.close')}
          </button>
        </div>
      </motion.div>
    </ModalShell>
  );
};

export default MatchDetailModal;
