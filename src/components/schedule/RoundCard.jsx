import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MatchCard from './MatchCard';
import BloqueoDePartidos from './BloqueoDePartidos';
import { RoundStatus } from '../../domain/value_objects/RoundStatus';
import { diaEnElIdioma } from '../../utils/diaDeLaSesion';

const STATUS_COLORS = {
  [RoundStatus.PENDING_TEAMS]: 'border border-current text-aviso',
  [RoundStatus.PENDING_MATCHES]: 'border border-current text-aviso',
  [RoundStatus.SCHEDULED]: 'border border-current text-tinta-suave',
  [RoundStatus.IN_PROGRESS]: 'border border-current text-exito',
  [RoundStatus.COMPLETED]: 'border border-current text-tinta',
};

// El día de la ronda en el idioma de la app, no en el del navegador (FE #1238)
const FORMATO_DEL_DIA = {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const RoundCard = ({
  round,
  onGenerateMatches,
  soloReintento = false,
  competicionCerrada = true,
  onToggleExpand,
  isExpanded,
  canEdit,
  onStartMatch,
  onCompleteMatch,
  onDeclareWalkover,
  onReassignPlayers,
  onViewMatchDetail,
  onScoreMatch,
  playerNameMap,
  playerHandicapMap,
  maxPlayingHandicap,
  golfCourses,
  teamNames,
  t,
}) => {
  // El idioma, del hook: el `t` llega por props y no avisa al cambiarlo
  const { i18n } = useTranslation();
  const status = round.status;
  // En modo Ryder, «Generar» solo es un reintento (FE #711): antes de abrirse
  // los sobres emparejaría por hándicap, y con los partidos hechos los
  // capitanes ya no podrían entregar. Reintento es que se abrieron y la sesión
  // se quedó sin partidos: eso es lo que dice su motivo de bloqueo
  // Y solo con la competición cerrada o en juego: con las inscripciones
  // reabiertas el servidor lo rechaza siempre
  const canGenerate =
    canEdit &&
    competicionCerrada &&
    status === RoundStatus.PENDING_MATCHES &&
    (!soloReintento || Boolean(round.matchGenerationBlock));
  const matches = round.matches || [];
  // Todos cuentan: sin su nombre (inscripciones sin cargar) se dice «un
  // jugador», que un id suelto no le dice nada a nadie (CodeRabbit en la #720)
  const descansan = (round.restingPlayerIds || []).map(
    (id) => playerNameMap?.get?.(id) || t('rounds.unknownPlayer'),
  );

  const golfCourseName =
    golfCourses.find((gc) => gc.id === round.golfCourseId)?.name ||
    round.golfCourseId;

  const formattedDate =
    diaEnElIdioma(round.roundDate, i18n?.language, FORMATO_DEL_DIA) ?? '';

  return (
    <div className="border border-contorno rounded-tarjeta bg-tarjeta overflow-hidden">
      {/* Round Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        className="flex items-start sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-fondo transition-colors"
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-bold text-tinta">{formattedDate}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'border border-current text-tinta'}`}
            >
              {t(`status.${status}`)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-tinta-suave">
            <span className="truncate max-w-[200px] sm:max-w-none">
              {golfCourseName}
            </span>
            <span className="text-tinta-suave hidden sm:inline">|</span>
            <span>{t(`sessions.${round.sessionType}`)}</span>
            {/* Sin formato no se pinta «formats.null» (BE #541) */}
            {round.matchFormat && (
              <>
                <span className="text-tinta-suave hidden sm:inline">|</span>
                <span>{t(`formats.${round.matchFormat}`)}</span>
              </>
            )}
            {matches.length > 0 && (
              <>
                <span className="text-tinta-suave hidden sm:inline">|</span>
                <span>{t('rounds.matchCount', { count: matches.length })}</span>
              </>
            )}
          </div>
          {round.handicapMode && (
            <div className="text-xs text-tinta-suave mt-1">
              {t('rounds.handicapMode')}:{' '}
              {t(`handicapModes.${round.handicapMode}`)}
              {round.allowancePercentage != null && (
                <span className="ml-2">
                  {t('rounds.allowancePercentage')}: {round.allowancePercentage}
                  %
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Action buttons (stop propagation to prevent toggle) */}
          {canGenerate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateMatches();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-contraste text-sobre-contraste rounded-boton text-xs font-medium transition-opacity hover:opacity-90"
              title={t('matches.generate')}
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">{t('matches.generate')}</span>
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-tinta-suave" />
          ) : (
            <ChevronDown className="w-5 h-5 text-tinta-suave" />
          )}
        </div>
      </div>

      {/* Los sobres se abrieron y los partidos no pudieron crearse (BE #361):
          sin desplegar, que es lo primero que el organizador tiene que ver */}
      {round.matchGenerationBlock && (
        <div className="px-4 pb-4">
          <BloqueoDePartidos
            bloqueo={round.matchGenerationBlock}
            puedeReintentar={canGenerate}
          />
        </div>
      )}

      {/* Quién descansa (#710): con equipos desiguales el que sobra se quedaba
          sin partido y nadie lo decía. Sin desplegar, como el motivo */}
      {descansan.length > 0 && (
        <p
          data-testid="descansan"
          className="px-4 pb-3 text-sm text-tinta-suave"
        >
          {t('rounds.resting', {
            count: descansan.length,
            names: descansan.join(', '),
          })}
        </p>
      )}

      {/* Expanded: Matches List */}
      {isExpanded && (
        <div className="border-t border-linea p-4 bg-tarjeta">
          {matches.length === 0 ? (
            <p className="text-center text-tinta-suave text-sm py-4">
              {t('matches.noMatches')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  matchFormat={round.matchFormat}
                  onStartMatch={onStartMatch}
                  onCompleteMatch={onCompleteMatch}
                  onDeclareWalkover={onDeclareWalkover}
                  onReassignPlayers={onReassignPlayers}
                  onViewDetail={onViewMatchDetail}
                  onScoreMatch={onScoreMatch}
                  canManage={canEdit}
                  playerNameMap={playerNameMap}
                  playerHandicapMap={playerHandicapMap}
                  maxPlayingHandicap={maxPlayingHandicap}
                  teamNames={teamNames}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoundCard;
