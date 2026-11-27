import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import ModalShell, { CAJA_PROPIA } from '../ui/ModalShell';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Team } from '../../domain/value_objects/Team';

// Wrapper: controls mount/unmount so inner component always has fresh state
const WalkoverModal = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <WalkoverModalContent {...props} />;
};

const WalkoverModalContent = ({
  onClose,
  onConfirm,
  matchNumber,
  isProcessing,
  teamNames,
  t,
}) => {
  const [winningTeam, setWinningTeam] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!window.confirm(t('walkover.confirmMessage'))) return;
    onConfirm(winningTeam, reason);
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      labelledBy="walkover-titulo"
      closeOnEscape={!isProcessing}
      busy={isProcessing}
      boxClassName={CAJA_PROPIA}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-fondo rounded-tarjeta max-w-md w-full"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-linea">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-aviso" />
            <h2 id="walkover-titulo" className="text-xl font-bold text-tinta">
              {t('walkover.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common:close')}
            className="p-2 text-tinta-suave rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-tinta-suave">
            {t('matches.matchNumber', { number: matchNumber })}
          </p>

          {/* Winning Team */}
          <div>
            <label className="block text-sm font-medium text-tinta mb-2">
              {t('walkover.winningTeam')} *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="winningTeam"
                  value={Team.A}
                  checked={winningTeam === Team.A}
                  onChange={(e) => setWinningTeam(e.target.value)}
                  required
                  className="text-tinta focus:ring-tinta"
                />
                <span className="text-sm font-medium">{teamNames.teamA}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="winningTeam"
                  value={Team.B}
                  checked={winningTeam === Team.B}
                  onChange={(e) => setWinningTeam(e.target.value)}
                  required
                  className="text-tinta focus:ring-tinta"
                />
                <span className="text-sm font-medium">{teamNames.teamB}</span>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-tinta mb-1">
              {t('walkover.reason')} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder={t('walkover.reasonPlaceholder')}
              className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tinta focus:border-tinta resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-linea">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-11 px-4 py-2 border-[1.5px] border-tinta bg-fondo text-tinta rounded-boton text-sm font-bold ${AL_PASAR}`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 bg-aviso text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? '...' : t('walkover.confirm')}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalShell>
  );
};

export default WalkoverModal;
