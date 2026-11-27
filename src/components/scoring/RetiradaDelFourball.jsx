import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell from '../ui/ModalShell';

/**
 * La retirada de un jugador de un fourball de torneo (25 oct 2026, F2 y F3;
 * regla en BE #665). Qué botones salen lo decide `opcionesDeRetirada`.
 *
 * Retirar pide confirmación: cambia lo que cuenta y quién marca a quién.
 * Deshacer no: devuelve al jugador y lo cerrado sin él se queda como está.
 *
 * @param {object} props.opciones - De `opcionesDeRetirada`
 * @param {string} props.yo - El id de quien mira
 * @param {(playerId: string, opciones: {deshacer: boolean}) => void} props.onRetirar
 * @param {boolean} props.enviando
 */
const RetiradaDelFourball = ({ opciones, yo, onRetirar, enviando }) => {
  const { t } = useTranslation('scoring');
  // A quién se va a retirar mientras se confirma
  const [porConfirmar, setPorConfirmar] = useState(null);
  const { pareja, retirarme, retirarPareja, volver, deshacerPareja } = opciones;
  if (!retirarme && !retirarPareja && !volver && !deshacerPareja) return null;

  const boton =
    'w-full min-h-11 px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-40';

  return (
    <div data-testid="retirada-del-fourball" className="space-y-2">
      {volver && (
        <div className="bg-tarjeta border border-aviso rounded-lg p-4 text-sm space-y-3">
          <p className="font-medium text-aviso">
            {t('withdraw.youAreWithdrawn')}
          </p>
          <button
            type="button"
            disabled={enviando}
            onClick={() => onRetirar(yo, { deshacer: true })}
            className={`${boton} bg-tarjeta border-aviso text-aviso hover:bg-fondo`}
          >
            {t('withdraw.comeBack')}
          </button>
        </div>
      )}
      {deshacerPareja && pareja && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => onRetirar(pareja.userId, { deshacer: true })}
          className={`${boton} bg-tarjeta border-linea text-tinta ${AL_PASAR}`}
        >
          {t('withdraw.undoPartner', { nombre: pareja.userName })}
        </button>
      )}
      {retirarPareja && pareja && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => setPorConfirmar(pareja.userId)}
          className={`${boton} bg-tarjeta border-error text-error hover:bg-fondo`}
        >
          {t('withdraw.withdrawPartner', { nombre: pareja.userName })}
        </button>
      )}
      {retirarme && (
        <button
          type="button"
          disabled={enviando}
          onClick={() => setPorConfirmar(yo)}
          className={`${boton} bg-tarjeta border-error text-error hover:bg-fondo`}
        >
          {t('withdraw.withdrawMe')}
        </button>
      )}

      <ModalShell
        isOpen={porConfirmar !== null}
        onClose={() => setPorConfirmar(null)}
        testId="retirada-confirmacion"
        labelledBy="retirada-titulo"
        describedBy="retirada-mensaje"
      >
        <h2
          id="retirada-titulo"
          className="text-lg font-semibold text-tinta mb-2"
        >
          {t('withdraw.confirmTitle')}
        </h2>
        <p id="retirada-mensaje" className="text-sm text-tinta-suave mb-4">
          {t('withdraw.confirmMessage')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setPorConfirmar(null)}
            className={`px-4 py-2 text-sm font-medium text-tinta bg-tarjeta rounded-lg ${AL_PASAR}`}
          >
            {t('withdraw.cancel')}
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={() => {
              const quien = porConfirmar;
              setPorConfirmar(null);
              onRetirar(quien, { deshacer: false });
            }}
            className="px-4 py-2 text-sm font-medium text-sobre-contraste bg-error rounded-lg hover:opacity-90"
          >
            {t('withdraw.confirmYes')}
          </button>
        </div>
      </ModalShell>
    </div>
  );
};

export default RetiradaDelFourball;
