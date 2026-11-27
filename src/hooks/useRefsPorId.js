import { useState } from 'react';

const crear = () => {
  const elementos = new Map();
  const refs = new Map();
  return {
    refDe: (id) => {
      let ref = refs.get(id);
      if (!ref) {
        ref = (elemento) => {
          if (elemento) elementos.set(id, elemento);
          else elementos.delete(id);
        };
        refs.set(id, ref);
      }
      return ref;
    },
    elemento: (id) => elementos.get(id),
  };
};

/**
 * Refs de callback por id, estables: la de cada id se crea una vez y es la
 * misma en todos los renders (y el objeto que las da, también). Una nueva en
 * cada pintado hace que React la suelte (con null) y la vuelva a poner cada
 * vez (/code-review). Para llegar a un elemento de una lista sin buscarlo por
 * un selector.
 *
 * @returns {{
 *   refDe: (id: string) => (elemento: HTMLElement|null) => void,
 *   elemento: (id: string) => HTMLElement|undefined,
 * }}
 */
export const useRefsPorId = () => useState(crear)[0];
