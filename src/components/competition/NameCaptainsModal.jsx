import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ModalShell from '../ui/ModalShell';
import { formatoDeIndice } from '../../utils/formatoDeHandicap';

/**
 * Elegir a los dos capitanes, uno por equipo (FE #692).
 *
 * Se elige entre los inscritos aprobados, el organizador incluido: los
 * capitanes siempre juegan, y entre amigos quien organiza suele tirar del grupo
 * (BE #320). Quién puede ser capitán lo vuelve a comprobar el servidor;
 * aquí solo se ofrece lo que tiene sentido elegir.
 *
 * Dos desplegables y no una lista con casillas: son dos puestos con nombre, y
 * así el elegido en un equipo se puede quitar del otro sin reglas aparte.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{userId: string, name: string, handicap?: number|null}[]} props.players -
 *   Los inscritos aprobados, con el hándicap que cuenta en la competición
 * @param {{a: string, b: string}} props.teamNames
 * @param {{teamA: string|null, teamB: string|null}} props.current - Los de ahora
 * @param {boolean} props.closesEnrollment - Si nombrarlos va a cerrar las inscripciones
 * @param {boolean} [props.playersUnavailable] - Si la lista de inscritos no cargó
 * @param {(capitanes: {teamA: string, teamB: string}) => void} props.onConfirm
 * @param {() => void} props.onClose
 * @param {boolean} props.isLoading
 */
const NameCaptainsModal = ({
  isOpen,
  players,
  teamNames,
  current,
  closesEnrollment,
  playersUnavailable = false,
  onConfirm,
  onClose,
  isLoading,
}) => {
  const { t } = useTranslation('competitions');
  // Arranca con los capitanes de ese momento. Quien lo usa lo vuelve a montar
  // cada vez que lo abre (con `key`): un modal que se cerró a medias no puede
  // volver con una elección que ya no es la de nadie
  const [teamA, setTeamA] = useState(current?.teamA ?? '');
  const [teamB, setTeamB] = useState(current?.teamB ?? '');

  // Los dos, distintos, y de entre los que se ofrecen: el modal arranca con los
  // capitanes de ahora, y si la lista no cargó —o uno se retiró— esos dos siguen
  // en el estado sin tener opción que los represente. Confirmar mandaría lo que
  // nadie ha elegido. Sin lista no hay disponibles, así que esto lo cubre también
  const disponibles = new Set(players.map((p) => p.userId));
  // El mismo en los dos: «Nombrar» se apaga, y se dice por qué (#710)
  const elMismo = Boolean(teamA) && teamA === teamB;
  // Por hándicap, de menor a mayor, y a la vista: es con lo que se elige (#710)
  const enOrden = [...players].sort(
    (a, b) => (a.handicap ?? Infinity) - (b.handicap ?? Infinity),
  );
  const etiqueta = (p) =>
    p.handicap === null || p.handicap === undefined
      ? p.name
      : `${p.name} (${formatoDeIndice(p.handicap)})`;
  const listo = Boolean(
    teamA &&
    teamB &&
    teamA !== teamB &&
    disponibles.has(teamA) &&
    disponibles.has(teamB),
  );

  const selector = (id, nombreEquipo, valor, alCambiar, elegidoEnElOtro) => (
    <div className="flex flex-col gap-1 min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-tinta">
        {t('detail.captains.teamLabel', { team: nombreEquipo })}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        disabled={isLoading}
        className="w-full bg-fondo border border-borde rounded-lg px-3 py-2 text-sm"
      >
        <option value="">{t('detail.captains.choose')}</option>
        {enOrden.map((p) => (
          <option
            key={p.userId}
            value={p.userId}
            disabled={p.userId === elegidoEnElOtro}
          >
            {etiqueta(p)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      testId="modal-capitanes"
      labelledBy="capitanes-titulo"
      describedBy="capitanes-explicacion"
      closeOnEscape={!isLoading}
      busy={isLoading}
    >
      <div className="px-6 pt-6 pb-2">
        <h2 id="capitanes-titulo" className="text-xl font-semibold text-tinta">
          {t('detail.captains.title')}
        </h2>
        <p id="capitanes-explicacion" className="text-sm text-tinta-suave mt-1">
          {t('detail.captains.explanation')}
        </p>
        {closesEnrollment && (
          <p className="text-sm text-aviso mt-2">
            {t('detail.captains.closesEnrollment')}
          </p>
        )}
        {/* Sin la lista no hay a quién elegir: desplegables vacíos sin explicación
            dejarían al organizador sin saber qué pasa */}
        {playersUnavailable && (
          <p role="alert" className="text-sm text-error mt-2">
            {t('detail.captains.playersUnavailable')}
          </p>
        )}
      </div>

      <div className="px-6 py-4 flex flex-col gap-4">
        {selector('capitan-a', teamNames.a, teamA, setTeamA, teamB)}
        {selector('capitan-b', teamNames.b, teamB, setTeamB, teamA)}
        {elMismo && (
          <p
            data-testid="capitanes-el-mismo"
            role="alert"
            className="text-sm text-aviso"
          >
            {t('detail.captains.sameForBoth')}
          </p>
        )}
      </div>

      <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={`w-full sm:w-auto px-4 py-2 bg-tarjeta text-tinta rounded-lg text-sm font-medium disabled:opacity-50 ${AL_PASAR}`}
        >
          {t('detail.captains.cancel')}
        </button>
        <button
          type="button"
          onClick={() => onConfirm({ teamA, teamB })}
          disabled={!listo || isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-contraste text-sobre-contraste rounded-boton text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('detail.captains.confirm')}
        </button>
      </div>
    </ModalShell>
  );
};

export default NameCaptainsModal;
