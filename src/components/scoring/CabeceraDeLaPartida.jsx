import { Link } from 'react-router';
import CampoDeLaPartida from './CampoDeLaPartida';

/**
 * La cabecera de la anotación de una partida de stroke play
 * (`GroupScoringPage`): volver a la ficha si se sabe la competición, el número
 * y la hora de la partida, su tipo y el campo. Sin estado ni efectos.
 */
const CabeceraDeLaPartida = ({ t, competitionId, scoringView }) => (
  <>
    {competitionId && (
      <Link
        to={`/competitions/${competitionId}`}
        className="inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-tinta"
      >
        &larr; {t('partida.backToCompetition')}
      </Link>
    )}

    <div>
      <h1 className="text-xl font-bold text-tinta">
        {t('partida.header', {
          numero: scoringView.matchNumber,
          hora: scoringView.strokePlay.teeTime,
        })}
      </h1>
      <p className="text-sm text-tinta-suave">
        {t(`partida.type.${scoringView.strokePlay.tournamentType}`)}
      </p>
      <CampoDeLaPartida nombre={scoringView.roundInfo?.golfCourseName} />
    </div>
  </>
);

export default CabeceraDeLaPartida;
