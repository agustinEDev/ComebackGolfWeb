/**
 * Si una pantalla de anotación que no ha podido cargar debe ofrecer volver a la
 * lista en vez de «Reintentar» (26 nov 2026).
 *
 * Solo cuando NUESTRA API ha dicho que esa partida no existe (404) —borrada, o
 * tirada a la papelera por quien la abre— o que no es tuya (403): reintentar
 * daría lo mismo. El 404 de un intermediario (un proxy, el portal cautivo de un
 * club) sí se reintenta, y sin cobertura también, aunque quede un 404 de antes:
 * lo que falta entonces es la señal. Y un 403 con código propio (CSRF, términos
 * sin aceptar) tampoco es «no es tuyo»: se arregla de otra manera.
 *
 * @param {(Error & {status?: number, deLaApi?: boolean, response?: {status?: number}})|null|undefined} error
 * @param {boolean} [sondeoSinRespuesta]
 * @returns {boolean}
 */
export const noSeArreglaReintentando = (error, sondeoSinRespuesta = false) => {
  if (!error || sondeoSinRespuesta || error.deLaApi !== true) return false;
  const estado = error.status ?? error.response?.status;
  if (estado === 404) return true;
  return estado === 403 && !error.errorCode;
};
