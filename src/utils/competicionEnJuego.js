import { CompetitionStatusEnum } from '../domain/value_objects/CompetitionStatus';

/**
 * De qué competición se enseña el marcador por equipos en Inicio: la del
 * próximo partido, si es por equipos y está EN JUEGO. Una que empieza el sábado
 * no sale el lunes como «En juego · 0 – 0».
 *
 * @param {object|null} proximo - el próximo partido o partida
 * @param {Array|null} competiciones - las del panel
 * @returns {string|null} su identificador, o nulo si no hay marcador que enseñar
 */
export const competicionEnJuego = (proximo, competiciones) => {
  // Una partida de stroke play no tiene marcador por equipos
  if (!proximo || proximo.esPartidaDeFranja) return null;
  const id = proximo.competitionId ?? null;
  if (!id || !Array.isArray(competiciones)) return null;
  const enJuego = competiciones.some(
    (c) => c?.id === id && c.status === CompetitionStatusEnum.IN_PROGRESS,
  );
  return enJuego ? id : null;
};
