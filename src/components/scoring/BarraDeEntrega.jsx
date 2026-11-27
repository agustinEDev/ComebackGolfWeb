import { useTranslation } from 'react-i18next';

/**
 * La barra de entregar la tarjeta, fija abajo en las tres pestañas (FE #745).
 *
 * El botón vivía solo en la pestaña Tarjeta y la pantalla abre en Anotar:
 * quien acababa el 18 no veía nada que le pidiera entregar, y los partidos se
 * quedaban abiertos. En la pantalla del partido no hay navegación inferior,
 * así que la barra ocupa ese sitio.
 *
 * @param {'entregar'|'faltaValidar'|'entregada'} estado
 * @param {string} [marcador] - El resultado, como en la cabecera
 * @param {Function} [onEntregar]
 * @param {boolean} [enviando]
 * @param {boolean} [esFoursomes] - La tarjeta es de la pareja
 * @param {string[]} [pendientes] - Quién falta por entregar
 * @param {boolean} [completado] - Ya no se espera a nadie
 * @param {boolean} [sePuedeSeguir] - Decidido con hoyos por jugar: se avisa de que
 *   se puede seguir, porque quien entrega a mitad deja fuera de su tarjeta los
 *   hoyos que anote después
 * @param {boolean} [dePartida] - Una partida de stroke play: «partida», no
 *   «partido» (QA del 11 oct 2026)
 * @param {boolean} [soloAnotado] - Todos los hoyos tienen golpe pero falta
 *   validarlos y nada lo ha decidido: no está terminado, y decirlo engañaba
 *   (Agustín, 16 oct)
 */
const BarraDeEntrega = ({
  estado,
  marcador,
  onEntregar,
  enviando = false,
  esFoursomes = false,
  pendientes = [],
  completado = false,
  sePuedeSeguir = false,
  dePartida = false,
  soloAnotado = false,
}) => {
  const { t } = useTranslation('scoring');
  const acabado = t(
    soloAnotado
      ? 'submit.allHolesScored'
      : dePartida
        ? 'submit.groupOver'
        : 'submit.matchOver',
  );

  return (
    <div
      data-testid="barra-de-entrega"
      role="region"
      aria-label={acabado}
      // Encima del aviso de instalar, que también flota abajo y la tapaba: se
      // apoya en el alto que publica (0 sin aviso). Con él debajo, el margen de
      // la zona segura ya lo guarda el aviso, que es quien toca el borde (FE #1240)
      className="fixed inset-x-0 bottom-[var(--alto-aviso-instalar,0px)] z-30 border-t border-linea bg-tarjeta px-4 pt-3 pb-[calc(0.75rem+max(0px,env(safe-area-inset-bottom)-var(--alto-aviso-instalar,0px)))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto max-w-2xl space-y-2">
        {estado === 'entregada' ? (
          <div className="space-y-0.5 text-center text-sm">
            <p className="font-semibold text-exito">
              {t(
                esFoursomes
                  ? 'submit.pairSubmitted'
                  : 'submit.alreadySubmitted',
              )}
            </p>
            {completado ? (
              <p className="text-tinta-suave">
                {t(
                  dePartida ? 'submit.groupCompleted' : 'submit.matchCompleted',
                )}
              </p>
            ) : (
              pendientes.length > 0 && (
                <p className="text-tinta-suave">
                  {esFoursomes
                    ? t('submit.waitingForPair', {
                        names: pendientes.join(' / '),
                      })
                    : t('submit.waitingForPlayers', {
                        count: pendientes.length,
                        names: pendientes.join(', '),
                      })}
                </p>
              )
            )}
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-bold text-tinta">{acabado}</p>
              {marcador && (
                <p className="min-w-0 truncate font-bold text-tinta">
                  {marcador}
                </p>
              )}
            </div>
            {estado === 'entregar' ? (
              <button
                type="button"
                onClick={onEntregar}
                disabled={enviando}
                className="w-full rounded-lg bg-contraste px-4 py-3 font-semibold text-sobre-contraste hover:opacity-90 disabled:opacity-50"
              >
                {t('submit.button')}
              </button>
            ) : (
              <p className="text-center text-sm text-tinta-suave">
                {t('submit.notReady')}
              </p>
            )}
            {sePuedeSeguir && (
              <p className="text-center text-xs text-tinta-suave">
                {t('submit.keepPlaying')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BarraDeEntrega;
