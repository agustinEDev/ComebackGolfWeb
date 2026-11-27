import { Calendar } from 'lucide-react';
import SesionDeLaAgenda from './SesionDeLaAgenda';
import { esCompeticionCerrada } from '../../utils/permisosDeLaAgenda';
import { SetupMode } from '../../domain/value_objects/SetupMode';

/**
 * Las sesiones de la agenda (`SchedulePage`): el título con cuántas hay, el
 * aviso de que no hay ninguna o cada sesión con su tarjeta. Lo abierto y lo
 * desplegado vive en la pantalla: aquí solo se pinta.
 */
const SesionesDeLaAgenda = ({
  rounds,
  competitionId,
  competition,
  botones,
  expandedRounds,
  onToggleExpand,
  onGenerateMatches,
  onRehacerSobres,
  onScoreMatch,
  onStartMatch,
  onCompleteMatch,
  onDeclareWalkover,
  onReassignPlayers,
  onViewMatchDetail,
  canManage,
  playerNameMap,
  playerHandicapMap,
  golfCourses,
  teamNames,
  t,
  tComp,
}) => (
  <div className="p-4">
    <h2 className="text-tinta font-bold text-xl mb-4 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-tinta" />
      {t('rounds.title')} ({rounds.length})
    </h2>

    {rounds.length === 0 ? (
      <div className="text-center py-12 bg-tarjeta rounded-tarjeta border border-contorno">
        <Calendar className="w-12 h-12 text-tinta-suave mx-auto mb-3" />
        <p className="text-tinta-suave">{t('rounds.noRounds')}</p>
      </div>
    ) : (
      <div className="space-y-4">
        {rounds.map((round) => (
          <SesionDeLaAgenda
            key={round.id}
            round={round}
            competitionId={competitionId}
            botones={botones}
            onRehacerSobres={onRehacerSobres}
            tComp={tComp}
            onGenerateMatches={() => onGenerateMatches(round)}
            soloReintento={competition.setupMode === SetupMode.RYDER_CUP}
            competicionCerrada={esCompeticionCerrada(competition.status)}
            onToggleExpand={() => onToggleExpand(round.id)}
            isExpanded={!!expandedRounds[round.id]}
            canEdit={canManage}
            onStartMatch={onStartMatch}
            onCompleteMatch={onCompleteMatch}
            onDeclareWalkover={onDeclareWalkover}
            onReassignPlayers={onReassignPlayers}
            onViewMatchDetail={onViewMatchDetail}
            onScoreMatch={onScoreMatch}
            playerNameMap={playerNameMap}
            playerHandicapMap={playerHandicapMap}
            maxPlayingHandicap={competition.maxPlayingHandicap ?? null}
            golfCourses={golfCourses}
            teamNames={teamNames}
            t={t}
          />
        ))}
      </div>
    )}
  </div>
);

export default SesionesDeLaAgenda;
