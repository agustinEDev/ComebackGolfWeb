/**
 * Terminar una competición con algo sin cerrar (backend, I1 del 22 nov
 * 2026): el servidor responde 409 PENDING_GAMES con cuántos partidos de la
 * Ryder (`pending_matches`) y partidas de stroke play (`pending_groups`)
 * quedan. Cada modalidad solo tiene lo suyo, así que el texto sale de los
 * números: «partidos» en una Ryder, «partidas» en stroke play.
 */

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export const esLoPendienteAlTerminar = (error) =>
  error?.errorCode === 'PENDING_GAMES';

const cuantos = (valor) => (Number.isInteger(valor) && valor > 0 ? valor : 0);

/**
 * @param {(clave: string, opciones?: Object) => string} t - El de
 *   `competitions`
 * @param {{data?: {pending_matches?: number, pending_groups?: number}}} error
 * @returns {string}
 */
export const textoDeLoPendienteAlTerminar = (t, error) => {
  const partidos = cuantos(error?.data?.pending_matches);
  const partidas = cuantos(error?.data?.pending_groups);
  const textos = [];
  if (partidos)
    textos.push(t('detail.errors.pendingMatches', { count: partidos }));
  if (partidas)
    textos.push(t('detail.errors.pendingGroups', { count: partidas }));
  return textos.length ? textos.join(' ') : t('detail.errors.pendingGames');
};
