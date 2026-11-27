import { Link } from 'react-router';
import { Users, CalendarClock, MapPin, Shield, Swords } from 'lucide-react';
import { CountryFlag } from '../../ui/CountryFlag';
import { formatDateRange } from '../../../services/competitions';
import PortadaDeTorneo from '../PortadaDeTorneo';
import { formatCountryName } from '../../../services/countries';
import { plazoQueSeEnseña } from '../../../domain/services/plazoDeInscripcion';
import NombrePequeno from '../../ui/NombrePequeno';
import { nombrePequeno } from '../../../utils/nombreVisible';
import { CompetitionStatusEnum } from '../../../domain/value_objects/CompetitionStatus';
import { Visibility } from '../../../domain/value_objects/Visibility';
import { SetupMode } from '../../../domain/value_objects/SetupMode';

/**
 * «Inscripción abierta hasta el 13 de noviembre a las 12:00» (15 nov 2026): el
 * día del campo, tal como lo manda el servidor, escrito en el idioma de la app.
 */
const textoDelPlazo = (competition, t, idioma) => {
  const plazo = plazoQueSeEnseña(competition, new Date());
  if (!plazo) return null;
  const dia = new Intl.DateTimeFormat(idioma, {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${plazo.dia}T00:00:00`));
  return t('detail.enrollmentOpenUntil', { dia, hora: plazo.hora });
};

/** Un dato de la ficha: su icono, qué es y cuánto vale. */
const Dato = ({ Icono, etiqueta, testId, children }) => (
  // `dt` y `dd`, hijos directos del grupo: con algo en medio la lista deja de
  // ser una lista de términos para los lectores de pantalla
  <div className="relative min-w-0 pl-8">
    <dt className="text-xs text-tinta-suave">
      <Icono
        className="absolute left-0 top-0.5 h-5 w-5 text-tinta-suave"
        aria-hidden="true"
      />
      {etiqueta}
    </dt>
    <dd data-testid={testId} className="text-sm font-semibold text-tinta">
      {children}
    </dd>
  </div>
);

/**
 * La tarjeta de cabecera de la ficha. Arriba, la portada del torneo con el
 * estado, la visibilidad, el nombre —el encabezado de nivel 1 de la pantalla,
 * en todos los anchos— y las fechas. Debajo, la sala de draft para el grupo,
 * los jugadores, la apertura programada o el plazo, el organizador y los países.
 */
const ResumenDeLaCompeticion = ({
  competition,
  t,
  i18n,
  isCreator,
  canManage,
  approvedCount,
  fechaDeAperturaLegible,
}) => {
  const plazo = textoDelPlazo(competition, t, i18n.language);
  const enJuego = competition.status === CompetitionStatusEnum.IN_PROGRESS;
  return (
    <div
      data-en-juego={enJuego || undefined}
      className={`overflow-hidden rounded-tarjeta border border-contorno ${enJuego ? 'bg-realce' : 'bg-tarjeta'}`}
    >
      {/* La portada, como en la lista de Torneos: la ilustración del torneo con
          un velo para que el nombre se lea, entero: la portada crece con él.
          Colores fijos —Sand sobre el velo—:
          es una imagen y no cambia con el tema */}
      <div className="relative min-h-44 md:min-h-56">
        <PortadaDeTorneo
          semilla={competition.id}
          className="absolute inset-0 h-full w-full"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-forest/95 via-forest/70 to-forest/25"
        />
        <div className="relative flex min-h-44 flex-col justify-between gap-6 p-4 md:min-h-56 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sand px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-forest">
              {competition.status && t(`status.${competition.status}`)}
            </span>
            {/* Junto al estado: quien la mira tiene que saber si le
              pueden encontrar o si entra solo quien es invitado (FE #664).
              Con fondo propio: ahí arriba el velo es fino, y sobre la
              portada de arena un contorno solo no se leía */}
            <span
              data-testid="visibilidad-competicion"
              className="rounded-full bg-forest/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sand"
            >
              {t(
                competition.visibility === Visibility.PUBLIC
                  ? 'detail.visibilityPublic'
                  : 'detail.visibilityPrivate',
              )}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="wrap-anywhere text-2xl font-black uppercase leading-tight tracking-wide text-sand md:text-4xl">
              {competition.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-sand">
              {formatDateRange(
                competition.startDate,
                competition.endDate,
                i18n.language,
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-6">
        {isCreator && (
          <p className="flex items-center gap-1.5 text-sm font-bold text-tinta">
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>{t('detail.creator')}</span>
          </p>
        )}

        {/* La sala de draft, para TODO el grupo y no solo para los dos
          capitanes: la gracia es que la ceremonia se vea en directo
          desde el móvil de cada uno (FE #653). Se ofrece cuando ya hay
          a quién elegir y todavía no hay equipos: después la sala ya
          terminó, y los equipos se ven en la agenda.

          A quien organiza no se le repite aquí: para él la sala es el
          siguiente paso y ya la ofrece el botón de arriba (FE #705) */}
        {!canManage &&
          competition.setupMode === SetupMode.RYDER_CUP &&
          competition.status === CompetitionStatusEnum.CLOSED &&
          !competition.teamsAssigned &&
          competition.captains?.teamA &&
          competition.captains?.teamB && (
            <Link
              to={`/competitions/${competition.id}/draft`}
              data-testid="ir-a-la-sala-de-draft"
              className="btn-primary flex min-h-11 items-center justify-center gap-2"
            >
              <Swords className="h-4 w-4" aria-hidden="true" />
              <span>{t('draft.open')}</span>
            </Link>
          )}

        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Dato Icono={Users} etiqueta={t('detail.players')}>
            {approvedCount} / {competition.maxPlayers || '∞'}
          </Dato>
          {/* Para todos, no solo el creador: quien la encuentra al explorar
            ve «Borrador» sin botón y tiene que saber cuándo podrá entrar */}
          {fechaDeAperturaLegible && (
            <Dato
              Icono={CalendarClock}
              etiqueta={t('detail.enrollment')}
              testId="apertura-programada"
            >
              {t('detail.enrollmentOpensOn', {
                fecha: fechaDeAperturaLegible,
              })}
            </Dato>
          )}
          {/* Hasta cuándo se apunta uno: las 12:00 del día anterior, hora del
            campo (15 nov 2026). Solo con la inscripción abierta */}
          {plazo && (
            <Dato
              Icono={CalendarClock}
              etiqueta={t('detail.enrollment')}
              testId="plazo-de-inscripcion"
            >
              {plazo}
            </Dato>
          )}
          {competition.creator && (
            <Dato Icono={Shield} etiqueta={t('detail.organizedBy')}>
              {competition.creator.displayName}
              <NombrePequeno texto={nombrePequeno(competition.creator)} />
            </Dato>
          )}
        </dl>

        {competition.countries && competition.countries.length > 0 && (
          <div className="flex items-start gap-3 border-t border-linea pt-4">
            <MapPin
              className="mt-0.5 h-5 w-5 shrink-0 text-tinta-suave"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs text-tinta-suave">
                {t('detail.countries')}
              </p>
              <div className="flex flex-wrap gap-2">
                {competition.countries.map((country) => (
                  <span
                    key={country.code}
                    className="inline-flex items-center gap-1.5 rounded-full border border-linea px-3 py-1 text-sm font-semibold text-tinta"
                  >
                    <CountryFlag
                      countryCode={country.code}
                      className="h-5 w-5"
                    />
                    <span>{formatCountryName(country, i18n.language)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumenDeLaCompeticion;
