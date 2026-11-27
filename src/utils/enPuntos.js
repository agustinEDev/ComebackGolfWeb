/**
 * Los puntos de un equipo, como se dicen en el campo: «8½», «9», «½».
 *
 * @param {number|null|undefined} puntos
 * @returns {string}
 */
export const enPuntos = (puntos) => {
  const valor = Number(puntos) || 0;
  const enteros = Math.floor(valor);
  const medio = valor - enteros >= 0.5;
  if (!medio) return String(enteros);
  return enteros === 0 ? '½' : `${enteros}½`;
};
