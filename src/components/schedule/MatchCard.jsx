import { AL_PASAR } from '../ui/clasesDeComportamiento';
import {
  Play,
  CheckCircle,
  AlertTriangle,
  Eye,
  Users,
  ClipboardList,
} from 'lucide-react';
import {
  formatoDeIndice,
  formatoDeHandicapDeJuego,
} from '../../utils/formatoDeHandicap';
import MatchStatus from '../../domain/value_objects/MatchStatus';
import { isTeamMatchFormat } from '../../domain/value_objects/MatchFormat';
import { Team } from '../../domain/value_objects/Team';

const STATUS_COLORS = {
  [MatchStatus.SCHEDULED]: 'border border-current text-tinta-suave',
  [MatchStatus.IN_PROGRESS]: 'border border-current text-exito',
  [MatchStatus.COMPLETED]: 'border border-current text-tinta',
  [MatchStatus.WALKOVER]: 'border border-current text-aviso',
  // Concedido es un partido terminado: su color (E1-9, 18 nov 2026)
  [MatchStatus.CONCEDED]: 'border border-current text-tinta',
};

const getPlayerName = (playerId, playerNameMap, t) => {
  return playerNameMap.get(playerId) || t('unnamedPlayer');
};

// Las acciones de un partido, con una sola forma. La que toca ahora (iniciar,
// completar, anotar) va rellena; las de consulta o cambio, con contorno; y el
// walkover, en el color de aviso: es una decisión que no se toma a la ligera
const ACCION =
  'flex min-h-11 items-center gap-1 rounded-boton px-4 py-1.5 text-xs font-bold';
const PRINCIPAL = `${ACCION} bg-contraste text-sobre-contraste transition-opacity hover:opacity-90`;
const SECUNDARIA = `${ACCION} border-[1.5px] border-tinta bg-fondo text-tinta ${AL_PASAR}`;
const DE_AVISO = `${ACCION} border-[1.5px] border-aviso bg-fondo text-aviso`;

const MatchCard = ({
  match,
  matchFormat,
  onStartMatch,
  onCompleteMatch,
  onDeclareWalkover,
  onReassignPlayers,
  onViewDetail,
  onScoreMatch,
  canManage,
  playerNameMap,
  playerHandicapMap,
  maxPlayingHandicap,
  teamNames,
  t,
}) => {
  const status = match.status;
  const isEditable = status === MatchStatus.SCHEDULED;
  const isInProgress = status === MatchStatus.IN_PROGRESS;

  const teamA = match.teamAPlayers || [];
  const teamB = match.teamBPlayers || [];

  const isTeamFormat = isTeamMatchFormat(matchFormat);

  const renderTeamPlayers = (players, teamColor) => {
    if (players.length === 0)
      return <p className="text-sm text-tinta-suave">--</p>;

    return players.map((p, i) => {
      const realHcp =
        p.playerHandicap ?? playerHandicapMap?.get(p.userId) ?? null;
      const ph = p.playingHandicap;
      const isCapped =
        maxPlayingHandicap != null && ph != null && ph >= maxPlayingHandicap;
      return (
        <div
          key={p.userId || i}
          className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5"
        >
          {/* Que encoja y parta: con «Hcp juego» al lado, un nombre largo sin
              espacios empujaba la fila fuera de la tarjeta a 360 px. Si no
              caben los dos, el HCP baja debajo antes que partir el nombre a
              mitad de palabra (pasada del Kind, 1 nov 2026) */}
          <p className={`min-w-0 break-words text-sm text-tinta`}>
            {getPlayerName(p.userId, playerNameMap, t)}
          </p>
          {/* Si baja, a la derecha, como en las filas que caben (/code-review) */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {realHcp != null && (
              <span className={`text-xs ${teamColor} font-medium`}>
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
                  <span className={`text-xs ${teamColor} font-medium`}>
                    {t('handicapLabels.playing', {
                      value: formatoDeHandicapDeJuego(ph),
                    })}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="border border-linea rounded-lg p-4 bg-fondo transition-colors">
      {/* Header: Match number + Status */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-tinta">
          {t('matches.matchNumber', { number: match.matchNumber })}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'border border-current text-tinta-suave'}`}
        >
          {t(`status.${status}`)}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-3">
        {/* Team A */}
        <div
          className={`rounded-lg p-2 ${isTeamFormat ? 'bg-team-a-suave border-l-4 border-team-a' : 'bg-team-a-suave'}`}
        >
          <p className="text-xs font-semibold text-team-a mb-1">
            {teamNames.teamA}
          </p>
          {renderTeamPlayers(teamA, 'text-team-a')}
        </div>

        <div className="text-center text-xs font-bold text-tinta-suave">
          {t('matches.vs')}
        </div>

        {/* Team B */}
        <div
          className={`rounded-lg p-2 ${isTeamFormat ? 'bg-team-b-suave border-l-4 border-team-b' : 'bg-team-b-suave'}`}
        >
          <p className="text-xs font-semibold text-team-b mb-1">
            {teamNames.teamB}
          </p>
          {renderTeamPlayers(teamB, 'text-team-b')}
        </div>
      </div>

      {/* Handicap info */}
      {match.handicapStrokesGiven != null && match.handicapStrokesGiven > 0 && (
        <div className="text-xs text-tinta-suave mb-3">
          {t('matches.handicapStrokes', {
            strokes: match.handicapStrokesGiven,
          })}
          {match.strokesGivenToTeam && (
            <span className="ml-1">
              (
              {t('matches.strokesGivenTo', {
                team:
                  match.strokesGivenToTeam === Team.A
                    ? teamNames.teamA
                    : match.strokesGivenToTeam === Team.B
                      ? teamNames.teamB
                      : '',
              })}
              )
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      {canManage && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-linea">
          {isEditable && (
            <>
              <button
                onClick={() => onStartMatch(match.id)}
                className={PRINCIPAL}
              >
                <Play className="w-3 h-3" />
                {t('matches.startMatch')}
              </button>
              <button
                onClick={() => onDeclareWalkover(match)}
                className={DE_AVISO}
              >
                <AlertTriangle className="w-3 h-3" />
                {t('matches.walkover')}
              </button>
              <button
                onClick={() => onReassignPlayers(match)}
                className={SECUNDARIA}
              >
                <Users className="w-3 h-3" />
                {t('matches.reassignPlayers')}
              </button>
            </>
          )}
          {isInProgress && (
            <>
              <button
                onClick={() => onCompleteMatch(match.id)}
                className={PRINCIPAL}
              >
                <CheckCircle className="w-3 h-3" />
                {t('matches.completeMatch')}
              </button>
              <button
                onClick={() => onDeclareWalkover(match)}
                className={DE_AVISO}
              >
                <AlertTriangle className="w-3 h-3" />
                {t('matches.walkover')}
              </button>
            </>
          )}
          <button onClick={() => onViewDetail(match.id)} className={SECUNDARIA}>
            <Eye className="w-3 h-3" />
            {t('matches.viewDetail')}
          </button>
          {isInProgress && onScoreMatch && (
            <button
              onClick={() => onScoreMatch(match.id)}
              className={PRINCIPAL}
            >
              <ClipboardList className="w-3 h-3" />
              {t('matches.score')}
            </button>
          )}
        </div>
      )}

      {/* Read-only: just view detail */}
      {!canManage && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-linea">
          <button onClick={() => onViewDetail(match.id)} className={SECUNDARIA}>
            <Eye className="w-3 h-3" />
            {t('matches.viewDetail')}
          </button>
          {isInProgress && onScoreMatch && (
            <button
              onClick={() => onScoreMatch(match.id)}
              className={PRINCIPAL}
            >
              <ClipboardList className="w-3 h-3" />
              {t('matches.score')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
