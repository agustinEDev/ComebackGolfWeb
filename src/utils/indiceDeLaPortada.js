/**
 * Qué portada le toca a un torneo: un número estable a partir de su
 * identificador. El mismo torneo lleva siempre la misma.
 *
 * @param {string} semilla - el identificador del torneo
 * @param {number} cuantas - cuántas portadas hay
 * @returns {number} de 0 a `cuantas - 1`
 */
export const indiceDeLaPortada = (semilla, cuantas) => {
  let suma = 0;
  for (const letra of String(semilla ?? '')) {
    suma = (suma * 31 + letra.codePointAt(0)) % 100003;
  }
  return suma % cuantas;
};
