import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Team } from '../../domain/value_objects/Team';
import { CLASE_DE_MEJOR_BOLA } from './claseDeMejorBola';

const CABECERA_DEL_EQUIPO = {
  [Team.A]: 'bg-team-a-suave/65 border-b-2 border-team-a',
  [Team.B]: 'bg-team-b-suave/65 border-b-2 border-team-b',
};

/**
 * Una tarjeta en el móvil: los hoyos de arriba abajo (FE #739).
 *
 * Solo dibuja. Quien la usa decide qué va en cada casilla —figura, puntos,
 * neto, golpes recibidos— y qué dice el resultado de cada hoyo: la misma pieza
 * sirve a la tarjeta de competición y a la de partida rápida, que hasta ahora
 * repetían cada cambio visual por separado (FE #746).
 *
 * @param {string} clave - Identifica las filas: `fila-<clave>-<hoyo>`
 * @param {string} testId - El de la tarjeta entera
 * @param {ReactNode} cabecera - Nombre y lo que haga falta debajo
 * @param {'A'|'B'|null} equipo - Color de la cabecera
 * @param {Array} hoyos - `{ holeNumber, par, strokeIndex, casilla, resultado?, mejorBola? }`
 * @param {{ ida?: number, vuelta?: number, total: number }} sumas
 * @param {boolean} conResultado - Si hay columna de quién se llevó el hoyo
 * @param {string} [columnaExtra] - Título de una columna más tras los golpes
 *   (los puntos Stableford, el neto en Medal); cada hoyo trae su `extra`
 * @param {{ ida?: ReactNode, vuelta?: ReactNode, total?: ReactNode }} [sumasExtra]
 *   - Lo que va en la columna extra de cada fila de suma
 */
const TarjetaVertical = ({
  clave,
  testId,
  cabecera,
  equipo,
  hoyos,
  sumas,
  conResultado = false,
  columnaExtra,
  sumasExtra,
}) => {
  const { t } = useTranslation('scoring');

  const filaDeSuma = (nombre, etiqueta, valor) => (
    <tr className="bg-tarjeta/65 border-y border-linea">
      <td
        colSpan={3}
        className="px-3 py-1.5 text-left text-[11px] font-bold text-tinta-suave"
      >
        {etiqueta}
      </td>
      <td
        data-testid={`suma-${nombre}`}
        className="py-1.5 text-center font-bold text-tinta"
      >
        {valor || '-'}
      </td>
      {columnaExtra && (
        <td data-testid={`suma-extra-${nombre}`} className="py-1.5 text-center">
          {sumasExtra?.[nombre] ?? '-'}
        </td>
      )}
      {conResultado && <td />}
    </tr>
  );

  return (
    <div
      data-testid={testId}
      // Translúcida, al 65 %: deja ver la marca de agua de la pantalla, que va
      // fija detrás (Agustín, 26 nov 2026). Solo los fondos; la letra, entera.
      // El fondo NO va aquí sino en cada franja (cabecera, filas, sumas): con
      // uno en la caja y otro encima, las franjas dejaban pasar un 12 %, no un
      // 35 %, y cortaban el dibujo en bandas
      className="rounded-xl border border-linea overflow-hidden"
    >
      <div
        className={`px-3 py-2 ${CABECERA_DEL_EQUIPO[equipo] ?? 'bg-tarjeta/65 border-b border-linea'}`}
      >
        {cabecera}
      </div>
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="border-b border-linea bg-fondo/65 text-[11px] text-tinta-suave">
            <th className="py-1.5 font-semibold">{t('scorecard.hole')}</th>
            <th className="py-1.5 font-semibold">{t('scorecard.par')}</th>
            <th className="py-1.5 font-semibold">{t('scorecard.si')}</th>
            <th className="py-1.5 font-semibold">{t('scorecard.strokes')}</th>
            {columnaExtra && (
              <th className="py-1.5 font-semibold">{columnaExtra}</th>
            )}
            {conResultado && (
              <th className="py-1.5 font-semibold">{t('scorecard.result')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {hoyos.map((h) => (
            <Fragment key={h.holeNumber}>
              <tr
                data-testid={`fila-${clave}-${h.holeNumber}`}
                data-mejor-bola={String(Boolean(h.mejorBola))}
                // La mejor bola sigue opaca, por contraste (`claseDeMejorBola`)
                className={`border-b border-linea ${h.mejorBola ? CLASE_DE_MEJOR_BOLA : 'bg-fondo/65'}`}
              >
                <td className="w-10 py-0.5 text-center font-bold text-tinta">
                  {h.holeNumber}
                </td>
                <td
                  data-testid="par"
                  className="w-10 py-0.5 text-center text-tinta-suave"
                >
                  {h.par}
                </td>
                <td
                  data-testid="hcp"
                  className="w-10 py-0.5 text-center text-tinta-suave"
                >
                  {h.strokeIndex}
                </td>
                <td className="py-0.5 text-center">{h.casilla}</td>
                {columnaExtra && (
                  <td data-testid="extra" className="w-12 py-0.5 text-center">
                    {h.extra}
                  </td>
                )}
                {conResultado && (
                  <td className="w-16 py-0.5 pr-2 text-center">
                    <span
                      data-testid="resultado"
                      className={`block rounded-md py-0.5 text-[10.5px] font-bold ${h.resultado?.clase ?? ''}`}
                    >
                      {h.resultado?.texto ?? ''}
                    </span>
                  </td>
                )}
              </tr>
              {h.holeNumber === 9 &&
                sumas.ida != null &&
                filaDeSuma('ida', t('scorecard.out'), sumas.ida)}
            </Fragment>
          ))}
          {sumas.vuelta != null &&
            filaDeSuma('vuelta', t('scorecard.in'), sumas.vuelta)}
          {filaDeSuma('total', t('scorecard.total'), sumas.total)}
        </tbody>
      </table>
    </div>
  );
};

export default TarjetaVertical;
