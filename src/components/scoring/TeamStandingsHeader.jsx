import { useTranslation } from 'react-i18next';
import { enPuntos } from '../../utils/enPuntos';

const TeamStandingsHeader = ({
  teamAName,
  teamBName,
  teamAPoints,
  teamBPoints,
}) => {
  const { t } = useTranslation('scoring');

  return (
    <div
      data-testid="team-standings-header"
      className="flex items-center justify-center gap-6 rounded-tarjeta bg-realce py-4"
    >
      <div className="text-center">
        <p className="text-sm font-medium text-tinta-suave truncate max-w-[120px]">
          {teamAName}
        </p>
        <p className="text-4xl font-bold text-team-a">
          {enPuntos(teamAPoints)}
        </p>
        <p className="text-xs text-tinta-suave">{t('leaderboard.points')}</p>
      </div>
      <div className="text-lg font-light text-tinta-suave">
        {t('leaderboard.versus')}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-tinta-suave truncate max-w-[120px]">
          {teamBName}
        </p>
        <p className="text-4xl font-bold text-team-b">
          {enPuntos(teamBPoints)}
        </p>
        <p className="text-xs text-tinta-suave">{t('leaderboard.points')}</p>
      </div>
    </div>
  );
};

export default TeamStandingsHeader;
