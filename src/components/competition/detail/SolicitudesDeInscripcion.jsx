import { AlertCircle, UserX, ChevronRight } from 'lucide-react';
import TituloConNumero from '../../ui/TituloConNumero';
import { formatoDeIndice } from '../../../utils/formatoDeHandicap';
import NombrePequeno from '../../ui/NombrePequeno';
import EnrollmentStatus from '../../../domain/value_objects/EnrollmentStatus';

/**
 * Las solicitudes pendientes (aprobar o rechazar) y las rechazadas, plegadas.
 * Solo las ve quien organiza.
 */
const SolicitudesDeInscripcion = ({
  competition,
  enrollments,
  t,
  i18n,
  isFull,
  handleApproveEnrollment,
  handleRejectEnrollment,
}) => (
  <div className="px-4 space-y-4">
    {/* Pending Requests Section */}
    {enrollments.filter((e) => e.status === EnrollmentStatus.REQUESTED).length >
      0 && (
      <div className="bg-tarjeta border border-aviso rounded-tarjeta p-5">
        <h3 className="text-tinta font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-none text-aviso" />
          <TituloConNumero
            texto={t('detail.pendingRequests')}
            numero={
              enrollments.filter((e) => e.status === EnrollmentStatus.REQUESTED)
                .length
            }
          />
        </h3>

        <div className="space-y-3">
          {enrollments
            .filter((e) => e.status === EnrollmentStatus.REQUESTED)
            .map((enrollment) => (
              <div
                key={enrollment.id}
                data-testid={`pendiente-${enrollment.userId}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border border-aviso rounded-lg bg-fondo"
              >
                {/* `min-w-0` y el correo partible: uno largo se salía
                    de la tarjeta (FE #744, gemelo de las rechazadas) */}
                <div className="flex-1 min-w-0">
                  <p className="text-tinta font-semibold break-words">
                    {enrollment.userName || t('detail.unknownUser')}
                  </p>
                  <NombrePequeno texto={enrollment.userSubName} />
                  <p className="text-tinta-suave text-sm wrap-anywhere">
                    {enrollment.userEmail || t('detail.noEmail')}
                  </p>
                  {enrollment.userHandicap !== null &&
                    enrollment.userHandicap !== undefined && (
                      <p className="text-tinta-suave text-sm mt-1">
                        {t('detail.handicapLabel', {
                          handicap: formatoDeIndice(
                            enrollment.userHandicap,
                            i18n.language,
                          ),
                        })}
                      </p>
                    )}
                </div>
                <div className="flex w-full gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
                  <button
                    onClick={() => handleApproveEnrollment(enrollment.id)}
                    disabled={isFull}
                    className={`min-h-11 rounded-boton px-4 py-2 text-sm font-bold transition-[filter] ${
                      isFull
                        ? 'cursor-not-allowed bg-linea text-tinta-suave'
                        : 'bg-exito text-sobre-contraste hover:brightness-90'
                    }`}
                    title={
                      isFull
                        ? t('detail.competitionFull', {
                            max: competition.maxPlayers,
                          })
                        : t('detail.approve')
                    }
                  >
                    ✓ {t('detail.approve')}
                  </button>
                  <button
                    onClick={() => handleRejectEnrollment(enrollment.id)}
                    className="min-h-11 rounded-boton bg-error px-4 py-2 text-sm font-bold text-sobre-contraste transition-[filter] hover:brightness-90"
                    title={t('detail.reject')}
                  >
                    ✗ {t('detail.reject')}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    )}

    {/* Solicitudes rechazadas, plegadas (FE #744). En gris: un rechazo
        no es un error. Flecha propia en vez del triángulo del
        navegador, que iba suelto en su línea, y filas que no se
        salen de su tarjeta aunque el correo sea largo */}
    {enrollments.some((e) => e.status === EnrollmentStatus.REJECTED) && (
      <details
        data-testid="solicitudes-rechazadas"
        className="group bg-tarjeta border border-contorno rounded-tarjeta"
      >
        <summary className="flex items-center gap-3 p-4 cursor-pointer list-none rounded-tarjeta hover:bg-fondo [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-tinta">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-fondo text-tinta-suave">
            <UserX className="h-4 w-4" aria-hidden="true" />
          </span>
          <TituloConNumero
            texto={t('detail.rejectedRequests')}
            numero={
              enrollments.filter((e) => e.status === EnrollmentStatus.REJECTED)
                .length
            }
            claseDelTexto="font-semibold text-tinta"
          />
          <ChevronRight
            className="h-4 w-4 flex-none text-tinta-suave transition-transform group-open:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </summary>
        <div className="space-y-2 border-t border-linea px-4 pb-4 pt-3">
          {enrollments
            .filter((e) => e.status === EnrollmentStatus.REJECTED)
            .map((enrollment) => (
              <div
                key={enrollment.id}
                data-testid={`rechazada-${enrollment.userId}`}
                className="flex items-start gap-3 rounded-lg border border-linea bg-fondo p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-tinta break-words">
                    {enrollment.userName || t('detail.unknownUser')}
                  </p>
                  <NombrePequeno texto={enrollment.userSubName} />
                  <p className="text-xs text-tinta-suave wrap-anywhere">
                    {enrollment.userEmail || t('detail.noEmail')}
                  </p>
                </div>
                <span className="flex-none rounded-full border border-current px-2 py-0.5 text-[10.5px] font-bold tracking-wide text-tinta-suave">
                  {t('detail.rejected')}
                </span>
              </div>
            ))}
        </div>
      </details>
    )}
  </div>
);

export default SolicitudesDeInscripcion;
