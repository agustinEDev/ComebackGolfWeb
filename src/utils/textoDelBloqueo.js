// Los motivos que esta versión sabe contar. Uno que el servidor añada mañana
// sale como «inesperado»: enseñar su clave no le dice nada a nadie
const MOTIVOS_CONOCIDOS = new Set([
  'PLAYERS_WITHOUT_TEE',
  'NOT_ENOUGH_PLAYERS',
  'NO_TEAMS',
  'NO_GOLF_COURSE',
  'UNEXPECTED',
  'ENROLLMENT_OPEN',
]);

// Y lo mismo con lo que le falta a cada jugador
const FALTAS_CONOCIDAS = new Set(['GENDER', 'TEE_COLOR', 'ENROLLMENT']);

/** @param {string} reason @returns {string} el motivo, o `UNEXPECTED` */
export const motivoConocido = (reason) =>
  MOTIVOS_CONOCIDOS.has(reason) ? reason : 'UNEXPECTED';

/** @param {string} missing @returns {string} la falta, o `OTHER` */
export const faltaConocida = (missing) =>
  FALTAS_CONOCIDAS.has(missing) ? missing : 'OTHER';

/**
 * La clave de lo que le falta a un jugador. Una barra que falta sin saber
 * cuál tiene su frase sin «:», que en la otra va seguido del color
 * (/code-review, 23 nov 2026).
 *
 * @param {{missing: string, teeColor?: ?string}} jugador
 * @returns {string}
 */
export const claveDeLaFalta = (jugador) => {
  const falta = faltaConocida(jugador.missing);
  return falta === 'TEE_COLOR' && !jugador.teeColor ? 'TEE_COLOR_NONE' : falta;
};

/**
 * El motivo de un bloqueo al generar en una sola línea, con las claves que
 * pinta `BloqueoDePartidos`: para el aviso de arriba cuando la respuesta llega
 * con el modal de esa sesión ya cerrado (23 nov 2026).
 *
 * @param {{reason: string, players?: Array}} bloqueo
 * @param {Function} t La `t` de la agenda (`schedule`)
 * @param {(color: string) => string} nombreDelColor El de una barra
 * @returns {string}
 */
export const textoDelBloqueo = (bloqueo, t, nombreDelColor) => {
  const jugadores = bloqueo.players || [];
  const detalle =
    jugadores.length > 0
      ? jugadores
          .map((jugador) =>
            [
              jugador.name,
              t(`generationBlock.missing.${claveDeLaFalta(jugador)}`),
              jugador.teeColor && nombreDelColor(jugador.teeColor),
            ]
              .filter(Boolean)
              .join(' '),
          )
          .join('; ')
      : t(`generationBlock.reason.${motivoConocido(bloqueo.reason)}`);
  return `${t('generationBlock.title')}: ${detalle}`;
};
