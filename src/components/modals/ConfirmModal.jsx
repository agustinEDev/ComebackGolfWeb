import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { alTocarElFondo } from '../ui/alTocarElFondo';

/**
 * Confirmation Modal Component
 * Reusable modal for confirmation dialogs with i18n support
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {string} props.title - Modal title (required)
 * @param {string} props.message - Confirmation message (required)
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {string} props.confirmText - Custom text for confirm button (optional)
 * @param {string} props.cancelText - Custom text for cancel button (optional)
 * @param {boolean} props.isDestructive - Whether action is destructive (red button)
 * @param {boolean} props.isLoading - Show loading state on confirm button
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDestructive = false,
  isLoading = false,
}) => {
  const { t } = useTranslation('common');
  const prevOverflowRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current overflow value before modifying
      prevOverflowRef.current = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous overflow value
      document.body.style.overflow = prevOverflowRef.current || '';
    }
    return () => {
      // Cleanup: restore previous overflow value
      if (prevOverflowRef.current !== null) {
        document.body.style.overflow = prevOverflowRef.current;
      }
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Default button texts (can be overridden)
  const defaultConfirmText = isDestructive ? t('modal.confirm') : t('modal.ok');
  const defaultCancelText = t('modal.cancel');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      // Tocar fuera cierra cuando cerraría Escape: no con la acción en vuelo
      {...alTocarElFondo(!isLoading && onCancel)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="bg-fondo rounded-tarjeta border border-contorno shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 id="modal-title" className="text-xl font-semibold text-tinta">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p
            id="modal-description"
            className="text-tinta-suave text-sm leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`w-full sm:w-auto px-4 py-2 border-[1.5px] border-tinta bg-fondo text-tinta rounded-boton text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${AL_PASAR}`}
          >
            {cancelText || defaultCancelText}
          </button>

          <button
            type="button"
            data-testid="confirm-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              w-full sm:w-auto px-4 py-2 rounded-boton text-sm font-bold transition-opacity hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isDestructive
                  ? 'bg-error text-sobre-contraste'
                  : 'bg-contraste text-sobre-contraste'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('modal.loading')}
              </span>
            ) : (
              confirmText || defaultConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
