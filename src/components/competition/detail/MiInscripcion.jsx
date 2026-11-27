import {
  BOLA_ENCENDIDA,
  CARRIL_ENCENDIDO,
} from '../../ui/clasesDeComportamiento';
import { AlertCircle } from 'lucide-react';
import { getEnrollmentStatusColor } from '../../../services/competitions';
import { etiquetaDeInscripcion } from '../../../utils/etiquetaDeInscripcion';
import { diaCortoDeLaFicha } from '../../../utils/fichaDeLaCompeticion';
import EnrollmentStatus from '../../../domain/value_objects/EnrollmentStatus';

/**
 * El estado de la inscripción propia (o su puesto en una espera) y, si tiene
 * alias, con qué nombre sale en ESTA competición (FE #571).
 */
const MiInscripcion = ({
  competition,
  user,
  // El género llega leído por la página, que es la que figura en la auditoría de la
  // copia sin conexión (copiaDelUsuarioSinConexion.test.js): no leer aquí user.gender
  generoDelUsuario,
  t,
  i18n,
  isCreator,
  userEnrollment,
  soloEspero,
  miEspera,
  puestoEnEspera,
  puedeElegirNombre,
  nombreFijoEnPublica,
  usaSuAlias,
  nombreLegal,
  savingNamePreference,
  handleToggleNamePreference,
}) => (
  <div className="p-4">
    <div className="rounded-tarjeta border border-contorno bg-realce p-4">
      <div className="flex flex-wrap items-center gap-2">
        <AlertCircle
          className="h-5 w-5 shrink-0 text-tinta"
          aria-hidden="true"
        />
        <span className="font-semibold text-tinta">
          {t('detail.enrollmentStatus')}
        </span>
        {soloEspero ? (
          <span
            data-testid="estado-en-espera"
            className="px-3 py-1 rounded-full text-xs font-semibold border border-current text-aviso"
          >
            {t('detail.waitingListStatus', {
              position: puestoEnEspera,
              time: miEspera.teeSheet.firstTeeTime,
              day: diaCortoDeLaFicha(miEspera.roundDate, i18n?.language),
            })}
          </span>
        ) : (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getEnrollmentStatusColor(
              userEnrollment?.status || competition.enrollment_status,
            )}`}
          >
            {(userEnrollment?.status || competition.enrollment_status) &&
              etiquetaDeInscripcion(
                t,
                userEnrollment?.status || competition.enrollment_status,
                generoDelUsuario,
              )}
          </span>
        )}
      </div>

      {/* No sale por su cuenta: quien quita es el organizador (29 oct 2026) */}
      {!isCreator &&
        competition.teamsAssigned &&
        (userEnrollment?.status || competition.enrollment_status) ===
          EnrollmentStatus.APPROVED && (
          <p className="mt-2 text-sm text-tinta">
            {t('detail.teamsFormed.enrolled')}
          </p>
        )}

      {/* En una pública no se elige: delante el nombre real y el alias debajo */}
      {nombreFijoEnPublica && (
        <p
          data-testid="nombre-fijo-en-publica"
          className="mt-3 pt-3 border-t border-linea text-sm text-tinta"
        >
          {t('detail.namePreference.publicShowsRealName', {
            realName: nombreLegal,
            alias: user.alias,
          })}
        </p>
      )}

      {puedeElegirNombre && (
        <div className="mt-3 pt-3 border-t border-linea">
          <div className="flex items-center justify-between gap-3">
            <span
              id="name-preference-label"
              className="text-sm font-semibold text-tinta"
            >
              {t('detail.namePreference.label')}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={usaSuAlias}
              aria-labelledby="name-preference-label"
              aria-describedby="name-preference-help"
              disabled={savingNamePreference}
              onClick={() =>
                handleToggleNamePreference(userEnrollment.id, usaSuAlias)
              }
              className={`relative w-11 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                usaSuAlias ? CARRIL_ENCENDIDO : 'bg-borde'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${
                  usaSuAlias ? `translate-x-5 ${BOLA_ENCENDIDA}` : 'bg-fondo'
                }`}
              />
            </button>
          </div>
          <p
            id="name-preference-help"
            className="mt-2 text-sm text-tinta-suave"
          >
            {usaSuAlias
              ? t('detail.namePreference.helpUsingAlias', {
                  realName: nombreLegal,
                  alias: user.alias,
                })
              : t('detail.namePreference.helpUsingRealName', {
                  realName: nombreLegal,
                  alias: user.alias,
                })}
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            {t('detail.namePreference.visibility')}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default MiInscripcion;
