import { Edit, CheckCircle, XCircle, Undo2, UserMinus } from 'lucide-react';
import CaptainBadge from '../CaptainBadge';
import CampoDeHandicap from '../../ui/CampoDeHandicap';
import { formatoDeIndice } from '../../../utils/formatoDeHandicap';
import {
  SE_PUEDE_QUITAR,
  conFijado,
  equipoDe,
  esCapitan,
} from '../../../utils/fichaDeLaCompeticion';
import NombrePequeno from '../../ui/NombrePequeno';

/**
 * Un inscrito aprobado en la lista de la ficha: su nombre, capitanía o equipo,
 * su hándicap (con el editor del personalizado) y, para quien organiza, el
 * botón de quitarle.
 */
const FilaDeAprobado = ({
  enrollment,
  competition,
  t,
  i18n,
  canManage,
  esStrokePlay,
  reparto,
  sinHandicap,
  hayVariasCategorias,
  canEditHandicap,
  editingHandicapId,
  handicapInput,
  setHandicapInput,
  savingHandicapId,
  revertingHandicapId,
  handleStartEditHandicap,
  handleSaveHandicap,
  handleCancelEditHandicap,
  handleRevertToRfegHandicap,
  quitandoId,
  handleQuitar,
  puedeVerSusBarras,
  onAbrirBarras,
}) => {
  const editando = editingHandicapId === enrollment.id;
  const equipo =
    !esCapitan(competition.captains, enrollment.userId) &&
    equipoDe(reparto, competition, enrollment.userId);
  // El hándicap va a la derecha del nombre; al editarlo baja a su propia
  // línea, que el campo con sus botones no cabe al lado a 360 px
  const handicap = (
    <div
      className={`flex items-center gap-1.5 ${editando ? 'mt-1.5' : 'shrink-0'}`}
    >
      {editando ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <CampoDeHandicap
            aria-label={t('detail.editHandicap')}
            value={handicapInput}
            onChange={setHandicapInput}
            autoFocus
            className="w-20 px-2 py-1 border border-linea rounded text-sm focus:outline-none focus:ring-2 focus:ring-tinta"
          />
          <button
            type="button"
            onClick={() => handleSaveHandicap(enrollment.id)}
            disabled={savingHandicapId === enrollment.id}
            className="text-exito disabled:opacity-50"
            title={t('detail.saveHandicap')}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancelEditHandicap}
            disabled={
              savingHandicapId === enrollment.id ||
              revertingHandicapId === enrollment.id
            }
            className="text-tinta-suave disabled:opacity-50"
            title={t('detail.cancelHandicap')}
          >
            <XCircle className="w-4 h-4" />
          </button>
          {enrollment.hasCustomHandicap &&
            enrollment.userCountryCode === 'ES' && (
              <button
                type="button"
                onClick={() => handleRevertToRfegHandicap(enrollment.id)}
                disabled={
                  savingHandicapId === enrollment.id ||
                  revertingHandicapId === enrollment.id
                }
                className="text-tinta disabled:opacity-50"
                title={t('detail.revertToRfegHandicap')}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
        </div>
      ) : (
        <>
          {conFijado(esStrokePlay, enrollment) ? (
            <span
              data-testid={`fijado-${enrollment.userId}`}
              className="text-sm font-semibold text-tinta tabular-nums"
            >
              {t(
                enrollment.category != null && hayVariasCategorias
                  ? 'detail.fixedHandicap'
                  : 'detail.fixedHandicapNoCategory',
                {
                  handicap: formatoDeIndice(
                    enrollment.fixedHandicap,
                    i18n.language,
                  ),
                  categoria: enrollment.category,
                },
              )}
            </span>
          ) : enrollment.hasCustomHandicap ? (
            <span className="text-sm font-semibold text-tinta tabular-nums">
              {t('detail.handicapLabel', {
                handicap: formatoDeIndice(
                  enrollment.customHandicap,
                  i18n.language,
                ),
              })}{' '}
              <span className="px-1.5 py-0.5 border border-current text-aviso rounded text-xs font-semibold">
                {t('detail.customHandicapBadge')}
              </span>
            </span>
          ) : enrollment.userHandicap !== null &&
            enrollment.userHandicap !== undefined ? (
            <span className="text-sm font-semibold text-tinta tabular-nums">
              {t('detail.handicapLabel', {
                handicap: formatoDeIndice(
                  enrollment.userHandicap,
                  i18n.language,
                ),
              })}
            </span>
          ) : (
            <span className="text-sm text-tinta-suave">
              {t('detail.noHandicap')}
            </span>
          )}
          {canEditHandicap && (
            <button
              type="button"
              onClick={() => handleStartEditHandicap(enrollment)}
              className="-my-3 -mr-2 flex h-11 w-9 items-center justify-center text-tinta-suave hover:text-tinta"
              title={t('detail.editHandicap')}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div
      data-testid={`aprobado-${enrollment.userId}`}
      data-sin-handicap={sinHandicap.has(enrollment.userId) || undefined}
      className="flex items-center gap-2 rounded-tarjeta border border-linea bg-fondo px-3 py-2"
    >
      {/* Fila compacta (Agustín, en el iPhone, 24 nov 2026): nombre y hándicap
          en una línea; debajo, en otra, lo demás. Antes cada dato iba en su
          renglón y cada inscrito ocupaba media pantalla.

          `min-w-0`: sin él, la etiqueta de capitán con el nombre largo de un
          equipo estiraba la tarjeta y la ficha entera se salía por la derecha
          a 360 px (FE #692) */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="min-w-[55%] flex-1 break-words font-semibold text-tinta">
            {enrollment.userName || t('detail.unknownUser')}
          </p>
          {!editando && handicap}
        </div>
        <NombrePequeno
          texto={enrollment.userSubName}
          className="text-tinta-suave"
        />
        <div className="flex flex-wrap items-center gap-x-2">
          <CaptainBadge
            userId={enrollment.userId}
            captains={competition.captains}
            teamNames={{ a: competition.team1Name, b: competition.team2Name }}
          />
          {/* Con el reparto hecho, el equipo de cada uno: sin esto solo los
              capitanes lo decían (#710). El capitán ya lo dice con su insignia */}
          {equipo && (
            <span
              data-testid="equipo-del-aprobado"
              className="mt-1 inline-flex max-w-full rounded-full border border-linea px-2 py-0.5 text-xs font-medium text-tinta-suave"
            >
              <span className="min-w-0 truncate">{equipo}</span>
            </span>
          )}
          {/* Que se vea a quién le falta, no solo en un atributo (revisor) */}
          {sinHandicap.has(enrollment.userId) && (
            <span className="mt-1 inline-flex rounded-full border border-current px-2 py-0.5 text-xs font-semibold text-aviso">
              {t('detail.missingHandicapBadge')}
            </span>
          )}
          {/* Sus barras (barras por campo): organizador, admin o el capitán de
              su equipo, también para solo verlas; se leen al abrir, no al
              cargar la ficha. El margen negativo le da 44 px de alto al dedo
              sin hacer más alta la fila */}
          {puedeVerSusBarras?.(enrollment) && (
            <button
              type="button"
              data-testid={`barras-de-${enrollment.userId}`}
              onClick={() => onAbrirBarras(enrollment)}
              className="-mb-3 -mt-2 flex min-h-11 items-center text-xs font-semibold text-tinta underline"
            >
              {t('tees.playerButton')}
            </button>
          )}
        </div>
        {editando && handicap}
      </div>
      {enrollment.team && (
        <span className="shrink-0 rounded-lg bg-contraste px-2 py-1 text-xs font-semibold text-sobre-contraste">
          {enrollment.team}
        </span>
      )}
      {/* Quitarle (release social 2): quien organiza, antes de
        empezar, a cualquiera menos a sí mismo */}
      {canManage &&
        SE_PUEDE_QUITAR.has(competition.status) &&
        enrollment.userId !== competition.creatorId && (
          <button
            type="button"
            data-testid={`quitar-${enrollment.userId}`}
            onClick={() => handleQuitar(enrollment)}
            disabled={quitandoId !== null}
            aria-label={t('detail.removePlayerAria', {
              nombre: enrollment.userName || t('detail.unknownUser'),
            })}
            className="-my-1 -mr-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-tinta-suave hover:bg-tarjeta hover:text-error disabled:opacity-50"
          >
            <UserMinus className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
    </div>
  );
};

export default FilaDeAprobado;
