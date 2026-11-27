import { useTranslation } from 'react-i18next';
import { Winner } from '../../domain/value_objects/Winner';

const MatchSummaryCard = ({ summary, winnerName }) => {
  const { t } = useTranslation('scoring');

  if (!summary) return null;

  return (
    <div
      data-testid="match-summary-card"
      className="bg-fondo rounded-lg border border-linea p-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-tinta">{t('summary.title')}</h2>

      {summary.result && (
        <div className="text-center py-4 bg-tarjeta rounded-lg">
          <p className="text-sm text-tinta-suave">{t('summary.result')}</p>
          <p className="text-3xl font-bold text-tinta mt-1">
            {summary.result.score}
          </p>
          {summary.result.winner === Winner.HALVED ? (
            <p className="text-sm text-tinta-suave mt-1">
              {t('summary.halved')}
            </p>
          ) : winnerName ? (
            <p className="text-sm text-tinta-suave mt-1">
              {t('summary.winner')}: {winnerName}
            </p>
          ) : null}
        </div>
      )}

      {summary.stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-tarjeta rounded">
            <p className="text-xs text-tinta-suave">
              {t('summary.grossTotal')}
            </p>
            <p className="text-lg font-bold">
              {summary.stats.playerGrossTotal}
            </p>
          </div>
          <div className="text-center p-2 bg-tarjeta rounded">
            <p className="text-xs text-tinta-suave">{t('summary.netTotal')}</p>
            <p className="text-lg font-bold">{summary.stats.playerNetTotal}</p>
          </div>
          <div className="text-center p-2 bg-exito-suave rounded">
            <p className="text-xs text-tinta-suave">{t('summary.holesWon')}</p>
            <p className="text-lg font-bold text-exito">
              {summary.stats.holesWon}
            </p>
          </div>
          <div className="text-center p-2 bg-error-suave rounded">
            <p className="text-xs text-tinta-suave">{t('summary.holesLost')}</p>
            <p className="text-lg font-bold text-error">
              {summary.stats.holesLost}
            </p>
          </div>
        </div>
      )}

      {summary.matchComplete ? (
        <p className="text-center text-sm font-medium text-exito">
          {t('summary.matchComplete')}
        </p>
      ) : (
        <p className="text-center text-sm text-tinta-suave">
          {t('summary.waitingForOthers')}
        </p>
      )}
    </div>
  );
};

export default MatchSummaryCard;
