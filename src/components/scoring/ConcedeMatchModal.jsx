import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell from '../ui/ModalShell';

const ConcedeMatchModalContent = ({ onConfirm, onClose }) => {
  const { t } = useTranslation('scoring');
  const [reason, setReason] = useState('');

  return (
    <>
      <h2 id="concede-title" className="text-lg font-semibold text-tinta mb-2">
        {t('concede.title')}
      </h2>
      <p id="concede-message" className="text-sm text-tinta-suave mb-4">
        {t('concede.message')}
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-tinta mb-1">
          {t('concede.reason')}
        </label>
        <input
          data-testid="concede-reason-input"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('concede.reasonPlaceholder')}
          maxLength={500}
          className="w-full px-3 py-2 border border-linea rounded-lg text-sm focus:ring-tinta focus:border-tinta"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          data-testid="concede-cancel"
          onClick={onClose}
          className={`px-4 py-2 text-sm font-medium text-tinta bg-tarjeta rounded-lg ${AL_PASAR}`}
        >
          {t('concede.cancel')}
        </button>
        <button
          data-testid="concede-confirm"
          onClick={() => onConfirm(reason || null)}
          className="px-4 py-2 text-sm font-medium text-sobre-contraste bg-error rounded-lg hover:opacity-90"
        >
          {t('concede.confirm')}
        </button>
      </div>
    </>
  );
};

// El contenido vive dentro del armazón, que no lo monta mientras está cerrado:
// así el motivo escrito y descartado no reaparece la próxima vez que se abre.
//
// Tocar fuera cierra, como Escape y «Cancelar»: en todos los diálogos (Agustín,
// 23 nov 2026), aunque dentro haya un motivo escrito a mano.
const ConcedeMatchModal = ({ isOpen, onConfirm, onClose }) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    testId="concede-match-modal"
    labelledBy="concede-title"
    describedBy="concede-message"
  >
    <ConcedeMatchModalContent onConfirm={onConfirm} onClose={onClose} />
  </ModalShell>
);

export default ConcedeMatchModal;
