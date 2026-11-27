import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useTranslation } from 'react-i18next';
import ModalShell from '../ui/ModalShell';

const SubmitScorecardModalContent = ({
  validatedHoles,
  totalHoles,
  isSubmitting,
  onConfirm,
  onClose,
  reopenable,
}) => {
  const { t } = useTranslation('scoring');

  return (
    <>
      <h2 id="submit-title" className="text-lg font-semibold text-tinta mb-2">
        {t('submit.title')}
      </h2>
      {/* En una partida el organizador puede reabrirla (2.ª pasada del QA) */}
      <p id="submit-message" className="text-sm text-tinta-suave mb-2">
        {t(reopenable ? 'submit.confirmReopenable' : 'submit.confirm')}
      </p>
      <p className="text-sm font-medium text-tinta mb-6">
        {t('submit.allValidated', { count: validatedHoles, total: totalHoles })}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          data-testid="submit-cancel"
          onClick={onClose}
          disabled={isSubmitting}
          className={`px-4 py-2 text-sm font-medium text-tinta bg-tarjeta rounded-lg disabled:opacity-50 ${AL_PASAR}`}
        >
          {t('submit.cancel')}
        </button>
        <button
          data-testid="submit-confirm"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-sobre-contraste bg-contraste rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? t('submit.submitting') : t('submit.submit')}
        </button>
      </div>
    </>
  );
};

// Mientras la entrega va de camino no se cierra por Escape ni pulsando fuera:
// los dos botones ya están desactivados y cerrar la caja por detrás dejaría al
// jugador sin saber si su tarjeta salió. `busy` es lo que hace que ese bloqueo
// no sea mudo: en pantalla se lee «Enviando…» en el botón, y un lector de
// pantalla no tenía forma de saber por qué su Escape no hacía nada.
const SubmitScorecardModal = ({
  isOpen,
  validatedHoles,
  totalHoles,
  isSubmitting,
  onConfirm,
  onClose,
  reopenable = false,
}) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    testId="submit-scorecard-modal"
    labelledBy="submit-title"
    describedBy="submit-message"
    closeOnEscape={!isSubmitting}
    busy={isSubmitting}
  >
    <SubmitScorecardModalContent
      validatedHoles={validatedHoles}
      totalHoles={totalHoles}
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      onClose={onClose}
      reopenable={reopenable}
    />
  </ModalShell>
);

export default SubmitScorecardModal;
