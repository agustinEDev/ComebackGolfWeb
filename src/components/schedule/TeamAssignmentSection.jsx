import { Users } from 'lucide-react';
import { formatoDeIndice } from '../../utils/formatoDeHandicap';
import { CompetitionStatusEnum } from '../../domain/value_objects/CompetitionStatus';
import EnrollmentStatus from '../../domain/value_objects/EnrollmentStatus';
import { Team } from '../../domain/value_objects/Team';

const TeamAssignmentSection = ({
  teamAssignment,
  onAssignTeams,
  onUndoTeams,
  sePuedenDeshacer,
  onFillCaptain,
  canManage,
  playerNameMap,
  enrollments,
  teamNames,
  maxPlayingHandicap,
  captains,
  status,
  inscritosSinCargar = false,
  t,
}) => {
  // Quién capitanea cada equipo, y quién es su segundo (FE #692): esta es la
  // pantalla donde se preparan las sesiones, y las parejas las monta el capitán
  // Un equipo puede quedarse sin capitán: si se retira tras el reparto y no
  // había subcapitán, repartir otra vez pide los dos y nombrarlos ya no se
  // puede (BE #320). El organizador cubre el puesto desde aquí.
  //
  // «Sin capitán» se decide contra los que siguen inscritos, como hace el
  // servidor: una baja con el torneo en marcha no le quita el puesto, así que
  // al volver a CERRADA el capitán figura pero ya no juega.
  //
  // Y solo mientras se prepara: en juego o terminado el servidor lo rechaza,
  // y ofrecerlo sería mandar al organizador a un error
  const inscritos = new Set(
    (enrollments || [])
      .filter((e) => e.status === EnrollmentStatus.APPROVED)
      .map((e) => e.userId),
  );
  const sePuedeCubrir = [
    CompetitionStatusEnum.ACTIVE,
    CompetitionStatusEnum.CLOSED,
  ].includes(status);
  const sinCapitan = (equipo) => {
    if (!captains || !sePuedeCubrir || inscritosSinCargar) return false;
    const capitan = equipo === Team.A ? captains.teamA : captains.teamB;
    return !capitan || !inscritos.has(capitan);
  };
  // Sin la lista no se sabe quién sigue: solo consta que falta el que no está
  // nombrado, y para cubrirlo hay que recargar (31 oct 2026)
  const faltaSinLista = (equipo) =>
    inscritosSinCargar &&
    sePuedeCubrir &&
    Boolean(captains) &&
    !(equipo === Team.A ? captains.teamA : captains.teamB);

  // Sin el nombre del equipo: cada lista ya lo lleva en su título, y uno largo
  // dejaba la etiqueta en «Capitán de E...»
  // Mirando también en qué equipo se pinta: repartir de nuevo libera los
  // subcapitanes en el servidor, y hasta que la pantalla se entere la etiqueta
  // no puede aparecer en el equipo contrario
  const papelDe = (playerId, equipo) => {
    if (!captains) return null;
    const capitan = equipo === Team.A ? captains.teamA : captains.teamB;
    const subcapitan =
      equipo === Team.A ? captains.viceTeamA : captains.viceTeamB;
    if (playerId === capitan) return t('teams.captainTag');
    if (playerId === subcapitan) return t('teams.viceCaptainTag');
    return null;
  };
  // Sin nombre (la lista no cargó), «Jugador N» por su puesto en el equipo:
  // nunca el UUID
  const nombreDe = (playerId, posicion) =>
    playerNameMap.get(playerId) ||
    t('unnamedPlayerNumbered', { numero: posicion + 1 });

  // Build handicap lookup from enrollments
  const handicapMap = new Map();
  (enrollments || []).forEach((e) => {
    if (!e.userId) return;
    const effectiveHandicap = e.hasCustomHandicap
      ? e.customHandicap
      : e.userHandicap;
    if (effectiveHandicap != null) {
      handicapMap.set(e.userId, Number(effectiveHandicap));
    }
  });

  const renderHandicap = (playerId, colorClass) => {
    if (!handicapMap.has(playerId)) return null;
    const hcp = handicapMap.get(playerId);
    const isLimited = maxPlayingHandicap != null && hcp > maxPlayingHandicap;
    // Sin encoger ni partirse: junto a un nombre largo, a 360 px, «HCP 18.0»
    // saltaba a dos líneas (#710)
    return (
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
        <span className={`text-xs ${colorClass} font-medium`}>
          {t('handicapLabels.index', { value: formatoDeIndice(hcp) })}
        </span>
        {isLimited && (
          <span className="text-xs text-aviso font-medium">
            | {t('handicapLabels.limit', { value: maxPlayingHandicap })}
          </span>
        )}
      </span>
    );
  };
  if (!teamAssignment) {
    return (
      <div className="bg-tarjeta border border-contorno rounded-tarjeta p-5">
        <h3 className="text-tinta font-bold text-lg mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-tinta" />
          {t('teams.title')}
        </h3>
        <div className="text-center py-6">
          <Users className="w-10 h-10 text-tinta-suave mx-auto mb-2" />
          <p className="text-tinta-suave mb-4">{t('teams.noTeamsAssigned')}</p>
          {canManage && (
            <button
              onClick={onAssignTeams}
              className="px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium transition-opacity hover:opacity-90"
            >
              {t('teams.assign')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const teamA = teamAssignment.teamAPlayerIds || [];
  const teamB = teamAssignment.teamBPlayerIds || [];

  return (
    <div className="bg-tarjeta border border-contorno rounded-tarjeta p-5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h3 className="text-tinta font-bold text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-tinta" />
          {t('teams.title')}
        </h3>
        {teamAssignment.mode && (
          <span className="text-xs text-tinta-suave">
            {/* Con `defaultValue`, un modo que el backend añada mañana y
                nadie traduzca todavía sale con su nombre en vez de con la
                clave: i18next devuelve la clave cuando no la encuentra, y eso
                acaba en pantalla tal cual */}
            {t('teams.mode')}:{' '}
            {t(`teams.${teamAssignment.mode.toLowerCase()}`, {
              defaultValue: teamAssignment.mode,
            })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A */}
        <div className="bg-team-a-suave rounded-lg p-4 border border-team-a">
          <h4 className="font-semibold text-team-a mb-2">
            {teamNames.teamA} (
            {t('teams.playersCount', { count: teamA.length })})
          </h4>
          <ul className="space-y-1.5">
            {teamA.map((playerId, posicion) => (
              <li
                key={playerId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-tinta min-w-0">
                  {nombreDe(playerId, posicion)}
                  {papelDe(playerId, Team.A) && (
                    <span className="block text-xs text-aviso truncate">
                      {papelDe(playerId, Team.A)}
                    </span>
                  )}
                </span>
                {renderHandicap(playerId, 'text-team-a')}
              </li>
            ))}
          </ul>

          {canManage && faltaSinLista(Team.A) && (
            <p
              data-testid="capitan-inscritos-sin-cargar-A"
              className="mt-3 text-sm text-error"
            >
              {t('teams.fillCaptainNeedsEnrollments')}
            </p>
          )}
          {canManage && sinCapitan(Team.A) && (
            <button
              type="button"
              data-testid="cubrir-capitan-A"
              onClick={() => onFillCaptain(Team.A)}
              className="mt-3 w-full rounded-lg border border-team-a bg-fondo px-3 py-2 text-sm font-medium text-team-a transition-[filter] hover:brightness-95"
            >
              {t('teams.fillCaptain')}
            </button>
          )}
        </div>

        {/* Team B */}
        <div className="bg-team-b-suave rounded-lg p-4 border border-team-b">
          <h4 className="font-semibold text-team-b mb-2">
            {teamNames.teamB} (
            {t('teams.playersCount', { count: teamB.length })})
          </h4>
          <ul className="space-y-1.5">
            {teamB.map((playerId, posicion) => (
              <li
                key={playerId}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-tinta min-w-0">
                  {nombreDe(playerId, posicion)}
                  {papelDe(playerId, Team.B) && (
                    <span className="block text-xs text-aviso truncate">
                      {papelDe(playerId, Team.B)}
                    </span>
                  )}
                </span>
                {renderHandicap(playerId, 'text-team-b')}
              </li>
            ))}
          </ul>

          {canManage && faltaSinLista(Team.B) && (
            <p
              data-testid="capitan-inscritos-sin-cargar-B"
              className="mt-3 text-sm text-error"
            >
              {t('teams.fillCaptainNeedsEnrollments')}
            </p>
          )}
          {canManage && sinCapitan(Team.B) && (
            <button
              type="button"
              data-testid="cubrir-capitan-B"
              onClick={() => onFillCaptain(Team.B)}
              className="mt-3 w-full rounded-lg border border-team-b bg-fondo px-3 py-2 text-sm font-medium text-team-b transition-[filter] hover:brightness-95"
            >
              {t('teams.fillCaptain')}
            </button>
          )}
        </div>
      </div>

      {/* Formados, quedan así: para que entre alguien, se deshacen y se
          repite el draft; con partidos, ya no (decidido el 29-30 oct 2026) */}
      {canManage && sePuedenDeshacer && onUndoTeams && (
        <div className="mt-4 pt-3 border-t border-linea">
          <button
            type="button"
            data-testid="deshacer-equipos"
            onClick={onUndoTeams}
            className="px-4 py-2 bg-fondo border border-error text-error rounded-boton text-sm font-bold transition-[filter] hover:brightness-95"
          >
            {t('teams.undo')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamAssignmentSection;
