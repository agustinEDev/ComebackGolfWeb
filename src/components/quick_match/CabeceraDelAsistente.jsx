import { X } from 'lucide-react';

/**
 * La cabecera del asistente de partida rápida: el título («Nueva partida» o
 * «Repetir partida»), en qué paso va y la X para cerrar, que no se puede
 * pulsar mientras se crea la partida.
 */
const CabeceraDelAsistente = ({
  titulo,
  pasoActual,
  t,
  etiquetaCerrar,
  onClose,
  isProcessing,
}) => (
  <div className="flex items-center justify-between p-4 border-b border-linea">
    <div>
      <h2
        id="quick-match-modal-title"
        className="text-lg font-semibold text-tinta"
      >
        {titulo}
      </h2>
      <p className="text-xs text-tinta-suave">
        {t('create.step', { current: pasoActual, total: 4 })}
      </p>
    </div>
    <button
      type="button"
      onClick={onClose}
      aria-label={etiquetaCerrar}
      disabled={isProcessing}
      className="text-tinta-suave transition-colors transition-colors hover:text-tinta"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
);

export default CabeceraDelAsistente;
