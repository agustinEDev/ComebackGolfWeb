import { CompetitionStatusEnum } from '../domain/value_objects/CompetitionStatus';

/**
 * Los tres filtros de Torneos: en vez de elegir entre los seis estados de una
 * competición, se elige en qué momento está.
 */
export const GRUPOS_DE_COMPETICIONES = {
  ACTIVOS: [CompetitionStatusEnum.IN_PROGRESS],
  PROXIMOS: [
    CompetitionStatusEnum.DRAFT,
    CompetitionStatusEnum.ACTIVE,
    CompetitionStatusEnum.CLOSED,
  ],
  FINALIZADOS: [
    CompetitionStatusEnum.COMPLETED,
    CompetitionStatusEnum.CANCELLED,
  ],
};

/**
 * @param {string|null|undefined} grupo
 * @returns {string|null} el grupo si existe; lo demás —nada, un estado suelto
 *   guardado de antes— es «todos»
 */
export const grupoValido = (grupo) =>
  Object.hasOwn(GRUPOS_DE_COMPETICIONES, grupo ?? '') ? grupo : null;

/**
 * @param {string} estado - el de la competición
 * @param {string|null} grupo - el filtro elegido; nulo, todos
 * @returns {boolean}
 */
export const esDelGrupo = (estado, grupo) => {
  const valido = grupoValido(grupo);
  if (!valido) return true;
  return GRUPOS_DE_COMPETICIONES[valido].includes(estado);
};
