/**
 * Si hay equipos en una Ryder que a quien mira no le mandan (FE #1225): no
 * participa y no tiene acceso entero, así que el servidor omite
 * `team_assignment` de la agenda. La ficha sí dice si los hay
 * (`teamsAssigned`, para cualquiera): sin mirarla, la agenda decía «aún no
 * asignados» y era falso. Quien gestiona los recibe siempre: para él, sin
 * equipos es que no los hay (también justo después de deshacerlos, cuando la
 * ficha leída aún dice que sí).
 *
 * @param {Object} datos
 * @param {boolean} datos.puedeGestionar
 * @param {unknown} datos.teamsAssigned - El de la ficha
 * @param {Object|null|undefined} datos.teamAssignment - El de la agenda
 * @returns {boolean}
 */
export const hayEquiposQueNoVe = ({
  puedeGestionar,
  teamsAssigned,
  teamAssignment,
}) => !puedeGestionar && teamsAssigned === true && !teamAssignment;
