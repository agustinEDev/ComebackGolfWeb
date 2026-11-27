import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useTranslation } from 'react-i18next';
import ModalShell from '../ui/ModalShell';

const SessionBlockedModalContent = ({ onTakeOver, onGoBack }) => {
  const { t } = useTranslation('scoring');

  return (
    <ModalShell
      isOpen
      testId="session-blocked-modal"
      labelledBy="sesion-ocupada-titulo"
      closeOnEscape={false}
    >
      <h2
        id="sesion-ocupada-titulo"
        className="text-lg font-semibold text-tinta mb-2"
      >
        {t('session.blocked')}
      </h2>
      <p className="text-sm text-tinta-suave mb-6">
        {t('session.blockedMessage')}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          data-testid="session-go-back"
          onClick={onGoBack}
          className={`px-4 py-2 text-sm font-medium text-tinta bg-tarjeta rounded-lg ${AL_PASAR}`}
        >
          {t('session.goBack')}
        </button>
        <button
          data-testid="session-take-over"
          onClick={onTakeOver}
          className="px-4 py-2 text-sm font-medium text-sobre-contraste bg-contraste rounded-lg hover:opacity-90"
        >
          {t('session.takeOver')}
        </button>
      </div>
    </ModalShell>
  );
};

const SessionBlockedModal = ({ isOpen, onTakeOver, onGoBack }) => {
  if (!isOpen) return null;
  return (
    <SessionBlockedModalContent onTakeOver={onTakeOver} onGoBack={onGoBack} />
  );
};

export default SessionBlockedModal;
